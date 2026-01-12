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
	users.add(&domain.User{ID: "u1", IsActive: false})
	if _, err := uc.Submit(ctx, "u1", usecase.SubmitInput{}); err == nil {
		t.Error("an inactive user should not be able to submit")
	}
}

func TestSubmitProblemNotFound(t *testing.T) {
	ctx := context.Background()
	uc, users, _, _ := setupSubmission()
	users.add(&domain.User{ID: "u1", IsActive: true})
	if _, err := uc.Submit(ctx, "u1", usecase.SubmitInput{Platform: domain.PlatformLeetCode, ExternalID: "nope"}); err == nil {
		t.Error("expected error when the problem is not in the library")
	}
}

func TestSubmitViaURL(t *testing.T) {
	ctx := context.Background()
	uc, users, problems, _ := setupSubmission()
	users.add(&domain.User{ID: "u1", IsActive: true})
	problems.Create(ctx, &domain.Problem{Platform: domain.PlatformLeetCode, ExternalID: "two-sum"})

	res, err := uc.Submit(ctx, "u1", usecase.SubmitInput{
		ProblemURL: "https://leetcode.com/problems/two-sum/", Language: "go", Code: "z",
	})
	if err != nil {
		t.Fatalf("Submit via URL: %v", err)
	}
	if res.ProblemCount != 1 {
		t.Errorf("ProblemCount = %d, want 1", res.ProblemCount)
	}
}

func TestSubmitBadURL(t *testing.T) {
	ctx := context.Background()
	uc, users, _, _ := setupSubmission()
	users.add(&domain.User{ID: "u1", IsActive: true})
	if _, err := uc.Submit(ctx, "u1", usecase.SubmitInput{ProblemURL: "https://example.com/foo"}); err == nil {
		t.Error("an unparseable URL should produce an error")
	}
}

func TestComputeStatsProblemCount(t *testing.T) {
	u := &domain.User{ProblemCount: 5}

	if c, _ := usecase.ComputeStats(u, true); c != 6 {
		t.Errorf("a newly solved problem should increment count: got %d, want 6", c)
	}
	if c, _ := usecase.ComputeStats(u, false); c != 5 {
		t.Errorf("re-solving a known problem should not increment count: got %d, want 5", c)
	}
}

func TestComputeStatsStreak(t *testing.T) {
	now := time.Now().In(usecase.EAT)
	today := now.Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")
	staleGap := now.AddDate(0, 0, -5).Format("2006-01-02")

	cases := []struct {
		name string
		user *domain.User
		want int
	}{
		{"first ever submission starts at 1", &domain.User{LastSubmissionDate: nil, DailyStreak: 0}, 1},
		{"second submission same day keeps streak", &domain.User{LastSubmissionDate: strPtr(today), DailyStreak: 4}, 4},
		{"submission yesterday extends streak", &domain.User{LastSubmissionDate: strPtr(yesterday), DailyStreak: 4}, 5},
		{"gap of several days resets streak", &domain.User{LastSubmissionDate: strPtr(staleGap), DailyStreak: 9}, 1},
		{"extending from zero streak yesterday", &domain.User{LastSubmissionDate: strPtr(yesterday), DailyStreak: 0}, 1},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, streak := usecase.ComputeStats(tc.user, false); streak != tc.want {
				t.Errorf("streak = %d, want %d", streak, tc.want)
			}
		})
	}
}

func TestEATIsUTCPlus3(t *testing.T) {
	_, offset := time.Now().In(usecase.EAT).Zone()
	if offset != 3*60*60 {
		t.Errorf("EAT offset = %d seconds, want %d (UTC+3)", offset, 3*60*60)
	}
}
