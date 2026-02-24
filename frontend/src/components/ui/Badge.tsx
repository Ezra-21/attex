import type { CSSProperties } from 'react';
import { T, PLAT, ROLE_META } from '../../lib/tokens';
import type { Platform, Role } from '../../lib/tokens';

// ── Platform badge ────────────────────────────────────────────────────────
interface PlatformBadgeProps {
  p: Platform;
  full?: boolean;
  size?: 'sm' | 'md';
}

export function PlatformBadge({ p, full, size = 'md' }: PlatformBadgeProps) {
  const d = PLAT[p] ?? PLAT.OTHER;
  const s = size === 'sm'
    ? { fs: 10.5, py: 2, px: 6, dot: 5 }
    : { fs: 11.5, py: 3, px: 8, dot: 6 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: `${s.py}px ${s.px}px`, borderRadius: 6,
      fontFamily: T.fM, fontSize: s.fs, fontWeight: 600, letterSpacing: 0.3,
      color: d.c, background: `${d.c}1c`, border: `1px solid ${d.c}33`,
    }}>
      <span style={{ width: s.dot, height: s.dot, borderRadius: 2, background: d.c }} />
      {full ? d.label : d.short}
    </span>
  );
}

// ── Role badge (tiered) ───────────────────────────────────────────────────
interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

function roleTierStyle(tier: number): CSSProperties {
  if (tier === 0) return { color: T.text2, background: 'transparent', border: `1px solid ${T.border}` };
  if (tier === 1) return { color: '#7fd1c4', background: 'rgba(127,209,196,0.10)', border: '1px solid rgba(127,209,196,0.28)' };
  if (tier === 2) return { color: '#062b27', background: 'linear-gradient(180deg,#37e3cf,#1ab9a8)', border: `1px solid ${T.accent}`, fontWeight: 700 };
  if (tier === 3) return { color: '#3a2c0f', background: 'linear-gradient(180deg,#f0c878,#d6a24a)', border: '1px solid #e7b765' };
  return { color: '#2e2403', background: 'linear-gradient(180deg,#ffe7a8,#e9c069)', border: '1px solid #f4d58a', boxShadow: '0 0 14px rgba(244,213,138,0.28)' };
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const r = ROLE_META[role] ?? ROLE_META.COMMUNITY;
  const s = size === 'sm' ? { fs: 10.5, py: 3, px: 8 } : { fs: 12, py: 4, px: 11 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: `${s.py}px ${s.px}px`, borderRadius: 7,
      fontFamily: T.fD, fontSize: s.fs, fontWeight: 600, letterSpacing: 0.3,
      ...roleTierStyle(r.tier),
    }}>
      <span style={{ fontSize: s.fs - 1, lineHeight: 1 }}>{r.glyph}</span>
      {r.label}
    </span>
  );
}

// ── Squad badge ───────────────────────────────────────────────────────────
interface SquadBadgeProps {
  squad: string | null | undefined;
  lead?: boolean;
  size?: 'sm' | 'md';
}

export function SquadBadge({ squad, lead, size = 'md' }: SquadBadgeProps) {
  if (!squad) return null;
  const s = size === 'sm' ? { fs: 10.5, py: 3, px: 7 } : { fs: 12, py: 4, px: 9 };
  const n = (squad.match(/\d+/) ?? ['#'])[0];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: `${s.py}px ${s.px}px`, borderRadius: 7,
      fontFamily: T.fD, fontSize: s.fs, fontWeight: 600,
      color: T.text, background: T.surface3, border: `1px solid ${T.border}`,
    }}>
      <span className="mono" style={{
        fontSize: s.fs - 1, fontWeight: 700, color: T.accentText,
        background: T.accentGhost, borderRadius: 4, padding: '1px 4px', lineHeight: 1.3,
      }}>{n}</span>
      {squad}
      {lead && <span style={{ color: T.accent }}>· Lead</span>}
    </span>
  );
}

// ── Verdict chip ─────────────────────────────────────────────────────────
interface VerdictProps {
  ok?: boolean;
  children?: string;
}

export function Verdict({ ok = true, children }: VerdictProps) {
  const c = ok ? T.gain : T.loss;
  const bg = ok ? 'rgba(69,212,131,0.12)' : 'rgba(242,101,79,0.12)';
  const br = ok ? 'rgba(69,212,131,0.3)' : 'rgba(242,101,79,0.3)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: T.fM, fontSize: 11.5, fontWeight: 600,
      padding: '2px 8px', borderRadius: 5,
      color: c, background: bg, border: `1px solid ${br}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 5, background: 'currentColor' }} />
      {children ?? (ok ? 'Accepted' : 'Failed')}
    </span>
  );
}
