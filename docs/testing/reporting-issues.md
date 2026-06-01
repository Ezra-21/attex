# Reporting Issues

Found a bug? Please open a GitHub issue using one of the templates below. Good bug reports make fixes happen faster.

## Where to open issues

→ **[GitHub Issues](https://github.com/focusastu/focus-astu-cp-hub-web/issues/new/choose)**

---

## Choosing the right template

| Template | Use when |
|----------|----------|
| **Bug Report (General)** | Something is broken but you're not sure which component |
| **Frontend Bug** | The web portal (UI, pages, buttons) is broken |
| **Backend Bug** | An API endpoint returns wrong data or an error |
| **Extension Bug** | The browser extension isn't capturing or submitting correctly |

---

## Writing a good bug report

A good report answers three questions:

1. **What did you do?** — exact steps to reproduce
2. **What did you expect?** — the correct behavior
3. **What happened instead?** — the actual broken behavior

### Required information

- **Component** — Frontend / Backend / Extension
- **Steps to reproduce** — numbered, specific
- **Expected behavior** — one sentence
- **Actual behavior** — one sentence + error message if any
- **Screenshots** — always attach one if the issue is visual
- **Browser + OS** — e.g. Chrome 124 on Windows 11

### Optional but very helpful

- Browser console errors (open DevTools → Console, copy any red errors)
- Network request details (DevTools → Network → click the failing request → copy as cURL)
- Your account role at the time (Community / Squad Member / Squad Lead / Admin)

---

## Example good report

> **Title:** Submission count doesn't update after logging a solve
>
> **Steps:**
> 1. Log in as a Squad Member
> 2. Go to Problems and select any problem
> 3. Click "Log Solve" and submit a valid code snippet
> 4. Go to Dashboard
>
> **Expected:** Problem count incremented by 1
>
> **Actual:** Problem count still shows the old value. Refreshing the page also shows the old count.
>
> **Screenshot:** [attached]
>
> **Browser:** Chrome 124, Ubuntu 22.04
>
> **Console errors:** none

---

## What NOT to report (for now)

- Missing features that are not in the current deployed version
- Performance suggestions
- UI style preferences

If you're unsure whether something is a bug, open an issue anyway — the team will triage it.
