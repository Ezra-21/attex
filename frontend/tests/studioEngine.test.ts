import { describe, expect, it } from 'vitest';
import { grade, gradeQuiz } from '../src/features/studio/engine/grade';
import { schedule } from '../src/features/studio/engine/review';
import { buildPlan } from '../src/features/studio/engine/planner';
import { buildArena } from '../src/features/studio/engine/arena';
import { searchCatalog } from '../src/features/studio/engine/search';
import { achievements } from '../src/features/studio/engine/achievements';
import { emptyProgress } from '../src/features/studio/engine/progress';
import type { Drill, Lesson, Quiz } from '../src/features/studio/types';

const lesson = (id: string, trackId: string, tags: string[] = []): Lesson => ({
  id, trackId, moduleId: trackId, title: id, difficulty: 'intro', minutes: 30,
  summary: 'prefix sums range query', objectives: [], tags, prereqs: [],
  sections: [{ heading: 'Idea', body: 'prefix table' }], pitfalls: [], checks: [],
});

const drill = (id: string, trackId = 'fundamentals'): Drill => ({
  id, trackId, topicId: 'prefix-sums', title: id, difficulty: 'core', minutes: 25,
  statement: 'Count pairs.', inputFmt: 'n', outputFmt: 'one integer', sampleIn: '1', sampleOut: '1',
  hint: 'sort', solution: 'int main(){return 0;}', language: 'C++', tags: ['prefix'], answer: '1',
});

describe('studio engine', () => {
  it('grades folded answers', () => {
    expect(grade('  O(1) ', ['o(1)'])).toBe(true);
    expect(grade('', ['o(1)'])).toBe(false);
  });

  it('scores a perfect quiz', () => {
    const quiz: Quiz = {
      id: 'q', trackId: 'fundamentals', topicId: 'prefix-sums', title: 'Quiz', minutes: 10,
      questions: [{ id: 'a', prompt: 'cost', accept: ['O(1)'], explain: 'because the table is built' }],
    };
    const res = gradeQuiz(quiz, { a: 'o(1)' });
    expect(res.score).toBe(100);
  });

  it('schedules SM-2', () => {
    const now = new Date('2026-09-30T00:00:00Z');
    let card = schedule({ ease: 2.5, interval: 0, reps: 0, due: now.toISOString() }, 4, now);
    expect(card.reps).toBe(1);
    expect(card.interval).toBe(1);
    card = schedule(card, 5, now);
    expect(card.interval).toBe(6);
    card = schedule(card, 1, now);
    expect(card.reps).toBe(0);
    expect(card.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('builds a plan that skips finished lessons and stays inside the budget', () => {
    const lessons = [lesson('a', 'fundamentals', ['prefix']), lesson('b', 'fundamentals'), lesson('c', 'graphs')];
    const plan = buildPlan({
      hours: 1, trackIds: ['fundamentals'], completed: { a: true }, weakTags: [], lessons,
    });
    expect(plan.items.every((item) => item.lessonId !== 'a')).toBe(true);
    expect(plan.totalMinutes).toBeLessThanOrEqual(75);
    expect(plan.items.some((item) => item.trackId === 'graphs')).toBe(false);
  });

  it('searches lessons by token', () => {
    const hits = searchCatalog([lesson('prefix-sums-intuition', 'fundamentals')], [drill('d1')], { text: 'prefix', limit: 5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].id).toContain('prefix');
  });

  it('builds a stable arena from a seed', () => {
    const drills = [drill('d1'), drill('d2'), drill('d3'), drill('d4')];
    const a = buildArena({ count: 2, seed: 7, drills, trackId: 'fundamentals' });
    const b = buildArena({ count: 2, seed: 7, drills, trackId: 'fundamentals' });
    expect(a.problems.map((p) => p.drillId)).toEqual(b.problems.map((p) => p.drillId));
    expect(a.problems).toHaveLength(2);
  });

  it('unlocks the first-lesson badge', () => {
    const progress = emptyProgress();
    progress.lessons['a'] = { done: true, at: '2026-09-30' };
    const badges = achievements(progress, [lesson('a', 'fundamentals')]);
    expect(badges.find((b) => b.id === 'first-lesson')?.earned).toBe(true);
  });
});
