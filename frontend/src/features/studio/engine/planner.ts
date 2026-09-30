import type { Difficulty, Lesson, Plan, PlanItem } from '../types';

const rank: Record<Difficulty, number> = { intro: 0, core: 1, advanced: 2, contest: 3 };

export interface PlanRequest {
  hours: number;
  trackIds: string[];
  completed: Record<string, boolean>;
  weakTags: string[];
  lessons: Lesson[];
}

function prereqsMet(lesson: Lesson, done: Record<string, boolean>): boolean {
  return lesson.prereqs.every((id) => done[id]);
}

export function buildPlan(req: PlanRequest): Plan {
  const hours = Math.max(1, Math.min(40, req.hours || 1));
  const budget = hours * 60;
  const allowed = new Set(req.trackIds);
  const weak = new Set(req.weakTags.map((t) => t.toLowerCase()));
  const pool = req.lessons.filter((lesson) => {
    if (req.completed[lesson.id]) return false;
    if (allowed.size && !allowed.has(lesson.trackId)) return false;
    return true;
  }).map((lesson) => {
    let boost = 0;
    for (const tag of lesson.tags) if (weak.has(tag.toLowerCase())) boost += 2;
    if (!prereqsMet(lesson, req.completed)) boost -= 5;
    return { lesson, boost };
  });
  pool.sort((a, b) => {
    if (a.boost !== b.boost) return b.boost - a.boost;
    const rd = rank[a.lesson.difficulty] - rank[b.lesson.difficulty];
    if (rd) return rd;
    if (a.lesson.trackId !== b.lesson.trackId) return a.lesson.trackId.localeCompare(b.lesson.trackId);
    return a.lesson.id.localeCompare(b.lesson.id);
  });

  const items: PlanItem[] = [];
  let used = 0;
  for (const c of pool) {
    const mins = c.lesson.minutes || 20;
    if (used > 0 && used + mins > budget + 15) continue;
    let reason = 'next unfinished lesson in difficulty order';
    if (c.boost > 0) reason = 'matches a tag you marked as weak';
    if (!prereqsMet(c.lesson, req.completed)) reason = 'preview — finish the prerequisite lesson when you can';
    items.push({ lessonId: c.lesson.id, title: c.lesson.title, trackId: c.lesson.trackId, minutes: mins, reason });
    used += mins;
    if (used >= budget) break;
  }
  const notes: string[] = [];
  if (items.length === 0) notes.push('Nothing left in the selected tracks. Widen the track filter or review old cards.');
  else if (used < budget / 2) notes.push('The catalog in these tracks is shorter than the time you set aside. Add another track or spend the rest on drills.');
  else notes.push('Work the list from the top. Mark a lesson done and build the plan again next session.');
  return { hours, totalMinutes: used, items, notes };
}
