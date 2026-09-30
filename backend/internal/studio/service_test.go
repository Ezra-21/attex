package studio

import (
	"testing"
	"time"
)

func TestGradeNormalize(t *testing.T) {
	if !Grade("  O(1) ", []string{"o(1)"}) {
		t.Fatal("expected whitespace and case to fold")
	}
	if Grade("", []string{"o(1)"}) {
		t.Fatal("empty answer must not pass")
	}
	if Grade("o(n)", []string{"o(1)"}) {
		t.Fatal("wrong answer passed")
	}
}

func TestScheduleSM2(t *testing.T) {
	now := time.Date(2026, 9, 30, 0, 0, 0, 0, time.UTC)
	card := Schedule(Card{}, 4, now)
	if card.Reps != 1 || card.Interval != 1 {
		t.Fatalf("first success: %+v", card)
	}
	card = Schedule(card, 5, now)
	if card.Reps != 2 || card.Interval != 6 {
		t.Fatalf("second success: %+v", card)
	}
	card = Schedule(card, 1, now)
	if card.Reps != 0 || card.Interval != 1 {
		t.Fatalf("failure should reset: %+v", card)
	}
	if card.Ease < 1.3 {
		t.Fatalf("ease floor: %v", card.Ease)
	}
}

func TestCatalogValid(t *testing.T) {
	if err := ValidateCatalog(); err != nil {
		t.Fatal(err)
	}
	s := NewService()
	if len(s.Tracks()) < 4 {
		t.Fatalf("tracks: %d", len(s.Tracks()))
	}
	hits := s.Search(SearchQuery{Text: "prefix", Limit: 5})
	if len(hits) == 0 {
		t.Fatal("search for prefix returned nothing")
	}
	lesson, err := s.Lesson("prefix-sums-intuition")
	if err != nil {
		t.Fatal(err)
	}
	if lesson.TrackID != "fundamentals" {
		t.Fatalf("track: %s", lesson.TrackID)
	}
}

func TestQuizAndPlanAndArena(t *testing.T) {
	s := NewService()
	quiz, err := s.Quiz("prefix-sums-quiz")
	if err != nil {
		t.Fatal(err)
	}
	answers := map[string]string{}
	for _, q := range quiz.Questions {
		answers[q.ID] = q.Accept[0]
	}
	res, err := s.SubmitQuiz("u1", quiz.ID, answers)
	if err != nil {
		t.Fatal(err)
	}
	if res.Score != 100 {
		t.Fatalf("score %d", res.Score)
	}
	if err := s.MarkLesson("u1", "prefix-sums-intuition", true); err != nil {
		t.Fatal(err)
	}
	badges := s.Achievements("u1")
	earned := map[string]bool{}
	for _, b := range badges {
		earned[b.ID] = b.Earned
	}
	if !earned["first-lesson"] || !earned["perfect-quiz"] {
		t.Fatalf("badges: %+v", earned)
	}
	plan := s.BuildPlan(PlanRequest{Hours: 2, TrackIDs: []string{"fundamentals"}, Completed: map[string]bool{"prefix-sums-intuition": true}})
	if len(plan.Items) == 0 {
		t.Fatal("empty plan")
	}
	if plan.TotalMinutes > 2*60+15 {
		t.Fatalf("plan overflow: %d", plan.TotalMinutes)
	}
	for _, item := range plan.Items {
		if item.LessonID == "prefix-sums-intuition" {
			t.Fatal("completed lesson was scheduled")
		}
	}
	arena := s.BuildArena(ArenaRequest{Count: 3, TrackID: "fundamentals", Seed: 7})
	if len(arena.Problems) == 0 {
		t.Fatal("arena empty")
	}
	again := s.BuildArena(ArenaRequest{Count: 3, TrackID: "fundamentals", Seed: 7})
	if arena.Problems[0].DrillID != again.Problems[0].DrillID {
		t.Fatal("arena seed is not stable")
	}
}

func TestReviewDue(t *testing.T) {
	s := NewService()
	now := time.Date(2026, 9, 30, 12, 0, 0, 0, time.UTC)
	card := s.ReviewCard("u2", "prefix-sums-intuition:check-1", 5, now)
	if card.Due.Before(now) {
		t.Fatal("card should be due in the future")
	}
	due := s.DueCards("u2", now.AddDate(0, 0, 2))
	found := false
	for _, id := range due {
		if id == "prefix-sums-intuition:check-1" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected the card to be due, got %v", due)
	}
}
