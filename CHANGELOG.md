# Changelog

All notable changes to Focus ASTU CP Hub are documented here.

## [0.1.0] - 2025-12-16
### Added
- Go module, config loader, domain layer (clean architecture)

### Added
- Role hierarchy with AtLeast() comparison

### Added
- Platform constants (LeetCode, Codeforces, AtCoder, ...)

## [0.1.1] - 2025-12-18
### Changed
- Config validates DATABASE_URL and SUPABASE_URL

### Added
- JWKS URL derived from Supabase URL

## [0.1.2] - 2025-12-19
### Added
- ErrNotFound, ErrForbidden, ErrConflict domain errors

### Changed
- gitignore covers env, build outputs, .har captures

### Added
- Graceful shutdown on SIGTERM

### Changed
- Config defaults documented in .env.example

### Added
- Health endpoint for container probes

## [0.2.0] - 2025-12-30
### Added
- PostgreSQL repositories (pgx) for users, problems, submissions, contests, squads

### Changed
- Repository methods accept context.Context

### Fixed
- Scan helpers tolerate nullable timestamps

## [0.2.1] - 2026-01-05
### Added
- Editorial, announcement, invitation, settings repositories

### Changed
- Connection pool tuned for serverless Postgres

### Added
- Indexes on submissions(user_id, created_at)

## [0.2.2] - 2026-01-07
### Fixed
- Null handling in optional user columns

### Changed
- Pagination helpers shared across repos

### Fixed
- Squad member upsert avoids duplicate rows

## [0.3.0] - 2026-01-16
### Added
- Use-case layer: verse, user, problem, submission, contest, squad, editorial, announcement

### Added
- Verse cache warms before serving traffic

### Changed
- Submission use case validates platform + handle

## [0.3.1] - 2026-01-20
### Added
- Editorial voting (upvote/downvote scoring)

### Changed
- Squad use case enforces lead ownership

### Added
- Streak computation from submission timeline

### Changed
- Problem counts reconciled on solve

### Fixed
- Verse fallback when upstream is unreachable

## [0.4.0] - 2026-01-30
### Added
- HTTP handlers + JWT/role middleware (Echo)

## [0.4.1] - 2026-02-09
### Added
- Squad-lead and admin route tiers
- Dependency wiring in cmd/server

## [0.4.2] - 2026-02-12
### Added
- Codeforces standings client
- Swagger UI at /api/docs

### Changed
- CORS allows Authorization + Content-Type

### Added
- Request-ID + structured request logging middleware

### Changed
- Handlers map domain errors to HTTP status codes

### Fixed
- Active-user guard rejects suspended accounts

### Changed
- Rate limit on public verse endpoint

## [0.5.0] - 2026-02-20
### Added
- React 19 + Vite + TS frontend base
- Supabase auth client, Axios, Zustand store, hooks

## [0.6.0] - 2026-03-02
### Added
- UI component library (Avatar, Badge, Btn, Card, CodeViewer, ...)

### Added
- Responsive app shell + navigation

### Changed
- Sidebar collapses on small viewports

### Fixed
- ErrorBoundary resets on route change

### Changed
- MarkdownRenderer sanitizes editorial HTML

## [0.7.0] - 2026-03-11