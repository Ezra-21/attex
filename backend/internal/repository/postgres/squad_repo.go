package postgres

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SquadRepo struct{ db *pgxpool.Pool }

func NewSquadRepo(db *pgxpool.Pool) *SquadRepo { return &SquadRepo{db: db} }

func (r *SquadRepo) Create(ctx context.Context, s *domain.Squad) (*domain.Squad, error) {
	err := r.db.QueryRow(ctx,
		`INSERT INTO squads (name) VALUES ($1) RETURNING id, name, created_at`,
		s.Name,
	).Scan(&s.ID, &s.Name, &s.CreatedAt)
	return s, err
}

func (r *SquadRepo) GetByID(ctx context.Context, id string) (*domain.Squad, error) {
	s := &domain.Squad{}
	err := r.db.QueryRow(ctx, `SELECT id, name, created_at FROM squads WHERE id=$1`, id).
		Scan(&s.ID, &s.Name, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("squad not found")
	}
	return s, err
}

func (r *SquadRepo) Update(ctx context.Context, s *domain.Squad) (*domain.Squad, error) {
	err := r.db.QueryRow(ctx,
		`UPDATE squads SET name=$2 WHERE id=$1 RETURNING id, name, created_at`,
		s.ID, s.Name,
	).Scan(&s.ID, &s.Name, &s.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("squad not found")
	}
	return s, err
}

func (r *SquadRepo) Delete(ctx context.Context, id string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM squads WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("squad not found")
	}
	return nil
}

func (r *SquadRepo) ListAll(ctx context.Context) ([]*domain.Squad, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, created_at FROM squads ORDER BY created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Squad
	for rows.Next() {
		s := &domain.Squad{}
		if err := rows.Scan(&s.ID, &s.Name, &s.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
}

func (r *SquadRepo) CreateTrack(ctx context.Context, t *domain.SquadTrack) (*domain.SquadTrack, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO squad_tracks (squad_id, title)
		VALUES ($1, $2)
		RETURNING id, squad_id, title, created_at`,
		t.SquadID, t.Title,
	).Scan(&t.ID, &t.SquadID, &t.Title, &t.CreatedAt)
	return t, err
}

func (r *SquadRepo) GetTracks(ctx context.Context, squadID string) ([]*domain.SquadTrack, error) {
	rows, err := r.db.Query(ctx, `