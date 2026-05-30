# Testing Guide

Welcome! This section is for **testers** who have been given access to a running deployment of the Focus ASTU CP Hub.

You don't need to run the code yourself — your job is to use the app and report anything broken or confusing.

---

## What you'll be testing

| Component | How you access it |
|-----------|------------------|
| **Frontend** (web portal) | URL provided by the team |
| **Backend API** | Via the frontend + optionally Swagger UI at `/api/docs` |
| **Browser Extension** | Load it in Chrome — see [Extension Installation](../extension/installation.md) |

---

## Getting an account

Since open signup may be disabled, ask the team for an invitation link. You will receive a link like:

```
https://app.focusastu.com/invite?token=abc123...
```

Open it in your browser, then sign up. After signing up, complete your profile (full name, Telegram handle, Codeforces handle). An admin will then assign you a role before you can access the full app.

---

## Quick navigation

- [Environment Setup](setup.md) — how to get credentials and configure the extension
- [Test Scenarios](scenarios.md) — a checklist of flows to walk through
- [Reporting Issues](reporting-issues.md) — how to write a good bug report on GitHub
