package postgres

import (
	"context"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AnnouncementRepo struct{ db *pgxpool.Pool }

func NewAnnouncementRepo(db *pgxpool.Pool) *AnnouncementRepo { return &AnnouncementRepo{db: db} }

func (r *AnnouncementRepo) Create(ctx context.Context, a *domain.Announcement) (*domain.Announcement, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO announcements (author_id, squad_id, title, body)
		VALUES ($1, $2, $3, $4)
		RETURNING id, author_id, squad_id, title, body, created_at`,
		a.AuthorID, a.SquadID, a.Title, a.Body,
	).Scan(&a.ID, &a.AuthorID, &a.SquadID, &a.Title, &a.Body, &a.CreatedAt)
	return a, err
}

func (r *AnnouncementRepo) ListPublic(ctx context.Context, limit int) ([]*domain.Announcement, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.id, a.author_id, a.squad_id, a.title, a.body, a.created_at,
		       u.id, u.full_name, u.role
		FROM announcements a
		JOIN users u ON u.id = a.author_id
		WHERE a.squad_id IS NULL
		ORDER BY a.created_at DESC
		LIMIT $1`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Announcement
	for rows.Next() {
		a := &domain.Announcement{Author: &domain.User{}}
		if err := rows.Scan(&a.ID, &a.AuthorID, &a.SquadID, &a.Title, &a.Body, &a.CreatedAt,
			&a.Author.ID, &a.Author.FullName, &a.Author.Role); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

func (r *AnnouncementRepo) ListForUser(ctx context.Context, squadID *string) ([]*domain.Announcement, error) {
	rows, err := r.db.Query(ctx, `
		SELECT a.id, a.author_id, a.squad_id, a.title, a.body, a.created_at,
		       u.id, u.full_name, u.role,
		       s.name
		FROM announcements a
		JOIN users u ON u.id = a.author_id
		LEFT JOIN squads s ON s.id = a.squad_id
		WHERE a.squad_id IS NULL OR a.squad_id=$1
		ORDER BY a.created_at DESC`, squadID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Announcement
	for rows.Next() {
		a := &domain.Announcement{Author: &domain.User{}}
		if err := rows.Scan(&a.ID, &a.AuthorID, &a.SquadID, &a.Title, &a.Body, &a.CreatedAt,
			&a.Author.ID, &a.Author.FullName, &a.Author.Role, &a.SquadName); err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}
