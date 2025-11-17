package domain

import "context"

type UserRepository interface {
	GetByID(ctx context.Context, id string) (*User, error)
	GetByCodeforcesHandle(ctx context.Context, handle string) (*User, error)
	ListAll(ctx context.Context) ([]*User, error)
	ListBySquad(ctx context.Context, squadID string) ([]*User, error)
	Update(ctx context.Context, u *User) error
	UpdateStats(ctx context.Context, userID string, problemCount, dailyStreak int, lastSubmissionDate *string) error
	SetAPIKeyHash(ctx context.Context, userID, hash string) error
	ClearAPIKeyHash(ctx context.Context, userID string) error
	HasAPIKey(ctx context.Context, userID string) (bool, error)
	GetByAPIKeyHash(ctx context.Context, hash string) (*User, error)
	ReconcileProblemCounts(ctx context.Context) (int64, error)
}

type ProblemRepository interface {
	GetByID(ctx context.Context, id string) (*Problem, error)
	GetByPlatformAndExternalID(ctx context.Context, platform Platform, externalID string) (*Problem, error)
	Create(ctx context.Context, p *Problem) (*Problem, error)
	Upsert(ctx context.Context, p *Problem) (*Problem, error)
	List(ctx context.Context, platform *Platform, tag *string) ([]*Problem, error)
	Search(ctx context.Context, query string, limit int) ([]*Problem, error)
}

type SubmissionRepository interface {
	Create(ctx context.Context, s *Submission) (*Submission, error)
	GetByID(ctx context.Context, id string) (*Submission, error)
	ListByUser(ctx context.Context, userID string, limit, offset int) ([]*Submission, error)
	ExistsByUserAndProblem(ctx context.Context, userID, problemID string) (bool, error)
	ListRecent(ctx context.Context, userID string, limit int) ([]*Submission, error)
}

type ContestRepository interface {
	Upsert(ctx context.Context, c *Contest) (*Contest, error)
	GetByID(ctx context.Context, id string) (*Contest, error)
	GetByExternalID(ctx context.Context, externalID string) (*Contest, error)
	List(ctx context.Context) ([]*Contest, error)
	UpsertStanding(ctx context.Context, s *ContestStanding) error
	GetStandings(ctx context.Context, contestID string) ([]*ContestStanding, error)
}

type SquadRepository interface {
	GetByID(ctx context.Context, id string) (*Squad, error)
	Create(ctx context.Context, s *Squad) (*Squad, error)
	Update(ctx context.Context, s *Squad) (*Squad, error)
	Delete(ctx context.Context, id string) error
	ListAll(ctx context.Context) ([]*Squad, error)
	CreateTrack(ctx context.Context, t *SquadTrack) (*SquadTrack, error)
	GetTracks(ctx context.Context, squadID string) ([]*SquadTrack, error)
	CreateTopic(ctx context.Context, t *SquadTopic) (*SquadTopic, error)
	GetTopics(ctx context.Context, trackID string) ([]*SquadTopic, error)
	AssignProblem(ctx context.Context, topicID, problemID string) error
	GetTopicProblems(ctx context.Context, topicID string) ([]*TopicProblem, error)
	GetTopicByID(ctx context.Context, topicID string) (*SquadTopic, error)
	GetTrackByID(ctx context.Context, trackID string) (*SquadTrack, error)
}

type EditorialRepository interface {
	Create(ctx context.Context, e *Editorial) (*Editorial, error)
	Update(ctx context.Context, e *Editorial) error
	Delete(ctx context.Context, id, userID string) error
	ListByProblem(ctx context.Context, problemID, callerID string) ([]*Editorial, error)
	GetByID(ctx context.Context, id string) (*Editorial, error)
	ToggleVote(ctx context.Context, editorialID, userID string, value int) error
}

type AnnouncementRepository interface {
	Create(ctx context.Context, a *Announcement) (*Announcement, error)
	ListPublic(ctx context.Context, limit int) ([]*Announcement, error)
	ListForUser(ctx context.Context, squadID *string) ([]*Announcement, error)
}

type InvitationRepository interface {
	Create(ctx context.Context, inv *Invitation) (*Invitation, error)
	GetByToken(ctx context.Context, token string) (*Invitation, error)
	MarkUsed(ctx context.Context, token string) error
	List(ctx context.Context) ([]*Invitation, error)
}

type SystemSettingsRepository interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key, value string) error
}
