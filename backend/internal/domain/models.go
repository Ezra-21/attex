package domain

import "time"

type Squad struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type User struct {
	ID                 string    `json:"id"`
	Email              string    `json:"email"`
	FullName           string    `json:"full_name"`
	Bio                *string   `json:"bio"`
	TelegramHandle     string    `json:"telegram_handle"`
	LinkedInURL        *string   `json:"linkedin_url"`
	LeetCodeHandle     *string   `json:"leetcode_handle"`
	CodeforcesHandle   string    `json:"codeforces_handle"`
	AtCoderHandle      *string   `json:"atcoder_handle"`
	SquadID            *string   `json:"squad_id"`
	Role               Role      `json:"role"`
	IsBanned           bool      `json:"is_banned"`
	IsActive           bool      `json:"is_active"`
	APIKeyHash         *string   `json:"-"`
	ProblemCount       int       `json:"problem_count"`
	DailyStreak        int       `json:"daily_streak"`
	LastSubmissionDate *string   `json:"last_submission_date"`
	CreatedAt          time.Time `json:"created_at"`
}

type Problem struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Platform     Platform  `json:"platform"`
	ExternalID   string    `json:"external_id"`
	ExternalLink string    `json:"external_link"`
	Tags         []string  `json:"tags"`
	CreatedAt    time.Time `json:"created_at"`
}

type Submission struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	ProblemID   string    `json:"problem_id"`
	Language    string    `json:"language"`
	Code        string    `json:"code"`
	IsContest   bool      `json:"is_contest"`
	ContestID   *string   `json:"contest_id"`
	Source      string    `json:"source"`
	SubmittedAt time.Time `json:"submitted_at"`
	// Joined fields
	Problem *Problem `json:"problem,omitempty"`
	User    *User    `json:"user,omitempty"`
}

type Contest struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Platform   Platform  `json:"platform"`
	ExternalID string    `json:"external_id"`
	HeldAt     time.Time `json:"held_at"`
	SyncedAt   time.Time `json:"synced_at"`
	CreatedAt  time.Time `json:"created_at"`
}

type ContestStanding struct {
	ID             string `json:"id"`
	ContestID      string `json:"contest_id"`
	UserID         string `json:"user_id"`
	Rank           int    `json:"rank"`
	OldRating      *int   `json:"old_rating"`
	NewRating      *int   `json:"new_rating"`
	ProblemsSolved int    `json:"problems_solved"`
	UpsolvedCount  int    `json:"upsolved_count"`
	// Joined
	User *User `json:"user,omitempty"`
}

type SquadTrack struct {
	ID        string       `json:"id"`
	SquadID   string       `json:"squad_id"`
	Title     string       `json:"title"`
	CreatedAt time.Time    `json:"created_at"`
	Topics    []SquadTopic `json:"topics,omitempty"`
}

type SquadTopic struct {
	ID         string         `json:"id"`
	TrackID    string         `json:"track_id"`
	Title      string         `json:"title"`
	OrderIndex int            `json:"order_index"`
	CreatedAt  time.Time      `json:"created_at"`
	Problems   []TopicProblem `json:"problems,omitempty"`
}

type TopicProblem struct {
	TopicID   string    `json:"topic_id"`
	ProblemID string    `json:"problem_id"`
	AddedAt   time.Time `json:"added_at"`
	Problem   *Problem  `json:"problem,omitempty"`
}

type Editorial struct {
	ID        string    `json:"id"`
	ProblemID string    `json:"problem_id"`
	UserID    string    `json:"user_id"`
	ContentMD string    `json:"content_md"`
	CreatedAt time.Time `json:"created_at"`
	Score     int       `json:"score"`
	UserVote  *int      `json:"user_vote,omitempty"`
	Author    *User     `json:"author,omitempty"`
}

type Announcement struct {
	ID        string    `json:"id"`
	AuthorID  string    `json:"author_id"`
	SquadID   *string   `json:"squad_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
	// Joined
	Author    *User   `json:"author,omitempty"`
	SquadName *string `json:"squad_name,omitempty"`
}

type Invitation struct {
	ID        string     `json:"id"`
	Email     string     `json:"email"`
	Token     string     `json:"token"`
	CreatedBy *string    `json:"created_by"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
}

type Verse struct {
	Text      string `json:"text"`
	Reference string `json:"reference"`
}
