package http

import (
	"context"
	"log"
	"net/http"
	"strconv"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type verseFetcher interface {
	GetVerse(ctx context.Context) (*domain.Verse, error)
}

type publicStatsRepo interface {
	ListAll(ctx context.Context) ([]*domain.User, error)
}

type contestLister interface {
	ListContests(ctx context.Context) ([]*domain.Contest, error)
}

type PublicHandler struct {
	verse         verseFetcher
	announcements *usecase.AnnouncementUseCase
	users         publicStatsRepo
	contests      contestLister
	settings      domain.SystemSettingsRepository
	invitations   *usecase.InvitationUseCase
}

func NewPublicHandler(
	verse verseFetcher,
	announcements *usecase.AnnouncementUseCase,
	users publicStatsRepo,
	contests contestLister,
	settings domain.SystemSettingsRepository,
	invitations *usecase.InvitationUseCase,
) *PublicHandler {
	return &PublicHandler{
		verse:         verse,
		announcements: announcements,
		users:         users,
		contests:      contests,
		settings:      settings,
		invitations:   invitations,
	}
}

func (h *PublicHandler) Healthz(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func (h *PublicHandler) Verse(c echo.Context) error {
	v, err := h.verse.GetVerse(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "verse unavailable")
	}
	return c.JSON(http.StatusOK, v)
}

func (h *PublicHandler) SignupStatus(c echo.Context) error {
	val, err := h.settings.Get(c.Request().Context(), "signup_open")
	if err != nil {
		val = "false"
	}
	open, _ := strconv.ParseBool(val)
	return c.JSON(http.StatusOK, map[string]bool{"open": open})
}

func (h *PublicHandler) ValidateInvite(c echo.Context) error {
	token := c.QueryParam("token")
	if token == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "token is required")
	}
	inv, err := h.invitations.Validate(c.Request().Context(), token)
	if err != nil {
		return echo.NewHTTPError(http.StatusGone, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{
		"email":      inv.Email,
		"token":      inv.Token,
		"expires_at": inv.ExpiresAt,
	})
}

// SignupViaInvite validates the token, creates a confirmed Supabase user
// (bypassing email verification), and marks the token as used.
// The frontend then calls supabase.auth.signInWithPassword() to get a session.
func (h *PublicHandler) SignupViaInvite(c echo.Context) error {
	var body struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := c.Bind(&body); err != nil || body.Token == "" || len(body.Password) < 8 {
		return echo.NewHTTPError(http.StatusBadRequest, "token and password (min 8 chars) are required")
	}
	inv, err := h.invitations.Validate(c.Request().Context(), body.Token)
	if err != nil {
		return echo.NewHTTPError(http.StatusGone, err.Error())
	}
	if err := h.invitations.CreateOrConfirmSupabaseUser(c.Request().Context(), inv.Email, body.Password); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	if err := h.invitations.MarkUsed(c.Request().Context(), body.Token); err != nil {
		log.Printf("mark invite used for %s: %v", inv.Email, err)
	}
	return c.JSON(http.StatusOK, map[string]string{"email": inv.Email})
}

func (h *PublicHandler) UseInvite(c echo.Context) error {
	var body struct {
		Token string `json:"token"`
	}
	if err := c.Bind(&body); err != nil || body.Token == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "token is required")
	}
	if _, err := h.invitations.Validate(c.Request().Context(), body.Token); err != nil {
		return echo.NewHTTPError(http.StatusGone, err.Error())
	}
	if err := h.invitations.MarkUsed(c.Request().Context(), body.Token); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "used"})
}

func (h *PublicHandler) PublicAnnouncements(c echo.Context) error {
	limit := 10
	if l := c.QueryParam("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 50 {
			limit = n
		}
	}
	list, err := h.announcements.ListPublic(c.Request().Context(), limit)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch announcements")
	}
	if list == nil {
		list = []*domain.Announcement{}
	}
	return c.JSON(http.StatusOK, list)
}

func (h *PublicHandler) PublicStats(c echo.Context) error {
	users, err := h.users.ListAll(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch stats")
	}

	totalSolved := 0
	for _, u := range users {
		totalSolved += u.ProblemCount
	}

	contests, err := h.contests.ListContests(c.Request().Context())
	if err != nil {
		contests = nil
	}

	return c.JSON(http.StatusOK, map[string]any{
		"total_members":        len(users),
		"total_problems_solved": totalSolved,
		"total_contests":       len(contests),
	})
}
