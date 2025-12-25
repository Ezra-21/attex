package http

import (
	"net/http"

	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type SquadHandler struct {
	squads *usecase.SquadUseCase
}

func NewSquadHandler(squads *usecase.SquadUseCase) *SquadHandler {
	return &SquadHandler{squads: squads}
}

func (h *SquadHandler) GetCurriculum(c echo.Context) error {
	squadID := c.Param("squadID")
	curriculum, err := h.squads.GetCurriculum(c.Request().Context(), squadID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch curriculum")
	}
	return c.JSON(http.StatusOK, curriculum)
}

func (h *SquadHandler) CreateTrack(c echo.Context) error {
	squadID := c.Param("squadID")
	callerSquadID := SquadIDFromContext(c)
	csid := ""
	if callerSquadID != nil {
		csid = *callerSquadID
	}

	var body struct {
		Title string `json:"title"`
	}
	if err := c.Bind(&body); err != nil || body.Title == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "title is required")
	}

	track, err := h.squads.CreateTrack(c.Request().Context(), csid, squadID, body.Title)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}
	return c.JSON(http.StatusCreated, track)
}

func (h *SquadHandler) AddTopic(c echo.Context) error {
	trackID := c.Param("trackID")
	callerSquadID := SquadIDFromContext(c)
	csid := ""
	if callerSquadID != nil {
		csid = *callerSquadID
	}

	var body struct {
		Title string `json:"title"`
	}
	if err := c.Bind(&body); err != nil || body.Title == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "title is required")
	}

	topic, err := h.squads.AddTopic(c.Request().Context(), csid, trackID, body.Title)
	if err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}
	return c.JSON(http.StatusCreated, topic)
}

func (h *SquadHandler) AssignProblem(c echo.Context) error {
	topicID := c.Param("topicID")
	callerSquadID := SquadIDFromContext(c)
	csid := ""
	if callerSquadID != nil {
		csid = *callerSquadID
	}

	var body struct {
		ProblemID string `json:"problem_id"`
	}
	if err := c.Bind(&body); err != nil || body.ProblemID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "problem_id is required")
	}

	if err := h.squads.AssignProblem(c.Request().Context(), csid, topicID, body.ProblemID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}
	return c.JSON(http.StatusCreated, map[string]string{"status": "assigned"})
}
