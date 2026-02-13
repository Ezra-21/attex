export const T = {
  bg: '#0a0c10',
  surface: '#11141a',
  surface2: '#161a21',
  surface3: '#1d222b',
  hover: '#222834',
  border: '#272d39',
  borderSoft: '#1c212a',
  text: '#e9ebf0',
  text2: '#99a0ad',
  text3: '#626a78',
  accent: '#25d6c1',
  accent2: '#14b3a2',
  accentText: '#63e6d6',
  accentGhost: 'rgba(37,214,193,0.13)',
  accentLine: 'rgba(37,214,193,0.30)',
  gain: '#45d483',
  loss: '#f2654f',
  streak: '#ff9646',
  streak2: '#ff6a35',
  warn: '#f3b53c',
  warnGhost: 'rgba(243,181,60,0.14)',
  lc: '#ffa116',
  cf: '#5790ff',
  ac: '#a78bfa',
  hr: '#2ec866',
  gfg: '#308d46',
  other: '#8c94a3',
  fD: 'var(--font-display)',
  fB: 'var(--font-body)',
  fM: 'var(--font-mono)',
  fS: 'var(--font-serif)',
} as const;

export type Platform = 'LEETCODE' | 'CODEFORCES' | 'ATCODER' | 'HACKERRANK' | 'GFG' | 'OTHER';
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'SQUAD_LEAD' | 'SQUAD_MEMBER' | 'COMMUNITY';

export const PLAT: Record<Platform, { label: string; short: string; c: string }> = {
  LEETCODE:   { label: 'LeetCode',      short: 'LC',  c: T.lc },
  CODEFORCES: { label: 'Codeforces',    short: 'CF',  c: T.cf },
  ATCODER:    { label: 'AtCoder',       short: 'AC',  c: T.ac },
  HACKERRANK: { label: 'HackerRank',    short: 'HR',  c: T.hr },
  GFG:        { label: 'GeeksForGeeks', short: 'GFG', c: T.gfg },
  OTHER:      { label: 'Other',         short: '··',  c: T.other },
};

export const ROLE_META: Record<Role, { label: string; tier: number; c: string; glyph: string }> = {
  COMMUNITY: { label: 'Community', tier: 0, c: T.text2, glyph: '◦' },
  SQUAD_MEMBER: { label: 'Member', tier: 1, c: '#7fd1c4', glyph: '▸' },
  SQUAD_LEAD: { label: 'Squad Lead', tier: 2, c: T.accent, glyph: '★' },
  ADMIN: { label: 'Admin', tier: 3, c: '#e7b765', glyph: '◆' },
  SUPER_ADMIN: { label: 'Super Admin', tier: 4, c: '#f4d58a', glyph: '❖' },
};

export const ROLE_ORDER: Role[] = ['COMMUNITY', 'SQUAD_MEMBER', 'SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN'];

export function hasSquadAccess(role: Role): boolean {
  return role === 'SQUAD_MEMBER' || role === 'SQUAD_LEAD' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function hasAdminAccess(role: Role): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
