package codeforces

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	http *http.Client
}

func NewClient() *Client {
	return &Client{
		http: &http.Client{Timeout: 15 * time.Second},
	}
}

type ContestMeta struct {
	Name   string
	HeldAt time.Time
}

type StandingRow struct {
	Rank           int
	ProblemsSolved int
	Party          Party
}

type Party struct {
	Members []Member
}

type Member struct {
	Handle string
}

type cfStandingsResponse struct {
	Status string `json:"status"`
	Result struct {
		Contest struct {
			ID                  int    `json:"id"`
			Name                string `json:"name"`
			StartTimeSeconds    int64  `json:"startTimeSeconds"`
		} `json:"contest"`
		Rows []struct {
			Rank           int `json:"rank"`
			Party          struct {
				Members []struct {
					Handle string `json:"handle"`
				} `json:"members"`
			} `json:"party"`
			ProblemResults []struct {
				Points float64 `json:"points"`
			} `json:"problemResults"`
		} `json:"rows"`
	} `json:"result"`
}

func (c *Client) GetStandings(ctx context.Context, contestID string) (*ContestMeta, []StandingRow, error) {
	url := fmt.Sprintf("https://codeforces.com/api/contest.standings?contestId=%s&showUnofficial=false", contestID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, nil, fmt.Errorf("codeforces request: %w", err)
	}
	defer resp.Body.Close()

	var body cfStandingsResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, nil, fmt.Errorf("decode response: %w", err)
	}
	if body.Status != "OK" {
		return nil, nil, fmt.Errorf("codeforces API error: status=%s", body.Status)
	}

	meta, rows := parseStandings(body)
	return meta, rows, nil
}

// parseStandings transforms a decoded Codeforces standings response into the
// domain types. It is pure (no I/O) so it can be unit-tested directly: a
// problem counts as solved when it awarded more than zero points.
func parseStandings(body cfStandingsResponse) (*ContestMeta, []StandingRow) {
	meta := &ContestMeta{
		Name:   body.Result.Contest.Name,
		HeldAt: time.Unix(body.Result.Contest.StartTimeSeconds, 0).UTC(),
	}

	var rows []StandingRow
	for _, r := range body.Result.Rows {
		solved := 0
		for _, pr := range r.ProblemResults {
			if pr.Points > 0 {
				solved++
			}
		}
		members := make([]Member, len(r.Party.Members))
		for i, m := range r.Party.Members {
			members[i] = Member{Handle: m.Handle}
		}
		rows = append(rows, StandingRow{
			Rank:           r.Rank,
			ProblemsSolved: solved,
			Party:          Party{Members: members},
		})
	}

	return meta, rows
}
