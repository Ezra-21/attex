package http

import (
	"errors"
	"net/http"
	"strconv"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type SubmissionHandler struct {
	submissions *usecase.SubmissionUseCase
}

func NewSubmissionHandler(submissions *usecase.SubmissionUseCase) *SubmissionHandler {
	return &SubmissionHandler{submissions: submissions}
}

func (h *SubmissionHandler) Create(c echo.Context) error {
	userID := UserIDFromContext(c)
	var body struct {
		ProblemURL   string  `json:"problem_url"`
		Platform     string  `json:"platform"`
		ExternalID   string  `json:"external_id"`
		ProblemName  string  `json:"problem_name"`
		ExternalLink string  `json:"external_link"`
		Language     string  `json:"language"`
		Code         string  `json:"code"`
		Source       string  `json:"source"`
		ContestID    *string `json:"contest_id"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if body.ProblemURL == "" && (body.ExternalID == "" || body.Platform == "") {
		return echo.NewHTTPError(http.StatusBadRequest, "problem_url or (platform + external_id) is required")
	}
	if body.Language == "" || body.Code == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "language and code are required")
	}

	result, err := h.submissions.Submit(c.Request().Context(), userID, usecase.SubmitInput{
		ProblemURL:   body.ProblemURL,
		Platform:     domain.Platform(body.Platform),
		ExternalID:   body.ExternalID,
		ProblemName:  body.ProblemName,
		ExternalLink: body.ExternalLink,
		Language:     body.Language,
		Code:         body.Code,
		Source:       body.Source,
		ContestID:    body.ContestID,
	})
	if err != nil {
		if errors.Is(err, domain.ErrProblemNotFound) {
			return echo.NewHTTPError(http.StatusUnprocessableEntity, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *SubmissionHandler) GetByID(c echo.Context) error {
	sub, err := h.submissions.GetSubmission(c.Request().Context(), c.Param("submissionID"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "submission not found")
	}
	return c.JSON(http.StatusOK, sub)
}

func (h *SubmissionHandler) ListByUser(c echo.Context) error {
	userID := c.Param("userID")
	limit := 20
	offset := 0
	if l := c.QueryParam("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil {
			limit = n
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil {
			offset = n
		}
	}
	subs, err := h.submissions.ListByUser(c.Request().Context(), userID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch submissions")
	}
	return c.JSON(http.StatusOK, subs)
}
