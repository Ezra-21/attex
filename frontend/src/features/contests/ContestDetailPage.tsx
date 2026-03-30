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
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: T.fD, fontSize: 13.5, fontWeight: 500, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.user_name}
                  {isMe && <span style={{ color: T.accentText }}> · you</span>}
                </div>
                {s.squad_name && (
                  <div style={{ marginTop: 2 }}>
                    <SquadBadge squad={s.squad_name} size="sm" />
                  </div>
                )}
              </div>
            </div>
            {cells.map((c, j) => (
              <span key={j} style={{ width: 30, display: 'grid', placeItems: 'center' }}>
                <ProblemCell state={c} />
              </span>
            ))}
            <span className="mono" style={{ width: 50, textAlign: 'right', fontSize: 12.5, fontWeight: 600, color: T.text }}>
              {s.problems_solved}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

// ── Upsolve tab ───────────────────────────────────────────────────────────
function UpsolveTab({ myRow, labels }: { myRow: StandingRow | undefined; labels: string[] }) {
  if (!myRow) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
        You didn't participate in this contest.
      </div>
    );
  }

  const solved    = myRow.problems_solved;
  const upsolved  = myRow.upsolved_count;
  const remaining = labels.slice(solved + upsolved);
  const cleared   = labels.slice(0, solved);

  return (
    <div>
      <div style={{ fontFamily: T.fB, fontSize: 13.5, color: T.text2, marginBottom: 14 }}>
        You solved <strong style={{ color: T.text }}>{solved} of {labels.length}</strong>.
        {remaining.length > 0 && ' These problems are still open — upsolving keeps your streak honest.'}
      </div>

      {remaining.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(69,212,131,0.06)', border: '1px solid rgba(69,212,131,0.3)', borderRadius: 12, fontFamily: T.fB, fontSize: 14, color: T.gain }}>
          All problems cleared.
        </div>
      )}

      {remaining.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>
          {remaining.map((letter) => (
            <UpsolveCard key={letter} letter={letter} name={`Problem ${letter}`} />
          ))}
        </div>
      )}

      {cleared.length > 0 && (
        <div>
          <div style={{ fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3, marginBottom: 10 }}>
            Already cleared
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {cleared.map((letter) => (
              <ClearedProblem key={letter} letter={letter} name={`Problem ${letter}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ContestDetailPage() {
  const { id: contestId } = useParams<{ id: string }>();
  const appUser = useAppUser();
  const [view, setView] = useState<'standings' | 'upsolve'>('standings');

  const { data: contest, isLoading } = useContestDetail(contestId);

  if (appUser.isLoading) return null;

  const myRow = contest?.standings.find((s) => s.user_id === appUser.id);

  return (
    <AppShell
      title={contest?.name ?? 'Contest'}
      crumbs={`Contests / ${contest?.external_id ? `#${contest.external_id}` : '…'}`}
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      scroll
      headerRight={
        contest && (
          <Btn
            kind="ghost"
            size="sm"
            iconR="external"
            onClick={() => window.open(`https://codeforces.com/contest/${contest.external_id}`, '_blank')}
          >
            View on Codeforces
          </Btn>
        )
      }
    >
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'fa-spin 0.7s linear infinite' }} />
        </div>
      )}

      {!isLoading && !contest && (
        <div style={{ textAlign: 'center', padding: 48, fontFamily: T.fB, fontSize: 15, color: T.text3 }}>
          Contest not found.
        </div>
      )}

      {contest && (
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {/* Meta stats */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
            <StatCard label="Held" value={formatDate(contest.held_at)} sub={`CF #${contest.external_id}`} accent={T.accent} icon="clock" />
            <StatCard label="Participants" value={contest.standings.length} sub="matched to portal users" accent={T.ac} icon="profile" />
            <StatCard
              label="Your rank"
              value={myRow ? `#${myRow.rank}` : '—'}
              sub={myRow ? `${myRow.problems_solved} solved` : 'not participated'}
              accent={T.cf}
              icon="trophy"
            />
            <StatCard label="Synced" value={relTime(contest.synced_at)} sub="from Codeforces" accent={T.text2} icon="bolt" />
          </div>

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4, background: T.surface2, padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
              {([['standings', 'Full standings'], ['upsolve', 'My upsolve queue']] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  style={{
                    padding: '8px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: T.fD, fontSize: 12.5, fontWeight: 600,
                    color: view === k ? '#04201d' : T.text2,
                    background: view === k ? T.accent : 'transparent',
                  }}
                >{l}</button>
              ))}
            </div>

            {view === 'standings' && contest.standings.length > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Legend color={T.gain}     label="solved" />
                <Legend color={T.accentText} label="upsolved" />
                <Legend color={T.warn}     label="needs upsolve" pulse />
              </div>
            )}
          </div>

          {view === 'standings' && (
            <StandingsTable
              rows={contest.standings}
              labels={contest.problem_labels}
              myUserId={appUser.id}
            />
          )}

          {view === 'upsolve' && (
            <UpsolveTab myRow={myRow} labels={contest.problem_labels} />
          )}
        </div>
      )}
    </AppShell>
  );
}
