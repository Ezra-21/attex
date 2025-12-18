package http

import (
	"net/http"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type AnnouncementHandler struct {
	announcements *usecase.AnnouncementUseCase
}

func NewAnnouncementHandler(announcements *usecase.AnnouncementUseCase) *AnnouncementHandler {
	return &AnnouncementHandler{announcements: announcements}
}

func (h *AnnouncementHandler) List(c echo.Context) error {
	squadID := SquadIDFromContext(c)
	list, err := h.announcements.ListForUser(c.Request().Context(), squadID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch announcements")
	}
	return c.JSON(http.StatusOK, list)
}

func (h *AnnouncementHandler) PostSquad(c echo.Context) error {
	userID := UserIDFromContext(c)
	callerSquadID := SquadIDFromContext(c)
	var body struct {
		SquadID string `json:"squad_id"`
		Title   string `json:"title"`
		Body    string `json:"body"`
	}
	if err := c.Bind(&body); err != nil || body.Title == "" || body.Body == "" || body.SquadID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "squad_id, title, and body are required")
	}
	a, err := h.announcements.PostSquad(c.Request().Context(), userID, body.SquadID, body.Title, body.Body, callerSquadID)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}
	return c.JSON(http.StatusCreated, a)
}

func (h *AnnouncementHandler) PostGlobal(c echo.Context) error {
	userID := UserIDFromContext(c)
	role := RoleFromContext(c)
	if !role.AtLeast(domain.RoleAdmin) {
		return echo.NewHTTPError(http.StatusForbidden, "admin required")
	}
	var body struct {
		Title    string   `json:"title"`
		Body     string   `json:"body"`
		SquadIDs []string `json:"squad_ids"`
	}
	if err := c.Bind(&body); err != nil || body.Title == "" || body.Body == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "title and body are required")
	}
	if len(body.SquadIDs) > 0 {
		list, err := h.announcements.PostToSquads(c.Request().Context(), userID, body.SquadIDs, body.Title, body.Body)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
		}
		return c.JSON(http.StatusCreated, list)
	}
	a, err := h.announcements.PostGlobal(c.Request().Context(), userID, body.Title, body.Body)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, a)
}
