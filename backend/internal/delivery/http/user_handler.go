package http

import (
	"net/http"

	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type UserHandler struct {
	users *usecase.UserUseCase
}

func NewUserHandler(users *usecase.UserUseCase) *UserHandler {
	return &UserHandler{users: users}
}

func (h *UserHandler) GetMe(c echo.Context) error {
	u, err := h.users.GetUser(c.Request().Context(), UserIDFromContext(c))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}
	return c.JSON(http.StatusOK, u)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	userID := c.Param("userID")
	u, err := h.users.GetUser(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}
	return c.JSON(http.StatusOK, u)
}

func (h *UserHandler) UpdateMe(c echo.Context) error {
	userID := UserIDFromContext(c)
	var body struct {
		FullName         string  `json:"full_name"`
		TelegramHandle   string  `json:"telegram_handle"`
		CodeforcesHandle string  `json:"codeforces_handle"`
		LeetCodeHandle   *string `json:"leetcode_handle"`
		AtCoderHandle    *string `json:"atcoder_handle"`
		LinkedInURL      *string `json:"linkedin_url"`
		Bio              *string `json:"bio"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	u, err := h.users.UpdateProfile(c.Request().Context(), userID, usecase.UpdateProfileInput{
		FullName:         body.FullName,
		TelegramHandle:   body.TelegramHandle,
		CodeforcesHandle: body.CodeforcesHandle,
		LeetCodeHandle:   body.LeetCodeHandle,
		AtCoderHandle:    body.AtCoderHandle,
		LinkedInURL:      body.LinkedInURL,
		Bio:              body.Bio,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, u)
}

func (h *UserHandler) CompleteProfile(c echo.Context) error {
	userID := UserIDFromContext(c)
	var body struct {
		FullName         string  `json:"full_name"`
		TelegramHandle   string  `json:"telegram_handle"`
		CodeforcesHandle string  `json:"codeforces_handle"`
		LeetCodeHandle   *string `json:"leetcode_handle"`
		AtCoderHandle    *string `json:"atcoder_handle"`
		LinkedInURL      *string `json:"linkedin_url"`
		Bio              *string `json:"bio"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if body.FullName == "" || body.TelegramHandle == "" || body.CodeforcesHandle == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "full_name, telegram_handle, and codeforces_handle are required")
	}

	u, err := h.users.CompleteProfile(c.Request().Context(), userID, usecase.CompleteProfileInput{
		FullName:         body.FullName,
		TelegramHandle:   body.TelegramHandle,
		CodeforcesHandle: body.CodeforcesHandle,
		LeetCodeHandle:   body.LeetCodeHandle,
		AtCoderHandle:    body.AtCoderHandle,
		LinkedInURL:      body.LinkedInURL,
		Bio:              body.Bio,
	})
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, u)
}

func (h *UserHandler) GenerateAPIKey(c echo.Context) error {
	userID := UserIDFromContext(c)
	rawKey, err := h.users.GenerateAPIKey(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to generate key")
	}
	return c.JSON(http.StatusCreated, map[string]string{"api_key": rawKey})
}

func (h *UserHandler) RevokeAPIKey(c echo.Context) error {
	userID := UserIDFromContext(c)
	if err := h.users.RevokeAPIKey(c.Request().Context(), userID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to revoke key")
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "revoked"})
}

func (h *UserHandler) HasAPIKey(c echo.Context) error {
	userID := UserIDFromContext(c)
	has, err := h.users.HasAPIKey(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to check key")
	}
	return c.JSON(http.StatusOK, map[string]bool{"has_api_key": has})
}
