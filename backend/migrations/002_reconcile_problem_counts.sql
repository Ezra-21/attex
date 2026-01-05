-- Recompute problem_count for all users from actual distinct submissions.
-- Run this once to repair data corrupted by the old counting bug.
-- Safe to re-run: it is a pure UPDATE with no side effects.

UPDATE users
SET problem_count = (
  SELECT COUNT(DISTINCT problem_id)
  FROM submissions
  WHERE submissions.user_id = users.id
);
