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