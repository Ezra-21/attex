import type { Arena, Difficulty, Drill } from '../types';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const points: Record<Difficulty, number> = { intro: 100, core: 200, advanced: 300, contest: 400 };

export interface ArenaRequest {
  count: number;
  difficulty?: Difficulty | '';
  trackId?: string;
  seed: number;
  drills: Drill[];
}

export function buildArena(req: ArenaRequest): Arena {
  const count = Math.max(1, Math.min(8, req.count || 3));
  const pool = req.drills.filter((d) => {
    if (req.trackId && d.trackId !== req.trackId) return false;
    if (req.difficulty && d.difficulty !== req.difficulty) return false;
    return true;
  }).slice().sort((a, b) => a.id.localeCompare(b.id));
  const rand = mulberry32(req.seed || 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, count);
  let minutes = 0;
  const problems = picked.map((d, i) => {
    const m = d.minutes || 20;
    minutes += m;
    return { drillId: d.id, title: d.title, difficulty: d.difficulty, minutes: m, points: points[d.difficulty] + i };
  });
  return {
    title: problems.length ? 'Studio arena' : 'Studio arena (no matching drills)',
    minutes,
    problems,
    seed: req.seed,
  };
}
