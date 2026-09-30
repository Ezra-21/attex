package studio

import (
	"sort"
	"strings"
)

var difficultyRank = map[Difficulty]int{
	DiffIntro:    0,
	DiffCore:     1,
	DiffAdvanced: 2,
	DiffContest:  3,
}

// PlanRequest asks for a week of study that fits in Hours.
type PlanRequest struct {
	Hours     int
	TrackIDs  []string
	Completed map[string]bool
	WeakTags  []string
}

func (s *Service) BuildPlan(req PlanRequest) Plan {
	hours := req.Hours
	if hours < 1 {
		hours = 1
	}
	if hours > 40 {
		hours = 40
	}
	budget := hours * 60
	allowed := map[string]bool{}
	for _, id := range req.TrackIDs {
		allowed[id] = true
	}
	weak := map[string]bool{}
	for _, tag := range req.WeakTags {
		weak[strings.ToLower(tag)] = true
	}

	type cand struct {
		lesson Lesson
		boost  int
	}
	var pool []cand
	for _, l := range s.lessons {
		if req.Completed[l.ID] {
			continue
		}
		if len(allowed) > 0 && !allowed[l.TrackID] {
			continue
		}
		boost := 0
		for _, tag := range l.Tags {
			if weak[strings.ToLower(tag)] {
				boost += 2
			}
		}
		if !prereqsMet(l, req.Completed) {
			boost -= 5
		}
		pool = append(pool, cand{lesson: l, boost: boost})
	}
	sort.SliceStable(pool, func(i, j int) bool {
		if pool[i].boost != pool[j].boost {
			return pool[i].boost > pool[j].boost
		}
		ri, rj := difficultyRank[pool[i].lesson.Difficulty], difficultyRank[pool[j].lesson.Difficulty]
		if ri != rj {
			return ri < rj
		}
		if pool[i].lesson.TrackID != pool[j].lesson.TrackID {
			return pool[i].lesson.TrackID < pool[j].lesson.TrackID
		}
		return pool[i].lesson.ID < pool[j].lesson.ID
	})

	plan := Plan{Hours: hours}
	used := 0
	for _, c := range pool {
		mins := c.lesson.Minutes
		if mins < 1 {
			mins = 20
		}
		if used > 0 && used+mins > budget+15 {
			continue
		}
		reason := "next unfinished lesson in difficulty order"
		if c.boost > 0 {
			reason = "matches a tag you marked as weak"
		}
		if !prereqsMet(c.lesson, req.Completed) {
			reason = "preview — finish the prerequisite lesson when you can"
		}
		plan.Items = append(plan.Items, PlanItem{
			LessonID: c.lesson.ID,
			Title:    c.lesson.Title,
			TrackID:  c.lesson.TrackID,
			Minutes:  mins,
			Reason:   reason,
		})
		used += mins
		if used >= budget {
			break
		}
	}
	plan.TotalMinutes = used
	if len(plan.Items) == 0 {
		plan.Notes = append(plan.Notes, "Nothing left in the selected tracks. Widen the track filter or review old cards.")
	} else if used < budget/2 {
		plan.Notes = append(plan.Notes, "The catalog in these tracks is shorter than the time you set aside. Add another track or spend the rest on drills.")
	} else {
		plan.Notes = append(plan.Notes, "Work the list from the top. Mark a lesson done and build the plan again next session.")
	}
	return plan
}

func prereqsMet(l Lesson, done map[string]bool) bool {
	for _, id := range l.Prereqs {
		if !done[id] {
			return false
		}
	}
	return true
}
