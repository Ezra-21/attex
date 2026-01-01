package codeforces

import "testing"

// buildResponse is a small helper to assemble a decoded standings payload.
func buildResponse() cfStandingsResponse {
	var body cfStandingsResponse
	body.Status = "OK"
	body.Result.Contest.Name = "Codeforces Round 900"
	body.Result.Contest.StartTimeSeconds = 1_700_000_000

	// Row 1: two solved (points > 0), one unsolved (0 points), single member.
	row1 := struct {
		Rank  int `json:"rank"`
		Party struct {
			Members []struct {
				Handle string `json:"handle"`
			} `json:"members"`
		} `json:"party"`
		ProblemResults []struct {
			Points float64 `json:"points"`
		} `json:"problemResults"`
	}{}
	row1.Rank = 1
	row1.Party.Members = append(row1.Party.Members, struct {
		Handle string `json:"handle"`
	}{Handle: "tourist"})
	row1.ProblemResults = append(row1.ProblemResults,
		struct {
			Points float64 `json:"points"`
		}{Points: 500},
		struct {
			Points float64 `json:"points"`
		}{Points: 0},
		struct {
			Points float64 `json:"points"`
		}{Points: 250},
	)
	body.Result.Rows = append(body.Result.Rows, row1)

	return body
}

func TestParseStandingsMeta(t *testing.T) {
	meta, _ := parseStandings(buildResponse())
	if meta.Name != "Codeforces Round 900" {
		t.Errorf("meta.Name = %q, want Codeforces Round 900", meta.Name)
	}
	if meta.HeldAt.Unix() != 1_700_000_000 {
		t.Errorf("meta.HeldAt = %d, want 1700000000", meta.HeldAt.Unix())
	}
	if meta.HeldAt.Location().String() != "UTC" {
		t.Errorf("meta.HeldAt should be UTC, got %s", meta.HeldAt.Location())
	}
}

func TestParseStandingsCountsSolved(t *testing.T) {
	_, rows := parseStandings(buildResponse())
	if len(rows) != 1 {
		t.Fatalf("expected 1 row, got %d", len(rows))
	}
	if rows[0].Rank != 1 {
		t.Errorf("rank = %d, want 1", rows[0].Rank)
	}
	// Two of the three problems awarded points → solved == 2.
	if rows[0].ProblemsSolved != 2 {
		t.Errorf("ProblemsSolved = %d, want 2", rows[0].ProblemsSolved)
	}
	if len(rows[0].Party.Members) != 1 || rows[0].Party.Members[0].Handle != "tourist" {
		t.Errorf("unexpected members: %+v", rows[0].Party.Members)
	}
}

func TestParseStandingsEmpty(t *testing.T) {
	var body cfStandingsResponse
	body.Status = "OK"
	meta, rows := parseStandings(body)
	if meta == nil {
		t.Fatal("meta should not be nil")
	}
	if len(rows) != 0 {
		t.Errorf("expected no rows, got %d", len(rows))
	}
}
