package tests

import (
	"context"
	"testing"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"
)

func TestNextRole(t *testing.T) {
	cases := map[domain.Role]domain.Role{
		domain.RoleCommunity:   domain.RoleSquadMember,
		domain.RoleSquadMember: domain.RoleSquadLead,
		domain.RoleSquadLead:   domain.RoleAdmin,
		domain.RoleAdmin:       domain.RoleSuperAdmin,
		domain.RoleSuperAdmin:  domain.RoleSuperAdmin, // capped at the top
	}

	for in, want := range cases {
		if got := usecase.NextRole(in); got != want {
			t.Errorf("NextRole(%s) = %s, want %s", in, got, want)
		}
	}
}

func TestSha256Hash(t *testing.T) {
	const knownEmpty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

	if got := usecase.Sha256Hex(""); got != knownEmpty {
		t.Errorf("Sha256Hex(\"\") = %s, want %s", got, knownEmpty)
	}
	if a, b := usecase.Sha256Hex("focus-api-key"), usecase.Sha256Hex("focus-api-key"); a != b {
		t.Error("hashing is not deterministic for the same input")
	}
	if len(usecase.Sha256Hex("anything")) != 64 {
		t.Errorf("sha256 hex digest length = %d, want 64", len(usecase.Sha256Hex("anything")))
	}
	if usecase.Sha256Hex("key-a") == usecase.Sha256Hex("key-b") {
		t.Error("different inputs must produce different hashes")
	}
}

func TestUserUseCaseGetAndList(t *testing.T) {
	ctx := context.Background()
	repo := newFakeUserRepo()
	repo.add(&domain.User{ID: "u1", FullName: "Alice"})
	repo.add(&domain.User{ID: "u2", FullName: "Bob"})
	uc := usecase.NewUserUseCase(repo)

	u, err := uc.GetUser(ctx, "u1")
	if err != nil || u.FullName != "Alice" {
		t.Fatalf("GetUser = %v, %v", u, err)
	}
	if _, err := uc.GetUser(ctx, "missing"); err == nil {
		t.Error("expected error for missing user")
	}
	list, err := uc.ListUsers(ctx)
	if err != nil || len(list) != 2 {
		t.Fatalf("ListUsers len = %d, err %v", len(list), err)
	}
}

func TestCompleteProfileActivates(t *testing.T) {
	ctx := context.Background()
	repo := newFakeUserRepo()
	repo.add(&domain.User{ID: "u1", IsActive: false})
	uc := usecase.NewUserUseCase(repo)

	u, err := uc.CompleteProfile(ctx, "u1", usecase.CompleteProfileInput{FullName: "Alice", CodeforcesHandle: "alice"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !u.IsActive {
		t.Error("profile completion should activate the account")
	}
	if u.FullName != "Alice" || u.CodeforcesHandle != "alice" {
		t.Error("profile fields not persisted")
	}
}

func TestCompleteProfileBanned(t *testing.T) {
	ctx := context.Background()
	repo := newFakeUserRepo()
	repo.add(&domain.User{ID: "u1", IsBanned: true})
	uc := usecase.NewUserUseCase(repo)
	if _, err := uc.CompleteProfile(ctx, "u1", usecase.CompleteProfileInput{}); err == nil {
		t.Error("banned user should not be able to complete profile")
	}
}

func TestUpdateProfileBanned(t *testing.T) {
	ctx := context.Background()
	repo := newFakeUserRepo()
	repo.add(&domain.User{ID: "u1", IsBanned: true})
	uc := usecase.NewUserUseCase(repo)
	if _, err := uc.UpdateProfile(ctx, "u1", usecase.UpdateProfileInput{}); err == nil {
		t.Error("banned user should not be able to update profile")
	}
}

func TestUpdateProfilePersists(t *testing.T) {
	ctx := context.Background()
	repo := newFakeUserRepo()
	repo.add(&domain.User{ID: "u1", IsActive: true})
	uc := usecase.NewUserUseCase(repo)
	bio := "competitive programmer"
	u, err := uc.UpdateProfile(ctx, "u1", usecase.UpdateProfileInput{FullName: "Carol", Bio: &bio})
	if err != nil {
		t.Fatalf("UpdateProfile: %v", err)
	}
	if u.FullName != "Carol" || u.Bio == nil || *u.Bio != bio {
		t.Error("update did not persist fields")
	}
}

func TestAPIKeyLifecycle(t *testing.T) {
	ctx := context.Background()
	repo := newFakeUserRepo()
	repo.add(&domain.User{ID: "u1"})
	uc := usecase.NewUserUseCase(repo)

	raw, err := uc.GenerateAPIKey(ctx, "u1")
	if err != nil {
		t.Fatalf("GenerateAPIKey: %v", err)
	}
	if len(raw) != 64 {
		t.Errorf("raw key length = %d, want 64", len(raw))
	}
	has, _ := uc.HasAPIKey(ctx, "u1")
	if !has {
		t.Error("user should have an API key after generation")
	}
	found, err := uc.ValidateAPIKey(ctx, raw)
	if err != nil || found == nil || found.ID != "u1" {
		t.Errorf("ValidateAPIKey returned %v, %v", found, err)
	}
	if err := uc.RevokeAPIKey(ctx, "u1"); err != nil {
		t.Fatalf("RevokeAPIKey: %v", err)
	}
	has, _ = uc.HasAPIKey(ctx, "u1")
	if has {
		t.Error("API key should be gone after revoke")
	}
}

// ─────────────────────────── Admin operations ───────────────────────────

func TestSetRoleCannotChangeSelf(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewAdminUserUseCase(newFakeUserRepo(), newFakeSquadRepo())
	if err := uc.SetRole(ctx, "u1", domain.RoleAdmin, "u1", domain.RoleSquadLead, nil); err == nil {
		t.Error("should not be able to change own role")
	}
}

func TestSetRoleAdminAssignsSquadLead(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "target", Role: domain.RoleCommunity})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	if err := uc.SetRole(ctx, "admin", domain.RoleAdmin, "target", domain.RoleSquadLead, nil); err != nil {
		t.Fatalf("admin assigning squad lead: %v", err)
	}
	if users.users["target"].Role != domain.RoleSquadLead {
		t.Error("target role not updated")
	}
}

func TestSetRoleAdminCannotAssignAdmin(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "target", Role: domain.RoleCommunity})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	if err := uc.SetRole(ctx, "admin", domain.RoleAdmin, "target", domain.RoleAdmin, nil); err == nil {
		t.Error("an admin must not be able to assign the admin role")
	}
}

func TestSetRoleSuperAdminAssignsAdmin(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "target", Role: domain.RoleCommunity})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	if err := uc.SetRole(ctx, "super", domain.RoleSuperAdmin, "target", domain.RoleAdmin, nil); err != nil {
		t.Fatalf("super admin assigning admin: %v", err)
	}
}

func TestSetRoleCannotModifyHigherTarget(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "target", Role: domain.RoleAdmin})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	if err := uc.SetRole(ctx, "admin", domain.RoleAdmin, "target", domain.RoleSquadLead, nil); err == nil {
		t.Error("an admin must not modify an admin-level target")
	}
}

func TestSetRoleAssignsSquad(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "target", Role: domain.RoleCommunity})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	sid := "squad-7"
	if err := uc.SetRole(ctx, "super", domain.RoleSuperAdmin, "target", domain.RoleSquadLead, &sid); err != nil {
		t.Fatalf("SetRole with squad: %v", err)
	}
	if users.users["target"].SquadID == nil || *users.users["target"].SquadID != sid {
		t.Error("squad id not assigned alongside role")
	}
}

func TestSetBan(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "u1"})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	if err := uc.SetBan(ctx, "u1", true); err != nil {
		t.Fatal(err)
	}
	if !users.users["u1"].IsBanned {
		t.Error("user should be banned")
	}
	_ = uc.SetBan(ctx, "u1", false)
	if users.users["u1"].IsBanned {
		t.Error("user should be unbanned")
	}
}

func TestSquadCRUD(t *testing.T) {
	ctx := context.Background()
	squads := newFakeSquadRepo()
	uc := usecase.NewAdminUserUseCase(newFakeUserRepo(), squads)

	s, err := uc.CreateSquad(ctx, "Alpha")
	if err != nil || s.Name != "Alpha" {
		t.Fatalf("CreateSquad: %v %v", s, err)
	}
	updated, err := uc.UpdateSquad(ctx, s.ID, "Beta")
	if err != nil || updated.Name != "Beta" {
		t.Fatalf("UpdateSquad: %v %v", updated, err)
	}
	list, _ := uc.ListSquads(ctx)
	if len(list) != 1 {
		t.Errorf("ListSquads len = %d, want 1", len(list))
	}
	if err := uc.DeleteSquad(ctx, s.ID); err != nil {
		t.Fatal(err)
	}
	list, _ = uc.ListSquads(ctx)
	if len(list) != 0 {
		t.Errorf("after delete len = %d, want 0", len(list))
	}
}

func TestSetSquad(t *testing.T) {
	ctx := context.Background()
	users := newFakeUserRepo()
	users.add(&domain.User{ID: "u1"})
	uc := usecase.NewAdminUserUseCase(users, newFakeSquadRepo())
	sid := "squad-9"
	if err := uc.SetSquad(ctx, "u1", &sid); err != nil {
		t.Fatal(err)
	}
	got := users.users["u1"].SquadID
	if got == nil || *got != sid {
		t.Error("squad not assigned")
	}
}
