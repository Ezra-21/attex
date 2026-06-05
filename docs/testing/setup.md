# Tester Environment Setup

## 1. Get your credentials

Contact the team (via Telegram or the admin) to receive:

- [ ] Invitation link (if open signup is off)
- [ ] The deployment URL for the frontend
- [ ] The backend API URL (for Swagger testing)

## 2. Create your account

1. Open your invitation link.
2. Complete the Supabase sign-up form.
3. Check your email and confirm your address.
4. Log in and complete your profile:
   - **Full name** — required
   - **Telegram handle** — required
   - **Codeforces handle** — required (use your actual CF handle or a test handle like `test_user`)
5. Wait for an admin to activate your account and assign a role.

## 3. Install the extension (optional but encouraged)

Follow the [Extension Installation guide](../extension/installation.md).

After installation:
1. Generate an API key from **Settings → API Key**.
2. Paste it into the extension popup.
3. Set the Backend URL to the deployment URL.

## 4. Use the Swagger UI

The interactive API explorer is at:
```
<backend-url>/api/docs
```

To authenticate in Swagger UI:
1. Get your JWT from the browser's `localStorage`:
   - Open DevTools → Application → Local Storage → `supabase.auth.token`
   - Copy the `access_token` value
2. Click **Authorize** in Swagger UI
3. Paste `Bearer <your-access-token>` and confirm

!!! note
    The JWT expires — if requests start returning 401, copy a fresh token from localStorage.
