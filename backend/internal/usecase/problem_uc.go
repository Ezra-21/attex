package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"focus-astu-hub/internal/domain"
)

// ── URL parsing regexps ───────────────────────────────────────────────────
var (
	lcRe   = regexp.MustCompile(`^/problems/([^/]+)`)
	cf1Re  = regexp.MustCompile(`/problemset/problem/(\d+)/([A-Za-z]\d*)$`)
	cf2Re  = regexp.MustCompile(`/contest/(\d+)/problem/([A-Za-z]\d*)$`)
	acRe   = regexp.MustCompile(`/contests/([^/]+)/tasks/([^/]+)$`)
	hrRe   = regexp.MustCompile(`/challenges/([^/]+)`)
	gfgRe  = regexp.MustCompile(`/problems/([^/]+)`)
	cfIDRe = regexp.MustCompile(`^(\d+)([A-Z]\d*)$`)
)

type ProblemUseCase struct {
	problems domain.ProblemRepository
	client   *http.Client
}

func NewProblemUseCase(problems domain.ProblemRepository) *ProblemUseCase {
	return &ProblemUseCase{
		problems: problems,
		client:   &http.Client{Timeout: 8 * time.Second},
	}
}

type ProblemPreview struct {
	Platform     domain.Platform `json:"platform"`
	ExternalID   string          `json:"external_id"`
	ExternalLink string          `json:"external_link"`
	Name         string          `json:"name"`
	Tags         []string        `json:"tags"`
}

// ParseProblemURL extracts platform, external_id, and canonical link from a supported URL.
func ParseProblemURL(rawURL string) (platform domain.Platform, externalID, externalLink string, err error) {
	u, parseErr := url.Parse(strings.TrimSpace(rawURL))
	if parseErr != nil || u.Host == "" {
		return "", "", "", fmt.Errorf("invalid URL")
	}
	host := strings.ToLower(u.Host)
	path := strings.TrimSuffix(u.Path, "/")

	switch {
	case strings.Contains(host, "leetcode.com"):
		m := lcRe.FindStringSubmatch(path)
		if m == nil {
			return "", "", "", fmt.Errorf("unsupported LeetCode URL — expected https://leetcode.com/problems/<slug>/")
		}
		slug := m[1]
		return domain.PlatformLeetCode, slug, "https://leetcode.com/problems/" + slug + "/", nil

	case strings.Contains(host, "codeforces.com"):
		var contestID, index string
		if m := cf1Re.FindStringSubmatch(path); m != nil {
			contestID, index = m[1], strings.ToUpper(m[2])
		} else if m := cf2Re.FindStringSubmatch(path); m != nil {
			contestID, index = m[1], strings.ToUpper(m[2])
		} else {
			return "", "", "", fmt.Errorf("unsupported Codeforces URL — expected /problemset/problem/<id>/<index> or /contest/<id>/problem/<index>")
		}
		extID := contestID + index
		link := "https://codeforces.com/problemset/problem/" + contestID + "/" + index
		return domain.PlatformCodeforces, extID, link, nil

	case strings.Contains(host, "atcoder.jp"):
		m := acRe.FindStringSubmatch(path)
		if m == nil {
			return "", "", "", fmt.Errorf("unsupported AtCoder URL — expected https://atcoder.jp/contests/<contest>/tasks/<task>")
		}
		contest, taskID := m[1], m[2]
		return domain.PlatformAtCoder, taskID, "https://atcoder.jp/contests/" + contest + "/tasks/" + taskID, nil

	case strings.Contains(host, "hackerrank.com"):
		m := hrRe.FindStringSubmatch(path)
		if m == nil {
			return "", "", "", fmt.Errorf("unsupported HackerRank URL — expected https://www.hackerrank.com/challenges/<slug>/problem")
		}
		slug := m[1]
		return domain.PlatformHackerRank, slug, "https://www.hackerrank.com/challenges/" + slug + "/problem", nil

	case strings.Contains(host, "geeksforgeeks.org"):
		m := gfgRe.FindStringSubmatch(path)
		if m == nil {
			return "", "", "", fmt.Errorf("unsupported GeeksForGeeks URL — expected https://www.geeksforgeeks.org/problems/<slug>/")
		}
		slug := m[1]
		return domain.PlatformGFG, slug, "https://www.geeksforgeeks.org/problems/" + slug + "/", nil

	default:
		return "", "", "", fmt.Errorf("unsupported platform — paste a LeetCode, Codeforces, AtCoder, HackerRank, or GeeksForGeeks problem URL")
	}
}

// SlugToTitle converts a URL slug to a human-readable title.
func SlugToTitle(slug string) string {
	words := strings.FieldsFunc(slug, func(r rune) bool { return r == '-' || r == '_' })
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(string([]rune(w)[:1])) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

func (uc *ProblemUseCase) Preview(ctx context.Context, rawURL string) (*ProblemPreview, error) {
	platform, externalID, externalLink, err := ParseProblemURL(rawURL)
	if err != nil {
		return nil, err
	}

	preview := &ProblemPreview{
		Platform:     platform,
		ExternalID:   externalID,
		ExternalLink: externalLink,
		Name:         SlugToTitle(externalID),
		Tags:         []string{},
	}

	fetchCtx, cancel := context.WithTimeout(ctx, 6*time.Second)
	defer cancel()

	switch platform {
	case domain.PlatformLeetCode:
		if name, tags, fetchErr := uc.fetchLeetCode(fetchCtx, externalID); fetchErr == nil {
			preview.Name = name
			preview.Tags = tags
		}
	case domain.PlatformCodeforces:
		if m := cfIDRe.FindStringSubmatch(externalID); m != nil {
			if name, tags, fetchErr := uc.fetchCodeforces(fetchCtx, m[1], m[2]); fetchErr == nil {
				preview.Name = name
				preview.Tags = tags
			}
		}
	}

	return preview, nil
}

func (uc *ProblemUseCase) fetchLeetCode(ctx context.Context, slug string) (string, []string, error) {
	payload := fmt.Sprintf(
		`{"query":"query questionData($titleSlug:String!){question(titleSlug:$titleSlug){title topicTags{name}}}","variables":{"titleSlug":"%s"}}`,
		slug,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://leetcode.com/graphql", strings.NewReader(payload))
	if err != nil {
		return "", nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0")

	resp, err := uc.client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Question struct {
				Title     string `json:"title"`
				TopicTags []struct {
					Name string `json:"name"`
				} `json:"topicTags"`
			} `json:"question"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", nil, err
	}
	q := result.Data.Question
	if q.Title == "" {
		return "", nil, fmt.Errorf("empty response")
	}
	tags := make([]string, 0, len(q.TopicTags))
	for _, t := range q.TopicTags {
		tags = append(tags, t.Name)
	}
	return q.Title, tags, nil
}

func (uc *ProblemUseCase) fetchCodeforces(ctx context.Context, contestID, index string) (string, []string, error) {
	apiURL := fmt.Sprintf(
		"https://codeforces.com/api/contest.standings?contestId=%s&from=1&count=1&showUnofficial=false",
		contestID,
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return "", nil, err
	}

	resp, err := uc.client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Status string `json:"status"`
		Result struct {
			Problems []struct {
				Index string   `json:"index"`
				Name  string   `json:"name"`
				Tags  []string `json:"tags"`
			} `json:"problems"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", nil, err
	}
	if result.Status != "OK" {
		return "", nil, fmt.Errorf("CF API: %s", result.Status)
	}
	for _, p := range result.Result.Problems {
		if strings.EqualFold(p.Index, index) {
			return p.Name, p.Tags, nil
		}
	}
	return "", nil, fmt.Errorf("problem %s not found in contest %s", index, contestID)
}

type CreateProblemInput struct {
	Platform     domain.Platform
	ExternalID   string
	ExternalLink string
	Name         string
	Tags         []string
}

func (uc *ProblemUseCase) Create(ctx context.Context, input CreateProblemInput) (*domain.Problem, error) {
	if input.Name == "" || input.ExternalID == "" || string(input.Platform) == "" {
		return nil, fmt.Errorf("name, external_id, and platform are required")
	}
	existing, err := uc.problems.GetByPlatformAndExternalID(ctx, input.Platform, input.ExternalID)
	if err != nil {
		return nil, fmt.Errorf("check existing: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("problem already exists in library")
	}
	tags := input.Tags
	if tags == nil {
		tags = []string{}
	}
	return uc.problems.Create(ctx, &domain.Problem{
		Name:         input.Name,
		Platform:     input.Platform,
		ExternalID:   input.ExternalID,
		ExternalLink: input.ExternalLink,
		Tags:         tags,
	})
}
