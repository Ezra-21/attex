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