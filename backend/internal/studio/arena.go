package studio

import (
	"math/rand"
	"sort"
)

// ArenaRequest builds a short mock contest from drills.
type ArenaRequest struct {
	Count      int
	Difficulty Difficulty
	TrackID    string
	Seed       int64
}

func (s *Service) BuildArena(req ArenaRequest) Arena {
	count := req.Count
	if count < 1 {
		count = 3
	}
	if count > 8 {
		count = 8
	}
	pool := make([]Drill, 0)
	for _, d := range s.drills {
		if !matchTrack(d.TrackID, req.TrackID) || !matchDiff(d.Difficulty, req.Difficulty) {
			continue
		}
		pool = append(pool, d)
	}
	sort.SliceStable(pool, func(i, j int) bool { return pool[i].ID < pool[j].ID })
	rng := rand.New(rand.NewSource(req.Seed))
	rng.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })
	if len(pool) > count {
		pool = pool[:count]
	}
	arena := Arena{Title: "Studio arena", Seed: req.Seed}
	for i, d := range pool {
		mins := d.Minutes
		if mins < 1 {
			mins = 20
		}
		pts := 100
		switch d.Difficulty {
		case DiffIntro:
			pts = 100
		case DiffCore:
			pts = 200
		case DiffAdvanced:
			pts = 300
		case DiffContest:
			pts = 400
		}
		arena.Problems = append(arena.Problems, ArenaProblem{
			DrillID: d.ID, Title: d.Title, Difficulty: d.Difficulty, Minutes: mins, Points: pts + i,
		})
		arena.Minutes += mins
	}
	if len(arena.Problems) == 0 {
		arena.Title = "Studio arena (no matching drills)"
	}
	return arena
}
