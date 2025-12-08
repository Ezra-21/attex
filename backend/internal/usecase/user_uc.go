package usecase

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"focus-astu-hub/internal/domain"
)

type UserUseCase struct {
	users domain.UserRepository
}

func NewUserUseCase(users domain.UserRepository) *UserUseCase {
	return &UserUseCase{users: users}
}

func (uc *UserUseCase) GetUser(ctx context.Context, id string) (*domain.User, error) {
	return uc.users.GetByID(ctx, id)
}

func (uc *UserUseCase) ListUsers(ctx context.Context) ([]*domain.User, error) {
	return uc.users.ListAll(ctx)
}

type CompleteProfileInput struct {
	FullName         string
	TelegramHandle   string
	CodeforcesHandle string
	LeetCodeHandle   *string
	AtCoderHandle    *string
	LinkedInURL      *string
	Bio              *string
}

func (uc *UserUseCase) CompleteProfile(ctx context.Context, userID string, input CompleteProfileInput) (*domain.User, error) {
	u, err := uc.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u.IsBanned {
		return nil, fmt.Errorf("account is banned")
	}

	u.FullName = input.FullName
	u.TelegramHandle = input.TelegramHandle
	u.CodeforcesHandle = input.CodeforcesHandle
	u.LeetCodeHandle = input.LeetCodeHandle
	u.AtCoderHandle = input.AtCoderHandle
	u.LinkedInURL = input.LinkedInURL
	u.Bio = input.Bio
	u.IsActive = true

	if err := uc.users.Update(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

type UpdateProfileInput struct {
	FullName         string
	TelegramHandle   string
	CodeforcesHandle string
	LeetCodeHandle   *string
	AtCoderHandle    *string
	LinkedInURL      *string
	Bio              *string
}

func (uc *UserUseCase) UpdateProfile(ctx context.Context, userID string, input UpdateProfileInput) (*domain.User, error) {
	u, err := uc.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if u.IsBanned {
		return nil, fmt.Errorf("account is banned")
	}

	u.FullName = input.FullName
	u.TelegramHandle = input.TelegramHandle
	u.CodeforcesHandle = input.CodeforcesHandle
	u.LeetCodeHandle = input.LeetCodeHandle
	u.AtCoderHandle = input.AtCoderHandle
	u.LinkedInURL = input.LinkedInURL
	u.Bio = input.Bio

	if err := uc.users.Update(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

// GenerateAPIKey creates a new random API key, stores the SHA-256 hash, and
// returns the raw key exactly once.
func (uc *UserUseCase) GenerateAPIKey(ctx context.Context, userID string) (rawKey string, err error) {
	buf := make([]byte, 32)
	if _, err = rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate random key: %w", err)
	}
	rawKey = hex.EncodeToString(buf)
	hash := Sha256Hex(rawKey)
	return rawKey, uc.users.SetAPIKeyHash(ctx, userID, hash)
}

func (uc *UserUseCase) RevokeAPIKey(ctx context.Context, userID string) error {
	return uc.users.ClearAPIKeyHash(ctx, userID)
}

func (uc *UserUseCase) HasAPIKey(ctx context.Context, userID string) (bool, error) {
	return uc.users.HasAPIKey(ctx, userID)
}

func (uc *UserUseCase) ValidateAPIKey(ctx context.Context, rawKey string) (*domain.User, error) {
	hash := Sha256Hex(rawKey)
	return uc.users.GetByAPIKeyHash(ctx, hash)
}

func Sha256Hex(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

// ── Admin operations ─────────────────────────────────────────────────────────

type AdminUserUseCase struct {
	users  domain.UserRepository
	squads domain.SquadRepository
}

func NewAdminUserUseCase(users domain.UserRepository, squads domain.SquadRepository) *AdminUserUseCase {
	return &AdminUserUseCase{users: users, squads: squads}
}

func (uc *AdminUserUseCase) SetRole(ctx context.Context, callerID string, callerRole domain.Role, targetUserID string, newRole domain.Role, squadID *string) error {
	if callerID == targetUserID {
		return fmt.Errorf("cannot change your own role")
	}

	// Resolve what the caller can assign (one tier below themselves)
	maxAssignable := domain.RoleSquadLead
	if callerRole == domain.RoleSuperAdmin {
		maxAssignable = domain.RoleAdmin
	}
	if !newRole.AtLeast(domain.RoleCommunity) || newRole.AtLeast(NextRole(maxAssignable)) {
		return fmt.Errorf("cannot assign role %s with role %s", newRole, callerRole)
	}

	target, err := uc.users.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}
	// Caller must outrank the target's current role
	if target.Role.AtLeast(NextRole(maxAssignable)) {
		return fmt.Errorf("cannot modify a user with role %s", target.Role)
	}

	target.Role = newRole
	if squadID != nil {
		target.SquadID = squadID
	}
	return uc.users.Update(ctx, target)
}

func (uc *AdminUserUseCase) UpdateSquad(ctx context.Context, squadID, name string) (*domain.Squad, error) {
	s, err := uc.squads.GetByID(ctx, squadID)
	if err != nil {
		return nil, err
	}
	s.Name = name
	return uc.squads.Update(ctx, s)
}

func (uc *AdminUserUseCase) DeleteSquad(ctx context.Context, squadID string) error {
	return uc.squads.Delete(ctx, squadID)
}

func (uc *AdminUserUseCase) SetSquad(ctx context.Context, targetUserID string, squadID *string) error {
	u, err := uc.users.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}
	u.SquadID = squadID
	return uc.users.Update(ctx, u)
}

func (uc *AdminUserUseCase) CreateSquad(ctx context.Context, name string) (*domain.Squad, error) {
	return uc.squads.Create(ctx, &domain.Squad{Name: name})
}

func (uc *AdminUserUseCase) ListSquads(ctx context.Context) ([]*domain.Squad, error) {
	return uc.squads.ListAll(ctx)
}

func (uc *AdminUserUseCase) SetBan(ctx context.Context, targetUserID string, banned bool) error {
	u, err := uc.users.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}
	u.IsBanned = banned
	return uc.users.Update(ctx, u)
}

// ── Invitation use case ───────────────────────────────────────────────────────

type InvitationUseCase struct {