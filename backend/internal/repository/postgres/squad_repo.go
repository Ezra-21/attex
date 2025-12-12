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
		SELECT id, squad_id, title, created_at
		FROM squad_tracks WHERE squad_id=$1 ORDER BY created_at`, squadID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.SquadTrack
	for rows.Next() {
		t := &domain.SquadTrack{}
		if err := rows.Scan(&t.ID, &t.SquadID, &t.Title, &t.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

func (r *SquadRepo) GetTrackByID(ctx context.Context, trackID string) (*domain.SquadTrack, error) {
	t := &domain.SquadTrack{}
	err := r.db.QueryRow(ctx, `SELECT id, squad_id, title, created_at FROM squad_tracks WHERE id=$1`, trackID).
		Scan(&t.ID, &t.SquadID, &t.Title, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("track not found")
	}
	return t, err
}

func (r *SquadRepo) CreateTopic(ctx context.Context, t *domain.SquadTopic) (*domain.SquadTopic, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO squad_track_topics (track_id, title, order_index)
		VALUES ($1, $2, COALESCE((SELECT MAX(order_index)+1 FROM squad_track_topics WHERE track_id=$1), 0))
		RETURNING id, track_id, title, order_index, created_at`,
		t.TrackID, t.Title,
	).Scan(&t.ID, &t.TrackID, &t.Title, &t.OrderIndex, &t.CreatedAt)
	return t, err
}

func (r *SquadRepo) GetTopics(ctx context.Context, trackID string) ([]*domain.SquadTopic, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, track_id, title, order_index, created_at
		FROM squad_track_topics WHERE track_id=$1 ORDER BY order_index`, trackID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.SquadTopic
	for rows.Next() {
		t := &domain.SquadTopic{}
		if err := rows.Scan(&t.ID, &t.TrackID, &t.Title, &t.OrderIndex, &t.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

func (r *SquadRepo) GetTopicByID(ctx context.Context, topicID string) (*domain.SquadTopic, error) {
	t := &domain.SquadTopic{}
	err := r.db.QueryRow(ctx, `SELECT id, track_id, title, order_index, created_at FROM squad_track_topics WHERE id=$1`, topicID).
		Scan(&t.ID, &t.TrackID, &t.Title, &t.OrderIndex, &t.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("topic not found")
	}
	return t, err
}

func (r *SquadRepo) AssignProblem(ctx context.Context, topicID, problemID string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO topic_problems (topic_id, problem_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING`, topicID, problemID,
	)
	return err
}

func (r *SquadRepo) GetTopicProblems(ctx context.Context, topicID string) ([]*domain.TopicProblem, error) {
	rows, err := r.db.Query(ctx, `
		SELECT tp.topic_id, tp.problem_id, tp.added_at,
		       p.id, p.name, p.platform, p.external_id, p.external_link, p.tags, p.created_at
		FROM topic_problems tp
		JOIN problems p ON p.id = tp.problem_id
		WHERE tp.topic_id=$1
		ORDER BY tp.added_at`, topicID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.TopicProblem
	for rows.Next() {
		tp := &domain.TopicProblem{Problem: &domain.Problem{}}
		if err := rows.Scan(
			&tp.TopicID, &tp.ProblemID, &tp.AddedAt,
			&tp.Problem.ID, &tp.Problem.Name, &tp.Problem.Platform,
			&tp.Problem.ExternalID, &tp.Problem.ExternalLink, &tp.Problem.Tags, &tp.Problem.CreatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, tp)
	}
	return result, rows.Err()
}
