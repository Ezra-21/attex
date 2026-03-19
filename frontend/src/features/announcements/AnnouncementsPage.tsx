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
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </div>

        {/* Body — write / preview tabs */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>Body · Markdown</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['write', 'preview'] as const).map((tab) => (
                <button key={tab} onClick={() => setBodyTab(tab)} style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontFamily: T.fD, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${bodyTab === tab ? T.accent : T.border}`,
                  background: bodyTab === tab ? T.accentGhost : 'transparent',
                  color: bodyTab === tab ? T.accentText : T.text3,
                }}>
                  {tab === 'write' ? 'Write' : 'Preview'}
                </button>
              ))}
            </div>
          </div>
          {bodyTab === 'write'
            ? <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }} />
            : <div style={{ minHeight: 120, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px' }}>
                {body.trim()
                  ? <MarkdownRenderer content={body} small />
                  : <span style={{ fontFamily: T.fB, fontSize: 13, color: T.text3 }}>Nothing to preview.</span>}
              </div>
          }
        </div>

        {error && <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="announce" disabled={isPending} onClick={handlePost}>{isPending ? 'Posting…' : 'Post'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Sub-column header ─────────────────────────────────────────────────────
function SubHead({ children, icon, color }: { children: string; icon: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: T.fM, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color }}>
      <Icon name={icon} size={14} />{children}
    </div>
  );
}

// ── Authenticated view ────────────────────────────────────────────────────
function AuthedView() {
  const appUser = useAppUser();
  const [filter, setFilter]     = useState<'all' | 'global' | 'squad'>('all');
  const [showPost, setShowPost] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  const { data: all = [] } = useAnnouncements(appUser.squadId);

  const globals = all.filter((a) => !a.squad_id);
  const squad   = all.filter((a) => !!a.squad_id);

  const canPost      = appUser.role === 'SQUAD_LEAD' || appUser.role === 'ADMIN' || appUser.role === 'SUPER_ADMIN';
  const canGlobal    = appUser.role === 'ADMIN' || appUser.role === 'SUPER_ADMIN';
  const hasSquad     = !!appUser.squadName;

  const filtered = filter === 'global' ? globals : filter === 'squad' ? squad : all;

  if (appUser.isLoading) return null;

  return (
    <>
      <AppShell
        title="Announcements"
        crumbs="Hub / Announcements"
        userId={appUser.id}
        role={appUser.role}
        userName={appUser.fullName}
        squadName={appUser.squadName}
        scroll
        headerRight={canPost
          ? <Btn kind="accentGhost" size="sm" icon="plus" onClick={() => setShowPost(true)}>
              {canGlobal ? 'Post announcement' : 'Post to squad'}
            </Btn>
          : undefined
        }
      >
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            {(['all', 'global', ...(hasSquad ? ['squad'] : [])] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                style={{ padding: '7px 12px', borderRadius: 8, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', color: filter === f ? '#04201d' : T.text2, background: filter === f ? T.accent : T.surface2, border: `1px solid ${filter === f ? T.accent : T.border}` }}
              >
                {f === 'all' ? 'All' : f === 'global' ? 'Global' : appUser.squadName ?? 'Squad'}
              </button>
            ))}
            {!isMobile && (
              <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
                {hasSquad ? 'Showing global + your squad' : 'Showing global'}
              </span>
            )}
          </div>

          {/* Two-column layout when showing all — single column on mobile */}
          {filter === 'all' && hasSquad ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SubHead icon="announce" color={T.text2}>Global</SubHead>
                {globals.length === 0 && <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text3 }}>No global announcements.</div>}
                {globals.map((a) => <AnnItem key={a.id} a={a} />)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <SubHead icon="squad" color={T.accentText}>{`${appUser.squadName ?? 'Squad'}${canPost && !canGlobal ? ' · you can post here' : ''}`}</SubHead>
                {squad.length === 0 && <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text3 }}>No squad announcements yet.</div>}
                {squad.map((a) => <AnnItem key={a.id} a={a} />)}
                {canPost && !canGlobal && (
                  <div
                    onClick={() => setShowPost(true)}
                    style={{ padding: '14px 16px', borderRadius: 12, border: `1px dashed ${T.accentLine}`, background: T.accentGhost, display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
                  >
                    <Icon name="plus" size={16} style={{ color: T.accent }} />
                    <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.accentText }}>Write a squad announcement</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Single column for filtered view */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>No announcements.</div>
              )}
              {filtered.map((a) => <AnnItem key={a.id} a={a} />)}
            </div>
          )}
        </div>
      </AppShell>

      {showPost && (
        <PostModal
          canGlobal={canGlobal}
          squadId={appUser.squadId ?? null}
          squadName={appUser.squadName}
          onClose={() => setShowPost(false)}
        />
      )}
    </>
  );
}

// ── Public view (unauthenticated) ─────────────────────────────────────────
function PublicView() {
  const navigate = useNavigate();
  const { data: announcements = [] } = usePublicAnnouncementsFull();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  return (
    <div style={{ background: T.bg, minHeight: '100vh' }}>
      <LandingNavbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '32px 20px 48px' : '48px 32px 56px' }}>
        <Kicker style={{ marginBottom: 10 }}>Public · global only</Kicker>
        <h1 style={{ margin: '0 0 10px', fontFamily: T.fD, fontSize: 34, fontWeight: 700, color: T.text, letterSpacing: -1 }}>
          Announcements
        </h1>
        <p style={{ margin: '0 0 28px', fontFamily: T.fB, fontSize: 15, color: T.text2, lineHeight: 1.6, maxWidth: 560 }}>
          Community-wide news from the Focus ASTU team.{' '}
          <span style={{ color: T.text3 }}>Squad announcements are private — sign in to see your squad's feed.</span>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {announcements.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>No announcements yet.</div>
          )}
          {announcements.map((a) => <AnnItem key={a.id} a={a} />)}
        </div>

        {/* Squad-locked notice */}
        <div style={{ marginTop: 24, padding: '16px 18px', borderRadius: 12, background: T.surface2, border: `1px dashed ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="lock" size={18} style={{ color: T.text3 }} />
          <span style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, flex: 1 }}>Squad-scoped announcements are visible after login.</span>
          <Btn kind="primary" size="sm" onClick={() => navigate('/login')}>Login</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Page entry — routes to public or authenticated view ───────────────────
export default function AnnouncementsPage() {
  const { user, loading } = useAuth();
  const appUser = useAppUser();

  if (loading) return null;

  // Authenticated + profile loaded + active → app shell view
  if (user && !appUser.isLoading && appUser.id) return <AuthedView />;

  // Everyone else (unauthenticated, or still loading profile) → public view
  return <PublicView />;
}
