package tests

import (
	"context"
	"testing"
	"time"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"
)

func setupSubmission() (*usecase.SubmissionUseCase, *fakeUserRepo, *fakeProblemRepo, *fakeSubmissionRepo) {
	users := newFakeUserRepo()
	problems := newFakeProblemRepo()
	subs := newFakeSubmissionRepo()
	return usecase.NewSubmissionUseCase(users, problems, subs), users, problems, subs
}

func strPtr(s string) *string { return &s }

func TestSubmitNewProblemIncrementsCount(t *testing.T) {
	ctx := context.Background()
	uc, users, problems, _ := setupSubmission()
	users.add(&domain.User{ID: "u1", IsActive: true, ProblemCount: 2})
	problems.Create(ctx, &domain.Problem{Platform: domain.PlatformLeetCode, ExternalID: "two-sum"})

	res, err := uc.Submit(ctx, "u1", usecase.SubmitInput{
		Platform: domain.PlatformLeetCode, ExternalID: "two-sum", Language: "go", Code: "x",
	})
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}
	if res.ProblemCount != 3 {
		t.Errorf("ProblemCount = %d, want 3", res.ProblemCount)
	}
	if res.DailyStreak != 1 {
		t.Errorf("DailyStreak = %d, want 1", res.DailyStreak)
	}
}

func TestSubmitDuplicateProblemKeepsCount(t *testing.T) {
	ctx := context.Background()
	uc, users, problems, subs := setupSubmission()
	users.add(&domain.User{ID: "u1", IsActive: true, ProblemCount: 5})
	p, _ := problems.Create(ctx, &domain.Problem{Platform: domain.PlatformLeetCode, ExternalID: "two-sum"})
	subs.Create(ctx, &domain.Submission{UserID: "u1", ProblemID: p.ID})

	res, err := uc.Submit(ctx, "u1", usecase.SubmitInput{
		Platform: domain.PlatformLeetCode, ExternalID: "two-sum", Language: "go", Code: "y",
	})
	if err != nil {
		t.Fatalf("Submit: %v", err)
	}
	if res.ProblemCount != 5 {
		t.Errorf("ProblemCount = %d, want 5 (problem already solved)", res.ProblemCount)
	}
}

func TestSubmitBanned(t *testing.T) {
	ctx := context.Background()
	uc, users, _, _ := setupSubmission()
	users.add(&domain.User{ID: "u1", IsActive: true, IsBanned: true})
	if _, err := uc.Submit(ctx, "u1", usecase.SubmitInput{}); err == nil {
		t.Error("a banned user should not be able to submit")
	}
}

func TestSubmitInactive(t *testing.T) {
	ctx := context.Background()
	uc, users, _, _ := setupSubmission()