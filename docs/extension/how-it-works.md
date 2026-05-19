# How the Extension Works

## LeetCode capture

LeetCode's submission results are returned via XHR from their GraphQL API. The extension intercepts these requests:

1. `leetcode.js` runs in the **MAIN world** so it can monkey-patch `XMLHttpRequest.prototype.open`.
2. It watches for requests to LeetCode's `checkSubmission` or `submissionDetails` endpoints.
3. When a response with `"status_msg": "Accepted"` is detected, it packages the submission data.
4. Because MAIN-world scripts cannot directly use `chrome.*` APIs, `leetcode_relay.js` (running in the isolated extension context) listens for `window.postMessage` events and forwards the data to the service worker via `chrome.runtime.sendMessage`.

## Codeforces capture

Codeforces submission results are visible in the DOM on the problem page after submission:

1. `codeforces.js` runs at `document_idle` on every Codeforces page.
2. It uses `MutationObserver` to watch for the verdict cell to change to "Accepted".
3. When detected, it reads the problem ID, language, and source from the page and sends the data to the service worker.

## Service worker

The service worker (`background/service_worker.js`) receives messages from content scripts and:

1. Reads `apiKey` and `backendUrl` from `chrome.storage.local`.
2. Calls `POST <backendUrl>/api/submissions` with the submission payload and `Authorization: Bearer <apiKey>`.
3. Shows `chrome.notifications.create(...)` with the result.

## Data flow diagram

```
LeetCode page
  → leetcode.js (MAIN world) intercepts XHR
  → window.postMessage → leetcode_relay.js
  → chrome.runtime.sendMessage → service_worker.js
  → POST /api/submissions (with API key)
  → chrome.notifications (success / error)

Codeforces page
  → codeforces.js observes DOM for "Accepted"
  → chrome.runtime.sendMessage → service_worker.js
  → POST /api/submissions (with API key)
  → chrome.notifications (success / error)
```
