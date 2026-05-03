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