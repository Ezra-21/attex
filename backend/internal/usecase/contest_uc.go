package usecase

import (
	"context"
	"fmt"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/pkg/codeforces"
)

type ContestUseCase struct {
	contests domain.ContestRepository
	users    domain.UserRepository
	cf       *codeforces.Client
}

func NewContestUseCase(
	contests domain.ContestRepository,
	users domain.UserRepository,
	cf *codeforces.Client,
) *ContestUseCase {
	return &ContestUseCase{contests: contests, users: users, cf: cf}
}

type SyncResult struct {
	ContestID     string `json:"contest_id"`
	MatchedUsers  int    `json:"matched_users"`
	StandingsSaved int   `json:"standings_saved"`
}

func (uc *ContestUseCase) SyncContest(ctx context.Context, callerRole domain.Role, callerSquadID *string, contestExternalID string) (*SyncResult, error) {
	// Fetch from Codeforces
	cfContest, standings, err := uc.cf.GetStandings(ctx, contestExternalID)
	if err != nil {
		return nil, fmt.Errorf("codeforces fetch: %w", err)
	}

	// Upsert contest row
	contest, err := uc.contests.Upsert(ctx, &domain.Contest{
		Name:       cfContest.Name,
		Platform:   domain.PlatformCodeforces,
		ExternalID: contestExternalID,
		HeldAt:     cfContest.HeldAt,
	})
	if err != nil {
		return nil, fmt.Errorf("upsert contest: %w", err)
	}

	// For each participant, match by codeforces_handle and upsert standing
	matched := 0
	saved := 0
	for _, row := range standings {
		for _, member := range row.Party.Members {
			u, err := uc.users.GetByCodeforcesHandle(ctx, member.Handle)
			if err != nil || u == nil {
				continue
			}
			matched++
			standing := &domain.ContestStanding{
				ContestID:      contest.ID,
				UserID:         u.ID,
				Rank:           row.Rank,
				ProblemsSolved: row.ProblemsSolved,
				// Rating changes are not available from standings endpoint; left nil
			}
			if err := uc.contests.UpsertStanding(ctx, standing); err == nil {
				saved++
			}
		}
	}

	return &SyncResult{
		ContestID:      contest.ID,
		MatchedUsers:   matched,
		StandingsSaved: saved,
	}, nil
}

func (uc *ContestUseCase) ListContests(ctx context.Context) ([]*domain.Contest, error) {
	return uc.contests.List(ctx)
}

func (uc *ContestUseCase) GetStandings(ctx context.Context, contestID string) ([]*domain.ContestStanding, error) {
	return uc.contests.GetStandings(ctx, contestID)
}
