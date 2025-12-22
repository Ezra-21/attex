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