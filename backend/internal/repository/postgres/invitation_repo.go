package postgres

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvitationRepo struct{ db *pgxpool.Pool }

func NewInvitationRepo(db *pgxpool.Pool) *InvitationRepo { return &InvitationRepo{db: db} }

func (r *InvitationRepo) Create(ctx context.Context, inv *domain.Invitation) (*domain.Invitation, error) {
	err := r.db.QueryRow(ctx, `
		INSERT INTO invitations (email, token, created_by, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, token, created_by, expires_at, used_at, created_at`,
		inv.Email, inv.Token, inv.CreatedBy, inv.ExpiresAt,
	).Scan(&inv.ID, &inv.Email, &inv.Token, &inv.CreatedBy, &inv.ExpiresAt, &inv.UsedAt, &inv.CreatedAt)
	return inv, err
}

func (r *InvitationRepo) GetByToken(ctx context.Context, token string) (*domain.Invitation, error) {
	inv := &domain.Invitation{}
	err := r.db.QueryRow(ctx, `
		SELECT id, email, token, created_by, expires_at, used_at, created_at
		FROM invitations WHERE token=$1`, token,
	).Scan(&inv.ID, &inv.Email, &inv.Token, &inv.CreatedBy, &inv.ExpiresAt, &inv.UsedAt, &inv.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("invitation not found")
	}
	return inv, err
}

func (r *InvitationRepo) MarkUsed(ctx context.Context, token string) error {
	_, err := r.db.Exec(ctx, `UPDATE invitations SET used_at=now() WHERE token=$1`, token)
	return err
}

func (r *InvitationRepo) List(ctx context.Context) ([]*domain.Invitation, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, email, token, created_by, expires_at, used_at, created_at
		FROM invitations ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []*domain.Invitation
	for rows.Next() {
		inv := &domain.Invitation{}
		if err := rows.Scan(&inv.ID, &inv.Email, &inv.Token, &inv.CreatedBy,
			&inv.ExpiresAt, &inv.UsedAt, &inv.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, inv)
	}
	return result, rows.Err()
}
