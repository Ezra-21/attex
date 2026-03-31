import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { SquadBadge } from '../../components/ui/Badge';
import { useAppUser } from '../../hooks/useAppUser';
import { useAuth } from '../../hooks/useAuth';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { useContests, useMyContestStats, useSyncContest } from './useContestData';
import { StatCardSk, CardRowSk } from '../../components/ui/Skeleton';
import type { Contest } from './useContestData';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ContestCard({ c }: { c: Contest }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/contests/${c.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 18, padding: '16px 20px',
        background: T.surface2, border: `1px solid ${T.border}`,
        borderRadius: 13, cursor: 'pointer',
        transition: 'border-color .15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.accentLine)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = T.border)}
    >
      {/* Icon */}
      <div style={{
        width: 46, height: 46, borderRadius: 11, display: 'grid', placeItems: 'center',
        background: c.squad_name ? 'rgba(167,139,250,0.12)' : T.accentGhost,
        color: c.squad_name ? T.ac : T.accent, flexShrink: 0,
      }}>
        <Icon name="trophy" size={22} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: T.fD, fontSize: 15.5, fontWeight: 600, color: T.text }}>
            {c.name}
          </span>
          {c.squad_name && <SquadBadge squad={c.squad_name} size="sm" />}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 5, fontFamily: T.fM, fontSize: 11.5, color: T.text3, flexWrap: 'wrap' }}>
          <span>
            <Icon name="clock" size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            {formatDate(c.held_at)}
          </span>
          <span>CF #{c.external_id}</span>
          <span>synced {relTime(c.synced_at)}</span>
        </div>
      </div>

      <Icon name="chevron" size={18} style={{ color: T.text3, flexShrink: 0 }} />
    </div>
  );
}

// ── Sync modal ────────────────────────────────────────────────────────────
function SyncModal({ squadId, onClose }: { squadId: string | null; onClose: () => void }) {
  const [cfId, setCfId] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { mutateAsync, isPending } = useSyncContest(squadId);

  async function handleSync() {
    if (!cfId.trim()) return;
    setError(''); setResult(null);
    try {
      const res = await mutateAsync(cfId.trim());
      const d = res.data as { matched_users?: number; standings_saved?: number };
      setResult(`Synced — ${d.matched_users ?? 0} matched, ${d.standings_saved ?? 0} standings saved.`);
    } catch {
      setError('Sync failed — check the contest ID and try again.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: T.fD, fontSize: 17, fontWeight: 600, color: T.text, margin: 0 }}>Sync CF contest</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}>
            <Icon name="ban" size={17} />
          </button>
        </div>

        <div style={{ marginBottom: 7, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>Contest ID</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', marginBottom: 8 }}>
          <Icon name="contests" size={16} style={{ color: T.text3 }} />
          <input
            value={cfId}
            onChange={(e) => setCfId(e.target.value)}
            placeholder="e.g. 2050"
            className="mono"
            style={{ fontFamily: T.fM, fontSize: 13.5, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
          />
        </div>
        <div style={{ fontFamily: T.fB, fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.5 }}>
          Maps CF handles → portal users, records ranks and per-problem solves. Unmatched handles are skipped.
        </div>

        {error && (
          <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
            {error}
          </div>
        )}
        {result && (
          <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(69,212,131,0.10)', border: '1px solid rgba(69,212,131,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.gain }}>
            {result}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="bolt" disabled={isPending || !cfId.trim()} onClick={handleSync}>
            {isPending ? 'Fetching…' : 'Fetch standings'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ContestsPage() {
  const { user } = useAuth();
  const appUser  = useAppUser();
  const [filter, setFilter]     = useState<'all' | 'squad' | 'global'>('all');
  const [showSync, setShowSync] = useState(false);

  const { data: contests = [], isLoading } = useContests();
  const { data: myStats } = useMyContestStats(user?.id);

  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  if (appUser.isLoading) {
    return (
      <AppShell title="Contests" crumbs="Hub / Contests" userId="" role="COMMUNITY" userName="" squadName={null}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
          <StatCardSk /><StatCardSk /><StatCardSk />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map((i) => <CardRowSk key={i} />)}
        </div>
      </AppShell>
    );
  }

  const canSync = appUser.role === 'SQUAD_LEAD' || appUser.role === 'ADMIN' || appUser.role === 'SUPER_ADMIN';

  const filtered = contests.filter((c) => {
    if (filter === 'squad')  return !!c.squad_name;
    if (filter === 'global') return !c.squad_name;
    return true;
  });

  return (
    <>
      <AppShell
        title="Contests"
        crumbs="Hub / Contests"
        userId={appUser.id}
        role={appUser.role}
        userName={appUser.fullName}
        squadName={appUser.squadName}
        headerRight={
          canSync
            ? <Btn kind="accentGhost" size="sm" icon="plus" onClick={() => setShowSync(true)}>Sync CF contest</Btn>
            : undefined
        }
      >
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
          <StatCard label="Contests run" value={contests.length} sub="all squads" accent={T.accent} icon="trophy" />
          <StatCard
            label="Your best rank"
            value={myStats?.bestRank != null ? `#${myStats.bestRank}` : '—'}
            sub="across all contests"
            accent={T.ac}
            icon="contests"
          />
          <StatCard
            label="Awaiting upsolve"
            value={myStats?.awaitingUpsolve ?? 0}
            sub="contests with unsolved problems"
            accent={T.warn}
            icon="bolt"
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0, fontFamily: T.fD, fontSize: 16, fontWeight: 600, color: T.text }}>Synced contests</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'squad', 'global'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 12px', borderRadius: 8, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  color: filter === f ? '#04201d' : T.text2,
                  background: filter === f ? T.accent : T.surface2,
                  border: `1px solid ${filter === f ? T.accent : T.border}`,
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading && [1,2,3].map((i) => <CardRowSk key={i} />)}
        {!isLoading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
            No contests synced yet.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((c) => <ContestCard key={c.id} c={c} />)}
        </div>
      </AppShell>

      {showSync && <SyncModal squadId={appUser.squadId} onClose={() => setShowSync(false)} />}
    </>
  );
}
