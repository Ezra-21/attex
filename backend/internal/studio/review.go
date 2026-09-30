package studio

import (
	"math"
	"time"
)

// Card is an SM-2 spaced-repetition record for one check question.
type Card struct {
	Ease     float64   `json:"ease"`
	Interval int       `json:"interval"`
	Reps     int       `json:"reps"`
	Due      time.Time `json:"due"`
}

// Schedule applies one SM-2 review. quality is 0..5.
// 0-2 means the learner failed and the card is due again tomorrow.
func Schedule(card Card, quality int, now time.Time) Card {
	if quality < 0 {
		quality = 0
	}
	if quality > 5 {
		quality = 5
	}
	if card.Ease == 0 {
		card.Ease = 2.5
	}
	if quality < 3 {
		card.Reps = 0
		card.Interval = 1
	} else {
		switch card.Reps {
		case 0:
			card.Interval = 1
		case 1:
			card.Interval = 6
		default:
			next := int(math.Round(float64(card.Interval) * card.Ease))
			if next < 1 {
				next = 1
			}
			card.Interval = next
		}
		card.Reps++
	}
	delta := 0.1 - float64(5-quality)*(0.08+float64(5-quality)*0.02)
	card.Ease += delta
	if card.Ease < 1.3 {
		card.Ease = 1.3
	}
	card.Due = now.UTC().AddDate(0, 0, card.Interval)
	return card
}
