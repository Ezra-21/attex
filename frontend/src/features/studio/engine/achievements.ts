import type { Achievement, Lesson, ProgressState } from '../types';

function clamp(n: number, goal: number): number {
  return Math.min(n, goal);
}

export function achievements(progress: ProgressState, lessons: Lesson[]): Achievement[] {
  const lessonsDone = Object.values(progress.lessons).filter((m) => m.done).length;
  const drillsDone = Object.values(progress.drills).filter((m) => m.solved).length;
  const perfect = Object.values(progress.quizzes).filter((q) => q.total > 0 && q.correct === q.total).length;
  const need = new Map<string, number>();
  const have = new Map<string, number>();
  for (const lesson of lessons) {
    need.set(lesson.trackId, (need.get(lesson.trackId) ?? 0) + 1);
    if (progress.lessons[lesson.id]?.done) have.set(lesson.trackId, (have.get(lesson.trackId) ?? 0) + 1);
  }
  let trackDone = 0;
  for (const [id, n] of need) if (n > 0 && have.get(id) === n) trackDone += 1;

  return [
    { id: 'first-lesson', title: 'First page', description: 'Finish one academy lesson.', earned: lessonsDone >= 1, progress: clamp(lessonsDone, 1), goal: 1 },
    { id: 'five-lessons', title: 'Warm up', description: 'Finish five lessons.', earned: lessonsDone >= 5, progress: clamp(lessonsDone, 5), goal: 5 },
    { id: 'scholar', title: 'Scholar', description: 'Finish twenty lessons.', earned: lessonsDone >= 20, progress: clamp(lessonsDone, 20), goal: 20 },
    { id: 'track', title: 'Track cleared', description: 'Finish every lesson in one track.', earned: trackDone >= 1, progress: clamp(trackDone, 1), goal: 1 },
    { id: 'first-drill', title: 'Hands on', description: 'Solve one drill.', earned: drillsDone >= 1, progress: clamp(drillsDone, 1), goal: 1 },
    { id: 'ten-drills', title: 'Reps', description: 'Solve ten drills.', earned: drillsDone >= 10, progress: clamp(drillsDone, 10), goal: 10 },
    { id: 'perfect-quiz', title: 'Clean quiz', description: 'Score 100% on a topic quiz.', earned: perfect >= 1, progress: clamp(perfect, 1), goal: 1 },
    { id: 'planner', title: 'Has a plan', description: 'Build a study plan.', earned: progress.plans >= 1, progress: clamp(progress.plans, 1), goal: 1 },
    { id: 'arena', title: 'Sat a round', description: 'Assemble a mock arena.', earned: progress.arenas >= 1, progress: clamp(progress.arenas, 1), goal: 1 },
    { id: 'review', title: 'Came back', description: 'Review three spaced-repetition cards.', earned: progress.reviews >= 3, progress: clamp(progress.reviews, 3), goal: 3 },
  ];
}
