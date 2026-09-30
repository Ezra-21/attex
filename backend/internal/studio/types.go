package studio

// Studio is the training academy: lessons, drills, quizzes, plans, review,
// patterns, a mock arena, and achievements. Catalog data is registered by
// generated files in this package. Progress stays in memory on the API and
// in the browser for the web app.

type Difficulty string

const (
	DiffIntro    Difficulty = "intro"
	DiffCore     Difficulty = "core"
	DiffAdvanced Difficulty = "advanced"
	DiffContest  Difficulty = "contest"
)

type Track struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Blurb string `json:"blurb"`
	Order int    `json:"order"`
}

type Section struct {
	Heading  string `json:"heading"`
	Body     string `json:"body"`
	Code     string `json:"code,omitempty"`
	Language string `json:"language,omitempty"`
}

type Check struct {
	ID      string   `json:"id"`
	Prompt  string   `json:"prompt"`
	Choices []string `json:"choices,omitempty"`
	Accept  []string `json:"accept"`
	Explain string   `json:"explain"`
}

type Lesson struct {
	ID         string     `json:"id"`
	TrackID    string     `json:"trackId"`
	ModuleID   string     `json:"moduleId"`
	Title      string     `json:"title"`
	Difficulty Difficulty `json:"difficulty"`
	Minutes    int        `json:"minutes"`
	Summary    string     `json:"summary"`
	Objectives []string   `json:"objectives"`
	Tags       []string   `json:"tags"`
	Prereqs    []string   `json:"prereqs"`
	Sections   []Section  `json:"sections"`
	Pitfalls   []string   `json:"pitfalls"`
	Checks     []Check    `json:"checks"`
}

type LessonSummary struct {
	ID         string     `json:"id"`
	TrackID    string     `json:"trackId"`
	Title      string     `json:"title"`
	Difficulty Difficulty `json:"difficulty"`
	Minutes    int        `json:"minutes"`
	Summary    string     `json:"summary"`
	Tags       []string   `json:"tags"`
}

type Drill struct {
	ID         string     `json:"id"`
	TrackID    string     `json:"trackId"`
	TopicID    string     `json:"topicId"`
	Title      string     `json:"title"`
	Difficulty Difficulty `json:"difficulty"`
	Minutes    int        `json:"minutes"`
	Statement  string     `json:"statement"`
	InputFmt   string     `json:"inputFmt"`
	OutputFmt  string     `json:"outputFmt"`
	SampleIn   string     `json:"sampleIn"`
	SampleOut  string     `json:"sampleOut"`
	Hint       string     `json:"hint"`
	Solution   string     `json:"solution"`
	Language   string     `json:"language"`
	Tags       []string   `json:"tags"`
	Answer     string     `json:"answer"`
}

type Quiz struct {
	ID        string  `json:"id"`
	TrackID   string  `json:"trackId"`
	TopicID   string  `json:"topicId"`
	Title     string  `json:"title"`
	Minutes   int     `json:"minutes"`
	Questions []Check `json:"questions"`
}

type Pattern struct {
	ID         string   `json:"id"`
	Title      string   `json:"title"`
	TrackID    string   `json:"trackId"`
	Idea       string   `json:"idea"`
	When       string   `json:"when"`
	Complexity string   `json:"complexity"`
	Signals    []string `json:"signals"`
}

type SearchHit struct {
	Kind       string     `json:"kind"`
	ID         string     `json:"id"`
	Title      string     `json:"title"`
	TrackID    string     `json:"trackId"`
	Difficulty Difficulty `json:"difficulty,omitempty"`
	Summary    string     `json:"summary"`
	Score      int        `json:"score"`
}

type PlanItem struct {
	LessonID string `json:"lessonId"`
	Title    string `json:"title"`
	TrackID  string `json:"trackId"`
	Minutes  int    `json:"minutes"`
	Reason   string `json:"reason"`
}

type Plan struct {
	Hours        int        `json:"hours"`
	TotalMinutes int        `json:"totalMinutes"`
	Items        []PlanItem `json:"items"`
	Notes        []string   `json:"notes"`
}

type ArenaProblem struct {
	DrillID    string     `json:"drillId"`
	Title      string     `json:"title"`
	Difficulty Difficulty `json:"difficulty"`
	Minutes    int        `json:"minutes"`
	Points     int        `json:"points"`
}

type Arena struct {
	Title    string         `json:"title"`
	Minutes  int            `json:"minutes"`
	Problems []ArenaProblem `json:"problems"`
	Seed     int64          `json:"seed"`
}

type Achievement struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Earned      bool   `json:"earned"`
	Progress    int    `json:"progress"`
	Goal        int    `json:"goal"`
}

type GradeResult struct {
	QuizID  string `json:"quizId"`
	Correct int    `json:"correct"`
	Total   int    `json:"total"`
	Score   int    `json:"score"`
	Details []struct {
		ID      string `json:"id"`
		Correct bool   `json:"correct"`
		Explain string `json:"explain"`
	} `json:"details"`
}
