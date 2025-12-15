package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type SystemSettingsRepo struct{ db *pgxpool.Pool }

func NewSystemSettingsRepo(db *pgxpool.Pool) *SystemSettingsRepo {
	return &SystemSettingsRepo{db: db}
}

func (r *SystemSettingsRepo) Get(ctx context.Context, key string) (string, error) {
	var value string
	err := r.db.QueryRow(ctx, `SELECT value FROM system_settings WHERE key=$1`, key).Scan(&value)
	return value, err
}

func (r *SystemSettingsRepo) Set(ctx context.Context, key, value string) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO system_settings (key, value) VALUES ($1, $2)
		ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()`,
		key, value,
	)
	return err
}
