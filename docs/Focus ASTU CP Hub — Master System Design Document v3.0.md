**FOCUS ASTU CP HUB**

**Master System Design Document**

*Version 3.0*

Focus ASTU Competitive Programming Community

Adama Science and Technology University

Document Status: Living Document  |  Updated June 2026

# **Table of Contents**

[**Table of Contents	2**](#heading=)

[**1\. Executive Summary	5**](#heading=)

[**2\. System Overview & Goals	5**](#heading=)

[2.1  Core Features (MVP)	5](#heading=)

[2.2  Design Constraints	6](#heading=)

[**3\. Technology Stack	6**](#heading=)

[**4\. High-Level Architecture	7**](#heading=)

[4.1  System Topology	7](#heading=)

[4.2  Request Flow Summary	8](#heading=)

[**5\. Database Design	8**](#heading=)

[5.1  Database Enums	8](#heading=)

[5.2  Table Definitions	8](#heading=)

[Table: squads	8](#heading=)

[Table: users	9](#heading=)

[Table: invitations	9](#heading=)

[Table: system\_settings	10](#heading=)

[Table: user\_roles\_history	10](#heading=)

[Table: problems	10](#heading=)

[Table: submissions	11](#heading=)

[Table: contests	11](#heading=)

[Table: contest\_standings	12](#heading=)

[Table: squad\_tracks	12](#heading=)

[Table: squad\_track\_topics	12](#heading=)

[Table: topic\_problems	13](#heading=)

[Table: editorials	13](#heading=)

[Table: announcements	13](#heading=)

[5.3  Row Level Security Policies	14](#heading=)

[**6\. Authentication & Authorization	15**](#heading=)

[6.1  Core Principles	15](#heading=)

[6.2  Registration & Invitation Flow	15](#heading=)

[Path A — Public Signup (when enabled by Super Admin)	15](#heading=)

[Path B — Admin Invitation (default / primary path)	15](#heading=)

[6.3  Profile Completion Flow	15](#heading=)

[6.4  Role Hierarchy & Permission Matrix	16](#heading=)

[6.5  Route Protection Strategy (Frontend)	16](#heading=)

[**7\. Backend Design (Go — Clean Architecture)	17**](#heading=)

[7.1  Directory Structure	17](#heading=)

[7.2  Core Use Cases	17](#heading=)

[UC-01: Problem Submission	17](#heading=)

[UC-02: Codeforces Contest Sync	18](#heading=)

[UC-03: Squad Track Management	18](#heading=)

[UC-04: Daily Verse	18](#heading=)

[7.3  REST API Endpoint Reference	18](#heading=)

[Public Endpoints (No Auth Required)	19](#heading=)

[Authenticated Endpoints (Any Active, Non-Banned User)	19](#heading=)

[Squad Lead Endpoints	19](#heading=)

[Admin & Super Admin Endpoints	20](#heading=)

[7.4  Background Services	20](#heading=)

[Daily Verse Cache	20](#heading=)

[7.5  Deployment (Docker)	20](#heading=)

[**8\. Frontend Design (React \+ Vite)	21**](#heading=)

[8.1  Architecture & State Management	21](#heading=)

[8.2  Directory Structure	21](#heading=)

[8.3  Page & Feature Inventory	22](#heading=)

[8.4  Browser Extension Integration	23](#heading=)

[**9\. Landing Page & Navigation Model	23**](#heading=)

[9.1  Landing Page	23](#heading=)

[9.1.1  Landing Page Navbar	23](#heading=)

[9.1.2  Landing Page Content	23](#heading=)

[9.1.3  What the Landing Page Does NOT Show	24](#heading=)

[9.2  Announcements Page (/announcements)	24](#heading=)

[New Backend Endpoint Required	24](#heading=)

[Updated RLS / Endpoint Behaviour for Announcements	24](#heading=)

[9.3  Navigation Model	24](#heading=)

[9.3.1  Two Distinct Shells	24](#heading=)

[9.3.2  Sidebar Navigation Items	25](#heading=)

[9.3.3  Dashboard Page Content	25](#heading=)

[**10\. Browser Extension Design (Core MVP)	25**](#heading=)

[10.1  Overview & Supported Platforms	25](#heading=)

[10.2  Extension Architecture	26](#heading=)

[10.3  Authentication Handshake	26](#heading=)

[10.4  Submission Capture Flow	26](#heading=)

[**11\. Phase 2 — Future Features	27**](#heading=)

[**12\. Implementation Roadmap	27**](#heading=)

[Phase 1 — Foundation (Weeks 1–2)	27](#heading=)

[Phase 2 — Backend Core (Weeks 2–3)	28](#heading=)

[Phase 3 — Frontend Scaffolding (Weeks 3–4)	28](#heading=)

[Phase 4 — Core Features (Weeks 4–6)	28](#heading=)

[Phase 5 — Contest & Squad Features (Weeks 6–8)	29](#heading=)

[Phase 6 — Browser Extension (Weeks 7–9, parallel)	29](#heading=)

[Phase 7 — Deployment & Hardening (Weeks 9–10)	29](#heading=)

[**13\. Non-Functional Requirements	30**](#heading=)

# **1\. Executive Summary**

Focus ASTU CP Hub is a private, invite-only competitive programming portal built for the Focus ASTU tech community at Adama Science and Technology University. The platform is modelled after elite CP training hubs (e.g., A2SV) and provides a centralized space for tracking problem-solving progress, running internal contests, managing squad-based curriculum, and building a culture of competitive accountability.

The system is organized around the concept of Squads — cohorts of members analogous to "generations" at A2SV — each led by Squad Leaders who design and deliver their squad's algorithmic curriculum. Admins manage the overall platform, while a Super Admin controls global system settings.

The platform consists of three interconnected components:

* A Go backend implementing Clean Architecture, exposed as a REST API.

* A React frontend (Vite \+ TypeScript) consuming both the Go API and Supabase directly.

* A browser extension (Chrome/Firefox) that automatically captures accepted submissions from LeetCode, Codeforces, and AtCoder and posts them to the portal.

# **2\. System Overview & Goals**

## **2.1  Core Features (MVP)**

| Feature | Description |
| :---- | :---- |
| Invite-Only Registration | Users join via an admin-generated invitation link or when public signup is explicitly enabled by a Super Admin. |
| Squad-Based Organization | Members belong to numbered Squads (e.g., 1st Squad, 2nd Squad). Each squad has its own lead, curriculum, and announcements. |
| Problem Tracking | Master list of problems from LeetCode, Codeforces, and AtCoder. Members log solutions; the platform tracks counts and streaks. |
| Code Viewing | Submitted code is stored and viewable by all members with syntax highlighting. No code execution is performed. |
| Contest Sync | Admins sync Codeforces contests by contest ID. The system fetches standings, maps participants to portal users, and tracks upsolves. |
| Editorials | Any member can write a Markdown editorial for any problem. |
| Squad Curriculum Tracks | Squad Leads design curriculum trees (Track → Topics → Problems). Problem names link externally; each row has an Editorial shortcut and inline Submit button for unsolved problems. |
| Announcements | Markdown-formatted. Squad Leads post to their own squad. Admins post globally or target specific squads (array of IDs). |
| Browser Extension | Auto-captures accepted solutions from LeetCode, Codeforces, and AtCoder and submits them to the portal silently. |
| Daily Verse | A Bible verse fetched from a public API, cached server-side, and displayed on the Landing Page. |
| Admin Dashboard | User management (role + squad combined assignment, ban), squad CRUD, invitation system (email via Resend), contest sync, and a repair tool for problem counts. |
| Member Directory | All active members listed and searchable by name or Codeforces handle, filterable by squad. Each row links to the member's profile. |
| Legal Pages | Privacy Policy and Terms of Service pages with consent captured at signup and profile completion. |

## **2.2  Design Constraints**

* Deployment target is a budget VPS (1–2 GB RAM). All design decisions must respect this constraint.

* No code execution engine. The platform stores and displays code only.

* Authentication is entirely delegated to Supabase Auth. No custom password management.

* Frontend design (colors, fonts, animations) is defined separately and is excluded from this document.

# **3\. Technology Stack**

| Layer | Technology | Rationale |
| :---- | :---- | :---- |
| Backend Language | Go (Golang) 1.21+ | \~15 MB container image, high concurrency via goroutines, ideal for budget VPS hosting. |
| Backend Framework | Echo v4 | Lightweight HTTP router with good middleware support for JWT and CORS. |
| Database | PostgreSQL via Supabase | Managed PostgreSQL with built-in Auth, Row Level Security, and real-time capabilities. |
| Database Client (Go) | pgx/v5 (pgxpool) | High-performance PostgreSQL driver with connection pooling. |
| Authentication | Supabase Auth | Handles magic links, invite flows, JWT issuance, and session management. |
| Frontend Framework | React 18 \+ Vite \+ TypeScript | Fast HMR in development, optimized production builds, strong typing. |
| Frontend Routing | React Router DOM v6 | SPA navigation with nested layout routes and route guards. |
| Frontend Data Fetching | TanStack Query | Server-state caching, background refetching, and stale-while-revalidate strategy. |
| Frontend State | Zustand | Minimal global state for UI toggles. TanStack Query handles all server state. |
| Supabase Client | @supabase/supabase-js | Auth state management and direct DB reads where no Go business logic is required. |
| Containerization | Docker \+ Docker Compose | Reproducible builds, simple VPS deployment. Multi-stage builds keep images minimal. |
| Reverse Proxy | Nginx (in Docker) | Serves the built React SPA and proxies /api/\* to the Go container. |
| Browser Extension | Manifest V3 (Chrome/Firefox) | Modern extension standard with background service workers and content scripts. |
| External APIs | Codeforces API, Bible Verse API | Free, public APIs requiring no authentication. |

# **4\. High-Level Architecture**

## **4.1  System Topology**

|   ┌──────────────────────────────────────────────────────────────┐ |
| :---- |
|   │                        CLIENT LAYER                          │ |
|   │                                                              │ |
|   │  ┌───────────────────────┐   ┌──────────────────────────┐   │ |
|   │  │   React SPA            │   │  Browser Extension        │   │ |
|   │  │  (Vite \+ TypeScript)   │   │  (Chrome / Firefox MV3)   │   │ |
|   │  └──────────┬────────────┘   └──────────┬───────────────┘   │ |
|   └─────────────┼─────────────────────────── ┼ ─────────────────┘ |
|                 │ REST /api/\*                 │ POST /api/submissions |
|                 ▼                             ▼ |
|   ┌──────────────────────────────────────────────────────────────┐ |
|   │                  NGINX REVERSE PROXY                         │ |
|   │       serves /  →  React SPA static files                    │ |
|   │       proxies /api/\* → Go Backend :8080                      │ |
|   └──────────────────────────┬───────────────────────────────────┘ |
|                              │ |
|                              ▼ |
|   ┌──────────────────────────────────────────────────────────────┐ |
|   │                  GO BACKEND  (:8080)                         │ |
|   │   Clean Architecture: domain / usecase / repository /        │ |
|   │                        delivery                              │ |
|   │  ┌────────────────┐ ┌─────────────────┐ ┌───────────────┐   │ |
|   │  │ Submission UC  │ │ Contest Sync UC  │ │  Squad UC     │   │ |
|   │  └────────────────┘ └────────┬────────┘ └───────────────┘   │ |
|   │  ┌────────────────┐ ┌────────▼────────┐                     │ |
|   │  │ Verse Fetcher  │ │  CF API Client   │                     │ |
|   │  │ (24hr cache)   │ │  codeforces.com  │                     │ |
|   │  └────────────────┘ └─────────────────┘                     │ |
|   └─────────────────────────────┬────────────────────────────────┘ |
|                                 │  pgx/v5  (DATABASE\_URL) |
|                                 ▼ |
|   ┌──────────────────────────────────────────────────────────────┐ |
|   │                       SUPABASE                               │ |
|   │  ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐   │ |
|   │  │ Auth Service│  │  PostgreSQL DB    │  │ RLS Policies  │   │ |
|   │  └─────────────┘  └──────────────────┘  └───────────────┘   │ |
|   └──────────────────────────────────────────────────────────────┘ |

## **4.2  Request Flow Summary**

| Scenario | Flow |
| :---- | :---- |
| User logs in | React → Supabase Auth (magic link) → Supabase returns JWT → stored in React context |
| User views problem list | React → Supabase JS client directly (RLS-protected SELECT on problems) — bypasses Go to save compute |
| Extension submits code | Extension → Nginx → Go API (JWT validated) → Postgres → streak/count updated |
| Squad Lead syncs CF contest | React → Nginx → Go API (Squad Lead JWT \+ squad\_id check) → Go calls Codeforces API → results saved to Postgres |
| User reads dashboard | React → Go API GET /api/verse (cached) \+ Supabase direct for user stats |

# **5\. Database Design**

## **5.1  Database Enums**

All enums are defined as PostgreSQL ENUM types for type safety at the database level.

| CREATE TYPE role\_type AS ENUM ( |
| :---- |
|   'SUPER\_ADMIN', 'ADMIN', 'SQUAD\_LEAD', 'SQUAD\_MEMBER', 'COMMUNITY' |
| ); |
|  |
| CREATE TYPE platform\_type AS ENUM ( |
|   'LEETCODE', 'CODEFORCES', 'ATCODER', 'OTHER' |
| ); |
|  |
| CREATE TYPE announcement\_scope AS ENUM ( |
|   'GLOBAL', 'SQUAD' |
| ); |

## **5.2  Table Definitions**

### **Table: squads**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| name | TEXT | NOT NULL, UNIQUE | e.g. "1st Squad", "2nd Squad" |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

### **Table: users**

Maps 1:1 to auth.users. Stores all application-level profile data. Created via a Supabase Auth trigger on first login.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, FK → auth.users.id ON DELETE CASCADE | Mirrors Supabase Auth user ID |
| email | TEXT | NOT NULL, UNIQUE | User email (synced from auth) |
| full\_name | TEXT | NOT NULL | Display name |
| bio | TEXT | NULLABLE | Short personal bio |
| telegram\_handle | TEXT | NOT NULL (required at completion) | Telegram username (no @) |
| linkedin\_url | TEXT | NULLABLE | LinkedIn profile URL |
| leetcode\_handle | TEXT | NULLABLE | LeetCode username |
| codeforces\_handle | TEXT | NULLABLE | Used for CF contest matching |
| atcoder\_handle | TEXT | NULLABLE | AtCoder handle |
| squad\_id | UUID | NULLABLE, FK → squads.id ON DELETE SET NULL | NULL \= COMMUNITY role |
| role | role\_type | NOT NULL, DEFAULT 'COMMUNITY' | User's current role |
| is\_banned | BOOLEAN | NOT NULL, DEFAULT false | Banned users get 403 on all writes |
| is\_active | BOOLEAN | NOT NULL, DEFAULT false | False until profile completion |
| problem\_count | INTEGER | NOT NULL, DEFAULT 0 | Denormalized total unique solves |
| daily\_streak | INTEGER | NOT NULL, DEFAULT 0 | Consecutive days with a submission |
| last\_submission\_date | DATE | NULLABLE | Used to compute streak continuity |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Account creation time |

### **Table: invitations**

Tracks admin-generated invite tokens. Enforces that only the intended email can consume each token.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| email | TEXT | NOT NULL | The email this invitation is locked to |
| token | TEXT | NOT NULL, UNIQUE | Cryptographically random 32-byte hex token |
| created\_by | UUID | FK → users.id | The admin who generated the invite |
| expires\_at | TIMESTAMPTZ | NOT NULL | Validity window (e.g. 72 hours from creation) |
| used\_at | TIMESTAMPTZ | NULLABLE | Set on consumption; NULL means still valid |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

### **Table: system\_settings**

A key-value store for global platform configuration. Managed exclusively by Super Admins. Seed: INSERT INTO system\_settings (key, value) VALUES ('signup\_open', 'false');

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| key | TEXT | PRIMARY KEY | Setting name, e.g. signup\_open |
| value | TEXT | NOT NULL | String value, e.g. "false" |
| updated\_at | TIMESTAMPTZ | DEFAULT now() | Last modified timestamp |

### **Table: user\_roles\_history**

Immutable log of role and squad assignments over time. Powers dynamic badge generation (e.g. "2nd Squad Lead").

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| user\_id | UUID | NOT NULL, FK → users.id ON DELETE CASCADE | The user whose role changed |
| squad\_id | UUID | NULLABLE, FK → squads.id | Squad context at time of role assignment |
| role | role\_type | NOT NULL | The role assigned |
| assigned\_at | TIMESTAMPTZ | DEFAULT now() | When this role was assigned |

### **Table: problems**

Master catalog of all problems across all platforms. Problems are created automatically when an extension submission references an unknown external\_id.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Internal problem ID |
| name | TEXT | NOT NULL | Human-readable problem name |
| platform | platform\_type | NOT NULL | Source platform |
| external\_id | TEXT | NOT NULL | Platform-specific identifier (e.g. 1A, two-sum) |
| external\_link | TEXT | NOT NULL | Direct URL to the problem page |
| tags | TEXT\[\] | DEFAULT '{}' | Algorithmic tags, e.g. {dp, math, greedy} |
| created\_at | TIMESTAMPTZ | DEFAULT now() | When first added to the portal |
| — UNIQUE — |  | (platform, external\_id) | Prevents duplicate problem entries |

### **Table: submissions**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Submission ID |
| user\_id | UUID | NOT NULL, FK → users.id ON DELETE CASCADE | The submitting user |
| problem\_id | UUID | NOT NULL, FK → problems.id ON DELETE RESTRICT | The problem solved |
| language | TEXT | NOT NULL | e.g. C++, Python, Java |
| code | TEXT | NOT NULL | Raw accepted source code |
| is\_contest | BOOLEAN | NOT NULL, DEFAULT false | True if submitted during a tracked contest |
| contest\_id | UUID | NULLABLE, FK → contests.id | Associated contest (when is\_contest \= true) |
| source | TEXT | NOT NULL, DEFAULT 'manual' | 'manual' or 'extension' |
| submitted\_at | TIMESTAMPTZ | DEFAULT now() | Submission timestamp |

### **Table: contests**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Internal contest ID |
| name | TEXT | NOT NULL | Contest display name |
| platform | platform\_type | NOT NULL, DEFAULT 'CODEFORCES' | Source platform |
| external\_id | TEXT | NOT NULL, UNIQUE | Codeforces contest ID, e.g. 1932 |
| held\_at | TIMESTAMPTZ | NOT NULL | When the contest took place |
| synced\_at | TIMESTAMPTZ | DEFAULT now() | Last fetch from Codeforces |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Row creation timestamp |

### **Table: contest\_standings**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| contest\_id | UUID | NOT NULL, FK → contests.id ON DELETE CASCADE | The contest |
| user\_id | UUID | NOT NULL, FK → users.id ON DELETE CASCADE | The participant |
| rank | INTEGER | NOT NULL | Final contest rank |
| old\_rating | INTEGER | NULLABLE | Codeforces rating before contest |
| new\_rating | INTEGER | NULLABLE | Codeforces rating after contest |
| problems\_solved | INTEGER | NOT NULL, DEFAULT 0 | Count solved during contest |
| upsolved\_count | INTEGER | NOT NULL, DEFAULT 0 | Count solved after contest |
| — UNIQUE — |  | (contest\_id, user\_id) | One standing per user per contest |

### **Table: squad\_tracks**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| squad\_id | UUID | NOT NULL, FK → squads.id ON DELETE CASCADE | Owning squad |
| title | TEXT | NOT NULL | Track name, e.g. "Python Foundations" |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

### **Table: squad\_track\_topics**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| track\_id | UUID | NOT NULL, FK → squad\_tracks.id ON DELETE CASCADE | Parent track |
| title | TEXT | NOT NULL | Topic name, e.g. "Hashmaps", "DP Basics" |
| order\_index | INTEGER | NOT NULL, DEFAULT 0 | Display order within a track |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Creation timestamp |

### **Table: topic\_problems**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| topic\_id | UUID | NOT NULL, FK → squad\_track\_topics.id ON DELETE CASCADE | Parent topic |
| problem\_id | UUID | NOT NULL, FK → problems.id ON DELETE CASCADE | Linked problem |
| added\_at | TIMESTAMPTZ | DEFAULT now() | When the problem was added |
| — PK — |  | (topic\_id, problem\_id) | Composite primary key |

### **Table: editorials**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| problem\_id | UUID | NOT NULL, FK → problems.id ON DELETE CASCADE | Problem this covers |
| user\_id | UUID | NOT NULL, FK → users.id ON DELETE CASCADE | Author |
| content\_md | TEXT | NOT NULL | Full editorial in Markdown format |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Submission timestamp |

### **Table: announcements**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT gen\_random\_uuid() | Primary key |
| author\_id | UUID | NOT NULL, FK → users.id | The user who created the announcement |
| squad\_id | UUID | NULLABLE, FK → squads.id | NULL \= global; non-null \= squad-scoped |
| title | TEXT | NOT NULL | Announcement headline |
| body | TEXT | NOT NULL | Body content (Markdown supported) |
| created\_at | TIMESTAMPTZ | DEFAULT now() | Publish timestamp |

## **5.3  Row Level Security Policies**

RLS is enabled on every table. The Go backend connects using the service\_role key, which bypasses RLS for trusted server operations. The React frontend uses the user JWT and is subject to all policies below.

| Table | Role | SELECT | INSERT | UPDATE | DELETE |
| :---- | :---- | :---- | :---- | :---- | :---- |
| users | Any authenticated | All rows | — | Own row only | — |
| users | ADMIN / SUPER\_ADMIN | All rows | — | Any row | — |
| problems | Any authenticated | All rows | — (Go only) | — | — |
| submissions | Any authenticated | All rows | Own user\_id, not banned | — | — |
| contests | Any authenticated | All rows | — (Go only) | — | — |
| contest\_standings | Any authenticated | All rows | — (Go only) | — | — |
| editorials | Any authenticated | All rows | Own user\_id | Own row | Own row |
| squad\_tracks | SQUAD\_LEAD | All rows | Own squad only | Own squad only | Own squad only |
| squad\_track\_topics | SQUAD\_LEAD | All rows | Own squad only | Own squad only | Own squad only |
| topic\_problems | SQUAD\_LEAD | All rows | Own squad only | — | Own squad only |
| announcements | Any authenticated | Global \+ own squad | — (Go only) | — | — |
| system\_settings | SUPER\_ADMIN | All rows | All rows | All rows | — |
| invitations | ADMIN / SUPER\_ADMIN | All rows | All rows | All rows | — |

# **6\. Authentication & Authorization**

## **6.1  Core Principles**

* All authentication state is owned by Supabase Auth. No custom session management is implemented.
