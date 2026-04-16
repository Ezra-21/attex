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