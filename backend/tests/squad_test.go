package tests

import (
	"context"
	"testing"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"
)

func TestSquadCreateTrack(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewSquadUseCase(newFakeSquadRepo(), newFakeProblemRepo())

	if _, err := uc.CreateTrack(ctx, "squadA", "squadB", "Graphs"); err == nil {
		t.Error("a squad mismatch should be forbidden")
	}
	tr, err := uc.CreateTrack(ctx, "squadA", "squadA", "Graphs")
	if err != nil || tr.Title != "Graphs" {
		t.Fatalf("CreateTrack: %v %v", tr, err)
	}
}

func TestSquadAddTopic(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewSquadUseCase(newFakeSquadRepo(), newFakeProblemRepo())
	tr, _ := uc.CreateTrack(ctx, "squadA", "squadA", "DP")

	if _, err := uc.AddTopic(ctx, "squadX", tr.ID, "Knapsack"); err == nil {
		t.Error("adding a topic to another squad's track should fail")
	}
	top, err := uc.AddTopic(ctx, "squadA", tr.ID, "Knapsack")
	if err != nil || top.Title != "Knapsack" {
		t.Fatalf("AddTopic: %v %v", top, err)
	}
}

func TestSquadAssignProblem(t *testing.T) {
	ctx := context.Background()
	problems := newFakeProblemRepo()
	uc := usecase.NewSquadUseCase(newFakeSquadRepo(), problems)
	tr, _ := uc.CreateTrack(ctx, "squadA", "squadA", "DP")
	top, _ := uc.AddTopic(ctx, "squadA", tr.ID, "Knapsack")
	p, _ := problems.Create(ctx, &domain.Problem{Name: "01 Knapsack"})

	if err := uc.AssignProblem(ctx, "squadX", top.ID, p.ID); err == nil {
		t.Error("assigning from the wrong squad should fail")
	}
	if err := uc.AssignProblem(ctx, "squadA", top.ID, "missing"); err == nil {
		t.Error("assigning a missing problem should fail")
	}
	if err := uc.AssignProblem(ctx, "squadA", top.ID, p.ID); err != nil {
		t.Fatalf("AssignProblem: %v", err)
	}
}

func TestSquadGetCurriculum(t *testing.T) {
	ctx := context.Background()
	problems := newFakeProblemRepo()
	uc := usecase.NewSquadUseCase(newFakeSquadRepo(), problems)
	tr, _ := uc.CreateTrack(ctx, "squadA", "squadA", "DP")
	top, _ := uc.AddTopic(ctx, "squadA", tr.ID, "Knapsack")
	p, _ := problems.Create(ctx, &domain.Problem{Name: "01 Knapsack"})
	_ = uc.AssignProblem(ctx, "squadA", top.ID, p.ID)

	curr, err := uc.GetCurriculum(ctx, "squadA")
	if err != nil {
		t.Fatal(err)
	}
	if len(curr) != 1 || len(curr[0].Topics) != 1 || len(curr[0].Topics[0].Problems) != 1 {
		t.Errorf("curriculum structure is wrong: %+v", curr)
	}
}

func TestSquadListSquads(t *testing.T) {
	ctx := context.Background()
	squads := newFakeSquadRepo()
	squads.Create(ctx, &domain.Squad{Name: "A"})
	uc := usecase.NewSquadUseCase(squads, newFakeProblemRepo())
	list, _ := uc.ListSquads(ctx)
	if len(list) != 1 {
		t.Errorf("ListSquads len = %d, want 1", len(list))
	}
}
