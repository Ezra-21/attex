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