# Focus ASTU CP Hub

A competitive programming platform for students at Adama Science and Technology University (ASTU).
Track solved problems, log contest standings, host community editorials, and manage squad-based learning tracks — all in one place.

[![Documentation](https://img.shields.io/badge/docs-mkdocs--material-blue)](https://ayanasamuel8.github.io/focus-astu-cp-hub-web)
[![Go](https://img.shields.io/badge/backend-Go%201.22+-00ADD8?logo=go)](backend/)
[![React](https://img.shields.io/badge/frontend-React%2018-61DAFB?logo=react)](frontend/)
[![Extension](https://img.shields.io/badge/extension-Chrome%20MV3-4285F4?logo=google-chrome)](extension/)

---

## What's in this repo

| Component | Stack | Directory |
|-----------|-------|-----------|
| **Backend** | Go + Echo + PostgreSQL | [`backend/`](backend/) |
| **Frontend** | React + TypeScript + Vite | [`frontend/`](frontend/) |
| **Extension** | Chrome Extension MV3 | [`extension/`](extension/) |

---

## Features

- **Problem library** — searchable, filterable, tagged by platform (LeetCode, Codeforces, AtCoder, …)
- **Submission tracking** — auto-captured via the browser extension or logged manually from any page (including the squad curriculum)
- **Contest standings** — synced from the Codeforces API with rating deltas
- **Community editorials** — Markdown write-ups with upvote/downvote scoring
- **Squad curriculum** — track → topic → problem learning paths managed by squad leads; problem names link to the problem externally, each row has an Editorial shortcut and an inline Submit button for unsolved problems
- **Announcements** — Markdown-formatted; squad-scoped (squad lead → own squad) and global or squad-targeted (admin selects specific squads or all)
- **Member directory** — searchable, filterable by squad, links to every member's profile
- **Profile pages** — public to all authenticated users; shows stats, activity heatmap, handles, and role history
- **Admin panel** — user management, squad CRUD, invitation system (email via Resend), role assignment, contest sync
- **Legal pages** — Privacy Policy and Terms of Service with consent at signup and profile completion

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        React SPA (Vite)                          │
│  Landing · Dashboard · Problems · Contests · Editorials ·        │
│  Squad · Members · Announcements · Profile · Admin               │
└─────────────────────────┬────────────────────────────────────────┘
                          │  HTTPS REST  /api/*
┌─────────────────────────▼────────────────────────────────────────┐
│                    Go / Echo API Server                           │
│  Supabase JWT auth · Role guards · Usecase layer · pgx repos     │
│  Swagger UI at /api/docs                                         │
└────────────┬─────────────────────────────────────────────────────┘
             │
   ┌─────────┴─────────┐
   │    PostgreSQL      │  (Supabase)
   └───────────────────┘
             ▲
┌────────────┴──────────────────┐
│   Chrome Extension (MV3)      │
│   LeetCode + Codeforces auto  │
│   submission capture          │
└───────────────────────────────┘
             ▲
   Codeforces Public API (contest sync)
```

---

## Quick start

### Prerequisites

- Go ≥ 1.22
- Node.js ≥ 18
- PostgreSQL ≥ 15 (or a Supabase project)
- Chrome / Edge (for the extension)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, SITE_URL

# Run migrations
psql "$DATABASE_URL" -f migrations/001_initial.sql
psql "$DATABASE_URL" -f migrations/002_reconcile_problem_counts.sql
psql "$DATABASE_URL" -f migrations/003_editorial_votes.sql

go run ./cmd/server
# → http://localhost:8080
# → API docs: http://localhost:8080/api/docs
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL

npm install
npm run dev
# → http://localhost:5173
```

### 3. Extension

1. Open `chrome://extensions`, enable **Developer mode**
2. Click **Load unpacked** → select the `extension/` folder
3. Generate an API key from **Settings** in the web portal and paste it into the extension popup

See the [extension installation guide](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/extension/installation/) for details.

---

## API reference

The backend serves an interactive Swagger UI at **`/api/docs`** when running. It covers all endpoints across public, authenticated, squad-lead, and admin tiers.

Full endpoint list: [docs → API Reference](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/backend/api-reference/)

---

## Documentation

Full documentation lives at **[ayanasamuel8.github.io/focus-astu-cp-hub-web](https://ayanasamuel8.github.io/focus-astu-cp-hub-web)** and is auto-deployed from the `docs/` folder on every push to `main`.

| Section | Contents |
|---------|----------|
| [Getting Started](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/getting-started/) | Setup guide, env vars, first admin |
| [Backend](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/backend/) | Architecture, API reference, database schema, roles |
| [Frontend](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/frontend/) | Features, pages & routes |
| [Extension](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/extension/) | Installation, how capture works |
| [Testing Guide](https://ayanasamuel8.github.io/focus-astu-cp-hub-web/testing/) | Tester setup, scenarios checklist, how to report bugs |

---

## Roles

| Role | Level | Can do |
|------|-------|--------|
| `COMMUNITY` | 0 | Public stats & announcements |
| `SQUAD_MEMBER` | 1 | Log submissions, view problems/contests, write editorials, browse members |
| `SQUAD_LEAD` | 2 | Manage squad curriculum, sync contests, post squad announcements |
| `ADMIN` | 3 | Manage all users/squads/invitations, post global or squad-targeted announcements |
| `SUPER_ADMIN` | 4 | Toggle open signup |

---

## Project structure

```
focus-astu-cp-hub-web/
├── backend/                    # Go API server
│   ├── cmd/server/main.go      # Entry point
│   ├── api/openapi.yaml        # OpenAPI 3.0 spec
│   ├── internal/
│   │   ├── config/             # Env loading
│   │   ├── domain/             # Models, enums, repo interfaces
│   │   ├── delivery/http/      # Echo handlers + middleware + Swagger UI
│   │   ├── usecase/            # Business logic
│   │   ├── repository/postgres/# pgx implementations
│   │   └── pkg/codeforces/     # Codeforces API client
│   └── migrations/             # SQL migration files
├── frontend/                   # React SPA
│   └── src/
│       ├── app/router.tsx      # Routes
│       ├── components/         # UI + layout components
│       ├── features/           # Page-level feature modules
│       │   ├── users/          # Member directory
│       │   ├── squad/          # Squad curriculum (mobile-responsive)
│       │   ├── announcements/  # Announcements with Markdown + post modal
│       │   └── ...
│       ├── hooks/              # Shared hooks
│       └── lib/                # API client, Supabase, tokens
├── extension/                  # Chrome Extension MV3
│   ├── background/             # Service worker
│   ├── content_scripts/        # LeetCode & Codeforces capture
│   ├── popup/                  # Extension popup
│   └── manifest.json
├── docs/                       # MkDocs documentation source
├── mkdocs.yml                  # Docs site config (Material theme)
└── supabase/email-templates/   # Branded auth email templates
```

---

## License

MIT
