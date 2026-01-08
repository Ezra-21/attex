package tests

import (
	"context"
	"testing"

	"focus-astu-hub/internal/usecase"
)

func TestEditorialCRUD(t *testing.T) {
	ctx := context.Background()
	repo := newFakeEditorialRepo()
	uc := usecase.NewEditorialUseCase(repo)

	ed, err := uc.Create(ctx, "user1", "prob1", "# Solution")
	if err != nil || ed.ID == "" {
		t.Fatalf("Create: %v %v", ed, err)
	}
	list, _ := uc.ListByProblem(ctx, "prob1", "user1")
	if len(list) != 1 {
		t.Fatalf("ListByProblem len = %d, want 1", len(list))
	}
	if err := uc.Update(ctx, ed.ID, "user1", "# Updated"); err != nil {
		t.Fatalf("Update: %v", err)
	}
	if repo.byID[ed.ID].ContentMD != "# Updated" {
		t.Error("content was not updated")
	}
	if err := uc.Update(ctx, ed.ID, "intruder", "# Hacked"); err == nil {
		t.Error("a non-author must not be able to update")
	}
	if err := uc.Delete(ctx, ed.ID, "intruder"); err == nil {
		t.Error("a non-author must not be able to delete")
	}
	if err := uc.Delete(ctx, ed.ID, "user1"); err != nil {
		t.Fatalf("Delete: %v", err)
	}
}

func TestEditorialVoteScore(t *testing.T) {
	ctx := context.Background()
	repo := newFakeEditorialRepo()
	uc := usecase.NewEditorialUseCase(repo)
	ed, _ := uc.Create(ctx, "author", "prob1", "x")

	_ = uc.Vote(ctx, ed.ID, "voter1", 1)
	_ = uc.Vote(ctx, ed.ID, "voter2", 1)
	if repo.byID[ed.ID].Score != 2 {
		t.Errorf("score = %d, want 2", repo.byID[ed.ID].Score)
	}
	// voter1 toggles their upvote off
	_ = uc.Vote(ctx, ed.ID, "voter1", 1)
	if repo.byID[ed.ID].Score != 1 {
		t.Errorf("score after toggle off = %d, want 1", repo.byID[ed.ID].Score)
	}
	// voter2 switches their upvote to a downvote
	_ = uc.Vote(ctx, ed.ID, "voter2", -1)
	if repo.byID[ed.ID].Score != -1 {
		t.Errorf("score after switch to downvote = %d, want -1", repo.byID[ed.ID].Score)
	}
}

func TestAnnouncementGlobalAndList(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewAnnouncementUseCase(newFakeAnnouncementRepo())

	if _, err := uc.PostGlobal(ctx, "admin", "Hi", "Body"); err != nil {
		t.Fatal(err)
	}
	pub, _ := uc.ListPublic(ctx, 10)
	if len(pub) != 1 {
		t.Errorf("ListPublic len = %d, want 1", len(pub))
	}
}

func TestAnnouncementSquadScoping(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewAnnouncementUseCase(newFakeAnnouncementRepo())
	sid := "squad1"

	other := "squad2"
	if _, err := uc.PostSquad(ctx, "lead", sid, "T", "B", &other); err == nil {
		t.Error("posting to another squad should be forbidden")
	}
	if _, err := uc.PostSquad(ctx, "lead", sid, "T", "B", nil); err == nil {
		t.Error("a nil caller squad should be forbidden")
	}
	if _, err := uc.PostSquad(ctx, "lead", sid, "T", "B", &sid); err != nil {
		t.Fatalf("matching-squad post: %v", err)
	}

	pub, _ := uc.ListPublic(ctx, 10)
	if len(pub) != 0 {
		t.Errorf("a squad announcement should not be public, got %d", len(pub))
	}
	forUser, _ := uc.ListForUser(ctx, &sid)
	if len(forUser) != 1 {
		t.Errorf("a squad member should see 1 announcement, got %d", len(forUser))
	}
}

func TestAnnouncementPostToSquads(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewAnnouncementUseCase(newFakeAnnouncementRepo())
	res, err := uc.PostToSquads(ctx, "admin", []string{"s1", "s2", "s3"}, "T", "B")
	if err != nil {
		t.Fatal(err)
	}
	if len(res) != 3 {
		t.Errorf("expected 3 announcements, got %d", len(res))
	}
}
