import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card, Kicker } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge, Verdict } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { TrackSk } from '../../components/ui/Skeleton';
import { useProblems } from '../problems/useProblemData';
import { LogSolveModal } from '../problems/LogSolveModal';
import type { Platform } from '../../lib/tokens';
import {
  useSquadCurriculum, useSquadRoster, useCreateTrack, useCreateTopic, useAssignProblem,
  type Track, type Topic, type TopicProblem,
} from './useSquadData';

// ── Progress bar ─────────────────────────────────────────────────────────
function Progress({ done, total, w = 100, color = T.accent }: { done: number; total: number; w?: number; color?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: w, height: 5, borderRadius: 4, background: T.surface3, overflow: 'hidden', flexShrink: 0 }}>
        <span style={{ display: 'block', width: `${pct}%`, height: '100%', background: color }} />
      </span>
      <span className="mono" style={{ fontSize: 10.5, color: T.text2, whiteSpace: 'nowrap' }}>{done}/{total}</span>
    </div>
  );
}

// ── Inline text input for quick-add ──────────────────────────────────────
function InlineAdd({ placeholder, onAdd, onCancel }: { placeholder: string; onAdd: (v: string) => Promise<void>; onCancel: () => void }) {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);

  async function commit() {
    if (!val.trim()) return;
    setBusy(true);
    await onAdd(val.trim());
    setBusy(false);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0' }}>
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') onCancel(); }}
        placeholder={placeholder}
        style={{ flex: 1, background: T.surface2, border: `1px solid ${T.accentLine}`, borderRadius: 8, padding: '8px 12px', fontFamily: T.fB, fontSize: 13.5, color: T.text, outline: 'none' }}
      />
      <Btn kind="primary" size="sm" disabled={busy || !val.trim()} onClick={commit}>{busy ? '…' : 'Add'}</Btn>
      <Btn kind="ghost" size="sm" onClick={onCancel}>Cancel</Btn>
    </div>
  );
}

// ── Problem search dropdown ───────────────────────────────────────────────
function ProblemSearchDropdown({
  topicId, squadId, onDone,
}: { topicId: string; squadId: string; onDone: () => void }) {
  const [query, setQuery]           = useState('');
  const [debounced, setDebounced]   = useState('');
  const [busy, setBusy]             = useState(false);
  const [err, setErr]               = useState('');
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { mutateAsync: assign }     = useAssignProblem(squadId);
  const { data }                    = useProblems({ search: debounced, pageSize: 8 });
  const results                     = data?.problems ?? [];

  function handleInput(v: string) {
    setQuery(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(v), 250);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function pick(problemId: string) {
    setBusy(true); setErr('');
    try {
      await assign({ topicId, problemId });
      onDone();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setErr(msg ?? 'Failed to assign — try again.');
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: '8px 13px 12px', borderTop: `1px solid ${T.borderSoft}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: T.surface2, border: `1px solid ${T.accentLine}`, borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
        <Icon name="search" size={14} style={{ color: T.text3 }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onDone()}
          placeholder="Search problems by name or ID…"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: T.fB, fontSize: 13, color: T.text }}
        />
        <button onClick={onDone} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, display: 'grid', placeItems: 'center' }}>
          <Icon name="ban" size={13} />
        </button>
      </div>

      {err && <div style={{ fontFamily: T.fB, fontSize: 12, color: T.loss, marginBottom: 6 }}>{err}</div>}

      {debounced.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, overflow: 'hidden' }}>
          {results.length === 0 ? (
            <div style={{ padding: '12px 14px', fontFamily: T.fB, fontSize: 13, color: T.text3 }}>No problems found.</div>
          ) : results.map((p, i) => (
            <button
              key={p.id}
              disabled={busy}
              onClick={() => pick(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '9px 14px', background: 'transparent', border: 'none',
                borderTop: i ? `1px solid ${T.borderSoft}` : 'none', cursor: busy ? 'wait' : 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.hover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <PlatformBadge p={p.platform} size="sm" />
              <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              <span className="mono" style={{ fontSize: 10.5, color: T.text3 }}>{p.external_id}</span>
              <Icon name="plus" size={13} style={{ color: T.accentText, flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Topic row (expandable) ────────────────────────────────────────────────
function TopicRow({ topic, open, onToggle, isLead, squadId, isMobile, onSubmit }: {
  topic: Topic; open: boolean; onToggle: () => void; isLead: boolean; squadId: string;
  isMobile: boolean; onSubmit: (p: TopicProblem) => void;
}) {
  const [addingProblem, setAddingProblem] = useState(false);
  const solved  = topic.problems.filter((p) => p.solved).length;
  const total   = topic.problems.length;
  const complete = total > 0 && solved === total;

  function ProblemList({ showSearch }: { showSearch: boolean }) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {topic.problems.map((p, i) => (
          <div key={p.problem_id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 11, padding: isMobile ? '10px 11px' : '9px 13px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
            {p.solved
              ? <span style={{ width: 17, height: 17, borderRadius: 5, background: 'rgba(69,212,131,0.15)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="check" size={12} style={{ color: T.gain }} /></span>
              : <span style={{ width: 15, height: 15, borderRadius: 5, border: `1.5px solid ${T.border}`, flexShrink: 0 }} />}
            <PlatformBadge p={p.platform as Platform} size="sm" />
            {/* Problem name → external link */}
            <a
              href={p.external_link}
              target="_blank"
              rel="noreferrer"
              style={{ fontFamily: T.fD, fontSize: isMobile ? 12.5 : 13, fontWeight: 500, color: p.solved ? T.text2 : T.text, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.textDecoration = 'underline')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.textDecoration = 'none')}
            >
              {p.name}
            </a>
            {/* Submit button for unsolved */}
            {!p.solved && (
              <button
                onClick={() => onSubmit(p)}
                title="Log a solve"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: isMobile ? '4px 8px' : '4px 9px', borderRadius: 7, background: T.accentGhost, border: `1px solid ${T.accentLine}`, color: T.accentText, fontFamily: T.fD, fontSize: isMobile ? 11 : 11.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                <Icon name="plus" size={11} />
                {!isMobile && 'Submit'}
              </button>
            )}
            {/* Editorial link */}
            <Link
              to={`/problems/${p.problem_id}/editorials`}
              title="View editorials"
              style={{ display: 'grid', placeItems: 'center', color: T.text3, flexShrink: 0 }}
            >
              <Icon name="book" size={14} style={{ color: T.text3 }} />
            </Link>
          </div>
        ))}
        {isLead && !showSearch && (
          <div style={{ padding: '9px 13px', borderTop: `1px solid ${T.borderSoft}` }}>
            <span
              onClick={(e) => { e.stopPropagation(); setAddingProblem(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fD, fontSize: 12, color: T.accentText, cursor: 'pointer' }}
            >
              <Icon name="plus" size={13} />Add problem
            </span>
          </div>
        )}
        {isLead && showSearch && (
          <ProblemSearchDropdown
            topicId={topic.id}
            squadId={squadId}
            onDone={() => setAddingProblem(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ borderTop: `1px solid ${T.borderSoft}` }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isMobile ? '10px 12px 10px 22px' : '11px 14px 11px 30px', cursor: 'pointer' }}
      >