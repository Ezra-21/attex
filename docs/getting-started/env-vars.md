# Environment Variables

## Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string, e.g. `postgres://user:pass@localhost:5432/focushub` |
| `JWKS_URL` | ✅ | Supabase JWKS endpoint, e.g. `https://<project>.supabase.co/auth/v1/.well-known/jwks.json` |
| `PORT` | ✅ | Port to listen on (default: `8080`) |

**Example `backend/.env`:**

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/focushub
JWKS_URL=https://abcdefghijk.supabase.co/auth/v1/.well-known/jwks.json
PORT=8080
```

---

## Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase `anon` public key |
| `VITE_API_BASE_URL` | ✅ | Backend API base URL, e.g. `http://localhost:8080` |

**Example `frontend/.env`:**

```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_API_BASE_URL=http://localhost:8080
```

---

## Extension

The extension stores its configuration in `chrome.storage.local`. After installing, open the popup and paste your **API key** (generated from the web portal under Settings).

No `.env` file is needed for the extension.
