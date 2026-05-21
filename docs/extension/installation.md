# Extension Installation

## Step 1 — Load the extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder from the repository root.

The extension icon should appear in your toolbar. If it's hidden, click the puzzle-piece icon and pin it.

!!! tip "Works in Edge too"
    The same steps work in Microsoft Edge — navigate to `edge://extensions` instead.

---

## Step 2 — Generate an API key

1. Log in to the web portal.
2. Go to **Settings** (bottom of the sidebar).
3. Click **Generate API Key**.
4. Copy the key — it is shown **only once**.

---

## Step 3 — Configure the extension

1. Click the Focus ASTU CP Hub icon in your toolbar.
2. Paste your **API key** in the field provided.
3. Set the **Backend URL** (default: `https://api.focusastu.com`; use `http://localhost:8080` for local dev).
4. Click **Save**.

---

## Verifying it works

1. Open any problem on LeetCode or Codeforces.
2. Submit a correct solution.
3. You should see a browser notification: *"Submission logged to Focus ASTU Hub ✓"*
4. Check your submission list on the portal to confirm it appeared.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| No notification after accepted submission | Check that the API key is saved and the backend URL is correct |
| "Unauthorized" notification | Regenerate your API key from Settings |
| Extension not detecting submissions | Reload the extension from `chrome://extensions` and refresh the problem page |
| Submission appears as wrong problem | The problem may not be in the library yet — ask a squad lead to add it |
