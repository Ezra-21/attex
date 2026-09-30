package studio

import (
	"strings"
	"unicode"
)

// Normalize folds case and whitespace so "O(1)" and " o(1) " grade the same.
func Normalize(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	var b strings.Builder
	space := false
	for _, r := range s {
		if unicode.IsSpace(r) {
			space = b.Len() > 0
			continue
		}
		if space {
			b.WriteByte(' ')
			space = false
		}
		b.WriteRune(r)
	}
	return b.String()
}

// Grade reports whether given matches any accepted answer.
func Grade(given string, accept []string) bool {
	g := Normalize(given)
	if g == "" {
		return false
	}
	for _, a := range accept {
		if Normalize(a) == g {
			return true
		}
	}
	return false
}

// GradeQuiz scores a map of question id to the learner's answer.
func GradeQuiz(q Quiz, answers map[string]string) GradeResult {
	res := GradeResult{QuizID: q.ID, Total: len(q.Questions)}
	for _, question := range q.Questions {
		ok := Grade(answers[question.ID], question.Accept)
		if ok {
			res.Correct++
		}
		res.Details = append(res.Details, struct {
			ID      string `json:"id"`
			Correct bool   `json:"correct"`
			Explain string `json:"explain"`
		}{ID: question.ID, Correct: ok, Explain: question.Explain})
	}
	if res.Total > 0 {
		res.Score = res.Correct * 100 / res.Total
	}
	return res
}
