package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"focus-astu-hub/internal/domain"
)

type VerseUseCase struct {
	mu        sync.RWMutex
	cached    *domain.Verse
	fetchedAt time.Time
	client    *http.Client
}

func NewVerseUseCase() *VerseUseCase {
	return &VerseUseCase{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (uc *VerseUseCase) GetVerse(ctx context.Context) (*domain.Verse, error) {
	uc.mu.RLock()
	if uc.cached != nil && time.Since(uc.fetchedAt) < 24*time.Hour {
		v := *uc.cached
		uc.mu.RUnlock()
		return &v, nil
	}
	uc.mu.RUnlock()

	fresh, err := uc.fetch(ctx)
	if err != nil {
		uc.mu.RLock()
		fallback := uc.cached
		uc.mu.RUnlock()
		if fallback != nil {
			return fallback, nil
		}
		return nil, err
	}

	uc.mu.Lock()
	uc.cached = fresh
	uc.fetchedAt = time.Now()
	uc.mu.Unlock()

	return fresh, nil
}

// WarmCache populates the cache on startup so the first request is never a miss.
func (uc *VerseUseCase) WarmCache(ctx context.Context) {
	if _, err := uc.GetVerse(ctx); err != nil {
		// Non-fatal — server starts anyway with no cached verse
	}
}

// StartRefreshLoop refreshes the verse cache every 24 hours in the background.
func (uc *VerseUseCase) StartRefreshLoop() {
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			_, _ = uc.GetVerse(ctx)
			cancel()
		}
	}()
}

type bibleAPIResponse struct {
	Reference string `json:"reference"`
	Verses    []struct {
		Text string `json:"text"`
	} `json:"verses"`
	Text string `json:"text"`
}

func (uc *VerseUseCase) fetch(ctx context.Context) (*domain.Verse, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://bible-api.com/?random=verse", nil)
	if err != nil {
		return nil, err
	}

	resp, err := uc.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch verse: %w", err)
	}
	defer resp.Body.Close()

	var body bibleAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("decode verse: %w", err)
	}

	text := body.Text
	if len(body.Verses) > 0 {
		text = body.Verses[0].Text
	}
	if text == "" {
		return nil, fmt.Errorf("empty verse response")
	}

	return &domain.Verse{
		Text:      text,
		Reference: body.Reference,
	}, nil
}
