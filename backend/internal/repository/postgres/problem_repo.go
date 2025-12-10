package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProblemRepo struct{ db *pgxpool.Pool }

func NewProblemRepo(db *pgxpool.Pool) *ProblemRepo { return &ProblemRepo{db: db} }

func scanProblem(row pgx.CollectableRow) (*domain.Problem, error) {
	p := &domain.Problem{}
	return p, row.Scan(&p.ID, &p.Name, &p.Platform, &p.ExternalID, &p.ExternalLink, &p.Tags, &p.CreatedAt)
}

func (r *ProblemRepo) GetByID(ctx context.Context, id string) (*domain.Problem, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, platform, external_id, external_link, tags, created_at FROM problems WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	p, err := pgx.CollectOneRow(rows, scanProblem)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("problem not found")
	}
	return p, err
}

func (r *ProblemRepo) GetByPlatformAndExternalID(ctx context.Context, platform domain.Platform, externalID string) (*domain.Problem, error) {
	rows, err := r.db.Query(ctx, `SELECT id, name, platform, external_id, external_link, tags, created_at FROM problems WHERE platform=$1 AND external_id=$2`, platform, externalID)
	if err != nil {
		return nil, err
	}
	p, err := pgx.CollectOneRow(rows, scanProblem)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return p, err
}

func (r *ProblemRepo) Create(ctx context.Context, p *domain.Problem) (*domain.Problem, error) {
	rows, err := r.db.Query(ctx, `
		INSERT INTO problems (name, platform, external_id, external_link, tags)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, platform, external_id, external_link, tags, created_at`,
		p.Name, p.Platform, p.ExternalID, p.ExternalLink, p.Tags,
	)
	if err != nil {
		return nil, err
	}
	return pgx.CollectOneRow(rows, scanProblem)
}

func (r *ProblemRepo) Upsert(ctx context.Context, p *domain.Problem) (*domain.Problem, error) {
	rows, err := r.db.Query(ctx, `
		INSERT INTO problems (name, platform, external_id, external_link, tags)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (platform, external_id) DO UPDATE
			SET name=EXCLUDED.name, external_link=EXCLUDED.external_link
		RETURNING id, name, platform, external_id, external_link, tags, created_at`,
		p.Name, p.Platform, p.ExternalID, p.ExternalLink, p.Tags,
	)
	if err != nil {
		return nil, err
	}
	return pgx.CollectOneRow(rows, scanProblem)
}

func (r *ProblemRepo) List(ctx context.Context, platform *domain.Platform, tag *string) ([]*domain.Problem, error) {
	var conditions []string
	var args []any
	argN := 1

	if platform != nil {
		conditions = append(conditions, fmt.Sprintf("platform=$%d", argN))
		args = append(args, *platform)
		argN++
	}
	if tag != nil {
		conditions = append(conditions, fmt.Sprintf("$%d=ANY(tags)", argN))
		args = append(args, *tag)
		argN++
	}

	q := `SELECT id, name, platform, external_id, external_link, tags, created_at FROM problems`
	if len(conditions) > 0 {
		q += " WHERE " + strings.Join(conditions, " AND ")
	}
	q += " ORDER BY created_at DESC"

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, scanProblem)
}

func (r *ProblemRepo) Search(ctx context.Context, query string, limit int) ([]*domain.Problem, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, name, platform, external_id, external_link, tags, created_at
		FROM problems
		WHERE name ILIKE $1
		ORDER BY name
		LIMIT $2`,
		"%"+query+"%", limit,
	)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, scanProblem)
}
