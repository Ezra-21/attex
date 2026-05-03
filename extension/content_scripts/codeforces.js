'use strict';

// Runs in ISOLATED world (default). Observes the DOM for "Accepted" verdicts
// in Codeforces submission tables and forwards them to the service worker.

(function () {
  const seenSubmissions = new Set();

  // ── MutationObserver setup ─────────────────────────────────────────────────

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        checkNode(node);
      }
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        checkNode(mutation.target);
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  // Also run on initial load in case the page already shows an accepted verdict
  document.querySelectorAll('.verdict-accepted').forEach(processVerdictCell);

  // ── Detection logic ────────────────────────────────────────────────────────

  function checkNode(el) {
    if (el.classList && el.classList.contains('verdict-accepted')) {
      processVerdictCell(el);
    }
    el.querySelectorAll && el.querySelectorAll('.verdict-accepted').forEach(processVerdictCell);
  }

  function processVerdictCell(verdictEl) {
    const row = verdictEl.closest('tr');
    if (!row) return;

    const submissionId = extractSubmissionId(row);
    if (!submissionId || seenSubmissions.has(submissionId)) return;
    seenSubmissions.add(submissionId);

    const info = extractRowInfo(row);
    if (!info) return;

    fetchSourceCode(submissionId, info).then((code) => {
      const submission = {
        platform: 'CODEFORCES',
        external_id: info.problemId,
        problem_name: info.problemName,
        external_link: info.problemLink,
        language: info.language,
        code: code || '',
        source: 'extension',
      };
      chrome.runtime.sendMessage({ type: 'SUBMISSION', payload: submission });
    });
  }

  // ── Row data extraction ────────────────────────────────────────────────────

  function extractSubmissionId(row) {
    const firstCell = row.querySelector('td:first-child');
    if (!firstCell) return null;
    const link = firstCell.querySelector('a');
    if (link) {
      const m = link.href.match(/\/submission\/(\d+)/) || link.href.match(/\/(\d+)$/);
      if (m) return m[1];
    }
    const text = firstCell.textContent.trim();
    return /^\d+$/.test(text) ? text : null;
  }

  function extractRowInfo(row) {
    const problemLink = row.querySelector('a[href*="/problem/"], a[href*="/problems/"]');
    if (!problemLink) return null;

    const href = problemLink.href;
    const problemId = extractProblemId(href);
    if (!problemId) return null;

    const problemName = problemLink.textContent.trim() || problemId;

    const cells = [...row.querySelectorAll('td')];
    const langCell = cells.find((td) => {
      const text = td.textContent.trim();
      return (
        /C\+\+|Java|Python|Go|Kotlin|Rust|Pascal|Delphi|Haskell|Ruby|Scala/i.test(text) &&
        text.length < 40
      );
    });
    const language = langCell ? langCell.textContent.trim() : 'Unknown';

    const problemLinkHref = buildProblemLink(href, problemId);
    return { problemId, problemName, problemLink: problemLinkHref, language };
  }

  function extractProblemId(href) {
    let m = href.match(/\/contest\/(\d+)\/problem\/([A-Z]\d*)/i);
    if (m) return `${m[1]}${m[2].toUpperCase()}`;

    m = href.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);
    if (m) return `${m[1]}${m[2].toUpperCase()}`;

    return null;
  }

  function buildProblemLink(href, problemId) {
    const m = href.match(/\/contest\/(\d+)\/problem\/([A-Z]\d*)/i);
    if (m) return `https://codeforces.com/contest/${m[1]}/problem/${m[2].toUpperCase()}`;

    const ps = href.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d*)/i);
    if (ps) return `https://codeforces.com/problemset/problem/${ps[1]}/${ps[2].toUpperCase()}`;

    return href;
  }

  // ── Source code fetching ───────────────────────────────────────────────────

  async function fetchSourceCode(submissionId, info) {
    const sourceLink = document.querySelector(`a[href*="/submission/${submissionId}"]`);
    const fetchUrl = sourceLink ? sourceLink.href : buildSourceUrl(submissionId);

    if (!fetchUrl) return '';

    try {
      const resp = await fetch(fetchUrl, { credentials: 'include' });
      if (!resp.ok) return '';
      const html = await resp.text();
      return parseSourceFromHtml(html);
    } catch (_) {
      return '';
    }
  }

  function buildSourceUrl(submissionId) {
    const m = location.href.match(/\/contest\/(\d+)/);
    if (m) return `https://codeforces.com/contest/${m[1]}/submission/${submissionId}`;
    return null;
  }

  function parseSourceFromHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const pre = doc.getElementById('program-source-text');
    if (pre) return pre.textContent;

    const fallback = doc.querySelector('.source-code pre, .program-source pre');
    return fallback ? fallback.textContent : '';
  }
})();
