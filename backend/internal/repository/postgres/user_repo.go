package postgres

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct{ db *pgxpool.Pool }

func NewUserRepo(db *pgxpool.Pool) *UserRepo { return &UserRepo{db: db} }

func scanUser(row pgx.CollectableRow) (*domain.User, error) {
	u := &domain.User{}
	return u, row.Scan(
		&u.ID, &u.Email, &u.FullName, &u.Bio,
		&u.TelegramHandle, &u.LinkedInURL,
		&u.LeetCodeHandle, &u.CodeforcesHandle, &u.AtCoderHandle,
		&u.SquadID, &u.Role, &u.IsBanned, &u.IsActive,
		&u.APIKeyHash, &u.ProblemCount, &u.DailyStreak,
		&u.LastSubmissionDate, &u.CreatedAt,
	)
}

const userCols = `id, email, full_name, bio, telegram_handle, linkedin_url,
  leetcode_handle, codeforces_handle, atcoder_handle,
  squad_id, role, is_banned, is_active, api_key_hash,
  problem_count, daily_streak, last_submission_date, created_at`

func (r *UserRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	rows, err := r.db.Query(ctx, `SELECT `+userCols+` FROM users WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	u, err := pgx.CollectOneRow(rows, scanUser)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("user not found")
	}
	return u, err
}

func (r *UserRepo) GetByCodeforcesHandle(ctx context.Context, handle string) (*domain.User, error) {
	rows, err := r.db.Query(ctx, `SELECT `+userCols+` FROM users WHERE codeforces_handle=$1`, handle)
	if err != nil {
		return nil, err
	}
	u, err := pgx.CollectOneRow(rows, scanUser)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

func (r *UserRepo) ListAll(ctx context.Context) ([]*domain.User, error) {
	rows, err := r.db.Query(ctx, `SELECT `+userCols+` FROM users ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, scanUser)
}

func (r *UserRepo) ListBySquad(ctx context.Context, squadID string) ([]*domain.User, error) {
	rows, err := r.db.Query(ctx, `SELECT `+userCols+` FROM users WHERE squad_id=$1 ORDER BY problem_count DESC`, squadID)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, scanUser)
}

func (r *UserRepo) Update(ctx context.Context, u *domain.User) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET
			full_name=$2, bio=$3, telegram_handle=$4, linkedin_url=$5,
			leetcode_handle=$6, codeforces_handle=$7, atcoder_handle=$8,
			squad_id=$9, role=$10, is_banned=$11, is_active=$12
		WHERE id=$1`,
		u.ID, u.FullName, u.Bio, u.TelegramHandle, u.LinkedInURL,
		u.LeetCodeHandle, u.CodeforcesHandle, u.AtCoderHandle,
		u.SquadID, u.Role, u.IsBanned, u.IsActive,
	)
	return err
}

func (r *UserRepo) UpdateStats(ctx context.Context, userID string, problemCount, dailyStreak int, lastSubmissionDate *string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE users SET problem_count=$2, daily_streak=$3, last_submission_date=$4
		WHERE id=$1`,
		userID, problemCount, dailyStreak, lastSubmissionDate,
	)
	return err
}

func (r *UserRepo) SetAPIKeyHash(ctx context.Context, userID, hash string) error {
	_, err := r.db.Exec(ctx, `UPDATE users SET api_key_hash=$2 WHERE id=$1`, userID, hash)
	return err
}

func (r *UserRepo) ClearAPIKeyHash(ctx context.Context, userID string) error {
	_, err := r.db.Exec(ctx, `UPDATE users SET api_key_hash=NULL WHERE id=$1`, userID)
	return err
}

func (r *UserRepo) HasAPIKey(ctx context.Context, userID string) (bool, error) {
	var has bool
	err := r.db.QueryRow(ctx, `SELECT api_key_hash IS NOT NULL FROM users WHERE id=$1`, userID).Scan(&has)
	return has, err
}

func (r *UserRepo) ReconcileProblemCounts(ctx context.Context) (int64, error) {
	tag, err := r.db.Exec(ctx, `
		UPDATE users
		SET problem_count = (
			SELECT COUNT(DISTINCT problem_id)
			FROM submissions
			WHERE submissions.user_id = users.id
		)`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (r *UserRepo) GetByAPIKeyHash(ctx context.Context, hash string) (*domain.User, error) {
	rows, err := r.db.Query(ctx, `SELECT `+userCols+` FROM users WHERE api_key_hash=$1`, hash)
	if err != nil {
		return nil, err
	}
	u, err := pgx.CollectOneRow(rows, scanUser)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return u, err
}
