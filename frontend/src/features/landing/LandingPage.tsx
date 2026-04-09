import { useNavigate, Link } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { LandingNavbar } from '../../components/layout/LandingNavbar';
import { Logo } from '../../components/ui/Logo';
import { Btn } from '../../components/ui/Btn';
import { Kicker } from '../../components/ui/Card';
import { useAuth } from '../../hooks/useAuth';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';
import { useVerse, usePublicAnnouncements, usePublicStats } from './useLandingData';

// ── Starfield ─────────────────────────────────────────────────────────────
function Stars() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    x: (i * 97) % 100,
    y: (i * 53) % 100,
    s: (i % 3) + 1,
    o: 0.12 + (i % 4) * 0.06,
  }));
  return (
    <svg
      width="100%" height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      preserveAspectRatio="none"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.s * 0.8} fill={T.accent} opacity={d.o} />
      ))}
    </svg>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────
function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  return (
    <div style={{
      textAlign: 'center',
      padding: isMobile ? '48px 24px 40px' : '80px 48px 56px',
      position: 'relative',
    }}>
      <Stars />
      <div style={{ position: 'relative' }}>
        <Kicker color={T.accentText} style={{ marginBottom: 20 }}>
          Adama Science &amp; Technology University
        </Kicker>
        <h1 style={{
          margin: '0 auto', fontFamily: T.fD, fontWeight: 700,
          fontSize: 'clamp(36px, 6vw, 72px)', lineHeight: 1.05,
          letterSpacing: -2, color: T.text, maxWidth: 760,
        }}>
          Where ASTU learns to <span style={{ color: T.accent }}>solve</span>
          <span className="fa-caret" />
        </h1>
        <p style={{
          fontFamily: T.fB,
          fontSize: isMobile ? 15 : 18,
          lineHeight: 1.6, color: T.text2,
          maxWidth: 560, margin: '20px auto 0',
        }}>
          A private, invite-only competitive programming hub — track every solve,
          run internal contests, and grow through squad-led curriculum.
        </p>
        <div style={{
          display: 'flex', gap: 12, marginTop: 32, justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
        }}>
          <Btn
            kind="primary"
            size="lg"
            iconR="arrow"
            style={isMobile ? { width: '100%', maxWidth: 320 } : undefined}
            onClick={() => navigate(user ? '/dashboard' : '/login')}
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Btn>
          <Btn
            kind="ghost"
            size="lg"
            style={isMobile ? { width: '100%', maxWidth: 320 } : undefined}
            onClick={() => navigate('/announcements')}
          >
            View Announcements
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Verse band ────────────────────────────────────────────────────────────
function VerseBand() {
  const { data: verse } = useVerse();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  return (
    <div style={{
      borderTop: `1px solid ${T.borderSoft}`, borderBottom: `1px solid ${T.borderSoft}`,
      background: 'radial-gradient(120% 140% at 50% 0%, rgba(37,214,193,0.05), transparent 60%)',
      padding: isMobile ? '36px 24px' : '58px 48px',
      textAlign: 'center', position: 'relative',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ width: 28, height: 1, background: T.accentLine }} />
        <span style={{ fontFamily: T.fM, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.accentText }}>
          Verse of the day
        </span>
        <span style={{ width: 28, height: 1, background: T.accentLine }} />
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500,
        fontSize: 'clamp(17px, 3vw, 34px)', lineHeight: 1.5, color: T.text,
        maxWidth: 860, margin: '0 auto', letterSpacing: -0.3,
      }}>
        "{verse?.text}"
      </div>
      <div style={{
        fontFamily: T.fD, fontSize: isMobile ? 13 : 15, fontWeight: 600,
        color: T.accentText, marginTop: 20, letterSpacing: 0.5,
      }}>
        {verse?.reference}
      </div>
    </div>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────
function StatsStrip() {
  const { data: stats } = usePublicStats();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  const items = [
    { value: stats?.total_members?.toLocaleString() ?? '—',         label: 'Members' },
    { value: stats?.total_problems_solved?.toLocaleString() ?? '—', label: 'Problems solved' },
    { value: stats?.total_contests?.toString() ?? '—',              label: 'Contests run' },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
      borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`,
    }}>
      {items.map(({ value, label }, i) => (
        <div key={label} style={{
          padding: isMobile ? '22px 8px' : '34px 28px',
          textAlign: 'center',
          borderLeft: i ? `1px solid ${T.border}` : 'none',
        }}>
          <div className="disp num" style={{
            fontSize: isMobile ? 28 : 44,
            fontWeight: 600, color: T.text, letterSpacing: -1,
          }}>
            {value}
          </div>
          <div style={{
            fontFamily: T.fM,
            fontSize: isMobile ? 9 : 12,
            letterSpacing: isMobile ? 1 : 2,
            textTransform: 'uppercase', color: T.text3, marginTop: 6,
            lineHeight: 1.4,
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Announcements feed ────────────────────────────────────────────────────
function AnnFeed() {
  const { data: announcements = [] } = usePublicAnnouncements();
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  function excerpt(body: string) {
    const limit = isMobile ? 90 : 120;
    return body.length > limit ? body.slice(0, limit).trimEnd() + '…' : body;
  }

  function relTime(isoStr: string) {
    const diff = Date.now() - new Date(isoStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1)  return 'just now';
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return d === 1 ? 'yesterday' : `${d}d ago`;
  }

  return (
    <div style={{ padding: isMobile ? '36px 20px 48px' : '56px 48px 64px' }}>
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'flex-end',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : 0,
        marginBottom: 26,
      }}>
        <div>
          <Kicker style={{ marginBottom: 8 }}>From the community</Kicker>
          <h2 style={{
            margin: 0, fontFamily: T.fD,
            fontSize: isMobile ? 22 : 28,
            fontWeight: 600, color: T.text, letterSpacing: -0.5,
          }}>
            Global announcements
          </h2>
        </div>
        <Btn kind="ghost" size="sm" iconR="arrow" onClick={() => navigate('/announcements')}>
          All announcements
        </Btn>
      </div>

      {announcements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: T.fB, fontSize: 14, color: T.text3 }}>
          No announcements yet.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14,
        }}>
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} style={{
              background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: 13, padding: 18, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontFamily: T.fM, fontSize: 10, letterSpacing: 1.5, color: T.text3,
                  border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px',
                }}>GLOBAL</span>
                <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
                  {relTime(a.created_at)}
                </span>
              </div>
              <div style={{ fontFamily: T.fD, fontSize: 15.5, fontWeight: 600, color: T.text, marginBottom: 6, letterSpacing: -0.2 }}>
                {a.title}
              </div>
              <div style={{ fontFamily: T.fB, fontSize: 13, color: T.text2, lineHeight: 1.5 }}>
                {excerpt(a.body)}
              </div>
              <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, marginTop: 12 }}>
                {a.author_name ?? 'Focus ASTU'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────
function LandingFooter() {
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  return (
    <div style={{
      borderTop: `1px solid ${T.border}`,
      padding: isMobile ? '24px 20px' : '30px 48px',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 8 : 20,
    }}>
      <Logo size={17} />
      <span style={{ fontFamily: T.fB, fontSize: 12.5, color: T.text3 }}>
        Focus ASTU Competitive Programming Community · Adama, Ethiopia
      </span>
      <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to="/privacy" style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, textDecoration: 'none' }}>Privacy</Link>
        <Link to="/terms" style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, textDecoration: 'none' }}>Terms</Link>
        <span style={{ fontFamily: T.fM, fontSize: 11, color: T.text3 }}>
          Invite-only · {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 520,
        background: 'radial-gradient(80% 90% at 50% -10%, rgba(37,214,193,0.10), transparent 65%)',
        pointerEvents: 'none',
      }} />
      <LandingNavbar />
      <div style={{ position: 'relative' }}>
        <Hero />
        <VerseBand />
        <StatsStrip />
        <AnnFeed />
        <LandingFooter />
      </div>
    </div>
  );
}
