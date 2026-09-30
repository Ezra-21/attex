package studio

import (
	"strings"
	"unicode"
)

func tokens(s string) []string {
	s = strings.ToLower(s)
	return strings.FieldsFunc(s, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
}

func scoreText(query []string, text string, weight int) int {
	if weight == 0 || text == "" || len(query) == 0 {
		return 0
	}
	hay := strings.ToLower(text)
	score := 0
	for _, q := range query {
		if q == "" {
			continue
		}
		if strings.Contains(hay, q) {
			score += weight
			if strings.Contains(" "+hay+" ", " "+q+" ") {
				score += weight
			}
		}
	}
	return score
}

func lessonBlob(l Lesson) string {
	var b strings.Builder
	for _, s := range l.Sections {
		b.WriteString(s.Heading)
		b.WriteByte(' ')
		b.WriteString(s.Body)
		b.WriteByte(' ')
	}
	for _, p := range l.Pitfalls {
		b.WriteString(p)
		b.WriteByte(' ')
	}
	return b.String()
}

// SearchQuery filters the academy catalog.
type SearchQuery struct {
	Text       string
	TrackID    string
	Difficulty Difficulty
	Limit      int
}

func matchTrack(id, want string) bool {
	return want == "" || id == want
}

func matchDiff(got, want Difficulty) bool {
	return want == "" || got == want
}
