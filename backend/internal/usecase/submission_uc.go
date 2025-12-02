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