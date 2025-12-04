package usecase

import (
	"context"
	"fmt"
	"time"

	"focus-astu-hub/internal/domain"
)

type SubmissionUseCase struct {
	users       domain.UserRepository
	problems    domain.ProblemRepository
	submissions domain.SubmissionRepository
}

func NewSubmissionUseCase(
	users domain.UserRepository,
	problems domain.ProblemRepository,
	submissions domain.SubmissionRepository,
) *SubmissionUseCase {
	return &SubmissionUseCase{users: users, problems: problems, submissions: submissions}
}

type SubmitInput struct {
	ProblemURL   string          // manual path: parse to resolve platform+external_id
	Platform     domain.Platform // extension path: provided directly
	ExternalID   string          // extension path: provided directly
	ProblemName  string          // legacy field, ignored (problem must already exist)
	ExternalLink string          // legacy field, ignored
	Language     string
	Code         string
	Source       string // "extension" or "manual"
	ContestID    *string
}

type SubmitResult struct {
	SubmissionID string
	ProblemID    string
	ProblemCount int
	DailyStreak  int
}

func (uc *SubmissionUseCase) Submit(ctx context.Context, userID string, input SubmitInput) (*SubmitResult, error) {
	// 1. Verify user is active and not banned
	user, err := uc.users.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user.IsBanned {
		return nil, fmt.Errorf("account is banned")
	}
	if !user.IsActive {
		return nil, fmt.Errorf("profile not complete")
	}

	// 2. Resolve platform + external_id, then look up the problem
	platform := input.Platform
	externalID := input.ExternalID
	if input.ProblemURL != "" {
		p, id, _, parseErr := ParseProblemURL(input.ProblemURL)
		if parseErr != nil {
			return nil, domain.ErrProblemNotFound
		}
		platform = p
		externalID = id
	}
	problem, err := uc.problems.GetByPlatformAndExternalID(ctx, platform, externalID)
	if err != nil {
		return nil, fmt.Errorf("lookup problem: %w", err)
	}
	if problem == nil {
		return nil, domain.ErrProblemNotFound
	}

	// 3. Check deduplication BEFORE inserting so the query sees the pre-insert state
	alreadySolved, err := uc.submissions.ExistsByUserAndProblem(ctx, userID, problem.ID)
	if err != nil {
		return nil, fmt.Errorf("check existing submission: %w", err)
	}

	// 4. Insert submission
	source := input.Source
	if source == "" {
		source = "manual"
	}
	sub, err := uc.submissions.Create(ctx, &domain.Submission{
		UserID:    userID,
		ProblemID: problem.ID,
		Language:  input.Language,
		Code:      input.Code,
		IsContest: input.ContestID != nil,
		ContestID: input.ContestID,
		Source:    source,
	})
	if err != nil {
		return nil, fmt.Errorf("create submission: %w", err)
	}

	// 5. Compute and persist updated stats
	count, streak := ComputeStats(user, !alreadySolved)

	today := time.Now().In(EAT).Format("2006-01-02")
	if err := uc.users.UpdateStats(ctx, userID, count, streak, &today); err != nil {
		// Non-fatal: submission is saved; stat drift will self-correct on next submit
		_ = err
	}

	return &SubmitResult{
		SubmissionID: sub.ID,
		ProblemID:    problem.ID,
		ProblemCount: count,
		DailyStreak:  streak,
	}, nil
}

// EAT is East Africa Time (UTC+3), used for day-boundary calculations so that
// midnight in Addis Ababa — not UTC — defines a new "day".
var EAT = time.FixedZone("EAT", 3*60*60)

// ComputeStats derives new problem_count and daily_streak from the user's current
// state. isNewProblem must be determined BEFORE the submission is inserted.
func ComputeStats(user *domain.User, isNewProblem bool) (count, streak int) {
	// problem_count: only increment for problems not previously solved by this user
	count = user.ProblemCount
	if isNewProblem {
		count++
	}

	// daily_streak: day boundaries use EAT so Addis midnight resets the counter
	now := time.Now().In(EAT)
	today := now.Format("2006-01-02")
	yesterday := now.AddDate(0, 0, -1).Format("2006-01-02")

	switch {
	case user.LastSubmissionDate == nil:
		streak = 1
	case *user.LastSubmissionDate == today:
		streak = user.DailyStreak // already submitted today — no change
	case *user.LastSubmissionDate == yesterday:
		streak = user.DailyStreak + 1 // extending a consecutive run
	default:
		streak = 1 // gap in submissions — reset
	}

	return count, streak
}

func (uc *SubmissionUseCase) GetSubmission(ctx context.Context, id string) (*domain.Submission, error) {
	return uc.submissions.GetByID(ctx, id)
}

func (uc *SubmissionUseCase) ListByUser(ctx context.Context, userID string, limit, offset int) ([]*domain.Submission, error) {
	return uc.submissions.ListByUser(ctx, userID, limit, offset)
}
