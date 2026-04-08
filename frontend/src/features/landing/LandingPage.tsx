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