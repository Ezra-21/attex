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
	invitations            domain.InvitationRepository
	supabaseURL            string
	supabaseServiceRoleKey string
	siteURL                string
	resendAPIKey           string
	resendFrom             string
}

func NewInvitationUseCase(
	invitations domain.InvitationRepository,
	supabaseURL, supabaseServiceRoleKey, siteURL string,
	resendAPIKey, resendFrom string,
) *InvitationUseCase {
	return &InvitationUseCase{
		invitations:            invitations,
		supabaseURL:            supabaseURL,
		supabaseServiceRoleKey: supabaseServiceRoleKey,
		siteURL:                siteURL,
		resendAPIKey:           resendAPIKey,
		resendFrom:             resendFrom,
	}
}

func (uc *InvitationUseCase) Create(ctx context.Context, email, createdBy string) (*domain.Invitation, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}
	token := hex.EncodeToString(buf)

	inv := &domain.Invitation{
		Email:     email,
		Token:     token,
		CreatedBy: &createdBy,
		ExpiresAt: time.Now().Add(72 * time.Hour),
	}
	return uc.invitations.Create(ctx, inv)
}

// SendEmail sends the invitation email.
// Uses Resend when RESEND_API_KEY is configured (preferred — works for any user).
// Falls back to Supabase admin invite when only Supabase credentials are present.
func (uc *InvitationUseCase) SendEmail(ctx context.Context, email, token string) error {
	inviteURL := uc.siteURL + "/invite?token=" + token
	if uc.resendAPIKey != "" {
		return uc.sendViaResend(ctx, email, inviteURL)
	}
	if uc.supabaseURL == "" || uc.supabaseServiceRoleKey == "" {
		return fmt.Errorf("no email provider configured: set RESEND_API_KEY or SUPABASE_SERVICE_ROLE_KEY")
	}
	if err := uc.supabaseAdminInvite(ctx, email, inviteURL); err != nil {
		log.Printf("supabase admin invite for %s failed (%v)", email, err)
		return err
	}
	return nil
}

func (uc *InvitationUseCase) sendViaResend(ctx context.Context, toEmail, inviteURL string) error {
	html := `<!DOCTYPE html><html><body style="margin:0;background:#0a0c10;font-family:sans-serif">
<div style="max-width:480px;margin:40px auto;padding:32px 28px;background:#13161e;border:1px solid #1e2433;border-radius:16px">
  <div style="font-size:22px;font-weight:700;color:#25d6c1;margin-bottom:8px">Focus ASTU CP Hub</div>
  <div style="font-size:13px;color:#6b7896;margin-bottom:28px;letter-spacing:1px;text-transform:uppercase">You're invited</div>
  <p style="color:#b0b8c8;font-size:15px;line-height:1.7;margin:0 0 28px">
    An admin has invited you to join the Focus ASTU Competitive Programming Community —
    a private hub for ASTU students to track solves, run contests, and grow through squad-led curriculum.
  </p>
  <a href="` + inviteURL + `"
     style="display:inline-block;background:#25d6c1;color:#0a0c10;font-weight:700;font-size:15px;padding:13px 32px;border-radius:9px;text-decoration:none">
    Accept Invite &rarr;
  </a>
  <p style="color:#3d4a5c;font-size:12px;margin:28px 0 0;line-height:1.6">
    This link expires in 72 hours. If you did not expect this invitation, you can safely ignore this email.<br>
    <a href="` + inviteURL + `" style="color:#3d4a5c;word-break:break-all">` + inviteURL + `</a>
  </p>
</div></body></html>`

	body, _ := json.Marshal(map[string]any{
		"from":    uc.resendFrom,
		"to":      []string{toEmail},
		"subject": "You're invited to Focus ASTU CP Hub",
		"html":    html,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+uc.resendAPIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("resend returned %d", resp.StatusCode)
	}
	return nil
}

func (uc *InvitationUseCase) SiteURL() string { return uc.siteURL }

// CreateOrConfirmSupabaseUser creates a confirmed Supabase auth user for the
// given email/password. If the user already exists (e.g. from a previous
// invite attempt), it updates their password and marks their email confirmed.
func (uc *InvitationUseCase) CreateOrConfirmSupabaseUser(ctx context.Context, email, password string) error {
	if uc.supabaseURL == "" || uc.supabaseServiceRoleKey == "" {
		return fmt.Errorf("supabase credentials not configured")
	}
	if err := uc.supabaseAdminCreateUser(ctx, email, password); err == nil {
		return nil
	}
	userID, err := uc.supabaseFindUserByEmail(ctx, email)
	if err != nil {
		return fmt.Errorf("user already exists but could not be located: %w", err)
	}
	return uc.supabaseAdminUpdateUser(ctx, userID, password)
}

func (uc *InvitationUseCase) supabaseAdminCreateUser(ctx context.Context, email, password string) error {
	body, _ := json.Marshal(map[string]any{
		"email":         email,
		"password":      password,
		"email_confirm": true,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		uc.supabaseURL+"/auth/v1/admin/users", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", uc.supabaseServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+uc.supabaseServiceRoleKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("create user returned %d", resp.StatusCode)
	}
	return nil
}

func (uc *InvitationUseCase) supabaseFindUserByEmail(ctx context.Context, email string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		uc.supabaseURL+"/auth/v1/admin/users?filter="+email, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("apikey", uc.supabaseServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+uc.supabaseServiceRoleKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		Users []struct {
			ID    string `json:"id"`
			Email string `json:"email"`
		} `json:"users"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	for _, u := range result.Users {
		if strings.EqualFold(u.Email, email) {
			return u.ID, nil
		}
	}
	return "", fmt.Errorf("user not found")
}

func (uc *InvitationUseCase) supabaseAdminUpdateUser(ctx context.Context, userID, password string) error {
	body, _ := json.Marshal(map[string]any{
		"password":      password,
		"email_confirm": true,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPut,
		uc.supabaseURL+"/auth/v1/admin/users/"+userID, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", uc.supabaseServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+uc.supabaseServiceRoleKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("update user returned %d", resp.StatusCode)
	}
	return nil
}

func (uc *InvitationUseCase) supabaseAdminInvite(ctx context.Context, email, redirectTo string) error {
	body, _ := json.Marshal(map[string]any{
		"email":       email,
		"redirect_to": redirectTo,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		uc.supabaseURL+"/auth/v1/admin/invite", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", uc.supabaseServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+uc.supabaseServiceRoleKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("supabase admin invite returned %d", resp.StatusCode)
	}
	return nil
}


func (uc *InvitationUseCase) Validate(ctx context.Context, token string) (*domain.Invitation, error) {
	inv, err := uc.invitations.GetByToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if inv.UsedAt != nil {
		return nil, fmt.Errorf("invitation already used")
	}
	if time.Now().After(inv.ExpiresAt) {
		return nil, fmt.Errorf("invitation expired")
	}
	return inv, nil
}

func (uc *InvitationUseCase) MarkUsed(ctx context.Context, token string) error {
	return uc.invitations.MarkUsed(ctx, token)
}

func (uc *InvitationUseCase) List(ctx context.Context) ([]*domain.Invitation, error) {
	return uc.invitations.List(ctx)
}

// NextRole returns the role one level above r (used for permission ceiling checks).
func NextRole(r domain.Role) domain.Role {
	switch r {
	case domain.RoleCommunity:
		return domain.RoleSquadMember
	case domain.RoleSquadMember:
		return domain.RoleSquadLead
	case domain.RoleSquadLead:
		return domain.RoleAdmin
	case domain.RoleAdmin:
		return domain.RoleSuperAdmin
	default:
		return domain.RoleSuperAdmin
	}
}
