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
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "updated"})
}

func (h *AdminHandler) CreateSquad(c echo.Context) error {
	var body struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&body); err != nil || strings.TrimSpace(body.Name) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	squad, err := h.adminUsers.CreateSquad(c.Request().Context(), strings.TrimSpace(body.Name))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, squad)
}

func (h *AdminHandler) ListSquads(c echo.Context) error {
	list, err := h.adminUsers.ListSquads(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch squads")
	}
	return c.JSON(http.StatusOK, list)
}

func (h *AdminHandler) UpdateSquad(c echo.Context) error {
	squadID := c.Param("squadID")
	var body struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&body); err != nil || strings.TrimSpace(body.Name) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "name is required")
	}
	squad, err := h.adminUsers.UpdateSquad(c.Request().Context(), squadID, strings.TrimSpace(body.Name))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, squad)
}

func (h *AdminHandler) DeleteSquad(c echo.Context) error {
	squadID := c.Param("squadID")
	if err := h.adminUsers.DeleteSquad(c.Request().Context(), squadID); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *AdminHandler) CreateInvitation(c echo.Context) error {
	callerID := UserIDFromContext(c)
	var body struct {
		Email string `json:"email"`
	}
	if err := c.Bind(&body); err != nil || body.Email == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email is required")
	}
	inv, err := h.invitations.Create(c.Request().Context(), body.Email, callerID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	inviteURL := h.invitations.SiteURL() + "/invite?token=" + inv.Token
	emailErr  := h.invitations.SendEmail(c.Request().Context(), body.Email, inv.Token)
	resp := map[string]any{
		"id":         inv.ID,
		"token":      inv.Token,
		"invite_url": inviteURL,
		"email_sent": emailErr == nil,
	}
	if emailErr != nil {
		resp["email_warning"] = emailErr.Error()
	}
	return c.JSON(http.StatusCreated, resp)
}

func (h *AdminHandler) ListInvitations(c echo.Context) error {
	list, err := h.invitations.List(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to fetch invitations")
	}
	return c.JSON(http.StatusOK, list)
}

// ReconcileStats recomputes problem_count for every user from their actual
// distinct submissions. Use this to repair counters corrupted by old bugs.
func (h *AdminHandler) ReconcileStats(c echo.Context) error {
	n, err := h.userRepo.ReconcileProblemCounts(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{"users_updated": n})
}

func (h *AdminHandler) ToggleSignup(c echo.Context) error {
	role := RoleFromContext(c)
	if !role.AtLeast(domain.RoleSuperAdmin) {
		return echo.NewHTTPError(http.StatusForbidden, "super_admin required")
	}
	var body struct {
		Open bool `json:"open"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "open is required")
	}
	val := strconv.FormatBool(body.Open)
	if err := h.settings.Set(c.Request().Context(), "signup_open", val); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]bool{"signup_open": body.Open})
}
