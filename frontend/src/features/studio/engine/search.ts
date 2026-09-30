import type { Difficulty, Drill, Lesson, SearchHit } from '../types';

function tokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreText(query: string[], text: string, weight: number): number {
  if (!weight || !text || query.length === 0) return 0;
  const hay = text.toLowerCase();
  let score = 0;
  for (const q of query) {
    if (hay.includes(q)) {
      score += weight;
      if (` ${hay} `.includes(` ${q} `)) score += weight;
    }
  }
  return score;
}

export interface SearchQuery {
  text: string;
  trackId?: string;
  difficulty?: Difficulty | '';
  limit?: number;
}

function okTrack(id: string, want?: string): boolean {
  return !want || id === want;
}

function okDiff(got: Difficulty, want?: Difficulty | ''): boolean {
  return !want || got === want;
}

export function searchCatalog(lessons: Lesson[], drills: Drill[], q: SearchQuery): SearchHit[] {
  const query = tokens(q.text);
  const limit = !q.limit || q.limit > 50 ? 20 : q.limit;
  const hits: SearchHit[] = [];
  for (const lesson of lessons) {
    if (!okTrack(lesson.trackId, q.trackId) || !okDiff(lesson.difficulty, q.difficulty)) continue;
    const blob = lesson.sections.map((s) => `${s.heading} ${s.body}`).join(' ') + ' ' + lesson.pitfalls.join(' ');
    let score = scoreText(query, lesson.title, 5) + scoreText(query, lesson.tags.join(' '), 4) + scoreText(query, lesson.summary, 2) + scoreText(query, blob, 1);
    if (q.text && score === 0) continue;
    if (!q.text) score = 1;
    hits.push({
      kind: 'lesson', id: lesson.id, title: lesson.title, trackId: lesson.trackId,
      difficulty: lesson.difficulty, summary: lesson.summary, score,
    });
  }
  for (const drill of drills) {
    if (!okTrack(drill.trackId, q.trackId) || !okDiff(drill.difficulty, q.difficulty)) continue;
    let score = scoreText(query, drill.title, 5) + scoreText(query, drill.statement, 2) + scoreText(query, drill.tags.join(' '), 4);
    if (q.text && score === 0) continue;
    if (!q.text) score = 1;
    hits.push({
      kind: 'drill', id: drill.id, title: drill.title, trackId: drill.trackId,
      difficulty: drill.difficulty, summary: drill.statement.split('\n')[0].slice(0, 180), score,
    });
  }
  hits.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return hits.slice(0, limit);
}
