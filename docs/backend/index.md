# Backend Overview

The backend is a Go HTTP server using the **Echo** framework. It follows a clean layered architecture with strict separation between delivery, use-case, and repository concerns.

## Technology stack

| Layer | Technology |
|-------|-----------|
| HTTP framework | [Echo v4](https://echo.labstack.com/) |
| Database | PostgreSQL via [pgx v5](https://github.com/jackc/pgx) |
| Auth | Supabase JWTs verified via JWKS + per-user API keys |
| Codeforces sync | Codeforces public API (no key required) |

## Directory structure

```
backend/
├── cmd/server/main.go          # Wires all layers together
├── api/openapi.yaml            # OpenAPI 3.0 spec (serves Swagger UI)
├── internal/
│   ├── config/                 # Env-var loading
│   ├── domain/                 # Models, enums, repository interfaces
│   ├── delivery/http/          # Echo handlers + middleware
│   ├── usecase/                # Business logic
│   ├── repository/postgres/    # pgx implementations
│   └── pkg/codeforces/         # Codeforces API client
└── migrations/                 # SQL migration files
```

## Request lifecycle

```
Request
  → CORS middleware
  → JWTMiddleware (validates Supabase JWT or API key, injects UserID + Role)
  → ActiveGuard (blocks inactive / unprofile-completed accounts on protected routes)
  → RoleGuard (enforces minimum role on squad-lead / admin routes)
  → Handler (binds + validates input, calls use case)
  → UseCase (business rules, orchestrates repos)
  → Repository (SQL queries via pgx)
  → Response JSON
```

## API docs

The server serves an interactive Swagger UI at **`/api/docs`** and the raw spec at **`/api/docs/openapi.yaml`**.

→ [Full API Reference](api-reference.md)
