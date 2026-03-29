import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { Avatar } from '../../components/ui/Avatar';
import { SquadBadge } from '../../components/ui/Badge';
import { useAppUser } from '../../hooks/useAppUser';
import { useContestDetail } from './useContestData';
import type { StandingRow } from './useContestData';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ── Problem cell ─────────────────────────────────────────────────────────
type CellState = 'ac' | 'up' | 'todo' | 'none';

function ProblemCell({ state }: { state: CellState }) {
  if (state === 'ac') return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7, background: 'rgba(69,212,131,0.14)', color: T.gain }}>
      <Icon name="check" size={15} />
    </span>
  );
  if (state === 'up') return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7, background: T.accentGhost, color: T.accentText, fontFamily: T.fM, fontSize: 13, fontWeight: 600 }}>
      ↑
    </span>
  );
  if (state === 'todo') return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7, background: T.warnGhost, color: T.warn, border: '1px solid rgba(243,181,60,0.4)', animation: 'fa-pulse-ring 2.2s infinite' }}>
      <Icon name="bolt" size={14} fill={T.warn} />
    </span>
  );
  return (
    <span style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7, background: T.surface, color: T.text3, fontFamily: T.fM, fontSize: 12 }}>
      ·
    </span>
  );
}

// Derive per-problem cell state from a standing row.
// Since the DB stores problems_solved (count solved during contest) and upsolved_count,
// we approximate cells: first N problems = ac, remaining = todo/none.
function deriveCells(row: StandingRow, total: number): CellState[] {
  return Array.from({ length: total }, (_, i) => {
    if (i < row.problems_solved) return 'ac';
    if (row.upsolved_count > 0 && i === row.problems_solved) return 'up';
    return 'none';
  });
}

// ── Legend ────────────────────────────────────────────────────────────────
function Legend({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, animation: pulse ? 'fa-pulse-ring 2.2s infinite' : 'none' }} />
      <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>{label}</span>
    </span>
  );
}

// ── Upsolve card — Stripe variant ─────────────────────────────────────────
function UpsolveCard({ letter, name }: { letter: string; name: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
      borderRadius: 13, position: 'relative', overflow: 'hidden',
      background: 'rgba(243,181,60,0.07)', border: '1px solid rgba(243,181,60,0.45)',
    }}>
      {/* Hazard stripe background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(243,181,60,0.08) 0 10px, transparent 10px 20px)',
      }} />
      <div style={{
        position: 'relative', width: 42, height: 42, borderRadius: 10,
        display: 'grid', placeItems: 'center',
        background: T.warn, color: '#3a2c0f',
        fontFamily: T.fD, fontSize: 18, fontWeight: 700,
      }}>{letter}</div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontFamily: T.fD, fontSize: 14.5, fontWeight: 600, color: T.text }}>{name}</div>
        <div style={{ fontFamily: T.fM, fontSize: 11, color: T.warn, marginTop: 3 }}>NEEDS UPSOLVE</div>
      </div>
      <Btn kind="solid" size="sm" iconR="arrow">Solve now</Btn>
    </div>
  );
}

function ClearedProblem({ letter, name }: { letter: string; name: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px',
      borderRadius: 9, background: T.surface2, border: `1px solid ${T.border}`,
      fontFamily: T.fD, fontSize: 12.5, color: T.text2,
    }}>
      <Icon name="check" size={13} style={{ color: T.gain }} />
      {letter} · {name}
    </span>
  );
}

// ── Standings table ───────────────────────────────────────────────────────
function StandingsTable({ rows, labels, myUserId }: { rows: StandingRow[]; labels: string[]; myUserId: string }) {
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', background: T.surface3 }}>
        <span style={{ width: 34, fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1, color: T.text3 }}>#</span>
        <span style={{ flex: 1, fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>Participant</span>
        {labels.map((l) => (
          <span key={l} style={{ width: 30, textAlign: 'center', fontFamily: T.fM, fontSize: 11, fontWeight: 600, color: T.text3 }}>{l}</span>
        ))}
        <span style={{ width: 50, textAlign: 'right', fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1, color: T.text3 }}>Solved</span>
      </div>

      {rows.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
          No standings yet — sync a contest to populate.
        </div>
      )}

      {rows.map((s) => {
        const isMe = s.user_id === myUserId;
        const cells = deriveCells(s, labels.length);
        return (
          <div
            key={s.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
              borderTop: `1px solid ${T.borderSoft}`,
              background: isMe ? 'rgba(37,214,193,0.05)' : 'transparent',
            }}
          >
            <span className="disp" style={{ width: 34, fontSize: 15, fontWeight: 600, color: s.rank <= 3 ? T.warn : T.text2 }}>
              {s.rank}
            </span>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar name={s.user_name} size={28} ring={isMe} />