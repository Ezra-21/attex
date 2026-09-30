import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { useAppUser } from '../../hooks/useAppUser';
import { T } from '../../lib/tokens';
import type { Difficulty } from './types';

export function StudioFrame({ title, crumbs, children }: { title: string; crumbs: string; children: ReactNode }) {
  const user = useAppUser();
  return (
    <AppShell title={title} crumbs={crumbs} userId={user.id} role={user.role} userName={user.fullName} squadName={user.squadName}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>{children}</div>
    </AppShell>
  );
}

export const DIFF_COLOR: Record<Difficulty, string> = {
  intro: T.gain,
  core: T.accent,
  advanced: T.warn,
  contest: T.loss,
};

export function Pill({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: T.fM, fontSize: 11, letterSpacing: 0.4, color: color ?? T.text2,
      border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 8px',
    }}>
      {children}
    </span>
  );
}

export function StudioNav() {
  const links = [
    ['/studio', 'Academy'],
    ['/studio/drills', 'Drills'],
    ['/studio/quizzes', 'Quizzes'],
    ['/studio/patterns', 'Patterns'],
    ['/studio/plan', 'Plan'],
    ['/studio/review', 'Review'],
    ['/studio/arena', 'Arena'],
    ['/studio/badges', 'Badges'],
  ] as const;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
      {links.map(([to, label]) => (
        <Link key={to} to={to} style={{
          textDecoration: 'none', fontFamily: T.fD, fontSize: 13, fontWeight: 600,
          color: T.accentText, background: T.accentGhost, border: `1px solid ${T.accentLine}`,
          borderRadius: 999, padding: '6px 12px',
        }}>
          {label}
        </Link>
      ))}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} style={{
      background: 'none', border: 'none', color: T.text3, cursor: 'pointer',
      fontFamily: T.fD, fontSize: 13, padding: 0, marginBottom: 12,
    }}>
      ← {label}
    </button>
  );
}
