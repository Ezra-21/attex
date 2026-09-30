package studio

// Catalog registries. Generated files append to these during init.
// After init they are treated as read-only.

var (
	tracks   []Track
	lessons  []Lesson
	drills   []Drill
	quizzes  []Quiz
	patterns []Pattern
)

func registerTrack(t Track)     { tracks = append(tracks, t) }
func registerLesson(l Lesson)   { lessons = append(lessons, l) }
func registerDrill(d Drill)     { drills = append(drills, d) }
func registerQuiz(q Quiz)       { quizzes = append(quizzes, q) }
func registerPattern(p Pattern) { patterns = append(patterns, p) }

func CatalogCounts() (int, int, int, int, int) {
	return len(tracks), len(lessons), len(drills), len(quizzes), len(patterns)
}
