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