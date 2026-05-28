# Focus ASTU CP Hub

**Focus ASTU CP Hub** is the competitive programming platform for students at Adama Science and Technology University (ASTU). It tracks solved problems, logs contest standings, hosts community editorials, and manages squad-based learning tracks — all in one place.

---

## What's in this monorepo?

| Component | Stack | Description |
|-----------|-------|-------------|
| **Backend** | Go + Echo + PostgreSQL | REST API, Supabase JWT auth, Codeforces sync |
| **Frontend** | React + TypeScript + Vite | Web portal for members, squad leads, and admins |
| **Extension** | Chrome Extension MV3 | Auto-captures accepted submissions from LeetCode & Codeforces |

---

## Quick links

<div class="grid cards" markdown>

- :material-api: **[API Reference](backend/api-reference.md)**  
  Interactive Swagger UI for every endpoint

- :material-rocket-launch: **[Getting Started](getting-started/index.md)**  
  Set up all three components locally in minutes

- :material-puzzle: **[Extension](extension/installation.md)**  
  Install the browser extension in two steps

- :material-test-tube: **[Testing Guide](testing/index.md)**  
  How testers can run the app and report bugs

</div>

---

## High-level architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          Browser (React SPA)                              │
│  Landing · Dashboard · Problems · Contests · Editorials · Squad ·        │
│  Members · Announcements · Profile · Admin                               │
└──────────────────────────┬───────────────────────────────────────────────┘
                           │ HTTPS REST  /api/*
┌──────────────────────────▼───────────────────────────────────────────────┐
│                        Go / Echo  API Server                              │
│   JWT/API-key auth · Role guards · Usecase layer · Repo layer             │
└────────────┬─────────────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │   PostgreSQL    │   Supabase (auth + DB hosting)
    └─────────────────┘
             ▲
┌────────────┴───────────────────┐
│  Chrome Extension (MV3)        │
│  LeetCode + Codeforces capture │
└────────────────────────────────┘
             ▲
    Codeforces Public API (contest sync)
```

---

## Roles at a glance

| Role | Can do |
|------|--------|
| `COMMUNITY` | Read public stats & announcements |
| `SQUAD_MEMBER` | Everything above + log submissions, view problems/contests, write editorials, browse member directory |
| `SQUAD_LEAD` | Everything above + manage squad curriculum, post squad announcements, sync contests |
| `ADMIN` | Everything above + manage users/squads/invitations, post global or squad-targeted announcements |
| `SUPER_ADMIN` | Everything above + toggle open signup |
