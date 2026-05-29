# Privacy Policy — Focus ASTU CP Hub Extension

*Last updated: June 8, 2026*

## Overview

The Focus ASTU CP Hub browser extension ("the Extension") automatically captures accepted
competitive programming submissions from LeetCode and Codeforces and syncs them to the
user's self-configured Focus ASTU CP Hub portal.

---

## Data We Collect

### What the Extension reads
The Extension reads submission result data (problem name, verdict, language, and timestamp)
from LeetCode and Codeforces pages **only when the user submits a solution**. It does not
monitor browsing history, read unrelated page content, or track user activity outside of
submission events on those two sites.

### What the Extension stores locally
The Extension stores the following in the browser's `chrome.storage.sync`:

- **Portal URL** — the address of the user's Focus ASTU CP Hub portal
- **API key** — a token used to authenticate with the user's own portal

This data never leaves the user's browser except to be sent directly to the portal URL
the user configured.

### What the Extension sends
Submission data (problem name, verdict, language, timestamp) is sent **only to the
portal URL entered by the user**. No data is sent to any third-party service, analytics
platform, or server controlled by the Extension developer.

---

## Data We Do NOT Collect

- Personally identifiable information (name, email, address)
- Browsing or web history
- Financial or payment information
- Health information
- Personal communications
- Location data

---

## Third-Party Services

The Extension communicates only with:

1. **LeetCode** (`leetcode.com`) and **Codeforces** (`codeforces.com`) — to detect submission results via content scripts
2. **The user's own portal** — the URL the user explicitly provides in the Extension settings

---

## Data Retention

All locally stored data (portal URL and API key) can be cleared at any time by removing
the Extension or clearing its storage from the browser's extension management page.

---

## Contact

For questions or concerns about this privacy policy, contact:
**ayanasamuel8@gmail.com**
