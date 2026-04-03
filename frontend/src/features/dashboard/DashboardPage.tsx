import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { FlameDef, FlameIcon, isStreakActive } from '../../components/ui/Avatar';
import { T } from '../../lib/tokens';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Btn } from '../../components/ui/Btn';
import { Icon } from '../../components/ui/Icon';
import { PlatformBadge, RoleBadge, SquadBadge, Verdict } from '../../components/ui/Badge';
import { AnnouncementCard } from '../../components/ui/AnnouncementCard';
import { useAuth } from '../../hooks/useAuth';
import { useAppUser } from '../../hooks/useAppUser';
import { supabase } from '../../lib/supabase';
import { StatCardSk, TableRowSk, CardRowSk } from '../../components/ui/Skeleton';

// ── Data hooks ────────────────────────────────────────────────────────────
function useRecentSubmissions(userId: string | undefined) {
  return useQuery({
    queryKey: ['submissions', 'recent', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('submissions')
        .select('id, submitted_at, language, source, problem:problems(name, platform)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

function useRecentAnnouncements() {
  return useQuery({
    queryKey: ['announcements', 'dashboard-preview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, body, created_at, squad_id')
        .is('squad_id', null)          // global only on dashboard preview
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────
function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
}

function excerpt(body: string, len = 90) {
  return body.length > len ? body.slice(0, len).trimEnd() + '…' : body;
}

function SectionHead({ children, action }: { children: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontFamily: T.fD, fontSize: 15.5, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>
        {children}
      </h2>
      {action}
    </div>
  );
}

function QuickLink({ icon, label, sub, color, to }: { icon: string; label: string; sub: string; color?: string; to: string }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 12,
        padding: '15px 16px', background: T.surface2, border: `1px solid ${T.border}`,
        borderRadius: 12, cursor: 'pointer',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center',
        background: `${color ?? T.accent}1c`, color: color ?? T.accent,
      }}>
        <Icon name={icon} size={19} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.fD, fontSize: 14, fontWeight: 600, color: T.text }}>{label}</div>
        <div style={{ fontFamily: T.fB, fontSize: 11.5, color: T.text3 }}>{sub}</div>
      </div>
      <Icon name="arrow" size={16} style={{ color: T.text3 }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const appUser  = useAppUser();
  const navigate = useNavigate();

  const { data: submissions = [] } = useRecentSubmissions(user?.id);
  const { data: announcements = [] } = useRecentAnnouncements();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.tablet;

  if (appUser.isLoading) {
    return (
      <AppShell title="Dashboard" crumbs="Home" userId="" role="COMMUNITY" userName="" squadName={null}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(3,minmax(0,1fr))', gap: 14, marginBottom: 24 }}>
            <StatCardSk /><StatCardSk /><StatCardSk />
          </div>