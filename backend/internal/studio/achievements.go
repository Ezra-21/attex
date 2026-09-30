package studio

func (s *Service) Achievements(userID string) []Achievement {
	s.mu.Lock()
	defer s.mu.Unlock()
	st := s.state(userID)
	lessonsDone := 0
	for _, m := range st.Lessons {
		if m.Done {
			lessonsDone++
		}
	}
	drillsDone := 0
	for _, m := range st.Drills {
		if m.Solved {
			drillsDone++
		}
	}
	perfect := 0
	for _, q := range st.Quizzes {
		if q.Total > 0 && q.Correct == q.Total {
			perfect++
		}
	}
	trackDone := 0
	byTrack := map[string]int{}
	need := map[string]int{}
	for _, l := range s.lessons {
		need[l.TrackID]++
		if st.Lessons[l.ID].Done {
			byTrack[l.TrackID]++
		}
	}
	for id, n := range need {
		if n > 0 && byTrack[id] == n {
			trackDone++
		}
	}

	return []Achievement{
		{ID: "first-lesson", Title: "First page", Description: "Finish one academy lesson.", Earned: lessonsDone >= 1, Progress: min(lessonsDone, 1), Goal: 1},
		{ID: "five-lessons", Title: "Warm up", Description: "Finish five lessons.", Earned: lessonsDone >= 5, Progress: min(lessonsDone, 5), Goal: 5},
		{ID: "scholar", Title: "Scholar", Description: "Finish twenty lessons.", Earned: lessonsDone >= 20, Progress: min(lessonsDone, 20), Goal: 20},
		{ID: "track", Title: "Track cleared", Description: "Finish every lesson in one track.", Earned: trackDone >= 1, Progress: min(trackDone, 1), Goal: 1},
		{ID: "first-drill", Title: "Hands on", Description: "Solve one drill.", Earned: drillsDone >= 1, Progress: min(drillsDone, 1), Goal: 1},
		{ID: "ten-drills", Title: "Reps", Description: "Solve ten drills.", Earned: drillsDone >= 10, Progress: min(drillsDone, 10), Goal: 10},
		{ID: "perfect-quiz", Title: "Clean quiz", Description: "Score 100% on a topic quiz.", Earned: perfect >= 1, Progress: min(perfect, 1), Goal: 1},
		{ID: "planner", Title: "Has a plan", Description: "Build a study plan.", Earned: st.Plans >= 1, Progress: min(st.Plans, 1), Goal: 1},
		{ID: "arena", Title: "Sat a round", Description: "Assemble a mock arena.", Earned: st.Arenas >= 1, Progress: min(st.Arenas, 1), Goal: 1},
		{ID: "review", Title: "Came back", Description: "Review three spaced-repetition cards.", Earned: st.Reviews >= 3, Progress: min(st.Reviews, 3), Goal: 3},
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
