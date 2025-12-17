package http

import (
	"net/http"
	"strconv"
	"strings"

	"focus-astu-hub/internal/domain"
	"focus-astu-hub/internal/usecase"

	"github.com/labstack/echo/v4"
)

type AdminHandler struct {
	adminUsers  *usecase.AdminUserUseCase
	users       *usecase.UserUseCase
	invitations *usecase.InvitationUseCase
	settings    domain.SystemSettingsRepository
	userRepo    domain.UserRepository
}

func NewAdminHandler(
	adminUsers *usecase.AdminUserUseCase,
	users *usecase.UserUseCase,
	invitations *usecase.InvitationUseCase,
	settings domain.SystemSettingsRepository,
	userRepo domain.UserRepository,
) *AdminHandler {
	return &AdminHandler{
		adminUsers:  adminUsers,
		users:       users,
		invitations: invitations,
		settings:    settings,
		userRepo:    userRepo,
	}
}

func (h *AdminHandler) ListUsers(c echo.Context) error {
	list, err := h.users.ListUsers(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch users")
	}
	return c.JSON(http.StatusOK, list)
}

func (h *AdminHandler) SetRole(c echo.Context) error {
	callerID   := UserIDFromContext(c)
	callerRole := RoleFromContext(c)
	targetID   := c.Param("userID")
	var body struct {
		Role    string  `json:"role"`
		SquadID *string `json:"squad_id"`
	}
	if err := c.Bind(&body); err != nil || body.Role == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "role is required")
	}
	if err := h.adminUsers.SetRole(c.Request().Context(), callerID, callerRole, targetID, domain.Role(body.Role), body.SquadID); err != nil {
		return echo.NewHTTPError(http.StatusForbidden, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}

func (h *AdminHandler) SetSquad(c echo.Context) error {
	targetID := c.Param("userID")
	var body struct {
		SquadID *string `json:"squad_id"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid body")
	}
	if err := h.adminUsers.SetSquad(c.Request().Context(), targetID, body.SquadID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}

func (h *AdminHandler) SetBan(c echo.Context) error {
	callerID := UserIDFromContext(c)
	targetID := c.Param("userID")
	if targetID == callerID {
		return echo.NewHTTPError(http.StatusForbidden, "cannot ban yourself")
	}
	var body struct {
		IsBanned bool `json:"is_banned"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "is_banned is required")
	}
	if err := h.adminUsers.SetBan(c.Request().Context(), targetID, body.IsBanned); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())