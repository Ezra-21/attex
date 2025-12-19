package http

import (
	"net/http"

	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type EditorialHandler struct {
	editorials *usecase.EditorialUseCase
}

func NewEditorialHandler(editorials *usecase.EditorialUseCase) *EditorialHandler {
	return &EditorialHandler{editorials: editorials}
}

func (h *EditorialHandler) List(c echo.Context) error {
	problemID := c.QueryParam("problem_id")
	if problemID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "problem_id is required")
	}
	callerID := UserIDFromContext(c)
	list, err := h.editorials.ListByProblem(c.Request().Context(), problemID, callerID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch editorials")
	}
	return c.JSON(http.StatusOK, list)
}

func (h *EditorialHandler) Create(c echo.Context) error {
	userID := UserIDFromContext(c)
	var body struct {
		ProblemID string `json:"problem_id"`
		ContentMD string `json:"content_md"`
	}
	if err := c.Bind(&body); err != nil || body.ProblemID == "" || body.ContentMD == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "problem_id and content_md are required")
	}
	e, err := h.editorials.Create(c.Request().Context(), userID, body.ProblemID, body.ContentMD)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, e)
}

func (h *EditorialHandler) Update(c echo.Context) error {
	userID := UserIDFromContext(c)
	editorialID := c.Param("editorialID")
	var body struct {
		ContentMD string `json:"content_md"`
	}
	if err := c.Bind(&body); err != nil || body.ContentMD == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "content_md is required")
	}
	if err := h.editorials.Update(c.Request().Context(), editorialID, userID, body.ContentMD); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}

func (h *EditorialHandler) Delete(c echo.Context) error {
	userID := UserIDFromContext(c)
	if err := h.editorials.Delete(c.Request().Context(), c.Param("editorialID"), userID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *EditorialHandler) Vote(c echo.Context) error {
	userID := UserIDFromContext(c)
	editorialID := c.Param("editorialID")
	var body struct {
		Value int `json:"value"`
	}
	if err := c.Bind(&body); err != nil || (body.Value != 1 && body.Value != -1) {
		return echo.NewHTTPError(http.StatusBadRequest, "value must be 1 or -1")
	}
	if err := h.editorials.Vote(c.Request().Context(), editorialID, userID, body.Value); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
