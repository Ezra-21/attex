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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auth trigger — create public.users stub on first sign-in ─────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems          ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_tracks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_track_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_problems    ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads            ENABLE ROW LEVEL SECURITY;

-- Helper: extract role for the calling user
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS role_type LANGUAGE sql STABLE AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Helper: extract squad_id for the calling user
CREATE OR REPLACE FUNCTION auth_user_squad() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT squad_id FROM public.users WHERE id = auth.uid();
$$;

-- squads — everyone authenticated can read
DROP POLICY IF EXISTS squads_select ON squads;
CREATE POLICY squads_select ON squads FOR SELECT TO authenticated USING (true);

-- users
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY users_update_own ON users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS users_update_admin ON users;
CREATE POLICY users_update_admin ON users FOR UPDATE TO authenticated
  USING (auth_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- problems — any authenticated user can read; Go writes via service_role
DROP POLICY IF EXISTS problems_select ON problems;
CREATE POLICY problems_select ON problems FOR SELECT TO authenticated USING (true);

-- submissions — any authenticated can read; can insert own if not banned
DROP POLICY IF EXISTS submissions_select ON submissions;
CREATE POLICY submissions_select ON submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS submissions_insert ON submissions;
CREATE POLICY submissions_insert ON submissions FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_banned)
  );

-- contests & standings — read-only for authenticated; Go writes via service_role
DROP POLICY IF EXISTS contests_select ON contests;
CREATE POLICY contests_select ON contests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS contest_standings_select ON contest_standings;
CREATE POLICY contest_standings_select ON contest_standings FOR SELECT TO authenticated USING (true);

-- editorials — all authenticated can read/write/delete own
DROP POLICY IF EXISTS editorials_select ON editorials;
CREATE POLICY editorials_select ON editorials FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS editorials_insert ON editorials;
CREATE POLICY editorials_insert ON editorials FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS editorials_update ON editorials;
CREATE POLICY editorials_update ON editorials FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS editorials_delete ON editorials;
CREATE POLICY editorials_delete ON editorials FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- squad_tracks — all can read; squad leads can write own squad
DROP POLICY IF EXISTS squad_tracks_select ON squad_tracks;
CREATE POLICY squad_tracks_select ON squad_tracks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS squad_tracks_write ON squad_tracks;
CREATE POLICY squad_tracks_write ON squad_tracks FOR ALL TO authenticated
  USING (
    auth_user_role() IN ('SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN')
    AND squad_id = auth_user_squad()
  )
  WITH CHECK (
    auth_user_role() IN ('SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN')
    AND squad_id = auth_user_squad()
  );

-- squad_track_topics — same pattern
DROP POLICY IF EXISTS squad_track_topics_select ON squad_track_topics;
CREATE POLICY squad_track_topics_select ON squad_track_topics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS squad_track_topics_write ON squad_track_topics;
CREATE POLICY squad_track_topics_write ON squad_track_topics FOR ALL TO authenticated
  USING (
    auth_user_role() IN ('SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM squad_tracks st
      WHERE st.id = track_id AND st.squad_id = auth_user_squad()
    )
  )
  WITH CHECK (
    auth_user_role() IN ('SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM squad_tracks st
      WHERE st.id = track_id AND st.squad_id = auth_user_squad()
    )
  );

-- topic_problems
DROP POLICY IF EXISTS topic_problems_select ON topic_problems;
CREATE POLICY topic_problems_select ON topic_problems FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS topic_problems_write ON topic_problems;
CREATE POLICY topic_problems_write ON topic_problems FOR ALL TO authenticated
  USING (
    auth_user_role() IN ('SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM squad_track_topics stt
      JOIN squad_tracks st ON st.id = stt.track_id
      WHERE stt.id = topic_id AND st.squad_id = auth_user_squad()
    )
  )
  WITH CHECK (
    auth_user_role() IN ('SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN')
    AND EXISTS (
      SELECT 1 FROM squad_track_topics stt
      JOIN squad_tracks st ON st.id = stt.track_id
      WHERE stt.id = topic_id AND st.squad_id = auth_user_squad()
    )
  );

-- announcements — global visible to all authenticated; squad-scoped only to squad members + admins
DROP POLICY IF EXISTS announcements_select ON announcements;
CREATE POLICY announcements_select ON announcements FOR SELECT TO authenticated
  USING (
    squad_id IS NULL
    OR squad_id = auth_user_squad()
    OR auth_user_role() IN ('ADMIN', 'SUPER_ADMIN')
  );

-- system_settings — SUPER_ADMIN only
DROP POLICY IF EXISTS system_settings_super_admin ON system_settings;
CREATE POLICY system_settings_super_admin ON system_settings FOR ALL TO authenticated
  USING (auth_user_role() = 'SUPER_ADMIN')
  WITH CHECK (auth_user_role() = 'SUPER_ADMIN');

-- invitations — ADMIN+ only
DROP POLICY IF EXISTS invitations_admin ON invitations;
CREATE POLICY invitations_admin ON invitations FOR ALL TO authenticated
  USING (auth_user_role() IN ('ADMIN', 'SUPER_ADMIN'))
  WITH CHECK (auth_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- user_roles_history — ADMIN+ can read; no direct writes (Go handles via service_role)
DROP POLICY IF EXISTS roles_history_select ON user_roles_history;
CREATE POLICY roles_history_select ON user_roles_history FOR SELECT TO authenticated
  USING (auth_user_role() IN ('ADMIN', 'SUPER_ADMIN') OR user_id = auth.uid());

-- ── Seed ─────────────────────────────────────────────────────────────────────

INSERT INTO system_settings (key, value)
VALUES ('signup_open', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO squads (name)
VALUES ('1st Squad')
ON CONFLICT (name) DO NOTHING;
