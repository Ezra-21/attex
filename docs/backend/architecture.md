# Architecture

## Layer diagram

```
┌──────────────────────────────────────────────────┐
│              delivery/http (Echo handlers)        │
│  Bind & validate input · Call use case · Return   │
│  JSON · Middleware (JWT, ActiveGuard, RoleGuard)  │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│                 usecase layer                     │
│  Business rules · Orchestrates one or more repos  │
│  Pure Go — no HTTP or DB concerns                 │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│           repository/postgres (pgx)               │
│  Implements domain.XxxRepository interfaces       │
│  All SQL lives here                               │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│                 PostgreSQL                        │
└──────────────────────────────────────────────────┘
```

## Domain layer (`internal/domain/`)

The domain package contains only pure Go types — no framework or database imports.

| File | Contents |
|------|----------|
| `models.go` | All domain structs (`User`, `Problem`, `Submission`, `Contest`, etc.) |
| `enums.go` | `Role` and `Platform` string enums with ordering helper |
| `errors.go` | Sentinel errors (`ErrProblemNotFound`, etc.) |
| `repository.go` | Repository interfaces that the usecase layer depends on |

## Authentication flow

```
Request arrives
  → JWTMiddleware
      ├── Header: "Authorization: Bearer <token>"
      ├── Try Supabase JWKS verification (RS256)
      │     → extract sub (user ID)
      └── If JWKS fails, try API key lookup (bcrypt hash compare)
            → extract user ID from DB row

  → load User record from DB (role, squad_id, is_active, is_banned)
  → store in echo.Context for downstream handlers
```

## JWKS caching

`JWKSCache` fetches the JWKS from Supabase on startup and refreshes it in the background every hour. The first request never hits a cold cache.

## Verse caching

`VerseUseCase` fetches a Bible verse from an external API, caches it in memory, and refreshes daily. The verse is served from memory — no external call per request.

## Codeforces sync

When a squad lead or admin triggers a sync, the backend calls the Codeforces `contest.standings` API endpoint, maps handle → user by matching `codeforces_handle`, and upserts standings into `contest_standings`.
