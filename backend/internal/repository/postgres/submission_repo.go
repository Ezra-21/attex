package postgres

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubmissionRepo struct{ db *pgxpool.Pool }

func NewSubmissionRepo(db *pgxpool.Pool) *SubmissionRepo { return &SubmissionRepo{db: db} }

func (r *SubmissionRepo) Create(ctx context.Context, s *domain.Submission) (*domain.Submission, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO submissions (user_id, problem_id, language, code, is_contest, contest_id, source)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, submitted_at`,
		s.UserID, s.ProblemID, s.Language, s.Code, s.IsContest, s.ContestID, s.Source,
	).Scan(&s.ID, &s.SubmittedAt)
	return s, err
}

func (r *SubmissionRepo) GetByID(ctx context.Context, id string) (*domain.Submission, error) {
	s := &domain.Submission{Problem: &domain.Problem{}}
	err := r.db.QueryRow(ctx, `
		SELECT s.id, s.user_id, s.problem_id, s.language, s.code, s.is_contest,
		       s.contest_id, s.source, s.submitted_at,
		       p.id, p.name, p.platform, p.external_id, p.external_link, p.tags, p.created_at
		FROM submissions s
		JOIN problems p ON p.id = s.problem_id
		WHERE s.id=$1`, id,
	).Scan(
		&s.ID, &s.UserID, &s.ProblemID, &s.Language, &s.Code, &s.IsContest,
		&s.ContestID, &s.Source, &s.SubmittedAt,
		&s.Problem.ID, &s.Problem.Name, &s.Problem.Platform,
		&s.Problem.ExternalID, &s.Problem.ExternalLink, &s.Problem.Tags, &s.Problem.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("submission not found")
	}
	return s, err
}

func (r *SubmissionRepo) ListByUser(ctx context.Context, userID string, limit, offset int) ([]*domain.Submission, error) {
	rows, err := r.db.Query(ctx, `
		SELECT s.id, s.user_id, s.problem_id, s.language, s.code, s.is_contest,
		       s.contest_id, s.source, s.submitted_at,
		       p.id, p.name, p.platform, p.external_id, p.external_link, p.tags, p.created_at
		FROM submissions s
		JOIN problems p ON p.id = s.problem_id
		WHERE s.user_id=$1
		ORDER BY s.submitted_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Submission
	for rows.Next() {
		s := &domain.Submission{Problem: &domain.Problem{}}
		if err := rows.Scan(
			&s.ID, &s.UserID, &s.ProblemID, &s.Language, &s.Code, &s.IsContest,
			&s.ContestID, &s.Source, &s.SubmittedAt,
			&s.Problem.ID, &s.Problem.Name, &s.Problem.Platform,
			&s.Problem.ExternalID, &s.Problem.ExternalLink, &s.Problem.Tags, &s.Problem.CreatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
}

func (r *SubmissionRepo) ExistsByUserAndProblem(ctx context.Context, userID, problemID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM submissions WHERE user_id=$1 AND problem_id=$2)`,
		userID, problemID,
	).Scan(&exists)
	return exists, err
}

func (r *SubmissionRepo) ListRecent(ctx context.Context, userID string, limit int) ([]*domain.Submission, error) {
	rows, err := r.db.Query(ctx, `
		SELECT s.id, s.user_id, s.problem_id, s.language, s.code, s.is_contest,
		       s.contest_id, s.source, s.submitted_at,
		       p.id, p.name, p.platform, p.external_id, p.external_link, p.tags, p.created_at
		FROM submissions s
		JOIN problems p ON p.id = s.problem_id
		WHERE s.user_id=$1
		ORDER BY s.submitted_at DESC
		LIMIT $2`, userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Submission
	for rows.Next() {
		s := &domain.Submission{Problem: &domain.Problem{}}
		if err := rows.Scan(
			&s.ID, &s.UserID, &s.ProblemID, &s.Language, &s.Code, &s.IsContest,
			&s.ContestID, &s.Source, &s.SubmittedAt,
			&s.Problem.ID, &s.Problem.Name, &s.Problem.Platform,
			&s.Problem.ExternalID, &s.Problem.ExternalLink, &s.Problem.Tags, &s.Problem.CreatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
}
