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
	api.GET("/announcements/public", public.PublicAnnouncements)
	api.GET("/stats/public", public.PublicStats)

	// ── JWT-gated routes ───────────────────────────────────────────────────
	auth := api.Group("", JWTMiddleware(jwks, users))

	// Profile completion — authenticated but NOT active guard (allows inactive users)
	auth.POST("/users/me/complete-profile", userH.CompleteProfile)
	auth.GET("/users/me/api-key", userH.HasAPIKey)
	auth.POST("/users/me/api-key", userH.GenerateAPIKey)
	auth.DELETE("/users/me/api-key", userH.RevokeAPIKey)

	// Active-user routes
	active := auth.Group("", ActiveGuard(users))

	active.GET("/users/me", userH.GetMe)
	active.GET("/users/:userID", userH.GetUser)
	active.PUT("/users/me", userH.UpdateMe)

	active.GET("/problems", problemH.List)
	active.GET("/problems/search", problemH.Search)

	active.POST("/submissions", submH.Create)
	active.GET("/submissions/:submissionID", submH.GetByID)
	active.GET("/users/:userID/submissions", submH.ListByUser)

	active.GET("/contests", contestH.List)
	active.GET("/contests/:contestID/standings", contestH.GetStandings)

	active.GET("/editorials", editorialH.List)
	active.POST("/editorials", editorialH.Create)
	active.PUT("/editorials/:editorialID", editorialH.Update)
	active.DELETE("/editorials/:editorialID", editorialH.Delete)
	active.POST("/editorials/:editorialID/vote", editorialH.Vote)

	active.GET("/announcements", annH.List)

	active.GET("/squads/:squadID/tracks", squadH.GetCurriculum)

	// ── Squad Lead routes ──────────────────────────────────────────────────
	lead := active.Group("", RoleGuard(domain.RoleSquadLead))

	lead.GET("/problems/preview", problemH.Preview)
	lead.POST("/problems", problemH.Create)
	lead.POST("/squads/:squadID/tracks", squadH.CreateTrack)
	lead.POST("/tracks/:trackID/topics", squadH.AddTopic)
	lead.POST("/topics/:topicID/problems", squadH.AssignProblem)
	lead.POST("/announcements", annH.PostSquad)
	lead.POST("/squads/:squadID/contests/sync", contestH.SyncForSquad)

	// ── Admin routes ───────────────────────────────────────────────────────
	admin := active.Group("/admin", RoleGuard(domain.RoleAdmin))

	admin.GET("/users", adminH.ListUsers)
	admin.PUT("/users/:userID/role", adminH.SetRole)
	admin.PUT("/users/:userID/squad", adminH.SetSquad)
	admin.PUT("/users/:userID/ban", adminH.SetBan)
	admin.GET("/squads", adminH.ListSquads)
	admin.POST("/squads", adminH.CreateSquad)
	admin.PUT("/squads/:squadID", adminH.UpdateSquad)
	admin.DELETE("/squads/:squadID", adminH.DeleteSquad)
	admin.GET("/invitations", adminH.ListInvitations)
	admin.POST("/invitations", adminH.CreateInvitation)
	admin.POST("/announcements", annH.PostGlobal)
	admin.POST("/contests/sync", contestH.SyncAdmin)
	admin.PUT("/system/signup", adminH.ToggleSignup)
	admin.POST("/repair/stats", adminH.ReconcileStats)

	RegisterDocsRoutes(e)

	return &Server{echo: e}
}

func (s *Server) Start(addr string) error {
	return s.echo.Start(":" + addr)
}
