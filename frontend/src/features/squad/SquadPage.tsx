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
        <Icon name="chevron" size={13} style={{ color: T.text3, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }} />
        <span style={{ fontFamily: T.fD, fontSize: isMobile ? 13 : 13.5, fontWeight: 500, color: T.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</span>
        {complete && <Verdict>Complete</Verdict>}
        {total > 0 && <Progress done={solved} total={total} w={isMobile ? 60 : 90} color={complete ? T.gain : T.accent} />}
        {isLead && <Icon name="settings" size={13} style={{ color: T.text3, flexShrink: 0 }} />}
      </div>

      {open && (
        <div style={{ padding: isMobile ? '0 10px 12px 30px' : '0 14px 14px 50px' }}>
          {topic.problems.length === 0 && !addingProblem ? (
            <div style={{ padding: 14, textAlign: 'center', fontFamily: T.fB, fontSize: 12.5, color: T.text3, background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 10 }}>
              {isLead
                ? <span style={{ color: T.accentText, cursor: 'pointer' }} onClick={() => setAddingProblem(true)}>+ Add the first problem to this topic</span>
                : 'No problems added yet.'}
            </div>
          ) : (
            <ProblemList showSearch={addingProblem} />
          )}
        </div>
      )}
    </div>
  );
}

// ── Track card (expandable) ───────────────────────────────────────────────
function TrackCard({ track, isLead, squadId, isMobile, onSubmit }: {
  track: Track; isLead: boolean; squadId: string; isMobile: boolean;
  onSubmit: (p: TopicProblem) => void;
}) {
  const [openTopics, setOpenTopics]   = useState<Record<string, boolean>>({});
  const [addingTopic, setAddingTopic] = useState(false);
  const { mutateAsync: createTopic }  = useCreateTopic(squadId);

  const solvedTotal  = track.topics.reduce((a, t) => a + t.problems.filter((p) => p.solved).length, 0);
  const problemTotal = track.topics.reduce((a, t) => a + t.problems.length, 0);

  async function handleAddTopic(title: string) {
    await createTopic({ trackId: track.id, title });
    setAddingTopic(false);
  }

  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      {/* Track header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, padding: isMobile ? '12px 14px' : '15px 18px', background: T.surface3, flexWrap: 'wrap' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: T.accentGhost, color: T.accent, flexShrink: 0 }}>
          <Icon name="book" size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fD, fontSize: isMobile ? 14 : 15, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</div>
          <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginTop: 2 }}>{track.topics.length} topics</div>
        </div>
        {problemTotal > 0 && (
          <Progress done={solvedTotal} total={problemTotal} w={isMobile ? 70 : 100} color={solvedTotal > 0 ? T.accent : T.text3} />
        )}
        {isLead && (
          <Btn kind="ghost" size="sm" icon="plus" onClick={() => setAddingTopic(true)}>Topic</Btn>
        )}
      </div>

      {track.topics.map((tp) => (
        <TopicRow
          key={tp.id}
          topic={tp}
          open={!!openTopics[tp.id]}
          onToggle={() => setOpenTopics((prev) => ({ ...prev, [tp.id]: !prev[tp.id] }))}
          isLead={isLead}
          squadId={squadId}
          isMobile={isMobile}
          onSubmit={onSubmit}
        />
      ))}

      {addingTopic && (
        <div style={{ padding: '6px 18px 12px', borderTop: `1px solid ${T.borderSoft}` }}>
          <InlineAdd
            placeholder="Topic name…"
            onAdd={handleAddTopic}
            onCancel={() => setAddingTopic(false)}
          />
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function SquadPage() {
  const appUser  = useAppUser();
  const navigate = useNavigate();
  const w        = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  const [addingTrack, setAddingTrack]     = useState(false);
  const [submitFor, setSubmitFor]         = useState<TopicProblem | null>(null);

  const squadId = appUser.squadId;
  const isLead  = appUser.role === 'SQUAD_LEAD';

  const { data: tracks = [],  isLoading: tracksLoading } = useSquadCurriculum(squadId, appUser.id);
  const { data: roster = [],  isLoading: rosterLoading } = useSquadRoster(squadId);
  const { mutateAsync: createTrack } = useCreateTrack(squadId ?? '');

  if (appUser.isLoading) return null;

  if (!squadId) {
    return (
      <AppShell title="My Squad" userId={appUser.id} role={appUser.role} userName={appUser.fullName} squadName={appUser.squadName}>
        <div style={{ textAlign: 'center', padding: 48, fontFamily: T.fB, fontSize: 15, color: T.text3 }}>
          You are not assigned to a squad yet. Contact an admin.
        </div>
      </AppShell>
    );
  }

  const totalSolves = roster.reduce((a, m) => a + m.problem_count, 0);
  const avgProgress = tracks.length === 0 ? 0 : (() => {
    const totals = tracks.map((tr) => {
      const done = tr.topics.reduce((a, t) => a + t.problems.filter((p) => p.solved).length, 0);
      const all  = tr.topics.reduce((a, t) => a + t.problems.length, 0);
      return all ? done / all : 0;
    });
    return Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 100);
  })();

  async function handleAddTrack(title: string) {
    await createTrack(title);
    setAddingTrack(false);
  }

  // ── Roster sidebar ─────────────────────────────────────────────────────
  const RosterSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontFamily: T.fD, fontWeight: 600, fontSize: 13.5, color: T.text }}>{appUser.squadName}</span>
          <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginLeft: 'auto' }}>{roster.length} members</span>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 28 : 20 }}>
          <div>
            <div className="disp" style={{ fontSize: 24, fontWeight: 600, color: T.text }}>{avgProgress}%</div>
            <div style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3 }}>track avg</div>
          </div>
          <div>
            <div className="disp" style={{ fontSize: 24, fontWeight: 600, color: T.text }}>{totalSolves.toLocaleString()}</div>
            <div style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3 }}>squad solves</div>
          </div>
        </div>
      </Card>

      <div>
        <Kicker style={{ marginBottom: 11 }}>Members</Kicker>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {rosterLoading ? (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: T.fB, fontSize: 13, color: T.text3 }}>Loading…</div>
          ) : (
            roster.map((m, i) => {
              const isMe = m.id === appUser.id;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/profile/${m.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none', background: isMe ? 'rgba(37,214,193,0.04)' : 'transparent', cursor: 'pointer', transition: 'background .12s' }}
                  onMouseEnter={(e) => { if (!isMe) e.currentTarget.style.background = T.hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isMe ? 'rgba(37,214,193,0.04)' : 'transparent'; }}
                >
                  <Avatar name={m.full_name} size={28} ring={isMe} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.full_name.split(' ')[0]} {(m.full_name.split(' ')[1] ?? '')[0]}.
                    </div>
                    {m.role === 'SQUAD_LEAD' && (
                      <div style={{ fontFamily: T.fM, fontSize: 9.5, color: T.accent }}>LEAD</div>
                    )}
                  </div>
                  <span className="mono" style={{ fontSize: 11.5, color: T.text2 }}>{m.problem_count}</span>
                  <Icon name="chevron" size={12} style={{ color: T.text3 }} />
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );

  return (
    <>
      <AppShell
        title={appUser.squadName ?? 'My Squad'}
        crumbs="Hub / My Squad"
        userId={appUser.id}
        role={appUser.role}
        userName={appUser.fullName}
        squadName={appUser.squadName}
        scroll
        headerRight={isLead
          ? <Btn kind="accentGhost" size="sm" icon="plus" onClick={() => setAddingTrack(true)}>New track</Btn>
          : undefined
        }
      >
        <div style={{
          maxWidth: 1120, margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
          gap: isMobile ? 20 : 24,
        }}>

          {/* Curriculum */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontFamily: T.fD, fontSize: 17, fontWeight: 600, color: T.text }}>Curriculum</h2>
              <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>Track → Topic → Problem</span>
              {isLead && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fM, fontSize: 10.5, color: T.accentText, background: T.accentGhost, border: `1px solid ${T.accentLine}`, borderRadius: 7, padding: '4px 9px' }}>
                  <Icon name="settings" size={12} />Lead editing
                </span>
              )}
            </div>

            {tracksLoading && [1,2].map((i) => <TrackSk key={i} />)}

            {!tracksLoading && tracks.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center', background: T.surface2, border: `1px dashed ${T.border}`, borderRadius: 14 }}>
                <div style={{ fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>No tracks yet</div>
                {isLead
                  ? <Btn kind="accentGhost" icon="plus" onClick={() => setAddingTrack(true)}>Create the first track</Btn>
                  : <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text3 }}>Your squad lead hasn't set up the curriculum yet.</div>}
              </div>
            )}

            {addingTrack && (
              <div style={{ marginBottom: 14, padding: '12px 18px', background: T.surface2, border: `1px solid ${T.accentLine}`, borderRadius: 12 }}>
                <InlineAdd
                  placeholder="Track name…"
                  onAdd={handleAddTrack}
                  onCancel={() => setAddingTrack(false)}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tracks.map((tr) => (
                <TrackCard
                  key={tr.id}
                  track={tr}
                  isLead={isLead}
                  squadId={squadId}
                  isMobile={isMobile}
                  onSubmit={(p) => setSubmitFor(p)}
                />
              ))}
            </div>
          </div>

          {/* Roster — below curriculum on mobile */}
          {RosterSection}
        </div>
      </AppShell>

      {submitFor && (
        <LogSolveModal
          prefill={{ url: submitFor.external_link, name: submitFor.name, platform: submitFor.platform as Platform }}
          onClose={() => setSubmitFor(null)}
        />
      )}
    </>
  );
}
