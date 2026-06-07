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
### Added
- Supabase auth flows (login, signup, reset, invite, complete profile)

### Added
- Public landing + member dashboard

### Changed
- Session refresh handled by auth context

### Fixed
- Protected route redirects preserve target

### Changed
- Dashboard stat cards lazy-load data

## [0.8.0] - 2026-03-23
### Added
- Problems, submissions and editorials UI

## [0.8.1] - 2026-03-31
### Added
- Contests, squad curriculum, announcements, members, profile, settings

## [0.8.2] - 2026-04-02
### Added
- Admin panel + legal pages (privacy, terms)

### Changed
- Consent captured at signup + profile completion

### Changed
- Skeleton loaders on all data pages

### Fixed
- React Query cache keys per resource

### Changed
- Problems page filters by platform + difficulty

### Fixed
- Log-solve modal validates submission URL

### Changed
- Editorial editor autosaves drafts

### Fixed
- Contest detail handles empty standings

### Changed
- Settings masks API key after save

### Fixed
- Admin role changes invalidate caches

## [0.9.0] - 2026-04-16
### Added
- Chrome extension (MV3): auto-capture LeetCode + Codeforces submissions

### Fixed
- Relay handles SPA navigation on LeetCode

### Changed
- Extension retries failed captures with backoff

### Fixed
- Service worker re-registers on update

### Changed
- Popup shows last-synced timestamp

## [0.10.0] - 2026-04-30
### Added
- MkDocs documentation site (Material theme)

### Added
- Branded Supabase email templates

## [0.10.1] - 2026-05-07
### Changed
- Docs auto-deploy notes + nav cleanup

### Fixed
- API reference matches handler routes

### Changed
- Setup guide covers Supabase project bootstrap

### Fixed
- Env-vars table lists all required keys

### Changed
- Testing scenarios expanded for QA

## [0.11.0] - 2026-05-14
### Added
- Deployment config (Vercel) + DB migrations 002/003

## [0.11.1] - 2026-05-19
### Added
- Single-container Docker build: Go API serves the built SPA
- docker-compose with PostgreSQL

### Changed
- Echo serves SPA from ./public with HTML5 fallback

### Fixed
- go mod download retried for flaky CI networks

## [0.11.2] - 2026-05-25
### Changed
- README architecture diagram + quick start

### Fixed
- EditorialPage hook ordering (rules of hooks)

### Changed
- Dockerfile caches go build + npm ci layers

### Fixed
- compose waits for postgres healthcheck

### Changed
- ESLint config ignores generated assets

### Fixed
- Migration order documented in README

### Changed
- Refactor Avatar to use shared format helpers

## [0.12.0] - 2026-06-04
### Added
- Frontend pure-logic test suite (Vitest)

## [0.12.1] - 2026-06-09
### Added
- Backend unit tests (Go): role hierarchy + standings parser
- Extracted pure parseStandings() from the CF client

### Added
- Test cases for getInitials edge inputs

### Added
- Test cases for isStreakActive boundaries

### Added
- Table-driven cases for Role.AtLeast

### Added
- parseStandings handles malformed rows

### Changed
- README documents test commands (Vitest + go test)

### Changed
- canSee() access matrix covered by tests

### Fixed
- Stabilize streak test around midnight boundary

## [1.0.0] - 2026-06-12
### Added
- Stable release: Go API + React SPA + Chrome extension
- Test coverage across frontend (Vitest) and backend (Go testing)

### Added
- Backend use-case unit tests: computeStats (streak/count), ParseProblemURL, slugToTitle, nextRole, sha256Hash

### Changed
- Repository Dockerfile now keeps full source + .git for the test harness; production image preserved as Dockerfile.production
- .dockerignore no longer excludes .git (required for base-commit reset)

### Added
- Backend usecase tests via in-memory repository fakes: users, admin/roles, submissions, problems, editorials, announcements, squads (usecase coverage 12.7%->47.5%)
- Frontend tests for the UI store and role/platform token metadata (46->57 tests)
