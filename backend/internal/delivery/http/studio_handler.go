package http

import (
	"net/http"
	"strconv"
	"time"

	"focus-astu-hub/internal/studio"

	"github.com/labstack/echo/v4"
)

// StudioHandler serves the training academy. It does not touch Postgres:
// the catalog is compiled into the binary and progress is kept in memory.
type StudioHandler struct {
	svc *studio.Service
}

func NewStudioHandler(svc *studio.Service) *StudioHandler {
	return &StudioHandler{svc: svc}
}

func (h *StudioHandler) Register(g *echo.Group) {
	g.GET("/studio/tracks", h.Tracks)
	g.GET("/studio/patterns", h.Patterns)
	g.GET("/studio/lessons", h.Lessons)
	g.GET("/studio/lessons/:lessonID", h.Lesson)
	g.POST("/studio/lessons/:lessonID/progress", h.MarkLesson)
	g.GET("/studio/drills", h.Drills)
	g.GET("/studio/drills/:drillID", h.Drill)
	g.POST("/studio/drills/:drillID/solve", h.SolveDrill)
	g.GET("/studio/quizzes", h.Quizzes)
	g.GET("/studio/quizzes/:quizID", h.Quiz)
	g.POST("/studio/quizzes/:quizID/grade", h.GradeQuiz)
	g.GET("/studio/search", h.Search)
	g.POST("/studio/plan", h.Plan)
	g.GET("/studio/review", h.Due)
	g.POST("/studio/review", h.Review)
	g.POST("/studio/arena", h.Arena)
	g.GET("/studio/achievements", h.Achievements)
}

func (h *StudioHandler) Tracks(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.Tracks())
}

func (h *StudioHandler) Patterns(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.Patterns())
}

func (h *StudioHandler) Lessons(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.Lessons(c.QueryParam("track"), studio.Difficulty(c.QueryParam("difficulty"))))
}

func (h *StudioHandler) Lesson(c echo.Context) error {
	lesson, err := h.svc.Lesson(c.Param("lessonID"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, lesson)
}

func (h *StudioHandler) MarkLesson(c echo.Context) error {
	var body struct {
		Done bool `json:"done"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := h.svc.MarkLesson(UserIDFromContext(c), c.Param("lessonID"), body.Done); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *StudioHandler) Drills(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.Drills(c.QueryParam("track"), studio.Difficulty(c.QueryParam("difficulty"))))
}

func (h *StudioHandler) Drill(c echo.Context) error {
	drill, err := h.svc.Drill(c.Param("drillID"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, drill)
}

func (h *StudioHandler) SolveDrill(c echo.Context) error {
	var body struct {
		Hints int `json:"hints"`
	}
	_ = c.Bind(&body)
	if err := h.svc.SolveDrill(UserIDFromContext(c), c.Param("drillID"), body.Hints); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *StudioHandler) Quizzes(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.Quizzes(c.QueryParam("track")))
}

func (h *StudioHandler) Quiz(c echo.Context) error {
	quiz, err := h.svc.Quiz(c.Param("quizID"))
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, quiz)
}

func (h *StudioHandler) GradeQuiz(c echo.Context) error {
	var body struct {
		Answers map[string]string `json:"answers"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	res, err := h.svc.SubmitQuiz(UserIDFromContext(c), c.Param("quizID"), body.Answers)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, res)
}

func (h *StudioHandler) Search(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	hits := h.svc.Search(studio.SearchQuery{
		Text:       c.QueryParam("q"),
		TrackID:    c.QueryParam("track"),
		Difficulty: studio.Difficulty(c.QueryParam("difficulty")),
		Limit:      limit,
	})
	return c.JSON(http.StatusOK, hits)
}

func (h *StudioHandler) Plan(c echo.Context) error {
	var body struct {
		Hours     int      `json:"hours"`
		TrackIDs  []string `json:"trackIds"`
		Completed []string `json:"completed"`
		WeakTags  []string `json:"weakTags"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	done := map[string]bool{}
	for _, id := range body.Completed {
		done[id] = true
	}
	h.svc.NotePlan(UserIDFromContext(c))
	return c.JSON(http.StatusOK, h.svc.BuildPlan(studio.PlanRequest{
		Hours: body.Hours, TrackIDs: body.TrackIDs, Completed: done, WeakTags: body.WeakTags,
	}))
}

func (h *StudioHandler) Due(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.DueCards(UserIDFromContext(c), time.Now().UTC()))
}

func (h *StudioHandler) Review(c echo.Context) error {
	var body struct {
		CardID  string `json:"cardId"`
		Quality int    `json:"quality"`
	}
	if err := c.Bind(&body); err != nil || body.CardID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "cardId is required")
	}
	card := h.svc.ReviewCard(UserIDFromContext(c), body.CardID, body.Quality, time.Now().UTC())
	return c.JSON(http.StatusOK, card)
}

func (h *StudioHandler) Arena(c echo.Context) error {
	var body struct {
		Count      int    `json:"count"`
		Difficulty string `json:"difficulty"`
		TrackID    string `json:"trackId"`
		Seed       int64  `json:"seed"`
	}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if body.Seed == 0 {
		body.Seed = time.Now().UnixNano()
	}
	h.svc.NoteArena(UserIDFromContext(c))
	return c.JSON(http.StatusOK, h.svc.BuildArena(studio.ArenaRequest{
		Count: body.Count, Difficulty: studio.Difficulty(body.Difficulty), TrackID: body.TrackID, Seed: body.Seed,
	}))
}

func (h *StudioHandler) Achievements(c echo.Context) error {
	return c.JSON(http.StatusOK, h.svc.Achievements(UserIDFromContext(c)))
}
