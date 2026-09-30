package studio

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

// Service is the in-memory academy. Catalog data is shared and read-only.
// Per-user progress is guarded by mu.
type Service struct {
	mu       sync.Mutex
	lessons  []Lesson
	drills   []Drill
	quizzes  []Quiz
	tracks   []Track
	patterns []Pattern
	byLesson map[string]Lesson
	byDrill  map[string]Drill
	byQuiz   map[string]Quiz
	users    map[string]*userState
}

type lessonMark struct {
	Done bool
	At   time.Time
}

type drillMark struct {
	Solved bool
	Hints  int
	At     time.Time
}

type quizMark struct {
	Correct int
	Total   int
	Score   int
	At      time.Time
}

type userState struct {
	Lessons map[string]lessonMark
	Drills  map[string]drillMark
	Cards   map[string]Card
	Quizzes map[string]quizMark
	Reviews int
	Arenas  int
	Plans   int
}

func NewService() *Service {
	s := &Service{
		lessons:  append([]Lesson(nil), lessons...),
		drills:   append([]Drill(nil), drills...),
		quizzes:  append([]Quiz(nil), quizzes...),
		tracks:   append([]Track(nil), tracks...),
		patterns: append([]Pattern(nil), patterns...),
		byLesson: map[string]Lesson{},
		byDrill:  map[string]Drill{},
		byQuiz:   map[string]Quiz{},
		users:    map[string]*userState{},
	}
	sort.SliceStable(s.tracks, func(i, j int) bool { return s.tracks[i].Order < s.tracks[j].Order })
	sort.SliceStable(s.lessons, func(i, j int) bool { return s.lessons[i].ID < s.lessons[j].ID })
	for _, l := range s.lessons {
		s.byLesson[l.ID] = l
	}
	for _, d := range s.drills {
		s.byDrill[d.ID] = d
	}
	for _, q := range s.quizzes {
		s.byQuiz[q.ID] = q
	}
	return s
}

func (s *Service) state(userID string) *userState {
	if userID == "" {
		userID = "guest"
	}
	st, ok := s.users[userID]
	if !ok {
		st = &userState{
			Lessons: map[string]lessonMark{},
			Drills:  map[string]drillMark{},
			Cards:   map[string]Card{},
			Quizzes: map[string]quizMark{},
		}
		s.users[userID] = st
	}
	return st
}

func (s *Service) Tracks() []Track { return append([]Track(nil), s.tracks...) }

func (s *Service) Patterns() []Pattern { return append([]Pattern(nil), s.patterns...) }

func (s *Service) Lesson(id string) (Lesson, error) {
	l, ok := s.byLesson[id]
	if !ok {
		return Lesson{}, fmt.Errorf("lesson %s not found", id)
	}
	return l, nil
}

func (s *Service) Drill(id string) (Drill, error) {
	d, ok := s.byDrill[id]
	if !ok {
		return Drill{}, fmt.Errorf("drill %s not found", id)
	}
	return d, nil
}

func (s *Service) Quiz(id string) (Quiz, error) {
	q, ok := s.byQuiz[id]
	if !ok {
		return Quiz{}, fmt.Errorf("quiz %s not found", id)
	}
	return q, nil
}

func (s *Service) Lessons(trackID string, difficulty Difficulty) []LessonSummary {
	out := make([]LessonSummary, 0)
	for _, l := range s.lessons {
		if !matchTrack(l.TrackID, trackID) || !matchDiff(l.Difficulty, difficulty) {
			continue
		}
		out = append(out, summarize(l))
	}
	return out
}

func summarize(l Lesson) LessonSummary {
	return LessonSummary{
		ID: l.ID, TrackID: l.TrackID, Title: l.Title, Difficulty: l.Difficulty,
		Minutes: l.Minutes, Summary: l.Summary, Tags: l.Tags,
	}
}

func (s *Service) Drills(trackID string, difficulty Difficulty) []Drill {
	out := make([]Drill, 0)
	for _, d := range s.drills {
		if matchTrack(d.TrackID, trackID) && matchDiff(d.Difficulty, difficulty) {
			out = append(out, d)
		}
	}
	return out
}

func (s *Service) Quizzes(trackID string) []Quiz {
	out := make([]Quiz, 0)
	for _, q := range s.quizzes {
		if matchTrack(q.TrackID, trackID) {
			out = append(out, q)
		}
	}
	return out
}

func (s *Service) Search(q SearchQuery) []SearchHit {
	query := tokens(q.Text)
	limit := q.Limit
	if limit <= 0 || limit > 50 {
		limit = 20
	}
	var hits []SearchHit
	for _, l := range s.lessons {
		if !matchTrack(l.TrackID, q.TrackID) || !matchDiff(l.Difficulty, q.Difficulty) {
			continue
		}
		score := scoreText(query, l.Title, 5) + scoreText(query, strings.Join(l.Tags, " "), 4) + scoreText(query, l.Summary, 2) + scoreText(query, lessonBlob(l), 1)
		if q.Text != "" && score == 0 {
			continue
		}
		if q.Text == "" {
			score = 1
		}
		hits = append(hits, SearchHit{
			Kind: "lesson", ID: l.ID, Title: l.Title, TrackID: l.TrackID,
			Difficulty: l.Difficulty, Summary: l.Summary, Score: score,
		})
	}
	for _, d := range s.drills {
		if !matchTrack(d.TrackID, q.TrackID) || !matchDiff(d.Difficulty, q.Difficulty) {
			continue
		}
		score := scoreText(query, d.Title, 5) + scoreText(query, d.Statement, 2) + scoreText(query, strings.Join(d.Tags, " "), 4)
		if q.Text != "" && score == 0 {
			continue
		}
		if q.Text == "" {
			score = 1
		}
		hits = append(hits, SearchHit{
			Kind: "drill", ID: d.ID, Title: d.Title, TrackID: d.TrackID,
			Difficulty: d.Difficulty, Summary: firstLine(d.Statement), Score: score,
		})
	}
	sort.SliceStable(hits, func(i, j int) bool {
		if hits[i].Score != hits[j].Score {
			return hits[i].Score > hits[j].Score
		}
		return hits[i].ID < hits[j].ID
	})
	if len(hits) > limit {
		hits = hits[:limit]
	}
	return hits
}

func firstLine(s string) string {
	s = strings.TrimSpace(s)
	if i := strings.IndexByte(s, '\n'); i >= 0 {
		s = s[:i]
	}
	if len(s) > 180 {
		return s[:180]
	}
	return s
}

func (s *Service) MarkLesson(userID, lessonID string, done bool) error {
	if _, ok := s.byLesson[lessonID]; !ok {
		return fmt.Errorf("lesson %s not found", lessonID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.state(userID).Lessons[lessonID] = lessonMark{Done: done, At: time.Now().UTC()}
	return nil
}

func (s *Service) SolveDrill(userID, drillID string, hints int) error {
	if _, ok := s.byDrill[drillID]; !ok {
		return fmt.Errorf("drill %s not found", drillID)
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.state(userID).Drills[drillID] = drillMark{Solved: true, Hints: hints, At: time.Now().UTC()}
	return nil
}

func (s *Service) SubmitQuiz(userID, quizID string, answers map[string]string) (GradeResult, error) {
	q, ok := s.byQuiz[quizID]
	if !ok {
		return GradeResult{}, fmt.Errorf("quiz %s not found", quizID)
	}
	res := GradeQuiz(q, answers)
	s.mu.Lock()
	defer s.mu.Unlock()
	s.state(userID).Quizzes[quizID] = quizMark{Correct: res.Correct, Total: res.Total, Score: res.Score, At: time.Now().UTC()}
	return res, nil
}

// ReviewCard schedules one check and returns the updated card.
func (s *Service) ReviewCard(userID, cardID string, quality int, now time.Time) Card {
	s.mu.Lock()
	defer s.mu.Unlock()
	st := s.state(userID)
	card := Schedule(st.Cards[cardID], quality, now)
	st.Cards[cardID] = card
	st.Reviews++
	return card
}

func (s *Service) DueCards(userID string, now time.Time) []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	st := s.state(userID)
	var due []string
	for id, card := range st.Cards {
		if !card.Due.After(now) {
			due = append(due, id)
		}
	}
	sort.Strings(due)
	return due
}

func (s *Service) NotePlan(userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.state(userID).Plans++
}

func (s *Service) NoteArena(userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.state(userID).Arenas++
}

func (s *Service) completedSet(userID string) map[string]bool {
	st := s.users[userID]
	done := map[string]bool{}
	if st == nil {
		return done
	}
	for id, mark := range st.Lessons {
		if mark.Done {
			done[id] = true
		}
	}
	return done
}

// ValidateCatalog reports duplicate ids and dangling prerequisites.
func ValidateCatalog() error {
	seen := map[string]string{}
	check := func(kind, id string) error {
		if id == "" {
			return fmt.Errorf("empty %s id", kind)
		}
		if prev, ok := seen[id]; ok {
			return fmt.Errorf("duplicate id %s (%s and %s)", id, prev, kind)
		}
		seen[id] = kind
		return nil
	}
	for _, t := range tracks {
		if err := check("track", t.ID); err != nil {
			return err
		}
	}
	lessonIDs := map[string]bool{}
	for _, l := range lessons {
		if err := check("lesson", l.ID); err != nil {
			return err
		}
		lessonIDs[l.ID] = true
		if len(l.Sections) == 0 {
			return fmt.Errorf("lesson %s has no sections", l.ID)
		}
		if len(l.Checks) == 0 {
			return fmt.Errorf("lesson %s has no checks", l.ID)
		}
	}
	for _, l := range lessons {
		for _, pre := range l.Prereqs {
			if !lessonIDs[pre] {
				return fmt.Errorf("lesson %s prerequisite %s missing", l.ID, pre)
			}
		}
	}
	for _, d := range drills {
		if err := check("drill", d.ID); err != nil {
			return err
		}
		if strings.TrimSpace(d.Statement) == "" || strings.TrimSpace(d.Solution) == "" {
			return fmt.Errorf("drill %s is missing a statement or solution", d.ID)
		}
	}
	for _, q := range quizzes {
		if err := check("quiz", q.ID); err != nil {
			return err
		}
		if len(q.Questions) == 0 {
			return fmt.Errorf("quiz %s has no questions", q.ID)
		}
	}
	for _, p := range patterns {
		if err := check("pattern", p.ID); err != nil {
			return err
		}
	}
	if len(lessons) == 0 || len(drills) == 0 || len(quizzes) == 0 {
		return fmt.Errorf("catalog is empty")
	}
	return nil
}
