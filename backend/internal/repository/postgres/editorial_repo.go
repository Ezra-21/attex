package postgres

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EditorialRepo struct{ db *pgxpool.Pool }

func NewEditorialRepo(db *pgxpool.Pool) *EditorialRepo { return &EditorialRepo{db: db} }

func (r *EditorialRepo) Create(ctx context.Context, e *domain.Editorial) (*domain.Editorial, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO editorials (problem_id, user_id, content_md)
		VALUES ($1, $2, $3)
		RETURNING id, problem_id, user_id, content_md, created_at`,
		e.ProblemID, e.UserID, e.ContentMD,
	).Scan(&e.ID, &e.ProblemID, &e.UserID, &e.ContentMD, &e.CreatedAt)
	return e, err
}

func (r *EditorialRepo) Update(ctx context.Context, e *domain.Editorial) error {
	_, err := r.db.Exec(ctx, `UPDATE editorials SET content_md=$2 WHERE id=$1 AND user_id=$3`, e.ID, e.ContentMD, e.UserID)
	return err
}

func (r *EditorialRepo) Delete(ctx context.Context, id, userID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM editorials WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}

func (r *EditorialRepo) GetByID(ctx context.Context, id string) (*domain.Editorial, error) {
	e := &domain.Editorial{Author: &domain.User{}}
	err := r.db.QueryRow(ctx, `
		SELECT e.id, e.problem_id, e.user_id, e.content_md, e.created_at,
		       u.id, u.full_name, u.role
		FROM editorials e
		JOIN users u ON u.id = e.user_id
		WHERE e.id=$1`, id,
	).Scan(&e.ID, &e.ProblemID, &e.UserID, &e.ContentMD, &e.CreatedAt,
		&e.Author.ID, &e.Author.FullName, &e.Author.Role)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("editorial not found")
	}
	return e, err
}

func (r *EditorialRepo) ListByProblem(ctx context.Context, problemID, callerID string) ([]*domain.Editorial, error) {
	rows, err := r.db.Query(ctx, `
		SELECT e.id, e.problem_id, e.user_id, e.content_md, e.created_at,
		       u.id, u.full_name, u.role,
		       COALESCE(SUM(v.value), 0) AS score,
		       MAX(CASE WHEN v.user_id=$2 THEN CAST(v.value AS INT) END) AS user_vote
		FROM editorials e
		JOIN users u ON u.id = e.user_id
		LEFT JOIN editorial_votes v ON v.editorial_id = e.id
		WHERE e.problem_id=$1
		GROUP BY e.id, u.id, u.full_name, u.role
		ORDER BY score DESC, e.created_at DESC`, problemID, callerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Editorial
	for rows.Next() {
		e := &domain.Editorial{Author: &domain.User{}}
		var userVote pgtype.Int4
		if err := rows.Scan(
			&e.ID, &e.ProblemID, &e.UserID, &e.ContentMD, &e.CreatedAt,
			&e.Author.ID, &e.Author.FullName, &e.Author.Role,
			&e.Score, &userVote,
		); err != nil {
			return nil, err
		}
		if userVote.Valid {
			v := int(userVote.Int32)
			e.UserVote = &v
		}
		result = append(result, e)
	}
	return result, rows.Err()
}

// ToggleVote upserts a vote; voting the same direction again removes it.
func (r *EditorialRepo) ToggleVote(ctx context.Context, editorialID, userID string, value int) error {
	var existing int
	err := r.db.QueryRow(ctx,
		`SELECT value FROM editorial_votes WHERE editorial_id=$1 AND user_id=$2`,
		editorialID, userID,
	).Scan(&existing)

	if errors.Is(err, pgx.ErrNoRows) {
		_, err = r.db.Exec(ctx,
			`INSERT INTO editorial_votes (editorial_id, user_id, value) VALUES ($1, $2, $3)`,
			editorialID, userID, value,
		)
		return err
	}
	if err != nil {
		return err
	}
	if existing == value {
		// Same direction → remove vote
		_, err = r.db.Exec(ctx,
			`DELETE FROM editorial_votes WHERE editorial_id=$1 AND user_id=$2`,
			editorialID, userID,
		)
	} else {
		// Flip vote direction
		_, err = r.db.Exec(ctx,
			`UPDATE editorial_votes SET value=$3, voted_at=NOW() WHERE editorial_id=$1 AND user_id=$2`,
			editorialID, userID, value,
		)
	}
	return err
}
