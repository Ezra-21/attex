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