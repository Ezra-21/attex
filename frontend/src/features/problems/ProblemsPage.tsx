import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { T } from '../../lib/tokens';
import type { Platform } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge, RoleBadge, SquadBadge, Verdict } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAppUser } from '../../hooks/useAppUser';
import { useAuth } from '../../hooks/useAuth';
import { TableRowSk } from '../../components/ui/Skeleton';
import { useProblems, useMySubmittedProblemIds, useProblemSubmissions } from './useProblemData';
import type { Problem, ProblemSubmission } from './useProblemData';
import { LogSolveModal } from './LogSolveModal';
import { AddProblemModal } from './AddProblemModal';

// ── Filter pills ─────────────────────────────────────────────────────────
function FilterPill({ children, active, icon, onClick }: {
  children: string; active?: boolean; icon?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
        fontFamily: T.fD, fontSize: 12.5, fontWeight: 500,
        color: active ? '#04201d' : T.text2,
        background: active ? T.accent : T.surface2,
        border: `1px solid ${active ? T.accent : T.border}`,
      }}
    >
      {icon && <Icon name={icon} size={14} />}{children}
    </button>
  );
}

// ── Tag chip ──────────────────────────────────────────────────────────────
function Tag({ children }: { children: string }) {
  return (
    <span style={{
      fontFamily: T.fM, fontSize: 10.5, color: T.text2,
      background: T.surface3, border: `1px solid ${T.border}`,
      borderRadius: 5, padding: '2px 7px',
    }}>{children}</span>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

// ── Accordion content — ALL member submissions ────────────────────────────
function ProblemAccordion({ problem, myUserId }: { problem: Problem; myUserId: string }) {
  const navigate = useNavigate();
  const { data: submissions = [], isLoading } = useProblemSubmissions(problem.id);
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  return (
    <div style={{ padding: isMobile ? '2px 10px 14px 10px' : '2px 18px 18px 52px' }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 11, overflow: 'hidden' }}>
        {/* Accordion header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderBottom: `1px solid ${T.borderSoft}`,
        }}>
          <span style={{ fontFamily: T.fM, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>
            {isLoading ? 'Loading…' : `${submissions.length} accepted submission${submissions.length !== 1 ? 's' : ''}`}
          </span>
          <a
            href={problem.external_link}
            target="_blank"
            rel="noreferrer"
            style={{ fontFamily: T.fD, fontSize: 12, fontWeight: 600, color: T.accentText, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            Open problem <Icon name="external" size={12} />
          </a>
        </div>

        {/* Submission rows — every member */}
        {submissions.length === 0 && !isLoading && (
          <div style={{ padding: '20px', textAlign: 'center', fontFamily: T.fB, fontSize: 13, color: T.text3 }}>
            No submissions yet.
          </div>
        )}
        {submissions.map((s: ProblemSubmission, i: number) => {
          const isMe = s.user?.id === myUserId;
          return (
            <div
              key={s.id}
              style={{
                padding: '10px 14px',
                borderTop: i ? `1px solid ${T.borderSoft}` : 'none',
                background: isMe ? 'rgba(37,214,193,0.04)' : 'transparent',
              }}
            >
              {isMobile ? (
                // Mobile: two-row card
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Avatar name={s.user?.full_name ?? '?'} size={26} />
                    <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.user?.full_name ?? 'Unknown'}
                      {isMe && <span style={{ color: T.accentText, fontWeight: 400 }}> · you</span>}
                    </span>
                    <Verdict>AC</Verdict>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {s.user?.role && <RoleBadge role={s.user.role as import('../../lib/tokens').Role} size="sm" />}
                    {s.user?.squad_name && <SquadBadge squad={s.user.squad_name} size="sm" />}
                    <span className="mono" style={{ fontSize: 10.5, color: T.text3 }}>{s.language}</span>
                    <span style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3 }}>
                      {relTime(s.submitted_at)}
                    </span>
                    <div style={{ marginLeft: 'auto' }}>
                      <Btn kind="solid" size="sm" icon="problems" onClick={() => navigate(`/submissions/${s.id}`)}>
                        View code
                      </Btn>
                    </div>
                  </div>
                </>
              ) : (
                // Desktop: single row
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={s.user?.full_name ?? '?'} size={26} />
                  <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.user?.full_name ?? 'Unknown'}
                    {isMe && <span style={{ color: T.accentText, fontWeight: 400 }}> · you</span>}
                  </span>
                  {s.user?.role && <RoleBadge role={s.user.role as import('../../lib/tokens').Role} size="sm" />}
                  {s.user?.squad_name && <SquadBadge squad={s.user.squad_name} size="sm" />}
                  <Verdict>AC</Verdict>
                  <span className="mono" style={{ fontSize: 11, color: T.text2, marginLeft: 'auto', flexShrink: 0 }}>{s.language}</span>
                  <span style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3, width: 78, textAlign: 'right', flexShrink: 0 }}>
                    {relTime(s.submitted_at)}
                  </span>
                  <Btn kind="solid" size="sm" icon="problems" onClick={() => navigate(`/submissions/${s.id}`)}>
                    View code
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Problem row ───────────────────────────────────────────────────────────
function ProblemRow({
  problem, open, onToggle, solved, myUserId, onSubmit,
}: {
  problem: Problem; open: boolean; onToggle: () => void; solved: boolean; myUserId: string;
  onSubmit: (p: Problem) => void;
}) {
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  return (
    <div style={{ borderTop: `1px solid ${T.borderSoft}`, background: open ? 'rgba(37,214,193,0.03)' : 'transparent' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center',
          gap: isMobile ? 8 : 14,
          padding: isMobile ? '10px 12px' : '13px 18px',
          cursor: 'pointer',
        }}
      >
        {/* Solved status */}