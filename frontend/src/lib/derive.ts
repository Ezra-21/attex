// Pure, dependency-free derivation helpers extracted from the data hooks so the
// business logic can be unit-tested without React Query or Supabase. Each
// function is side-effect free and deterministic.

/** East Africa Time offset (UTC+3) in milliseconds. */
export const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

const LANG_EXT: Record<string, string> = {
  'C++': 'cpp',
  'C++17': 'cpp',
  'C++14': 'cpp',
  C: 'c',
  Python: 'py',
  Python3: 'py',
  Java: 'java',
  JavaScript: 'js',
  TypeScript: 'ts',
  Go: 'go',
  Rust: 'rs',
  Kotlin: 'kt',
  Swift: 'swift',
  Ruby: 'rb',
  PHP: 'php',
  Scala: 'scala',
};

/** Map a language label to a source-file extension (falls back to "txt"). */
export function langToExt(lang: string): string {
  return LANG_EXT[lang] ?? 'txt';
}

/**
 * Bucket UTC submission timestamps into EAT (UTC+3) calendar-day counts.
 * Invalid or empty timestamps are skipped.
 */
export function bucketSubmissionsByDay(
  timestamps: Array<string | null | undefined>,
  offsetMs: number = EAT_OFFSET_MS
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    if (!ts) continue;
    const t = new Date(ts).getTime();
    if (Number.isNaN(t)) continue;
    const day = new Date(t + offsetMs).toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return counts;
}

/** Best (lowest) rank across standings, or null when there are none. */
export function bestRank(ranks: number[]): number | null {
  return ranks.length ? Math.min(...ranks) : null;
}

/** Count standings still awaiting an upsolve (upsolved_count === 0). */
export function countAwaitingUpsolve(rows: Array<{ upsolved_count: number }>): number {
  return rows.filter((r) => r.upsolved_count === 0).length;
}

/**
 * Contest problem labels "A", "B", "C" … derived from the maximum number of
 * problems solved by any participant. Always returns at least one label.
 */
export function contestProblemLabels(maxSolved: number): string[] {
  const n = Math.max(Math.floor(Number.isFinite(maxSolved) ? maxSolved : 0), 1);
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
}
