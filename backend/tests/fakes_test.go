package tests

import (
	"context"
	"errors"
	"fmt"

	"focus-astu-hub/internal/domain"
)

var errNotFoundFake = errors.New("not found")

// Compile-time guarantees that the fakes satisfy the repository interfaces.
var (
	_ domain.UserRepository         = (*fakeUserRepo)(nil)
	_ domain.ProblemRepository      = (*fakeProblemRepo)(nil)
	_ domain.SubmissionRepository   = (*fakeSubmissionRepo)(nil)
	_ domain.SquadRepository        = (*fakeSquadRepo)(nil)
	_ domain.EditorialRepository    = (*fakeEditorialRepo)(nil)
	_ domain.AnnouncementRepository = (*fakeAnnouncementRepo)(nil)
)

// ─────────────────────────── User repository ───────────────────────────
type fakeUserRepo struct {
	users   map[string]*domain.User
	hashes  map[string]string
	counter int
}

func newFakeUserRepo() *fakeUserRepo {
	return &fakeUserRepo{users: map[string]*domain.User{}, hashes: map[string]string{}}
}

func (r *fakeUserRepo) add(u *domain.User) *domain.User {
	if u.ID == "" {
		r.counter++
		u.ID = fmt.Sprintf("user-%d", r.counter)
	}
	r.users[u.ID] = u
	return u
}

func (r *fakeUserRepo) GetByID(_ context.Context, id string) (*domain.User, error) {
	if u, ok := r.users[id]; ok {
		return u, nil
	}
	return nil, errNotFoundFake
}

func (r *fakeUserRepo) GetByCodeforcesHandle(_ context.Context, handle string) (*domain.User, error) {
	for _, u := range r.users {
		if u.CodeforcesHandle == handle {
			return u, nil
		}
	}
	return nil, errNotFoundFake
}

func (r *fakeUserRepo) ListAll(_ context.Context) ([]*domain.User, error) {
	out := make([]*domain.User, 0, len(r.users))
	for _, u := range r.users {
		out = append(out, u)
	}
	return out, nil
}

func (r *fakeUserRepo) ListBySquad(_ context.Context, squadID string) ([]*domain.User, error) {
	var out []*domain.User
	for _, u := range r.users {
		if u.SquadID != nil && *u.SquadID == squadID {
			out = append(out, u)
		}
	}
	return out, nil
}

func (r *fakeUserRepo) Update(_ context.Context, u *domain.User) error {
	if _, ok := r.users[u.ID]; !ok {
		return errNotFoundFake
	}
	r.users[u.ID] = u
	return nil
}

func (r *fakeUserRepo) UpdateStats(_ context.Context, userID string, problemCount, dailyStreak int, last *string) error {
	u, ok := r.users[userID]
	if !ok {
		return errNotFoundFake
	}
	u.ProblemCount = problemCount
	u.DailyStreak = dailyStreak
	u.LastSubmissionDate = last
	return nil
}

func (r *fakeUserRepo) SetAPIKeyHash(_ context.Context, userID, hash string) error {
	u, ok := r.users[userID]
	if !ok {
		return errNotFoundFake
	}
	u.APIKeyHash = &hash
	r.hashes[hash] = userID
	return nil
}

func (r *fakeUserRepo) ClearAPIKeyHash(_ context.Context, userID string) error {
	u, ok := r.users[userID]
	if !ok {
		return errNotFoundFake
	}
	if u.APIKeyHash != nil {
		delete(r.hashes, *u.APIKeyHash)
	}
	u.APIKeyHash = nil
	return nil
}

func (r *fakeUserRepo) HasAPIKey(_ context.Context, userID string) (bool, error) {
	u, ok := r.users[userID]
	if !ok {
		return false, errNotFoundFake
	}
	return u.APIKeyHash != nil, nil
}

func (r *fakeUserRepo) GetByAPIKeyHash(_ context.Context, hash string) (*domain.User, error) {
	if id, ok := r.hashes[hash]; ok {
		return r.users[id], nil
	}
	return nil, errNotFoundFake
}

func (r *fakeUserRepo) ReconcileProblemCounts(_ context.Context) (int64, error) {
	return int64(len(r.users)), nil
}

// ─────────────────────────── Problem repository ───────────────────────────
type fakeProblemRepo struct {
	byID    map[string]*domain.Problem
	counter int
}

func newFakeProblemRepo() *fakeProblemRepo {
	return &fakeProblemRepo{byID: map[string]*domain.Problem{}}
}

func (r *fakeProblemRepo) GetByID(_ context.Context, id string) (*domain.Problem, error) {
	if p, ok := r.byID[id]; ok {
		return p, nil
	}
	return nil, errNotFoundFake
}

func (r *fakeProblemRepo) GetByPlatformAndExternalID(_ context.Context, platform domain.Platform, externalID string) (*domain.Problem, error) {
	for _, p := range r.byID {
		if p.Platform == platform && p.ExternalID == externalID {
			return p, nil
		}
	}
	// Matches the real repository contract: not found returns (nil, nil).
	return nil, nil
}

func (r *fakeProblemRepo) Create(_ context.Context, p *domain.Problem) (*domain.Problem, error) {
	r.counter++
	p.ID = fmt.Sprintf("problem-%d", r.counter)
	r.byID[p.ID] = p
	return p, nil
}

func (r *fakeProblemRepo) Upsert(ctx context.Context, p *domain.Problem) (*domain.Problem, error) {
	if existing, _ := r.GetByPlatformAndExternalID(ctx, p.Platform, p.ExternalID); existing != nil {
		return existing, nil
	}
	return r.Create(ctx, p)
}

func (r *fakeProblemRepo) List(_ context.Context, platform *domain.Platform, _ *string) ([]*domain.Problem, error) {
	var out []*domain.Problem
	for _, p := range r.byID {
		if platform != nil && p.Platform != *platform {
			continue
		}
		out = append(out, p)
	}
	return out, nil
}

func (r *fakeProblemRepo) Search(ctx context.Context, _ string, _ int) ([]*domain.Problem, error) {
	return r.List(ctx, nil, nil)
}

// ─────────────────────────── Submission repository ───────────────────────────
type fakeSubmissionRepo struct {
	byID    map[string]*domain.Submission
	counter int
}

func newFakeSubmissionRepo() *fakeSubmissionRepo {
	return &fakeSubmissionRepo{byID: map[string]*domain.Submission{}}
}

func (r *fakeSubmissionRepo) Create(_ context.Context, s *domain.Submission) (*domain.Submission, error) {
	r.counter++
	s.ID = fmt.Sprintf("sub-%d", r.counter)
	r.byID[s.ID] = s
	return s, nil
}

func (r *fakeSubmissionRepo) GetByID(_ context.Context, id string) (*domain.Submission, error) {
	if s, ok := r.byID[id]; ok {
		return s, nil
	}
	return nil, errNotFoundFake
}