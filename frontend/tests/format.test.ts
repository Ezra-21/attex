import { describe, it, expect } from 'vitest';
import {
  cn,
  getInitials,
  avatarHue,
  isStreakActive,
  clamp,
  pluralize,
  truncate,
  formatCompact,
  formatDate,
  timeAgo,
} from '../src/lib/format';

describe('cn', () => {
  it('joins truthy class fragments', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });
  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });
  it('returns an empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});

describe('getInitials', () => {
  it('returns two initials for a full name', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL');
  });
  it('uppercases the initials', () => {
    expect(getInitials('grace hopper')).toBe('GH');
  });
  it('returns a single initial for one word', () => {
    expect(getInitials('Linus')).toBe('L');
  });
  it('uses only the first two words', () => {
    expect(getInitials('john ronald reuel tolkien')).toBe('JR');
  });
  it('ignores extra whitespace', () => {
    expect(getInitials('ada   lovelace')).toBe('AL');
  });
  it('returns an empty string for an empty name', () => {
    expect(getInitials('')).toBe('');
  });
  it('falls back to ? for null/undefined', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
});

describe('avatarHue', () => {
  it('is deterministic for the same name', () => {
    expect(avatarHue('Ada')).toBe(avatarHue('Ada'));
  });
  it('returns a value from the hue palette', () => {
    const hues = [185, 150, 45, 265, 320, 210];
    expect(hues).toContain(avatarHue('Ada Lovelace'));
  });
  it('handles empty input without throwing', () => {
    expect(typeof avatarHue('')).toBe('number');
    expect(typeof avatarHue(null)).toBe('number');
  });
});

describe('isStreakActive', () => {
  it('returns false for null/empty', () => {
    expect(isStreakActive(null)).toBe(false);
    expect(isStreakActive(undefined)).toBe(false);
    expect(isStreakActive('')).toBe(false);
  });
  it('returns true when the date matches today in EAT', () => {
    const todayEAT = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    expect(isStreakActive(todayEAT)).toBe(true);
  });
  it('returns false for an old date', () => {
    expect(isStreakActive('2000-01-01')).toBe(false);
  });
});

describe('clamp', () => {
  it('returns the value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps below the minimum', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps above the maximum', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it('returns min for NaN', () => {
    expect(clamp(NaN, 2, 10)).toBe(2);
  });
});

describe('pluralize', () => {
  it('uses the singular for 1', () => {
    expect(pluralize(1, 'day')).toBe('1 day');
  });
  it('appends s for other counts', () => {
    expect(pluralize(0, 'day')).toBe('0 days');
    expect(pluralize(3, 'day')).toBe('3 days');
  });
  it('uses a custom plural when provided', () => {
    expect(pluralize(2, 'person', 'people')).toBe('2 people');
  });
});

describe('truncate', () => {
  it('leaves short strings unchanged', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });
  it('truncates and appends an ellipsis', () => {
    expect(truncate('hello world', 6)).toBe('hello…');
  });
  it('handles empty input', () => {
    expect(truncate('', 5)).toBe('');
    expect(truncate(null, 5)).toBe('');
  });
});

describe('formatCompact', () => {
  it('leaves numbers under 1000 as-is', () => {
    expect(formatCompact(999)).toBe('999');
    expect(formatCompact(0)).toBe('0');
  });
  it('formats thousands with a k suffix', () => {
    expect(formatCompact(1500)).toBe('1.5k');
    expect(formatCompact(2000)).toBe('2k');
  });
  it('formats millions with an M suffix', () => {
    expect(formatCompact(2_000_000)).toBe('2M');
    expect(formatCompact(1_250_000)).toBe('1.3M');
  });
  it('returns 0 for non-finite input', () => {
    expect(formatCompact(NaN)).toBe('0');
    expect(formatCompact(Infinity)).toBe('0');
  });
});

describe('formatDate', () => {
  it('formats as "D Mon YYYY"', () => {
    expect(formatDate(new Date(2026, 5, 12))).toBe('12 Jun 2026');
    expect(formatDate(new Date(2025, 0, 1))).toBe('1 Jan 2025');
  });
  it('returns empty for invalid/empty input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-06-12T12:00:00Z');
  it('returns "just now" for recent times', () => {
    expect(timeAgo(new Date(now.getTime() - 10_000), now)).toBe('just now');
  });
  it('returns minutes/hours/days', () => {
    expect(timeAgo(new Date(now.getTime() - 5 * 60_000), now)).toBe('5m ago');
    expect(timeAgo(new Date(now.getTime() - 3 * 3_600_000), now)).toBe('3h ago');
    expect(timeAgo(new Date(now.getTime() - 2 * 86_400_000), now)).toBe('2d ago');
  });
  it('falls back to a date after a week', () => {
    const old = new Date(now.getTime() - 30 * 86_400_000);
    expect(timeAgo(old, now)).toBe(formatDate(old));
  });
  it('handles empty input', () => {
    expect(timeAgo(null)).toBe('');
  });
});
