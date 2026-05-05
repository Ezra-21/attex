'use strict';

// Runs in MAIN world (manifest declares world: "MAIN") so we can patch window.fetch.

(function () {
  if (window.__focusASTUPatched) return;
  window.__focusASTUPatched = true;

  const originalFetch = window.fetch.bind(window);

  // Holds typed_code + lang from the most recent submit POST
  let pendingSubmit = { code: '', lang: '' };

  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string'
      ? args[0]
      : (args[0] instanceof Request ? args[0].url : '');

    // Capture typed_code from the submit POST before the fetch fires
    if (/\/problems\/[^/]+\/submit\/?$/.test(url)) {
      try {
        const bodyText = typeof args[1]?.body === 'string'
          ? args[1].body
          : (args[0] instanceof Request ? await args[0].clone().text() : '');
        const submitData = JSON.parse(bodyText);
        pendingSubmit = {
          code: submitData.typed_code || '',
          lang: submitData.lang || '',
        };
      } catch (_) {}
    }

    const response = await originalFetch(...args);

    // REST polling endpoint — LeetCode now uses /v2/check/
    if (/\/submissions\/detail\/\d+\/(?:v2\/)?check\/?/.test(url)) {
      handleCheckResponse(response.clone());
    }

    // GraphQL fallback (future-proofing)
    if (/\/graphql\/?/.test(url)) {
      const bodyText = typeof args[1]?.body === 'string' ? args[1].body : '';
      handleGraphQLResponse(response.clone(), bodyText);
    }

    return response;
  };

  // Also intercept XHR (some LeetCode flows still use it)
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__url = url;
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (this.__url && /\/submissions\/detail\/\d+\/(?:v2\/)?check\/?/.test(this.__url)) {
      this.addEventListener('load', () => {
        try {
          const data = JSON.parse(this.responseText);
          dispatchAccepted(data);
        } catch (_) {}
      });
    }
    return originalSend.apply(this, args);
  };

  async function handleCheckResponse(response) {
    try {
      const data = await response.json();
      dispatchAccepted(data);
    } catch (_) {}
  }

  async function handleGraphQLResponse(response, requestBody) {
    try {
      const text = await response.text();
      const data = JSON.parse(text);

      // submissionDetails query — fired when LeetCode polls for the result
      const details =
        data?.data?.submissionDetails ||
        data?.data?.submission;

      if (details) {
        dispatchAccepted({
          status_msg: details.statusDisplay || details.status_display || '',
          statusDisplay: details.statusDisplay || details.status_display || '',
          lang: details.lang || details.langName || '',
          pretty_lang: details.langName || '',
          code: details.code || details.typedCode || '',
        });
        return;
      }

      // submissionResult / checkSubmission — alternative operation names LeetCode uses
      const result =
        data?.data?.submissionResult ||
        data?.data?.checkSubmission;

      if (result) {
        dispatchAccepted({
          status_msg: result.statusDisplay || result.status_msg || '',
          statusDisplay: result.statusDisplay || '',
          lang: result.lang || '',
          code: result.code || '',
        });
      }
    } catch (_) {}
  }

  function dispatchAccepted(data) {
    // Accept both REST ("Accepted") and possible GraphQL ("statusDisplay")
    const isAccepted =
      data.status_msg === 'Accepted' ||
      data.statusDisplay === 'Accepted';

    if (!isAccepted) return;

    const slug = extractSlug();
    if (!slug) return;

    const submission = {
      platform: 'LEETCODE',
      external_id: slug,
      problem_name: extractProblemName(slug),
      external_link: `https://leetcode.com/problems/${slug}/`,
      language: normalizeLang(data.lang || data.pretty_lang || pendingSubmit.lang),
      code: data.code || pendingSubmit.code,
      source: 'extension',
    };

    // MAIN world has no chrome.* API access — relay via DOM event to the isolated-world script.
    window.dispatchEvent(new CustomEvent('__focusASTU_submission', { detail: submission }));
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function extractSlug() {
    // URL: https://leetcode.com/problems/<slug>/...
    const m = location.pathname.match(/\/problems\/([^/]+)/);
    return m ? m[1] : null;
  }

  function extractProblemName(slug) {
    const title = document.title;
    if (title && title.toLowerCase().includes('leetcode')) {
      return title.replace(/\s*[-|]\s*LeetCode.*$/i, '').trim();
    }
    // Fallback: "two-sum" → "Two Sum"
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const LANG_MAP = {
    cpp: 'C++',
    c: 'C',
    java: 'Java',
    python: 'Python',
    python3: 'Python3',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    csharp: 'C#',
    go: 'Go',
    golang: 'Go',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    rust: 'Rust',
    scala: 'Scala',
    php: 'PHP',
  };

  function normalizeLang(lang) {
    if (!lang) return 'Unknown';
    return LANG_MAP[lang.toLowerCase()] || lang;
  }
})();
