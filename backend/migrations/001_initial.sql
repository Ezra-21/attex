-- Focus ASTU CP Hub — Initial Migration
-- Run against your Supabase project in the SQL editor (or via psql).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE role_type AS ENUM (
    'SUPER_ADMIN', 'ADMIN', 'SQUAD_LEAD', 'SQUAD_MEMBER', 'COMMUNITY'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE platform_type AS ENUM (
    'LEETCODE', 'CODEFORCES', 'ATCODER', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_scope AS ENUM (
    'GLOBAL', 'SQUAD'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS squads (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL UNIQUE,
  full_name            TEXT        NOT NULL DEFAULT '',
  bio                  TEXT,
  telegram_handle      TEXT        NOT NULL DEFAULT '',
  linkedin_url         TEXT,
  leetcode_handle      TEXT,
  codeforces_handle    TEXT        NOT NULL DEFAULT '',
  atcoder_handle       TEXT,
  squad_id             UUID        REFERENCES squads(id) ON DELETE SET NULL,
  role                 role_type   NOT NULL DEFAULT 'COMMUNITY',
  is_banned            BOOLEAN     NOT NULL DEFAULT false,
  is_active            BOOLEAN     NOT NULL DEFAULT false,
  api_key_hash         TEXT,
  problem_count        INTEGER     NOT NULL DEFAULT 0,
  daily_streak         INTEGER     NOT NULL DEFAULT 0,
  last_submission_date DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT        NOT NULL,
  token      TEXT        NOT NULL UNIQUE,
  created_by UUID        REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  squad_id    UUID        REFERENCES squads(id),
  role        role_type   NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problems (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT          NOT NULL,
  platform     platform_type NOT NULL,
  external_id  TEXT          NOT NULL,
  external_link TEXT         NOT NULL,
  tags         TEXT[]        NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE TABLE IF NOT EXISTS contests (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT          NOT NULL,
  platform    platform_type NOT NULL DEFAULT 'CODEFORCES',
  external_id TEXT          NOT NULL UNIQUE,
  held_at     TIMESTAMPTZ   NOT NULL,
  synced_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id   UUID        NOT NULL REFERENCES problems(id) ON DELETE RESTRICT,
  language     TEXT        NOT NULL,
  code         TEXT        NOT NULL,
  is_contest   BOOLEAN     NOT NULL DEFAULT false,
  contest_id   UUID        REFERENCES contests(id),
  source       TEXT        NOT NULL DEFAULT 'manual',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contest_standings (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id      UUID    NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id         UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank            INTEGER NOT NULL,
  old_rating      INTEGER,
  new_rating      INTEGER,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  upsolved_count  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (contest_id, user_id)
);

CREATE TABLE IF NOT EXISTS squad_tracks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id   UUID        NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS squad_track_topics (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    UUID        NOT NULL REFERENCES squad_tracks(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  order_index INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topic_problems (
  topic_id   UUID        NOT NULL REFERENCES squad_track_topics(id) ON DELETE CASCADE,
  problem_id UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (topic_id, problem_id)
);

CREATE TABLE IF NOT EXISTS editorials (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_md  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID        NOT NULL REFERENCES users(id),
  squad_id   UUID        REFERENCES squads(id),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,