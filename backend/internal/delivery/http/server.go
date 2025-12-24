package http

import (
	"os"
	"strings"

	"focus-astu-hub/internal/domain"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Server struct {
	echo *echo.Echo
}

func NewServer(
	jwks *JWKSCache,
	users domain.UserRepository,
	public     *PublicHandler,
	userH      *UserHandler,
	submH      *SubmissionHandler,
	problemH   *ProblemHandler,
	contestH   *ContestHandler,
	squadH     *SquadHandler,
	editorialH *EditorialHandler,
	annH       *AnnouncementHandler,
	adminH     *AdminHandler,
) *Server {
	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{"Authorization", "Content-Type"},
	}))

	// ── Serve the built React SPA when present (single-container deployment) ──
	// In the Docker image the Vite build is copied to ./public, so the API and
	// the SPA are served from the same origin. When the folder is absent (local
	// API-only runs) this is skipped and the server stays API-only.
	if _, err := os.Stat("public/index.html"); err == nil {
		e.Use(middleware.StaticWithConfig(middleware.StaticConfig{
			Root:  "public",
			Index: "index.html",
			HTML5: true, // SPA fallback: unknown paths serve index.html
			Skipper: func(c echo.Context) bool {
				p := c.Request().URL.Path
				return strings.HasPrefix(p, "/api") || strings.HasPrefix(p, "/docs")
			},
		}))
	}

	api := e.Group("/api")

	// ── Public routes ──────────────────────────────────────────────────────
	api.GET("/healthz", public.Healthz)
	api.GET("/verse", public.Verse)
	api.GET("/system/signup-status", public.SignupStatus)
	api.GET("/invite/validate", public.ValidateInvite)
	api.POST("/invite/signup", public.SignupViaInvite)
	api.POST("/invite/use", public.UseInvite)