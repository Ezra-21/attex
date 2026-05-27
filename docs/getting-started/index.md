# Getting Started

This guide walks you through running all three components of the Focus ASTU CP Hub locally.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Go | ≥ 1.22 | Backend |
| Node.js | ≥ 18 | Frontend |
| PostgreSQL | ≥ 15 | or use Supabase cloud |
| Chrome / Edge | any | For the extension |

---

## 1. Clone the repo

```bash
git clone https://github.com/focusastu/focus-astu-cp-hub-web.git
cd focus-astu-cp-hub-web
```

---

## 2. Backend

```bash
cd backend

# Copy and fill in the env file
cp .env.example .env
# Edit .env with your values (see Environment Variables page)

# Run database migrations (requires psql on PATH)
psql "$DATABASE_URL" -f migrations/001_initial.sql
psql "$DATABASE_URL" -f migrations/002_reconcile_problem_counts.sql
psql "$DATABASE_URL" -f migrations/003_editorial_votes.sql

# Start the server
go run ./cmd/server
# → listening on :8080
```

Browse the interactive API docs at **[http://localhost:8080/api/docs](http://localhost:8080/api/docs)**.

---

## 3. Frontend

```bash
cd frontend

# Copy and fill in the env file
cp .env.example .env

npm install
npm run dev
# → http://localhost:5173
```

---

## 4. Extension

See the **[Extension Installation](../extension/installation.md)** page for step-by-step instructions.

---

## Next steps

- [Environment Variables reference](env-vars.md)
- [API Reference](../backend/api-reference.md)
- [Testing Guide](../testing/index.md)
