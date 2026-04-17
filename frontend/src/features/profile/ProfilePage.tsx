import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { T } from '../../lib/tokens';
import type { Platform, Role } from '../../lib/tokens';
import { PLAT } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { Card, Kicker } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge, RoleBadge, SquadBadge } from '../../components/ui/Badge';
import { Avatar, FlameDef, Streak, FlameIcon, isStreakActive } from '../../components/ui/Avatar';
import { StatCard } from '../../components/ui/StatCard';
import { useAppUser } from '../../hooks/useAppUser';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import {
  useProfile, useRoleHistory, useUserSubmissions, useActivityHeatmap, useUpdateProfile,
  type UserProfile,
} from './useProfileData';
import { ProfileCardSk, StatCardSk, TableRowSk, Sk } from '../../components/ui/Skeleton';

// ── Helpers ───────────────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

function formatMonth(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Platform handle chip ─────────────────────────────────────────────────
function HandleChip({ p, handle }: { p: Platform; handle: string }) {
  const d = PLAT[p];
  const urls: Record<Platform, string> = {
    LEETCODE:   `https://leetcode.com/${handle}`,
    CODEFORCES: `https://codeforces.com/profile/${handle}`,
    ATCODER:    `https://atcoder.jp/users/${handle}`,
    HACKERRANK: `https://www.hackerrank.com/profile/${handle}`,
    GFG:        `https://auth.geeksforgeeks.org/user/${handle}`,
    OTHER:      '#',
  };
  return (
    <a
      href={urls[p]}
      target="_blank"
      rel="noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, textDecoration: 'none' }}
    >
      <span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: `${d.c}1c`, color: d.c, fontFamily: T.fM, fontSize: 11, fontWeight: 700 }}>
        {d.short}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.fM, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: T.text3 }}>{d.label}</div>
        <div className="mono" style={{ fontSize: 12.5, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{handle}</div>
      </div>
      <Icon name="external" size={13} style={{ color: T.text3 }} />
    </a>
  );
}

// ── Activity heatmap ─────────────────────────────────────────────────────
function HeatStrip({ userId }: { userId: string }) {
  const { data: counts = new Map<string, number>() } = useActivityHeatmap(userId);

  // Use EAT dates so cell keys match the EAT-grouped counts from useActivityHeatmap
  const EAT_OFFSET = 3 * 60 * 60 * 1000;
  const todayEATStr = new Date(Date.now() + EAT_OFFSET).toISOString().slice(0, 10);
  const todayBase = new Date(todayEATStr + 'T00:00:00Z');
  const cells: Array<{ date: string; level: 0 | 1 | 2 | 3 | 4 }> = [];
  for (let i = 111; i >= 0; i--) {
    const d = new Date(todayBase.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const c = counts.get(key) ?? 0;
    cells.push({ date: key, level: c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c <= 4 ? 3 : 4 });
  }
  const colors = ['#181c22', 'rgba(37,214,193,0.25)', 'rgba(37,214,193,0.45)', 'rgba(37,214,193,0.7)', '#25d6c1'];
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateRows: 'repeat(7,12px)', gridAutoFlow: 'column', gridAutoColumns: '12px', gap: 3, minWidth: 'max-content' }}>
        {cells.map((c, i) => (
          <span key={i} title={`${c.date}: ${counts.get(c.date) ?? 0} solve(s)`} style={{ width: 12, height: 12, borderRadius: 3, background: colors[c.level] }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontFamily: T.fM, fontSize: 10, color: T.text3 }}>
        Less {colors.map((c, i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />)} More
        <span style={{ marginLeft: 'auto' }}>{total} solves this period</span>
      </div>
    </div>
  );
}

// ── Edit profile modal ────────────────────────────────────────────────────
function EditModal({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const [bio, setBio]             = useState(profile.bio ?? '');
  const [telegram, setTelegram]   = useState(profile.telegram_handle ?? '');
  const [linkedin, setLinkedin]   = useState(profile.linkedin_url ?? '');
  const [lc, setLc]               = useState(profile.leetcode_handle ?? '');
  const [cf, setCf]               = useState(profile.codeforces_handle ?? '');
  const [ac, setAc]               = useState(profile.atcoder_handle ?? '');
  const [error, setError]         = useState('');
  const { mutateAsync, isPending } = useUpdateProfile();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  async function handleSave() {
    setError('');
    try {
      await mutateAsync({
        bio:               bio.trim() || undefined,
        telegram_handle:   telegram.trim().replace(/^@/, '') || undefined,
        linkedin_url:      linkedin.trim() || undefined,
        leetcode_handle:   lc.trim() || undefined,
        codeforces_handle: cf.trim() || undefined,
        atcoder_handle:    ac.trim() || undefined,
      });
      onClose();
    } catch { setError('Failed to save — try again.'); }
  }

  function ModalField({ label, value, onChange, mono, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string;
  }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: T.fD, fontSize: 12.5, fontWeight: 500, color: T.text2, marginBottom: 6 }}>{label}</div>
        <input
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 13px', outline: 'none', boxSizing: 'border-box', fontFamily: mono ? T.fM : T.fB, fontSize: 13.5, color: T.text }}
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : 520,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: isMobile ? '16px 16px 0 0' : 16,
        padding: isMobile ? '24px 20px 32px' : 28,
        zIndex: 1, maxHeight: isMobile ? '90dvh' : '90vh', overflow: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 style={{ fontFamily: T.fD, fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>Edit profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}><Icon name="ban" size={17} /></button>
        </div>
        <ModalField label="Bio" value={bio} onChange={setBio} placeholder="A short bio about yourself…" />
        <ModalField label="Telegram handle" value={telegram} onChange={setTelegram} mono placeholder="abel_t (no @)" />
        <ModalField label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/…" />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <ModalField label="Codeforces handle" value={cf} onChange={setCf} mono />
          <ModalField label="LeetCode handle"   value={lc} onChange={setLc} mono />
        </div>
        <ModalField label="AtCoder handle" value={ac} onChange={setAc} mono />
        {error && <div style={{ marginBottom: 14, padding: '10px 13px', borderRadius: 9, background: 'rgba(242,101,79,0.10)', border: '1px solid rgba(242,101,79,0.3)', fontFamily: T.fB, fontSize: 12.5, color: T.loss }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="check" disabled={isPending} onClick={handleSave}>{isPending ? 'Saving…' : 'Save changes'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const appUser = useAppUser();
  const [showEdit, setShowEdit] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  const isOwn = paramUserId === appUser.id;
  const targetId = isOwn ? appUser.id : paramUserId;

  const { data: profile, isLoading } = useProfile(targetId);
  const { data: roleHistory = [] }   = useRoleHistory(targetId);
  const { data: submissions = [] }   = useUserSubmissions(targetId);

  if (appUser.isLoading || isLoading) {
    return (
      <AppShell title="Profile" crumbs="Hub / Profile" userId="" role="COMMUNITY" userName="" squadName={null} scroll>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : '320px minmax(0,1fr)', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <ProfileCardSk />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Sk h={52} radius={10} /><Sk h={52} radius={10} /><Sk h={52} radius={10} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 14 }}><StatCardSk /><StatCardSk /></div>
            <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
              <Sk w={200} h={14} style={{ marginBottom: 16 }} />
              <Sk w="100%" h={80} radius={8} />
            </div>
            <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
              {[1,2,3,4].map((i) => <TableRowSk key={i} cols={3} />)}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) return (
    <AppShell title="Profile" userId={appUser.id} role={appUser.role} userName={appUser.fullName} squadName={appUser.squadName}>
      <div style={{ textAlign: 'center', padding: 48, fontFamily: T.fB, fontSize: 15, color: T.text3 }}>User not found.</div>
    </AppShell>
  );

  const joinYear = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const streakActive = isStreakActive(profile.last_submission_date);

  return (
    <>
      <FlameDef />
      <AppShell
        title="Profile"
        crumbs={`Hub / Profile${!isOwn ? ` / ${profile.full_name}` : ''}`}
        userId={appUser.id}
        role={appUser.role}
        userName={appUser.fullName}
        squadName={appUser.squadName}
        scroll
        headerRight={isOwn
          ? <Btn kind="ghost" size="sm" icon="settings" onClick={() => setShowEdit(true)}>Edit profile</Btn>
          : undefined
        }
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : '320px minmax(0,1fr)', gap: 22 }}>

          {/* Left — identity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
            <Card style={{ textAlign: 'center' }} pad={isMobile ? 20 : 24}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <Avatar name={profile.full_name} size={isMobile ? 72 : 84} ring={isOwn} />
              </div>
              <h2 style={{ margin: 0, fontFamily: T.fD, fontSize: isMobile ? 19 : 21, fontWeight: 600, color: T.text, letterSpacing: -0.4 }}>
                {profile.full_name}
              </h2>
              <div style={{ fontFamily: T.fM, fontSize: 12, color: T.text3, marginTop: 4 }}>
                joined {joinYear}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                <RoleBadge role={profile.role as Role} />
                {profile.squad_name && <SquadBadge squad={profile.squad_name} lead={profile.role === 'SQUAD_LEAD'} />}
              </div>
              {profile.bio && (
                <p style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, lineHeight: 1.6, margin: '18px 0 0' }}>
                  {profile.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                {profile.telegram_handle && (
                  <a href={`https://t.me/${profile.telegram_handle}`} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                    <Btn kind="solid" size="sm" full icon="announce">Telegram</Btn>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: 'none' }}>
                    <Btn kind="solid" size="sm" full icon="external">LinkedIn</Btn>
                  </a>
                )}
              </div>
            </Card>

            {/* Platform handles */}
            <div>
              <Kicker style={{ marginBottom: 11 }}>Platform handles</Kicker>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {profile.codeforces_handle && <HandleChip p="CODEFORCES" handle={profile.codeforces_handle} />}
                {profile.leetcode_handle   && <HandleChip p="LEETCODE"   handle={profile.leetcode_handle} />}
                {profile.atcoder_handle    && <HandleChip p="ATCODER"    handle={profile.atcoder_handle} />}
                {!profile.codeforces_handle && !profile.leetcode_handle && !profile.atcoder_handle && (
                  <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text3, padding: '10px 0' }}>No handles set yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right — stats + activity + submissions + history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
              <StatCard label="Problems" value={profile.problem_count} sub="unique solves" accent={T.accent} icon="check" />
              <StatCard
                label="Streak"
                value={profile.daily_streak}
                sub="days"
                accent={streakActive ? T.streak : T.text3}
                iconNode={<FlameIcon active={streakActive} size={18} />}
              />
            </div>

            {/* Activity heatmap */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontFamily: T.fD, fontSize: 15.5, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>
                  Activity · last 16 weeks
                </h2>
                <Streak days={profile.daily_streak} active={streakActive} size="sm" />
              </div>
              <HeatStrip userId={profile.id} />
            </Card>

            {/* Submissions + role history */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1.4fr) minmax(0,1fr)', gap: 20 }}>
              {/* Recent submissions */}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: '0 0 14px', fontFamily: T.fD, fontSize: 15.5, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>Recent submissions</h2>
                <Card pad={0} style={{ overflow: 'hidden' }}>
                  {submissions.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', fontFamily: T.fB, fontSize: 13, color: T.text3 }}>No submissions yet.</div>
                  ) : (
                    submissions.map((s, i) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderTop: i ? `1px solid ${T.borderSoft}` : 'none', minWidth: 0 }}>
                        <PlatformBadge p={(s.problem?.platform ?? 'OTHER') as Platform} size="sm" />
                        <span style={{ fontFamily: T.fD, fontSize: 13, fontWeight: 500, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.problem?.name ?? '—'}
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: T.text2, flexShrink: 0 }}>{s.language}</span>
                        {!isMobile && <span style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3, width: 72, textAlign: 'right', flexShrink: 0 }}>{relTime(s.submitted_at)}</span>}
                      </div>
                    ))
                  )}
                </Card>
              </div>

              {/* Role history */}
              <div style={{ minWidth: 0 }}>
                <h2 style={{ margin: '0 0 14px', fontFamily: T.fD, fontSize: 15.5, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>Role history</h2>
                <Card>
                  {roleHistory.length === 0 ? (
                    <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text3 }}>No history yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {roleHistory.map((h, i) => (
                        <div key={h.id} style={{ display: 'flex', gap: 12, paddingBottom: i < roleHistory.length - 1 ? 16 : 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ width: 10, height: 10, borderRadius: 5, background: i === 0 ? T.accent : T.border, marginTop: 4 }} />
                            {i < roleHistory.length - 1 && <span style={{ flex: 1, width: 2, background: T.border, marginTop: 4 }} />}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <RoleBadge role={h.role as Role} size="sm" />
                              {h.squad_name && <span style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3 }}>· {h.squad_name}</span>}
                            </div>
                            <div style={{ fontFamily: T.fM, fontSize: 10.5, color: T.text3, marginTop: 5 }}>
                              {formatMonth(h.assigned_at)}{i === 0 ? ' · current' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {showEdit && profile && <EditModal profile={profile} onClose={() => setShowEdit(false)} />}
    </>
  );
}
