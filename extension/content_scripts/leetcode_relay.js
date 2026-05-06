'use strict';

// Runs in ISOLATED world (default) — has full chrome.* API access.
// Listens for submission events fired by leetcode.js (MAIN world) and forwards
// them to the service worker via chrome.runtime.sendMessage.

window.addEventListener('__focusASTU_submission', (event) => {
  chrome.runtime.sendMessage({ type: 'SUBMISSION', payload: event.detail });
});
