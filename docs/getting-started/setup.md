# Detailed Setup Guide

## Supabase project

The platform uses Supabase for authentication (JWTs) and optionally for the PostgreSQL database.

1. Create a project at [supabase.com](https://supabase.com).
2. Copy your **Project URL** and **anon public key** — these go into the frontend `.env`.
3. In *Authentication → Settings*, set the **JWT expiry** and optionally **email confirmation**.
4. Copy the **JWT secret** (Settings → API → JWT Secret) — used in the backend as `JWKS_URL` or verified via the Supabase JWKS endpoint.

## Running migrations

Apply migrations in order against your PostgreSQL database:

```bash
# Using psql
psql "postgres://user:pass@host:5432/dbname" -f migrations/001_initial.sql
psql "postgres://user:pass@host:5432/dbname" -f migrations/002_reconcile_problem_counts.sql
psql "postgres://user:pass@host:5432/dbname" -f migrations/003_editorial_votes.sql
```

| Migration | What it creates |
|-----------|----------------|
| `001_initial.sql` | All core tables: users, squads, problems, submissions, contests, editorials, announcements, invitations, system_settings |
| `002_reconcile_problem_counts.sql` | Helper function to repair `problem_count` counters |
| `003_editorial_votes.sql` | Adds editorial vote tracking table |

## Creating the first super admin

After running migrations, manually set the first admin in PostgreSQL:

```sql
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
```

## Codeforces integration

The backend syncs contest standings from the Codeforces public API. No API key is required. Squad leads trigger syncs manually from the frontend.
