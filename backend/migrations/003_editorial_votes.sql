-- Editorial votes: each user can upvote (+1) or downvote (-1) each editorial once.
-- Repeated vote on the same direction is toggled off server-side.
CREATE TABLE IF NOT EXISTS editorial_votes (
  editorial_id UUID     NOT NULL REFERENCES editorials(id) ON DELETE CASCADE,
  user_id      UUID     NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  value        SMALLINT NOT NULL CHECK (value IN (1, -1)),
  voted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (editorial_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_editorial_votes_editorial_id ON editorial_votes(editorial_id);

ALTER TABLE editorial_votes ENABLE ROW LEVEL SECURITY;

-- Frontend Supabase client only needs SELECT (votes are written through the backend API).
CREATE POLICY "editorial_votes_select_all" ON editorial_votes
  FOR SELECT USING (true);
