package http

import (
	"net/http"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type ContestHandler struct {
	contests *usecase.ContestUseCase
}

func NewContestHandler(contests *usecase.ContestUseCase) *ContestHandler {
	return &ContestHandler{contests: contests}
}

func (h *ContestHandler) List(c echo.Context) error {
	list, err := h.contests.ListContests(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch contests")
	}
	return c.JSON(http.StatusOK, list)
}

func (h *ContestHandler) GetStandings(c echo.Context) error {
	standings, err := h.contests.GetStandings(c.Request().Context(), c.Param("contestID"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "contest not found")
	}
	return c.JSON(http.StatusOK, standings)
}

func (h *ContestHandler) SyncForSquad(c echo.Context) error {
	squadID := c.Param("squadID")
	callerSquadID := SquadIDFromContext(c)
	callerRole := RoleFromContext(c)

	// Squad lead can only sync for their own squad
	if !callerRole.AtLeast(domain.RoleAdmin) {
		if callerSquadID == nil || *callerSquadID != squadID {
			return echo.NewHTTPError(http.StatusForbidden, "can only sync contests for your own squad")
		}
	}

	var body struct {
		ContestID string `json:"contest_id"`
	}
	if err := c.Bind(&body); err != nil || body.ContestID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "contest_id is required")
	}

	result, err := h.contests.SyncContest(c.Request().Context(), callerRole, callerSquadID, body.ContestID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	return c.JSON(http.StatusOK, result)
}

func (h *ContestHandler) SyncAdmin(c echo.Context) error {
	var body struct {
		ContestID string `json:"contest_id"`
	}
	if err := c.Bind(&body); err != nil || body.ContestID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "contest_id is required")
	}

	callerRole := RoleFromContext(c)
	result, err := h.contests.SyncContest(c.Request().Context(), callerRole, nil, body.ContestID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadGateway, err.Error())
	}
	return c.JSON(http.StatusOK, result)
}
