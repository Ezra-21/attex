# Browser Extension Overview

The Focus ASTU CP Hub Chrome extension (Manifest V3) automatically detects accepted submissions on **LeetCode** and **Codeforces** and posts them to the hub without any manual action.

## What it does

1. Monitors the active LeetCode / Codeforces page for successful submissions.
2. Captures the problem URL, language, and submitted code.
3. Sends a `POST /api/submissions` request to the hub API using the user's **API key**.
4. Shows a browser notification confirming the submission was logged.

## Content scripts

| File | Target | Technique |
|------|--------|-----------|
| `leetcode.js` | `https://leetcode.com/*` | Runs in MAIN world; intercepts `XMLHttpRequest` to detect submission results |
| `leetcode_relay.js` | `https://leetcode.com/*` | Relays captured data from MAIN world to the extension context |
| `codeforces.js` | `https://codeforces.com/*` | Polls the Codeforces submission verdict page |

## Service worker

`background/service_worker.js` handles:
- Receiving captured submission data from content scripts
- Reading the stored API key and backend URL from `chrome.storage.local`
- POSTing to the hub API
- Showing success/failure notifications

## Supported platforms

| Platform | Auto-capture | Notes |
|----------|:------------:|-------|
| LeetCode | ✅ | All languages |
| Codeforces | ✅ | All languages |
| AtCoder | ❌ | Manual log via web portal |
| HackerRank / GFG / Other | ❌ | Manual log via web portal |
