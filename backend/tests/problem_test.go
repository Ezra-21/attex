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
			domain.PlatformLeetCode, "add-two-numbers", "https://leetcode.com/problems/add-two-numbers/",
		},
		{
			"codeforces problemset",
			"https://codeforces.com/problemset/problem/1700/A",
			domain.PlatformCodeforces, "1700A", "https://codeforces.com/problemset/problem/1700/A",
		},
		{
			"codeforces contest path, lowercase index normalised",
			"https://codeforces.com/contest/1700/problem/b",
			domain.PlatformCodeforces, "1700B", "https://codeforces.com/problemset/problem/1700/B",
		},
		{
			"atcoder task",
			"https://atcoder.jp/contests/abc300/tasks/abc300_a",
			domain.PlatformAtCoder, "abc300_a", "https://atcoder.jp/contests/abc300/tasks/abc300_a",
		},
		{
			"hackerrank challenge",
			"https://www.hackerrank.com/challenges/solve-me-first/problem",
			domain.PlatformHackerRank, "solve-me-first", "https://www.hackerrank.com/challenges/solve-me-first/problem",
		},
		{
			"geeksforgeeks problem",
			"https://www.geeksforgeeks.org/problems/maximum-subarray-sum/1",
			domain.PlatformGFG, "maximum-subarray-sum", "https://www.geeksforgeeks.org/problems/maximum-subarray-sum/",
		},
		{
			"surrounding whitespace is trimmed",
			"  https://leetcode.com/problems/valid-anagram/  ",
			domain.PlatformLeetCode, "valid-anagram", "https://leetcode.com/problems/valid-anagram/",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			platform, extID, link, err := usecase.ParseProblemURL(tc.url)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if platform != tc.platform {
				t.Errorf("platform = %q, want %q", platform, tc.platform)
			}
			if extID != tc.extID {
				t.Errorf("externalID = %q, want %q", extID, tc.extID)
			}
			if link != tc.link {
				t.Errorf("link = %q, want %q", link, tc.link)
			}
		})
	}
}

func TestParseProblemURLErrors(t *testing.T) {
	bad := []struct {
		name string
		url  string
	}{
		{"empty", ""},
		{"no host", "not-a-real-url"},
		{"unsupported platform", "https://example.com/problems/foo"},
		{"leetcode wrong path", "https://leetcode.com/contest/foo"},
		{"codeforces non-problem path", "https://codeforces.com/profile/tourist"},
		{"atcoder wrong path", "https://atcoder.jp/contests/abc300"},
	}

	for _, tc := range bad {
		t.Run(tc.name, func(t *testing.T) {
			if _, _, _, err := usecase.ParseProblemURL(tc.url); err == nil {
				t.Errorf("expected an error for %q, got nil", tc.url)
			}
		})
	}
}

func TestSlugToTitle(t *testing.T) {
	cases := map[string]string{
		"two-sum":                       "Two Sum",
		"add_two_numbers":               "Add Two Numbers",
		"maximum-subarray":              "Maximum Subarray",
		"longest-palindromic-substring": "Longest Palindromic Substring",
		"single":                        "Single",
		"":                              "",
	}

	for in, want := range cases {
		if got := usecase.SlugToTitle(in); got != want {
			t.Errorf("SlugToTitle(%q) = %q, want %q", in, got, want)
		}
	}
}
