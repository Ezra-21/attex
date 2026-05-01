import { describe, it, expect } from 'vitest';
import {
  langToExt,
  bucketSubmissionsByDay,
  bestRank,
  countAwaitingUpsolve,
  contestProblemLabels,
  EAT_OFFSET_MS,
} from '../src/lib/derive';

describe('langToExt', () => {
  it('maps known languages to extensions', () => {
    expect(langToExt('Python3')).toBe('py');
    expect(langToExt('C++17')).toBe('cpp');
    expect(langToExt('Go')).toBe('go');
    expect(langToExt('TypeScript')).toBe('ts');
    expect(langToExt('Rust')).toBe('rs');
  });

  it('collapses C++ variants to cpp', () => {
    expect(langToExt('C++')).toBe('cpp');
    expect(langToExt('C++14')).toBe('cpp');
  });

  it('falls back to txt for unknown languages', () => {
    expect(langToExt('Brainfuck')).toBe('txt');
    expect(langToExt('')).toBe('txt');
  });
});

describe('bucketSubmissionsByDay', () => {
  it('counts submissions per EAT calendar day', () => {
    const counts = bucketSubmissionsByDay([
      '2026-06-12T06:00:00Z',
      '2026-06-12T20:00:00Z',
      '2026-06-13T09:00:00Z',
    ]);
    expect(counts.get('2026-06-12')).toBe(2);
    expect(counts.get('2026-06-13')).toBe(1);
    expect(counts.size).toBe(2);
  });

  it('shifts a late-UTC timestamp into the next EAT day', () => {
    // 22:30 UTC + 3h = 01:30 next day in EAT
    const counts = bucketSubmissionsByDay(['2026-06-11T22:30:00Z']);
    expect(counts.get('2026-06-12')).toBe(1);
    expect(counts.has('2026-06-11')).toBe(false);
  });

  it('skips null, undefined and invalid timestamps', () => {
    const counts = bucketSubmissionsByDay([null, undefined, 'not-a-date', '']);
    expect(counts.size).toBe(0);
  });

  it('returns an empty map for an empty list', () => {
    expect(bucketSubmissionsByDay([]).size).toBe(0);
  });

  it('honours a custom offset', () => {
    const counts = bucketSubmissionsByDay(['2026-06-12T00:30:00Z'], -2 * 60 * 60 * 1000);
    expect(counts.get('2026-06-11')).toBe(1);
  });

  it('exposes the EAT offset constant', () => {
    expect(EAT_OFFSET_MS).toBe(3 * 60 * 60 * 1000);
  });
});

describe('bestRank', () => {
  it('returns the lowest rank', () => {
    expect(bestRank([12, 3, 47, 8])).toBe(3);
  });

  it('returns null for no standings', () => {
    expect(bestRank([])).toBeNull();
  });

  it('handles a single rank', () => {
    expect(bestRank([42])).toBe(42);
  });
});

describe('countAwaitingUpsolve', () => {
  it('counts rows with zero upsolves', () => {
    expect(
      countAwaitingUpsolve([
        { upsolved_count: 0 },
        { upsolved_count: 2 },
        { upsolved_count: 0 },
      ])
    ).toBe(2);
  });

  it('returns 0 when none are awaiting', () => {
    expect(countAwaitingUpsolve([{ upsolved_count: 1 }])).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(countAwaitingUpsolve([])).toBe(0);
  });
});

describe('contestProblemLabels', () => {
  it('produces A..E for five solved', () => {
    expect(contestProblemLabels(5)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('always returns at least one label', () => {
    expect(contestProblemLabels(0)).toEqual(['A']);
    expect(contestProblemLabels(-3)).toEqual(['A']);
  });

  it('floors fractional inputs', () => {
    expect(contestProblemLabels(2.9)).toEqual(['A', 'B']);
  });

  it('handles non-finite input safely', () => {
    expect(contestProblemLabels(NaN)).toEqual(['A']);
  });
});
