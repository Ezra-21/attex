package postgres

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ContestRepo struct{ db *pgxpool.Pool }

func NewContestRepo(db *pgxpool.Pool) *ContestRepo { return &ContestRepo{db: db} }

func (r *ContestRepo) Upsert(ctx context.Context, c *domain.Contest) (*domain.Contest, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO contests (name, platform, external_id, held_at, synced_at)
		VALUES ($1, $2, $3, $4, now())
		ON CONFLICT (external_id) DO UPDATE
			SET name=EXCLUDED.name, held_at=EXCLUDED.held_at, synced_at=now()
		RETURNING id, name, platform, external_id, held_at, synced_at, created_at`,
		c.Name, c.Platform, c.ExternalID, c.HeldAt,
	).Scan(&c.ID, &c.Name, &c.Platform, &c.ExternalID, &c.HeldAt, &c.SyncedAt, &c.CreatedAt)
	return c, err
}

func (r *ContestRepo) GetByID(ctx context.Context, id string) (*domain.Contest, error) {
	c := &domain.Contest{}
	err := r.db.QueryRow(ctx, `
		SELECT id, name, platform, external_id, held_at, synced_at, created_at
		FROM contests WHERE id=$1`, id,
	).Scan(&c.ID, &c.Name, &c.Platform, &c.ExternalID, &c.HeldAt, &c.SyncedAt, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("contest not found")
	}
	return c, err
}

func (r *ContestRepo) GetByExternalID(ctx context.Context, externalID string) (*domain.Contest, error) {
	c := &domain.Contest{}
	err := r.db.QueryRow(ctx, `
		SELECT id, name, platform, external_id, held_at, synced_at, created_at
		FROM contests WHERE external_id=$1`, externalID,
	).Scan(&c.ID, &c.Name, &c.Platform, &c.ExternalID, &c.HeldAt, &c.SyncedAt, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return c, err
}

func (r *ContestRepo) List(ctx context.Context) ([]*domain.Contest, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, platform, external_id, held_at, synced_at, created_at
		FROM contests ORDER BY held_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Contest
	for rows.Next() {
		c := &domain.Contest{}
		if err := rows.Scan(&c.ID, &c.Name, &c.Platform, &c.ExternalID, &c.HeldAt, &c.SyncedAt, &c.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, rows.Err()
}

func (r *ContestRepo) UpsertStanding(ctx context.Context, s *domain.ContestStanding) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO contest_standings (contest_id, user_id, rank, old_rating, new_rating, problems_solved, upsolved_count)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (contest_id, user_id) DO UPDATE
			SET rank=EXCLUDED.rank, old_rating=EXCLUDED.old_rating,
			    new_rating=EXCLUDED.new_rating, problems_solved=EXCLUDED.problems_solved,
			    upsolved_count=EXCLUDED.upsolved_count`,
		s.ContestID, s.UserID, s.Rank, s.OldRating, s.NewRating, s.ProblemsSolved, s.UpsolvedCount,
	)
	return err
}

func (r *ContestRepo) GetStandings(ctx context.Context, contestID string) ([]*domain.ContestStanding, error) {
	rows, err := r.db.Query(ctx, `
		SELECT cs.id, cs.contest_id, cs.user_id, cs.rank, cs.old_rating, cs.new_rating,
		       cs.problems_solved, cs.upsolved_count,
		       u.id, u.full_name, u.role, u.codeforces_handle
		FROM contest_standings cs
		JOIN users u ON u.id = cs.user_id
		WHERE cs.contest_id=$1
		ORDER BY cs.rank ASC`, contestID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.ContestStanding
	for rows.Next() {
		s := &domain.ContestStanding{User: &domain.User{}}
		if err := rows.Scan(
			&s.ID, &s.ContestID, &s.UserID, &s.Rank, &s.OldRating, &s.NewRating,
			&s.ProblemsSolved, &s.UpsolvedCount,
			&s.User.ID, &s.User.FullName, &s.User.Role, &s.User.CodeforcesHandle,
		); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
}
