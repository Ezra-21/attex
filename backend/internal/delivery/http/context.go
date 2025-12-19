package http

import (
	"focus-astu-hub/internal/domain"

	"github.com/labstack/echo/v4"
)

const (
	contextKeyUserID  = "user_id"
	contextKeyRole    = "user_role"
	contextKeySquadID = "user_squad_id"
)

func UserIDFromContext(c echo.Context) string {
	v, _ := c.Get(contextKeyUserID).(string)
	return v
}

func RoleFromContext(c echo.Context) domain.Role {
	v, _ := c.Get(contextKeyRole).(domain.Role)
	return v
}

func SquadIDFromContext(c echo.Context) *string {
	v, ok := c.Get(contextKeySquadID).(string)
	if !ok || v == "" {
		return nil
	}
	return &v
}
