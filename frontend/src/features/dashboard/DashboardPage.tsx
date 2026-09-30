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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20 }}>
            <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
              {[1,2,3,4,5].map((i) => <TableRowSk key={i} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <CardRowSk /><CardRowSk /><CardRowSk />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const { id: userId, role, fullName, squadName, problemCount, dailyStreak, lastSubmissionDate } = appUser;
  const streakActive = isStreakActive(lastSubmissionDate);
  const firstName = fullName.split(' ')[0] || 'there';
  const inSquad   = role === 'SQUAD_MEMBER' || role === 'SQUAD_LEAD' || role === 'ADMIN' || role === 'SUPER_ADMIN';

  return (
    <>
    <FlameDef />
    <AppShell
      title="Dashboard"
      crumbs="Home"
      userId={userId}
      role={role}
      userName={fullName}
      squadName={squadName}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 22, flexWrap: 'wrap', gap: 14,
        }}>
          <div>
            <div style={{ fontFamily: T.fB, fontSize: 13.5, color: T.text3 }}>Good day,</div>
            <h1 style={{ margin: '2px 0 0', fontFamily: T.fD, fontSize: 26, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>
              {firstName} 👋
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {inSquad && squadName && <SquadBadge squad={squadName} lead={role === 'SQUAD_LEAD'} />}
            <RoleBadge role={role} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(3,minmax(0,1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard label="Problems solved" value={problemCount} sub="+8 this week"       accent={T.accent} icon="check" />
          <StatCard label="Current streak"  value={dailyStreak}   sub="days · keep it alive" accent={streakActive ? T.streak : T.text3} iconNode={<FlameIcon active={streakActive} size={18} />} />
          {inSquad && squadName && !isMobile && (
            <StatCard label="Squad" value={squadName} accent={T.ac} icon="squad" />
          )}
        </div>

        {/* Main two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20 }}>

          {/* Recent submissions */}
          <div style={{ minWidth: 0 }}>
            <SectionHead action={
              <Btn kind="ghost" size="sm" iconR="arrow" onClick={() => navigate('/problems')}>All</Btn>
            }>
              Recent submissions
            </SectionHead>
            <Card pad={0} style={{ overflow: 'hidden' }}>
              {submissions.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: T.fB, fontSize: 13.5, color: T.text3 }}>
                  No submissions yet — solve your first problem!
                </div>
              ) : (
                submissions.map((s: Record<string, unknown>, i: number) => {
                  const problem = s.problem as { name: string; platform: string } | null;
                  return (
                    <div
                      key={s.id as string}
                      onClick={() => navigate(`/submissions/${s.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
                        padding: '12px 16px', cursor: 'pointer', minWidth: 0,
                        borderTop: i ? `1px solid ${T.borderSoft}` : 'none',
                      }}
                    >
                      <PlatformBadge p={(problem?.platform ?? 'OTHER') as import('../../lib/tokens').Platform} size="sm" />
                      <span style={{
                        fontFamily: T.fD, fontSize: 13.5, fontWeight: 500, color: T.text,
                        flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {problem?.name ?? 'Unknown problem'}
                      </span>
                      <span className="mono" style={{ fontSize: 11.5, color: T.text2, flexShrink: 0 }}>{s.language as string}</span>
                      {!isMobile && <Verdict>AC</Verdict>}
                      {!isMobile && (
                        <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, width: 78, textAlign: 'right', flexShrink: 0 }}>
                          {relTime(s.submitted_at as string)}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </Card>
          </div>

          {/* Announcement previews */}
          <div style={{ minWidth: 0 }}>
            <SectionHead action={
              <Btn kind="ghost" size="sm" iconR="arrow" onClick={() => navigate('/announcements')}>All</Btn>
            }>
              Announcements
            </SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.length === 0 ? (
                <div style={{ padding: 16, fontFamily: T.fB, fontSize: 13, color: T.text3, textAlign: 'center' }}>
                  No announcements.
                </div>
              ) : (
                announcements.map((a: Record<string, unknown>) => (
                  <AnnouncementCard
                    key={a.id as string}
                    scope="GLOBAL"
                    title={a.title as string}
                    excerpt={excerpt(a.body as string)}
                    author="Focus ASTU"
                    when={relTime(a.created_at as string)}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: 24 }}>
          <SectionHead>Jump back in</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(220px,1fr))', gap: 14 }}>
            <QuickLink icon="problems"  label="Problems"  sub="Browse & log solutions"     color={T.accent} to="/problems" />
            <QuickLink icon="contests"  label="Contests"  sub="View standings & upsolves"  color={T.warn}   to="/contests" />
            {inSquad && (
              <QuickLink icon="squad" label="My Squad" sub="Curriculum tracks" color={T.ac} to="/squad" />
            )}
          </div>
        </div>
      </div>
    </AppShell>
    </>
  );
}
