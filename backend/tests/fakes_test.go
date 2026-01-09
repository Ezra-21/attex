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

func (r *fakeSubmissionRepo) ListByUser(_ context.Context, userID string, _, _ int) ([]*domain.Submission, error) {
	var out []*domain.Submission
	for _, s := range r.byID {
		if s.UserID == userID {
			out = append(out, s)
		}
	}
	return out, nil
}

func (r *fakeSubmissionRepo) ExistsByUserAndProblem(_ context.Context, userID, problemID string) (bool, error) {
	for _, s := range r.byID {
		if s.UserID == userID && s.ProblemID == problemID {
			return true, nil
		}
	}
	return false, nil
}

func (r *fakeSubmissionRepo) ListRecent(ctx context.Context, userID string, limit int) ([]*domain.Submission, error) {
	return r.ListByUser(ctx, userID, limit, 0)
}

// ─────────────────────────── Squad repository ───────────────────────────
type fakeSquadRepo struct {
	squads        map[string]*domain.Squad
	tracks        map[string]*domain.SquadTrack
	topics        map[string]*domain.SquadTopic
	topicProblems map[string][]string
	counter       int
}

func newFakeSquadRepo() *fakeSquadRepo {
	return &fakeSquadRepo{
		squads:        map[string]*domain.Squad{},
		tracks:        map[string]*domain.SquadTrack{},
		topics:        map[string]*domain.SquadTopic{},
		topicProblems: map[string][]string{},
	}
}

func (r *fakeSquadRepo) id(prefix string) string {
	r.counter++
	return fmt.Sprintf("%s-%d", prefix, r.counter)
}

func (r *fakeSquadRepo) GetByID(_ context.Context, id string) (*domain.Squad, error) {
	if s, ok := r.squads[id]; ok {
		return s, nil
	}
	return nil, errNotFoundFake
}

func (r *fakeSquadRepo) Create(_ context.Context, s *domain.Squad) (*domain.Squad, error) {
	s.ID = r.id("squad")
	r.squads[s.ID] = s
	return s, nil
}

func (r *fakeSquadRepo) Update(_ context.Context, s *domain.Squad) (*domain.Squad, error) {
	if _, ok := r.squads[s.ID]; !ok {
		return nil, errNotFoundFake
	}
	r.squads[s.ID] = s
	return s, nil
}

func (r *fakeSquadRepo) Delete(_ context.Context, id string) error {
	if _, ok := r.squads[id]; !ok {
		return errNotFoundFake
	}
	delete(r.squads, id)
	return nil
}

func (r *fakeSquadRepo) ListAll(_ context.Context) ([]*domain.Squad, error) {
	out := make([]*domain.Squad, 0, len(r.squads))
	for _, s := range r.squads {
		out = append(out, s)
	}
	return out, nil
}

func (r *fakeSquadRepo) CreateTrack(_ context.Context, t *domain.SquadTrack) (*domain.SquadTrack, error) {
	t.ID = r.id("track")
	r.tracks[t.ID] = t
	return t, nil
}

func (r *fakeSquadRepo) GetTracks(_ context.Context, squadID string) ([]*domain.SquadTrack, error) {
	var out []*domain.SquadTrack
	for _, t := range r.tracks {
		if t.SquadID == squadID {
			out = append(out, t)
		}
	}
	return out, nil
}

func (r *fakeSquadRepo) CreateTopic(_ context.Context, t *domain.SquadTopic) (*domain.SquadTopic, error) {
	t.ID = r.id("topic")
	r.topics[t.ID] = t
	return t, nil
}

func (r *fakeSquadRepo) GetTopics(_ context.Context, trackID string) ([]*domain.SquadTopic, error) {
	var out []*domain.SquadTopic
	for _, t := range r.topics {
		if t.TrackID == trackID {
			out = append(out, t)
		}
	}
	return out, nil
}

func (r *fakeSquadRepo) AssignProblem(_ context.Context, topicID, problemID string) error {
	r.topicProblems[topicID] = append(r.topicProblems[topicID], problemID)
	return nil
}

func (r *fakeSquadRepo) GetTopicProblems(_ context.Context, topicID string) ([]*domain.TopicProblem, error) {
	var out []*domain.TopicProblem
	for _, pid := range r.topicProblems[topicID] {
		out = append(out, &domain.TopicProblem{TopicID: topicID, ProblemID: pid})
	}
	return out, nil
}

func (r *fakeSquadRepo) GetTopicByID(_ context.Context, topicID string) (*domain.SquadTopic, error) {
	if t, ok := r.topics[topicID]; ok {
		return t, nil
	}
	return nil, errNotFoundFake
}

func (r *fakeSquadRepo) GetTrackByID(_ context.Context, trackID string) (*domain.SquadTrack, error) {
	if t, ok := r.tracks[trackID]; ok {
		return t, nil
	}
	return nil, errNotFoundFake
}

// ─────────────────────────── Editorial repository ───────────────────────────
type fakeEditorialRepo struct {
	byID    map[string]*domain.Editorial
	votes   map[string]int
	counter int
}

func newFakeEditorialRepo() *fakeEditorialRepo {
	return &fakeEditorialRepo{byID: map[string]*domain.Editorial{}, votes: map[string]int{}}
}

func (r *fakeEditorialRepo) Create(_ context.Context, e *domain.Editorial) (*domain.Editorial, error) {
	r.counter++
	e.ID = fmt.Sprintf("ed-%d", r.counter)
	r.byID[e.ID] = e
	return e, nil
}

func (r *fakeEditorialRepo) Update(_ context.Context, e *domain.Editorial) error {
	cur, ok := r.byID[e.ID]
	if !ok {
		return errNotFoundFake
	}
	if cur.UserID != e.UserID {
		return errors.New("forbidden")
	}
	cur.ContentMD = e.ContentMD
	return nil
}

func (r *fakeEditorialRepo) Delete(_ context.Context, id, userID string) error {
	cur, ok := r.byID[id]
	if !ok {
		return errNotFoundFake
	}
	if cur.UserID != userID {
		return errors.New("forbidden")
	}
	delete(r.byID, id)
	return nil
}

func (r *fakeEditorialRepo) ListByProblem(_ context.Context, problemID, _ string) ([]*domain.Editorial, error) {
	var out []*domain.Editorial
	for _, e := range r.byID {
		if e.ProblemID == problemID {
			out = append(out, e)
		}
	}
	return out, nil
}

func (r *fakeEditorialRepo) GetByID(_ context.Context, id string) (*domain.Editorial, error) {
	if e, ok := r.byID[id]; ok {
		return e, nil
	}
	return nil, errNotFoundFake
}

func (r *fakeEditorialRepo) ToggleVote(_ context.Context, editorialID, userID string, value int) error {
	e, ok := r.byID[editorialID]
	if !ok {
		return errNotFoundFake
	}
	key := editorialID + ":" + userID
	prev := r.votes[key]
	e.Score -= prev
	if prev == value {
		delete(r.votes, key)
	} else {
		r.votes[key] = value
		e.Score += value
	}
	return nil
}

// ─────────────────────────── Announcement repository ───────────────────────────
type fakeAnnouncementRepo struct {
	items   []*domain.Announcement
	counter int
}

func newFakeAnnouncementRepo() *fakeAnnouncementRepo {
	return &fakeAnnouncementRepo{}
}

func (r *fakeAnnouncementRepo) Create(_ context.Context, a *domain.Announcement) (*domain.Announcement, error) {
	r.counter++
	a.ID = fmt.Sprintf("ann-%d", r.counter)
	r.items = append(r.items, a)
	return a, nil
}

func (r *fakeAnnouncementRepo) ListPublic(_ context.Context, limit int) ([]*domain.Announcement, error) {
	var out []*domain.Announcement
	for _, a := range r.items {
		if a.SquadID == nil {
			out = append(out, a)
		}
	}
	if limit > 0 && len(out) > limit {
		out = out[:limit]
	}
	return out, nil
}

func (r *fakeAnnouncementRepo) ListForUser(_ context.Context, squadID *string) ([]*domain.Announcement, error) {
	var out []*domain.Announcement
	for _, a := range r.items {
		if a.SquadID == nil {
			out = append(out, a)
			continue
		}
		if squadID != nil && *a.SquadID == *squadID {
			out = append(out, a)
		}
	}
	return out, nil
}
