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
