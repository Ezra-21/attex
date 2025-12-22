package http

import (
	"net/http"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type ProblemHandler struct {
	problems domain.ProblemRepository
	uc       *usecase.ProblemUseCase
}

func NewProblemHandler(problems domain.ProblemRepository, uc *usecase.ProblemUseCase) *ProblemHandler {
	return &ProblemHandler{problems: problems, uc: uc}
}

func (h *ProblemHandler) List(c echo.Context) error {
	var platform *domain.Platform
	var tag *string

	if p := c.QueryParam("platform"); p != "" {
		pl := domain.Platform(p)
		platform = &pl
	}
	if t := c.QueryParam("tag"); t != "" {
		tag = &t
	}

	problems, err := h.problems.List(c.Request().Context(), platform, tag)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch problems")
	}
	return c.JSON(http.StatusOK, problems)
}

func (h *ProblemHandler) Search(c echo.Context) error {
	q := c.QueryParam("q")
	if q == "" {
		return c.JSON(http.StatusOK, []any{})
	}
	problems, err := h.problems.Search(c.Request().Context(), q, 20)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "search failed")
	}
	return c.JSON(http.StatusOK, problems)
}

// Preview parses a problem URL and returns auto-fetched metadata (title, tags, platform, external_id).
// Requires SQUAD_LEAD or above.
func (h *ProblemHandler) Preview(c echo.Context) error {
	rawURL := c.QueryParam("url")
	if rawURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "url query parameter is required")
	}
	preview, err := h.uc.Preview(c.Request().Context(), rawURL)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, preview)
}

// Create adds a new problem to the library.
// Requires SQUAD_LEAD or above.
func (h *ProblemHandler) Create(c echo.Context) error {
	var body struct {
		Platform     string   `json:"platform"`
		ExternalID   string   `json:"external_id"`
		ExternalLink string   `json:"external_link"`
		Name         string   `json:"name"`
		Tags         []string `json:"tags"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	problem, err := h.uc.Create(c.Request().Context(), usecase.CreateProblemInput{
		Platform:     domain.Platform(body.Platform),
		ExternalID:   body.ExternalID,
		ExternalLink: body.ExternalLink,
		Name:         body.Name,
		Tags:         body.Tags,
	})
	if err != nil {
		if err.Error() == "problem already exists in library" {
			return echo.NewHTTPError(http.StatusConflict, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, problem)
}
