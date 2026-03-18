import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { T } from '../../lib/tokens';
import type { Role } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { LandingNavbar } from '../../components/layout/LandingNavbar';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge, SquadBadge } from '../../components/ui/Badge';
import { Kicker } from '../../components/ui/Card';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { useAuth } from '../../hooks/useAuth';
import { useAppUser } from '../../hooks/useAppUser';
import { useSquads } from '../admin/useAdminData';
import {
  useAnnouncements, usePublicAnnouncementsFull, useCreateAnnouncement,
  type Announcement,
} from './useAnnouncementData';

// ── Helpers ───────────────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

// ── Announcement item ─────────────────────────────────────────────────────
function AnnItem({ a }: { a: Announcement }) {
  const isGlobal = !a.squad_id;
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;
  return (
    <div style={{
      background: isGlobal ? T.surface2 : 'rgba(37,214,193,0.045)',
      border: `1px solid ${isGlobal ? T.border : T.accentLine}`,
      borderRadius: 14, padding: isMobile ? '16px 16px' : '20px 22px',
      position: 'relative', overflow: 'hidden',
    }}>
      {!isGlobal && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.accent }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {isGlobal
          ? <span style={{ fontFamily: T.fM, fontSize: 10, letterSpacing: 2, color: T.text3, border: `1px solid ${T.border}`, borderRadius: 6, padding: '3px 9px' }}>GLOBAL</span>
          : <SquadBadge squad={a.squad_name} size="sm" />
        }
        <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 11, color: T.text3 }}>{relTime(a.created_at)}</span>
      </div>
      <h3 style={{ margin: '0 0 9px', fontFamily: T.fD, fontSize: 17, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>
        {a.title}
      </h3>
      <div style={{ margin: 0 }}>
        <MarkdownRenderer content={a.body} small />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.borderSoft}` }}>
        <Avatar name={a.author_name} size={26} />
        <span style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text }}>{a.author_name}</span>
        <RoleBadge role={a.author_role as Role} size="sm" />
      </div>
    </div>
  );
}

// ── Post modal ────────────────────────────────────────────────────────────
function PostModal({
  canGlobal, squadId, squadName, onClose,
}: { canGlobal: boolean; squadId: string | null; squadName: string | null; onClose: () => void }) {
  const [title, setTitle]           = useState('');
  const [body, setBody]             = useState('');
  const [scope, setScope]           = useState<'GLOBAL' | 'SQUAD'>(canGlobal ? 'GLOBAL' : 'SQUAD');
  const [selectedSquads, setSelected] = useState<string[]>([]);
  const [bodyTab, setBodyTab]       = useState<'write' | 'preview'>('write');
  const [error, setError]           = useState('');
  const { mutateAsync, isPending }  = useCreateAnnouncement();
  // Only fetch squads when admin needs the squad picker
  const { data: squads = [] } = useSquads();

  function toggleSquad(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handlePost() {
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return; }
    if (canGlobal && scope === 'SQUAD' && selectedSquads.length === 0) {
      setError('Select at least one squad.'); return;
    }
    setError('');
    try {
      if (scope === 'SQUAD' && !canGlobal && squadId) {
        // Squad lead — post to own squad
        await mutateAsync({ scope: 'SQUAD', squad_id: squadId, title: title.trim(), body: body.trim() });
      } else if (scope === 'SQUAD' && canGlobal) {
        // Admin — post to selected squads
        await mutateAsync({ scope: 'SQUAD_IDS', squad_ids: selectedSquads, title: title.trim(), body: body.trim() });
      } else {
        // Admin — global
        await mutateAsync({ scope: 'GLOBAL', title: title.trim(), body: body.trim() });
      }
      onClose();
    } catch { setError('Failed to post — try again.'); }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: T.surface2, border: `1px solid ${T.border}`,
    borderRadius: 9, padding: '10px 13px', outline: 'none',
    boxSizing: 'border-box', fontFamily: T.fB, fontSize: 13.5, color: T.text,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontFamily: T.fD, fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>Post announcement</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}><Icon name="ban" size={17} /></button>
        </div>

        {/* Scope selector — only for admins */}
        {canGlobal && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button onClick={() => setScope('GLOBAL')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${scope === 'GLOBAL' ? T.accent : T.border}`, background: scope === 'GLOBAL' ? T.accentGhost : T.surface2, color: scope === 'GLOBAL' ? T.accentText : T.text2, fontFamily: T.fD, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Global
            </button>
            <button onClick={() => setScope('SQUAD')} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1px solid ${scope === 'SQUAD' ? T.accent : T.border}`, background: scope === 'SQUAD' ? T.accentGhost : T.surface2, color: scope === 'SQUAD' ? T.accentText : T.text2, fontFamily: T.fD, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Squad(s)
            </button>
          </div>
        )}

        {/* Squad lead — show their squad as a locked chip */}
        {!canGlobal && squadName && (
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>Posting to</span>
            <SquadBadge squad={squadName} size="sm" />
          </div>
        )}

        {/* Admin squad picker */}
        {canGlobal && scope === 'SQUAD' && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2, marginBottom: 8 }}>Target squads</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {squads.map((sq) => {
                const active = selectedSquads.includes(sq.id);
                return (
                  <button key={sq.id} onClick={() => toggleSquad(sq.id)} style={{
                    padding: '5px 12px', borderRadius: 20, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${active ? T.accent : T.border}`,
                    background: active ? T.accentGhost : T.surface2,
                    color: active ? T.accentText : T.text2,
                  }}>
                    {sq.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2, marginBottom: 6 }}>Title</div>