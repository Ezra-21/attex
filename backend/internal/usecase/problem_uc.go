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