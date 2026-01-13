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