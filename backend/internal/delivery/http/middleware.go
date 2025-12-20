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
	if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
		return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
	}

	kid, _ := token.Header["kid"].(string)

	c.mu.RLock()
	key, ok := c.keys[kid]
	c.mu.RUnlock()

	if !ok {
		// Unknown kid — try a one-shot refresh (handles key rotation)
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := c.Fetch(ctx); err != nil {
			return nil, fmt.Errorf("kid %q not found and JWKS refresh failed: %w", kid, err)
		}
		c.mu.RLock()
		key, ok = c.keys[kid]
		c.mu.RUnlock()
		if !ok {
			return nil, fmt.Errorf("kid %q not found after JWKS refresh", kid)
		}
	}
	return key, nil
}

// ── Middleware ────────────────────────────────────────────────────────────────

type userFetcher interface {
	GetByID(ctx context.Context, id string) (*domain.User, error)
	GetByAPIKeyHash(ctx context.Context, hash string) (*domain.User, error)
}

// JWTMiddleware validates the Supabase ES256 JWT using the project's JWKS
// and populates user_id, user_role, and user_squad_id on the Echo context.
// The sub claim is used as the canonical user_id.
//
// If the bearer token is not a valid JWT, it is treated as a raw API key:
// the backend hashes it with SHA-256 and looks up the user by api_key_hash.
// This allows the browser extension to authenticate without managing JWTs.
func JWTMiddleware(jwks *JWKSCache, users userFetcher) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			raw, err := extractBearerToken(c.Request())
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing or malformed token")
			}

			// Try JWT first (frontend path).
			claims, jwtErr := parseJWT(raw, jwks.keyFunc)
			if jwtErr == nil {
				userID, err := claims.GetSubject()
				if err != nil || userID == "" {
					return echo.NewHTTPError(http.StatusUnauthorized, "invalid token subject")
				}
				user, err := users.GetByID(c.Request().Context(), userID)
				if err != nil {
					return echo.NewHTTPError(http.StatusUnauthorized, "user not found")
				}
				setUserContext(c, user)
				return next(c)
			}

			// Fall back to API key (browser extension path).
			// Hash the raw token and look up the user by that hash.
			sum := sha256.Sum256([]byte(raw))
			hash := fmt.Sprintf("%x", sum)
			user, err := users.GetByAPIKeyHash(c.Request().Context(), hash)
			if err != nil || user == nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}
			setUserContext(c, user)
			return next(c)
		}
	}
}

func setUserContext(c echo.Context, user *domain.User) {
	c.Set(contextKeyUserID, user.ID)
	c.Set(contextKeyRole, user.Role)
	if user.SquadID != nil {
		c.Set(contextKeySquadID, *user.SquadID)
	}
}

// ActiveGuard rejects requests from users who haven't completed their profile.
func ActiveGuard(users userFetcher) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			userID := UserIDFromContext(c)
			user, err := users.GetByID(c.Request().Context(), userID)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "user not found")
			}
			if !user.IsActive {
				return echo.NewHTTPError(http.StatusForbidden, "profile not complete")
			}
			if user.IsBanned {
				return echo.NewHTTPError(http.StatusForbidden, "account is banned")
			}
			return next(c)
		}
	}
}

// RoleGuard rejects requests from users without at least the required role.
func RoleGuard(minRole domain.Role) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			role := RoleFromContext(c)
			if !role.AtLeast(minRole) {
				return echo.NewHTTPError(http.StatusForbidden, "insufficient permissions")
			}
			return next(c)
		}
	}
}

func extractBearerToken(r *http.Request) (string, error) {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return "", fmt.Errorf("no authorization header")
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
		return "", fmt.Errorf("malformed authorization header")
	}
	return parts[1], nil
}

func parseJWT(tokenStr string, keyfunc jwt.Keyfunc) (jwt.Claims, error) {
	token, err := jwt.Parse(tokenStr, keyfunc)
	if err != nil {
		return nil, err
	}
	return token.Claims, nil
}
