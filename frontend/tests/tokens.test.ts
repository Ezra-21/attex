import { describe, it, expect } from 'vitest';
import {
  PLAT,
  ROLE_META,
  ROLE_ORDER,
  hasSquadAccess,
  hasAdminAccess,
  type Role,
  type Platform,
} from '../src/lib/tokens';

describe('PLAT (platform metadata)', () => {
  const platforms: Platform[] = ['LEETCODE', 'CODEFORCES', 'ATCODER', 'HACKERRANK', 'GFG', 'OTHER'];

  it('has an entry for every platform', () => {
    platforms.forEach((p) => expect(PLAT[p]).toBeDefined());
  });

  it('each entry has a label, short code and color', () => {
    platforms.forEach((p) => {
      expect(PLAT[p].label.length).toBeGreaterThan(0);
      expect(PLAT[p].short.length).toBeGreaterThan(0);
      expect(PLAT[p].c).toMatch(/^#|rgb/);
    });
  });

  it('maps known platforms to expected labels', () => {
    expect(PLAT.LEETCODE.label).toBe('LeetCode');
    expect(PLAT.CODEFORCES.short).toBe('CF');
  });
});

describe('ROLE_META + ROLE_ORDER', () => {
  it('orders roles from lowest to highest tier', () => {
    const tiers = ROLE_ORDER.map((r) => ROLE_META[r].tier);
    const sorted = [...tiers].sort((a, b) => a - b);
    expect(tiers).toEqual(sorted);
  });

  it('has unique ascending tiers 0..4', () => {
    expect(ROLE_ORDER.map((r) => ROLE_META[r].tier)).toEqual([0, 1, 2, 3, 4]);
  });

  it('has metadata for every role in ROLE_ORDER', () => {
    ROLE_ORDER.forEach((r) => {
      expect(ROLE_META[r].label.length).toBeGreaterThan(0);
      expect(ROLE_META[r].glyph.length).toBeGreaterThan(0);
    });
  });
});

describe('hasSquadAccess', () => {
  it('grants access to members and above', () => {
    (['SQUAD_MEMBER', 'SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN'] as Role[]).forEach((r) =>
      expect(hasSquadAccess(r)).toBe(true)
    );
  });
  it('denies community users', () => {
    expect(hasSquadAccess('COMMUNITY')).toBe(false);
  });
});

describe('hasAdminAccess', () => {
  it('grants access only to admins and super admins', () => {
    expect(hasAdminAccess('ADMIN')).toBe(true);
    expect(hasAdminAccess('SUPER_ADMIN')).toBe(true);
  });
  it('denies everyone below admin', () => {
    (['COMMUNITY', 'SQUAD_MEMBER', 'SQUAD_LEAD'] as Role[]).forEach((r) =>
      expect(hasAdminAccess(r)).toBe(false)
    );
  });
});
