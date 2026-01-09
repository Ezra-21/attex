package tests

import (
	"context"
	"testing"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"
)

func TestProblemCreate(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewProblemUseCase(newFakeProblemRepo())
	p, err := uc.Create(ctx, usecase.CreateProblemInput{
		Platform: domain.PlatformLeetCode, ExternalID: "two-sum", Name: "Two Sum",
	})
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if p.ID == "" {
		t.Error("created problem should have an ID")
	}
	if p.Tags == nil {
		t.Error("tags should default to a non-nil slice")
	}
}

func TestProblemCreateMissingFields(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewProblemUseCase(newFakeProblemRepo())
	cases := []struct {
		name string
		in   usecase.CreateProblemInput
	}{
		{"no name", usecase.CreateProblemInput{Platform: domain.PlatformLeetCode, ExternalID: "x"}},
		{"no external id", usecase.CreateProblemInput{Platform: domain.PlatformLeetCode, Name: "x"}},
		{"no platform", usecase.CreateProblemInput{ExternalID: "x", Name: "y"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := uc.Create(ctx, tc.in); err == nil {
				t.Error("expected a validation error")
			}
		})
	}
}

func TestProblemCreateDuplicate(t *testing.T) {
	ctx := context.Background()
	uc := usecase.NewProblemUseCase(newFakeProblemRepo())
	in := usecase.CreateProblemInput{Platform: domain.PlatformCodeforces, ExternalID: "1700A", Name: "Problem"}
	if _, err := uc.Create(ctx, in); err != nil {
		t.Fatal(err)
	}
	if _, err := uc.Create(ctx, in); err == nil {
		t.Error("a duplicate problem should be rejected")
	}
}

func TestParseProblemURL(t *testing.T) {
	cases := []struct {
		name     string
		url      string
		platform domain.Platform
		extID    string
		link     string
	}{
		{
			"leetcode with trailing slash",
			"https://leetcode.com/problems/two-sum/",
			domain.PlatformLeetCode, "two-sum", "https://leetcode.com/problems/two-sum/",
		},
		{
			"leetcode without trailing slash",
			"https://leetcode.com/problems/add-two-numbers",