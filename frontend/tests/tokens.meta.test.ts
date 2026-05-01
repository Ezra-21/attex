import { describe, it, expect } from 'vitest';
import { PLAT, ROLE_META, ROLE_ORDER, type Role, type Platform } from '../src/lib/tokens';

describe('PLAT short codes', () => {
  it('maps every platform to its expected short code', () => {
    const expected: Record<Platform, string> = {
      LEETCODE: 'LC',
      CODEFORCES: 'CF',
      ATCODER: 'AC',
      HACKERRANK: 'HR',
      GFG: 'GFG',
      OTHER: '··',
    };
    (Object.keys(expected) as Platform[]).forEach((p) => {
      expect(PLAT[p].short).toBe(expected[p]);
    });
  });

  it('gives every platform a non-empty color', () => {
    (Object.values(PLAT)).forEach((meta) => {
      expect(meta.c).toMatch(/^#|rgb/);
    });
  });
});

describe('ROLE_META details', () => {
  it('assigns a distinct glyph to each role', () => {
    const glyphs = ROLE_ORDER.map((r) => ROLE_META[r].glyph);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it('assigns a distinct color to each role', () => {
    const colors = ROLE_ORDER.map((r) => ROLE_META[r].c);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('labels match expected display names', () => {
    const expected: Record<Role, string> = {
      COMMUNITY: 'Community',
      SQUAD_MEMBER: 'Member',
      SQUAD_LEAD: 'Squad Lead',
      ADMIN: 'Admin',
      SUPER_ADMIN: 'Super Admin',
    };
    (Object.keys(expected) as Role[]).forEach((r) => {
      expect(ROLE_META[r].label).toBe(expected[r]);
    });
  });

  it('tier increases strictly along ROLE_ORDER', () => {
    for (let i = 1; i < ROLE_ORDER.length; i++) {
      expect(ROLE_META[ROLE_ORDER[i]].tier).toBeGreaterThan(ROLE_META[ROLE_ORDER[i - 1]].tier);
    }
  });
});
