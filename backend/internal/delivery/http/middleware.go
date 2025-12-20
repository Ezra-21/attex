package http

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"focus-astu-hub/internal/domain"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

// ── JWKS cache ────────────────────────────────────────────────────────────────

// JWKSCache fetches and caches EC public keys from a Supabase JWKS endpoint.
// Keys are refreshed every hour and on-demand when an unknown kid is encountered.
type JWKSCache struct {
	mu        sync.RWMutex
	keys      map[string]*ecdsa.PublicKey
	fetchedAt time.Time
	url       string
	client    *http.Client
}

func NewJWKSCache(jwksURL string) *JWKSCache {
	return &JWKSCache{
		url:    jwksURL,
		client: &http.Client{Timeout: 10 * time.Second},
		keys:   make(map[string]*ecdsa.PublicKey),
	}
}

// Fetch downloads the JWKS and rebuilds the in-memory key map.
func (c *JWKSCache) Fetch(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.url, nil)
	if err != nil {
		return err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	var body struct {
		Keys []struct {
			Kid string `json:"kid"`
			Kty string `json:"kty"`
			Crv string `json:"crv"`
			X   string `json:"x"`
			Y   string `json:"y"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return fmt.Errorf("decode JWKS: %w", err)
	}

	keys := make(map[string]*ecdsa.PublicKey, len(body.Keys))
	for _, k := range body.Keys {
		if k.Kty != "EC" || k.Crv != "P-256" || k.Kid == "" {
			continue
		}
		xb, err := base64.RawURLEncoding.DecodeString(k.X)
		if err != nil {
			continue
		}
		yb, err := base64.RawURLEncoding.DecodeString(k.Y)
		if err != nil {
			continue
		}
		keys[k.Kid] = &ecdsa.PublicKey{
			Curve: elliptic.P256(),
			X:     new(big.Int).SetBytes(xb),
			Y:     new(big.Int).SetBytes(yb),
		}
	}

	if len(keys) == 0 {
		return fmt.Errorf("JWKS contained no usable EC P-256 keys")
	}

	c.mu.Lock()
	c.keys = keys
	c.fetchedAt = time.Now()
	c.mu.Unlock()
	return nil
}

// StartRefreshLoop refreshes JWKS every hour in the background.
func (c *JWKSCache) StartRefreshLoop() {
	go func() {
		ticker := time.NewTicker(time.Hour)
		for range ticker.C {
			ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			_ = c.Fetch(ctx)
			cancel()
		}
	}()
}

// keyFunc is a jwt.Keyfunc that selects the public key matching the token's kid header.
// If the kid is unknown it attempts a single cache refresh before failing.
func (c *JWKSCache) keyFunc(token *jwt.Token) (any, error) {