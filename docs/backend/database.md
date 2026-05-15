# Database Schema

All tables are created by the migrations in `backend/migrations/`.

## Core tables

### `squads`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| created_at | timestamptz | |

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Matches Supabase auth UID |
| email | text unique | |
| full_name | text | |
| bio | text nullable | |
| telegram_handle | text | |
| linkedin_url | text nullable | |
| leetcode_handle | text nullable | |
| codeforces_handle | text | |
| atcoder_handle | text nullable | |
| squad_id | uuid FK → squads nullable | |
| role | text | `COMMUNITY`, `SQUAD_MEMBER`, `SQUAD_LEAD`, `ADMIN`, `SUPER_ADMIN` |
| is_banned | boolean default false | |
| is_active | boolean default false | true after profile completion |
| api_key_hash | text nullable | bcrypt hash of API key |
| problem_count | int default 0 | Maintained by triggers / reconcile job |
| daily_streak | int default 0 | Days with at least one submission |
| last_submission_date | date nullable | |
| created_at | timestamptz | |

### `problems`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| platform | text | `LEETCODE`, `CODEFORCES`, etc. |
| external_id | text | Platform's problem identifier |
| external_link | text | URL to the problem |
| tags | text[] | |
| created_at | timestamptz | |

### `submissions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users | |
| problem_id | uuid FK → problems | |
| language | text | |
| code | text | |
| is_contest | boolean | |
| contest_id | uuid nullable FK → contests | |
| source | text | `extension`, `manual`, etc. |
| submitted_at | timestamptz | |

### `contests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| platform | text | |
| external_id | text | Codeforces contest ID |
| held_at | timestamptz | |
| synced_at | timestamptz | |
| created_at | timestamptz | |

### `contest_standings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| contest_id | uuid FK → contests | |
| user_id | uuid FK → users | |
| rank | int | |
| old_rating | int nullable | |
| new_rating | int nullable | |
| problems_solved | int | |
| upsolved_count | int | |

### `editorials`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| problem_id | uuid FK → problems | |
| user_id | uuid FK → users | Author |
| content_md | text | Markdown content |
| score | int default 0 | Net vote score |
| created_at | timestamptz | |

### `editorial_votes`
| Column | Type | Notes |
|--------|------|-------|
| editorial_id | uuid FK → editorials | |
| user_id | uuid FK → users | |
| value | int | 1 or -1 |
| PRIMARY KEY | (editorial_id, user_id) | One vote per user per editorial |

### `announcements`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| author_id | uuid FK → users | |
| squad_id | uuid nullable FK → squads | null = global |
| title | text | |
| body | text | |
| created_at | timestamptz | |

### `invitations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| email | text | |
| token | text unique | |
| created_by | uuid nullable FK → users | |
| expires_at | timestamptz | |
| used_at | timestamptz nullable | |
| created_at | timestamptz | |

### `squad_tracks` / `squad_topics` / `topic_problems`
Curriculum tables. A **track** belongs to a squad, has ordered **topics**, and each topic contains a list of **problems** from the library.

### `system_settings`
Key-value store for platform settings (currently: `signup_open`).
