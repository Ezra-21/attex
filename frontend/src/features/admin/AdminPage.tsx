import { useState } from 'react';
import { T } from '../../lib/tokens';
import type { Role } from '../../lib/tokens';
import { ROLE_META, ROLE_ORDER } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { Avatar } from '../../components/ui/Avatar';
import { Verdict } from '../../components/ui/Badge';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { useSyncContest } from '../contests/useContestData';
import { UserRowSk, StatCardSk } from '../../components/ui/Skeleton';
import {
  useAdminUsers, useSquads, useUpdateRole, useUpdateSquad, useUpdateBan,
  useInvitations, useGenerateInvitation, useCreateSquad,
  useUpdateSquadName, useDeleteSquad,
  useSignupStatus, useToggleSignup,
  useRecentSyncs,
  type AdminUser,
} from './useAdminData';

// ── Helpers ───────────────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function hoursUntil(iso: string) {
  const h = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 3_600_000));
  return `in ${h}h`;
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;padding:0;border:none;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// ── Inline select ─────────────────────────────────────────────────────────
function Pill({ value, options, onChange, color }: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  color?: string;
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', fontFamily: T.fD, fontSize: 11.5, fontWeight: 500,
          color: color ?? T.text2, background: T.surface3,
          border: `1px solid ${T.border}`, borderRadius: 7,
          padding: '4px 26px 4px 9px', cursor: 'pointer', outline: 'none',
          maxWidth: '100%',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevronD" size={11} style={{ position: 'absolute', right: 7, pointerEvents: 'none', color: T.text3 }} />
    </div>
  );
}

// ── Ban toggle ────────────────────────────────────────────────────────────
function BanToggle({ userId, isBanned, isSelf }: { userId: string; isBanned: boolean; isSelf: boolean }) {
  const { mutate, isPending } = useUpdateBan();
  const disabled = isSelf || isPending;
  function toggle() { if (!disabled) mutate({ userId, isBanned: !isBanned }); }

  if (isBanned) {
    return (
      <span
        onClick={toggle}
        title={isSelf ? 'Cannot ban yourself' : 'Click to unban'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.fM, fontSize: 11, fontWeight: 600, color: T.loss, background: 'rgba(242,101,79,0.12)', border: '1px solid rgba(242,101,79,0.4)', borderRadius: 7, padding: '4px 9px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.45 : 1, flexShrink: 0 }}
      >
        <Icon name="ban" size={11} />Banned
      </span>
    );
  }
  return (
    <span
      onClick={toggle}
      title={isSelf ? 'Cannot ban yourself' : 'Click to ban'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fM, fontSize: 11, color: isSelf ? T.text3 : T.gain, cursor: disabled ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.45 : 1, flexShrink: 0 }}
    >
      <span style={{ width: 28, height: 16, borderRadius: 8, background: isSelf ? T.surface3 : 'rgba(69,212,131,0.25)', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', right: 2, top: 2, width: 12, height: 12, borderRadius: 6, background: isSelf ? T.text3 : T.gain }} />
      </span>
      Active
    </span>
  );
}

// ── User row ──────────────────────────────────────────────────────────────
function UserRow({ user, squads, maxRole, selfId, isMobile }: {
  user: AdminUser;
  squads: Array<{ id: string; name: string }>;
  maxRole: Role;
  selfId: string;
  isMobile: boolean;
}) {
  const { mutate: updateRole, isPending: rolePending }  = useUpdateRole();
  const { mutate: updateSquad } = useUpdateSquad();
  const [pendingRole, setPendingRole]       = useState<string | null>(null);
  const [pendingSquadId, setPendingSquadId] = useState<string>('');

  const maxTier    = ROLE_ORDER.indexOf(maxRole);
  const targetTier = ROLE_ORDER.indexOf(user.role as Role);
  const roleLocked = user.id === selfId || targetTier >= maxTier;

  const roleOptions = ROLE_ORDER
    .filter((r) => ROLE_ORDER.indexOf(r) < maxTier)
    .map((r) => ({ value: r, label: ROLE_META[r].label }));
  const squadOptions = [
    { value: '', label: '— none —' },
    ...squads.map((s) => ({ value: s.id, label: s.name })),
  ];

  function handleRoleChange(newRole: string) {
    if (newRole === 'SQUAD_MEMBER' || newRole === 'SQUAD_LEAD') {
      setPendingRole(newRole);
      setPendingSquadId(user.squad_id ?? '');
    } else {
      updateRole({ userId: user.id, role: newRole, squadId: null });
    }
  }

  function confirmRoleChange() {
    if (!pendingRole) return;
    updateRole({ userId: user.id, role: pendingRole, squadId: pendingSquadId || null }, {
      onSuccess: () => setPendingRole(null),
    });
  }

  const squadPickerBanner = pendingRole && (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 18px 10px', background: T.accentGhost, borderTop: `1px solid ${T.accentLine}` }}>
      <span style={{ fontFamily: T.fM, fontSize: 11, color: T.accentText, letterSpacing: 0.3 }}>
        Assigning as {ROLE_META[pendingRole as Role]?.label ?? pendingRole} — pick a squad:
      </span>
      <Pill value={pendingSquadId} options={squadOptions} onChange={setPendingSquadId} />
      <Btn kind="accentGhost" size="sm" disabled={rolePending} onClick={confirmRoleChange}>
        {rolePending ? 'Saving…' : 'Confirm'}
      </Btn>
      <Btn kind="ghost" size="sm" onClick={() => setPendingRole(null)}>Cancel</Btn>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{
        borderTop: `1px solid ${T.borderSoft}`,
        background: user.is_banned ? 'rgba(242,101,79,0.05)' : 'transparent',
        opacity: user.is_banned ? 0.85 : 1,
      }}>
        <div style={{ padding: '12px 14px' }}>
          {/* Row 1: avatar + name/email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar name={user.full_name} size={30} banned={user.is_banned} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: user.is_banned ? T.text2 : T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name}
              </div>
              <div className="mono" style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
            <span className="mono" style={{ fontSize: 11, color: T.text2, flexShrink: 0 }}>{user.problem_count} solved</span>
          </div>
          {/* Row 2: squad + role + ban */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Pill value={user.squad_id ?? ''} options={squadOptions} onChange={(v) => updateSquad({ userId: user.id, squadId: v || null })} />
            {roleLocked
              ? <span style={{ fontFamily: T.fD, fontSize: 11.5, fontWeight: 500, color: ROLE_META[user.role as Role]?.c ?? T.text2, background: T.surface3, border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 9px', opacity: 0.7 }}>
                  {ROLE_META[user.role as Role]?.label ?? user.role}
                </span>
              : <Pill value={user.role} options={roleOptions} onChange={handleRoleChange} color={ROLE_META[user.role as Role]?.c ?? T.text2} />
            }
            <div style={{ marginLeft: 'auto' }}>
              <BanToggle userId={user.id} isBanned={user.is_banned} isSelf={user.id === selfId} />
            </div>
          </div>
        </div>
        {squadPickerBanner}
      </div>
    );
  }

  return (
    <div style={{
      borderTop: `1px solid ${T.borderSoft}`,
      background: user.is_banned ? 'rgba(242,101,79,0.05)' : 'transparent',
      opacity: user.is_banned ? 0.85 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px' }}>
        <Avatar name={user.full_name} size={32} banned={user.is_banned} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.fD, fontSize: 13.5, fontWeight: 500, color: user.is_banned ? T.text2 : T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.full_name}
          </div>
          <div className="mono" style={{ fontSize: 10.5, color: T.text3 }}>{user.email}</div>
        </div>
        <div style={{ width: 130 }}>
          <Pill value={user.squad_id ?? ''} options={squadOptions} onChange={(v) => updateSquad({ userId: user.id, squadId: v || null })} />
        </div>
        <div style={{ width: 150 }}>
          {roleLocked
            ? <span style={{ fontFamily: T.fD, fontSize: 11.5, fontWeight: 500, color: ROLE_META[user.role as Role]?.c ?? T.text2, background: T.surface3, border: `1px solid ${T.border}`, borderRadius: 7, padding: '4px 9px', opacity: 0.7, display: 'inline-block' }}>
                {ROLE_META[user.role as Role]?.label ?? user.role}
              </span>
            : <Pill value={user.role} options={roleOptions} onChange={handleRoleChange} color={ROLE_META[user.role as Role]?.c ?? T.text2} />
          }
        </div>
        <span className="mono" style={{ width: 46, textAlign: 'right', fontSize: 11.5, color: T.text2 }}>
          {user.problem_count}
        </span>
        <div style={{ width: 110, display: 'flex', justifyContent: 'flex-end' }}>
          <BanToggle userId={user.id} isBanned={user.is_banned} isSelf={user.id === selfId} />
        </div>
      </div>
      {squadPickerBanner}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────
function UsersTab({ isSuperAdmin, selfId, isMobile }: { isSuperAdmin: boolean; selfId: string; isMobile: boolean }) {
  const { data: users = [], isLoading } = useAdminUsers();
  const { data: squads = [] }           = useSquads();
  const { data: signupOpen }            = useSignupStatus();
  const { mutate: toggleSignup, isPending: toggling } = useToggleSignup();
  const [search, setSearch] = useState('');

  const maxRole: Role = isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN';
  const filtered = users.filter((u) =>
    !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {isSuperAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <Icon name="settings" size={18} style={{ color: T.text3, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.fD, fontSize: 13.5, fontWeight: 600, color: T.text }}>Public signup</div>
            <div style={{ fontFamily: T.fB, fontSize: 12, color: T.text3 }}>
              When enabled, anyone can register without an invite link.
            </div>
          </div>
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.fM, fontSize: 11, fontWeight: 600, color: signupOpen ? T.gain : T.text3, cursor: toggling ? 'wait' : 'pointer', flexShrink: 0 }}
            onClick={() => !toggling && toggleSignup(!signupOpen)}
          >
            <span style={{ width: 36, height: 20, borderRadius: 10, background: signupOpen ? 'rgba(69,212,131,0.25)' : T.surface3, border: `1px solid ${signupOpen ? T.gain : T.border}`, position: 'relative', transition: 'background .2s' }}>
              <span style={{ position: 'absolute', top: 3, left: signupOpen ? 18 : 3, width: 14, height: 14, borderRadius: 7, background: signupOpen ? T.gain : T.text3, transition: 'left .15s' }} />
            </span>
            {signupOpen ? 'Open' : 'Invite-only'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, padding: '8px 13px', marginBottom: 14 }}>
        <Icon name="search" size={15} style={{ color: T.text3 }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…"
          style={{ fontFamily: T.fB, fontSize: 13, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
        />
      </div>

      <Card pad={0} style={{ overflow: 'hidden' }}>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 18px', background: T.surface3 }}>
            <span style={{ flex: 1, fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: T.text3 }}>Member</span>
            <span style={{ width: 130, fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: T.text3 }}>Squad</span>
            <span style={{ width: 150, fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: T.text3 }}>Role</span>
            <span style={{ width: 46, textAlign: 'right', fontFamily: T.fM, fontSize: 10.5, textTransform: 'uppercase', color: T.text3 }}>Solv</span>
            <span style={{ width: 110, textAlign: 'right', fontFamily: T.fM, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: T.text3 }}>Status</span>
          </div>
        )}
        {isLoading && [1,2,3,4,5].map((i) => <UserRowSk key={i} />)}
        {!isLoading && filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>No members found.</div>}
        {filtered.map((u) => (
          <UserRow key={u.id} user={u} squads={squads} maxRole={maxRole} selfId={selfId} isMobile={isMobile} />
        ))}
      </Card>
    </div>
  );
}

// ── Invitations tab ───────────────────────────────────────────────────────
function InvitationsTab({ isMobile }: { isMobile: boolean }) {
  const [email, setEmail]           = useState('');
  const [generated, setGenerated]   = useState<{ url: string; emailSent: boolean; emailWarning?: string } | null>(null);
  const [genError, setGenError]     = useState('');
  const [copiedIdx, setCopiedIdx]   = useState<string | null>(null);
  const { data: invitations = [] }  = useInvitations();
  const { mutateAsync, isPending }  = useGenerateInvitation();

  async function handleGenerate() {
    if (!email.trim()) return;
    setGenError(''); setGenerated(null);
    try {
      const res = await mutateAsync(email.trim());
      setGenerated({ url: res.data.invite_url, emailSent: res.data.email_sent, emailWarning: res.data.email_warning });
      setEmail('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setGenError(msg ?? 'Failed to generate invitation.');
    }
  }

  async function handleCopy(url: string, id: string) {
    const ok = await copyToClipboard(url);
    if (ok) { setCopiedIdx(id); setTimeout(() => setCopiedIdx(null), 1800); }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: 20 }}>
      {/* Generate form */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text }}>Generate invitation</h3>
        <div style={{ marginBottom: 7, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>Email to invite</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', marginBottom: 8 }}>
          <Icon name="mail" size={16} style={{ color: T.text3 }} />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="name@astu.edu.et"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            style={{ fontFamily: T.fB, fontSize: 13.5, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
          />
        </div>
        <div style={{ fontFamily: T.fB, fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.5 }}>
          A token locked to this email, valid 72 hours.
        </div>
        {genError && <div style={{ marginBottom: 12, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>{genError}</div>}
        {generated && (
          <div style={{ marginBottom: 14, padding: '12px 13px', borderRadius: 10, background: T.accentGhost, border: `1px solid ${T.accentLine}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 600, color: T.accentText, flex: 1 }}>
                Invite link generated
              </div>
              {generated.emailSent
                ? <span style={{ fontFamily: T.fM, fontSize: 10, color: T.gain }}>✓ Email sent</span>
                : <span style={{ fontFamily: T.fM, fontSize: 10, color: T.warn }}>⚠ Email not sent</span>
              }
            </div>
            {generated.emailWarning && (
              <div style={{ fontFamily: T.fB, fontSize: 11, color: T.warn, marginBottom: 6, lineHeight: 1.4 }}>
                {generated.emailWarning}
              </div>
            )}
            <div className="mono" style={{ fontSize: 11, color: T.text2, wordBreak: 'break-all', marginBottom: 8 }}>{generated.url}</div>
            <Btn kind="accentGhost" size="sm" icon="copy" full onClick={() => handleCopy(generated.url, 'new')}>
              {copiedIdx === 'new' ? 'Copied!' : 'Copy link'}
            </Btn>
          </div>
        )}
        <Btn kind="primary" full icon="plus" disabled={isPending || !email.trim()} onClick={handleGenerate}>
          {isPending ? 'Generating…' : 'Generate invite link'}
        </Btn>
      </Card>

      {/* Recent invitations */}
      <div>
        <h3 style={{ margin: '0 0 14px', fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text }}>Recent invitations</h3>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {invitations.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>No invitations yet.</div>
          )}
          {invitations.map((iv, i) => {
            const used    = !!iv.used_at;
            const expired = !used && new Date(iv.expires_at) < new Date();
            const status  = used ? 'used' : expired ? 'expired' : 'pending';

            return (
              <div key={iv.id} style={{ padding: '12px 14px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
                {/* Row 1: icon + email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Icon name="mail" size={14} style={{ color: T.text3, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.fD, fontSize: 13, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {iv.email}
                  </span>
                </div>
                {/* Row 2: token + expiry + action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: T.text3 }}>
                    {iv.token.slice(0, 4)}…{iv.token.slice(-3)}
                  </span>
                  <span style={{ fontFamily: T.fM, fontSize: 11, color: status === 'pending' ? T.warn : T.text3 }}>
                    {status === 'used' ? 'used' : status === 'expired' ? 'expired' : hoursUntil(iv.expires_at)}
                  </span>
                  <div style={{ marginLeft: 'auto' }}>
                    {status === 'pending'
                      ? <Btn kind="ghost" size="sm" icon={copiedIdx === iv.id ? 'check' : 'copy'} onClick={() => handleCopy(`${window.location.origin}/invite?token=${iv.token}`, iv.id)}>
                          {copiedIdx === iv.id ? 'Copied' : 'Copy'}
                        </Btn>
                      : <span style={{ fontFamily: T.fM, fontSize: 11, color: status === 'used' ? T.gain : T.text3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Icon name={status === 'used' ? 'check' : 'ban'} size={12} />
                          {status === 'used' ? 'Used' : 'Expired'}
                        </span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ── Squads tab ────────────────────────────────────────────────────────────
function SquadsTab({ isMobile }: { isMobile: boolean }) {
  const { data: squads = [], isLoading }     = useSquads();
  const { mutateAsync, isPending }           = useCreateSquad();
  const { mutateAsync: renameSquad }         = useUpdateSquadName();
  const { mutateAsync: deleteSquad }         = useDeleteSquad();
  const [name, setName]                      = useState('');
  const [error, setError]                    = useState('');
  const [created, setCreated]                = useState<string | null>(null);
  const [editingId, setEditingId]            = useState<string | null>(null);
  const [editingName, setEditingName]        = useState('');
  const [confirmDeleteId, setConfirmDeleteId]= useState<string | null>(null);
  const [actionError, setActionError]        = useState('');

  async function handleCreate() {
    if (!name.trim()) return;
    setError(''); setCreated(null);
    try {
      await mutateAsync(name.trim());
      setCreated(name.trim());
      setName('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to create squad.');
    }
  }

  async function handleRename(squadId: string) {
    if (!editingName.trim()) return;
    setActionError('');
    try {
      await renameSquad({ squadId, name: editingName.trim() });
      setEditingId(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setActionError(msg ?? 'Failed to rename squad.');
    }
  }

  async function handleDelete(squadId: string) {
    setActionError('');
    try {
      await deleteSquad(squadId);
      setConfirmDeleteId(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setActionError(msg ?? 'Failed to delete squad.');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: 20 }}>
      {/* Create form */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text }}>Create squad</h3>
        <div style={{ marginBottom: 7, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>Squad name</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', marginBottom: 8 }}>
          <Icon name="profile" size={16} style={{ color: T.text3 }} />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alpha Squad"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{ fontFamily: T.fB, fontSize: 13.5, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
          />
        </div>
        {error && (
          <div style={{ marginBottom: 12, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
            {error}
          </div>
        )}
        {created && (
          <div style={{ marginBottom: 12, padding: '10px 13px', borderRadius: 9, background: 'rgba(69,212,131,0.10)', border: '1px solid rgba(69,212,131,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.gain }}>
            Squad "{created}" created.
          </div>
        )}
        <Btn kind="primary" full icon="plus" disabled={isPending || !name.trim()} onClick={handleCreate}>
          {isPending ? 'Creating…' : 'Create squad'}
        </Btn>
      </Card>

      {/* Squad list */}
      <div>
        <h3 style={{ margin: '0 0 14px', fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text }}>
          All squads ({squads.length})
        </h3>
        {actionError && (
          <div style={{ marginBottom: 10, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>
            {actionError}
          </div>
        )}
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {isLoading && [1,2,3].map((i) => (
            <div key={i} style={{ padding: '14px 18px', borderTop: i > 1 ? `1px solid ${T.borderSoft}` : 'none', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: T.surface3 }} />
              <div style={{ width: 120, height: 13, borderRadius: 4, background: T.surface3 }} />
            </div>
          ))}
          {!isLoading && squads.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
              No squads yet. Create one to get started.
            </div>
          )}
          {squads.map((s, i) => (
            <div key={s.id} style={{ borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
              {/* Normal row */}
              {editingId !== s.id && confirmDeleteId !== s.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: T.accentGhost, border: `1px solid ${T.accentLine}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Icon name="profile" size={14} style={{ color: T.accent }} />
                  </div>
                  <span style={{ fontFamily: T.fD, fontSize: 13.5, fontWeight: 500, color: T.text, flex: 1 }}>{s.name}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: T.text3 }}>{s.id.slice(0, 8)}…</span>
                  <Btn kind="ghost" size="sm" onClick={() => { setEditingId(s.id); setEditingName(s.name); setActionError(''); }}>
                    Rename
                  </Btn>
                  <Btn kind="ghost" size="sm" onClick={() => { setConfirmDeleteId(s.id); setActionError(''); }}>
                    Delete
                  </Btn>
                </div>
              )}

              {/* Inline rename */}
              {editingId === s.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: T.surface2 }}>
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(s.id); if (e.key === 'Escape') setEditingId(null); }}
                    style={{ flex: 1, fontFamily: T.fB, fontSize: 13.5, color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 10px', outline: 'none' }}
                  />
                  <Btn kind="primary" size="sm" disabled={!editingName.trim()} onClick={() => handleRename(s.id)}>Save</Btn>
                  <Btn kind="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Btn>
                </div>
              )}

              {/* Delete confirmation */}
              {confirmDeleteId === s.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(242,101,79,0.06)', flexWrap: 'wrap' }}>
                  <Icon name="ban" size={14} style={{ color: T.loss, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.fB, fontSize: 12.5, color: T.text2, flex: 1 }}>
                    Delete <strong style={{ color: T.text }}>{s.name}</strong>? Members will be unassigned.
                  </span>
                  <Btn kind="ghost" size="sm" onClick={() => handleDelete(s.id)} style={{ color: T.loss, borderColor: 'rgba(242,101,79,0.4)' }}>
                    Yes, delete
                  </Btn>
                  <Btn kind="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Btn>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Contest sync tab ──────────────────────────────────────────────────────
function SyncTab({ squadId: _squadId, isMobile }: { squadId: string | null; isMobile: boolean }) {
  const [cfId, setCfId]           = useState('');
  const [result, setResult]       = useState<string | null>(null);
  const [syncError, setSyncError] = useState('');
  const { data: history = [] }    = useRecentSyncs();
  const { mutateAsync, isPending } = useSyncContest(null);

  async function handleSync() {
    if (!cfId.trim()) return;
    setSyncError(''); setResult(null);
    try {
      const res = await mutateAsync(cfId.trim());
      const d   = res.data as { matched_users?: number; standings_saved?: number };
      setResult(`Synced — ${d.matched_users ?? 0} users matched, ${d.standings_saved ?? 0} standings saved.`);
      setCfId('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSyncError(msg ?? 'Sync failed — check the contest ID and try again.');
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '340px 1fr', gap: 20 }}>
      {/* Sync form */}
      <Card>
        <h3 style={{ margin: '0 0 16px', fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text }}>Sync a Codeforces contest</h3>
        <div style={{ marginBottom: 7, fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2 }}>Contest ID</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', marginBottom: 8 }}>
          <Icon name="contests" size={16} style={{ color: T.text3 }} />
          <input
            value={cfId} onChange={(e) => setCfId(e.target.value)}
            placeholder="e.g. 2050" className="mono"
            onKeyDown={(e) => e.key === 'Enter' && handleSync()}
            style={{ fontFamily: T.fM, fontSize: 13.5, color: T.text, background: 'transparent', border: 'none', outline: 'none', flex: 1 }}
          />
        </div>
        <div style={{ fontFamily: T.fB, fontSize: 12, color: T.text3, marginBottom: 16, lineHeight: 1.5 }}>
          Maps CF handles → portal users, records ranks and per-problem solves. Unmatched handles are skipped.
        </div>
        {syncError && <div style={{ marginBottom: 12, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>{syncError}</div>}
        {result    && <div style={{ marginBottom: 12, padding: '10px 13px', borderRadius: 9, background: 'rgba(69,212,131,0.10)', border: '1px solid rgba(69,212,131,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.gain }}>{result}</div>}
        <Btn kind="primary" full icon="bolt" disabled={isPending || !cfId.trim()} onClick={handleSync}>
          {isPending ? 'Fetching…' : 'Fetch standings'}
        </Btn>
      </Card>

      {/* Sync history */}
      <div>
        <h3 style={{ margin: '0 0 14px', fontFamily: T.fD, fontSize: 15, fontWeight: 600, color: T.text }}>Recently synced</h3>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          {history.length === 0 && <div style={{ padding: '24px', textAlign: 'center', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>No contests synced yet.</div>}
          {history.map((c: Record<string, unknown>, i: number) => (
            <div key={c.id as string} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', background: T.accentGhost, color: T.accent, flexShrink: 0 }}>
                <Icon name="trophy" size={13} />
              </div>
              <span style={{ fontFamily: T.fD, fontSize: 13, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name as string}
              </span>
              {!isMobile && (
                <span className="mono" style={{ fontSize: 11, color: T.text3, flexShrink: 0 }}>#{c.external_id as string}</span>
              )}
              <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, flexShrink: 0 }}>{relTime(c.synced_at as string)}</span>
              <Verdict>synced</Verdict>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
type Tab = 'users' | 'squads' | 'invites' | 'sync';

export default function AdminPage() {
  const appUser = useAppUser();
  const [tab, setTab] = useState<Tab>('users');
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  const { data: users = [] } = useAdminUsers();

  if (appUser.isLoading) {
    return (
      <AppShell title="Admin" crumbs="Hub / Admin" userId="" role="ADMIN" userName="" squadName={null} scroll>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
          <StatCardSk /><StatCardSk /><StatCardSk />
        </div>
        <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
          {[1,2,3,4,5].map((i) => <UserRowSk key={i} />)}
        </div>
      </AppShell>
    );
  }

  const isSuperAdmin = appUser.role === 'SUPER_ADMIN';
  const totalMembers = users.length;
  const active       = users.filter((u) => !u.is_banned).length;
  const banned       = users.filter((u) => u.is_banned).length;

  const TAB_LABELS: [Tab, string][] = [
    ['users',   'Users'],
    ['squads',  'Squads'],
    ['invites', 'Invitations'],
    ['sync',    'Contest sync'],
  ];

  return (
    <AppShell
      title="Admin"
      crumbs="Hub / Admin"
      userId={appUser.id}
      role={appUser.role}
      userName={appUser.fullName}
      squadName={appUser.squadName}
      scroll
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
          <StatCard label="Total members" value={totalMembers} sub="registered accounts" accent={T.accent} icon="profile" />
          <StatCard label="Active"        value={active}       sub="non-banned"          accent={T.gain}   icon="check" />
          <StatCard label="Banned"        value={banned}       sub="write-locked"        accent={T.loss}   icon="ban" />
        </div>

        {/* Tab bar — full width on mobile */}
        <div style={{
          display: 'flex', gap: 4, background: T.surface2, padding: 4,
          borderRadius: 11, border: `1px solid ${T.border}`,
          width: isMobile ? '100%' : 'fit-content',
          marginBottom: 18,
        }}>
          {TAB_LABELS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '9px 8px' : '9px 16px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: T.fD, fontSize: isMobile ? 12 : 13, fontWeight: 600,
                color: tab === k ? '#04201d' : T.text2,
                background: tab === k ? T.accent : 'transparent',
                textAlign: 'center',
              }}
            >{l}</button>
          ))}
        </div>

        {tab === 'users'   && <UsersTab isSuperAdmin={isSuperAdmin} selfId={appUser.id} isMobile={isMobile} />}
        {tab === 'squads'  && <SquadsTab isMobile={isMobile} />}
        {tab === 'invites' && <InvitationsTab isMobile={isMobile} />}
        {tab === 'sync'    && <SyncTab squadId={appUser.squadId} isMobile={isMobile} />}
      </div>
    </AppShell>
  );
}
