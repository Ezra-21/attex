import { Link, useNavigate } from 'react-router-dom';
import { T } from '../../lib/tokens';
import { Logo } from '../ui/Logo';
import { Btn } from '../ui/Btn';
import { useAuth } from '../../hooks/useAuth';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';

export function LandingNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < BREAKPOINTS.mobile;

  return (
    <nav style={{
      display: 'flex', alignItems: 'center',
      padding: isMobile ? '14px 20px' : '20px 48px',
      gap: isMobile ? 10 : 32,
      borderBottom: `1px solid ${T.borderSoft}`, position: 'relative', zIndex: 3,
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Logo size={isMobile ? 17 : 20} />
      </Link>
      <div style={{ flex: 1 }} />
      {!isMobile && (
        <Link
          to="/announcements"
          style={{ fontFamily: T.fD, fontSize: 14, fontWeight: 500, color: T.text2, textDecoration: 'none' }}
        >
          Announcements
        </Link>
      )}
      <Btn
        kind="ghost"
        size="sm"
        iconR={isMobile ? undefined : 'arrow'}
        onClick={() => navigate(user ? '/dashboard' : '/login')}
      >
        Dashboard
      </Btn>
      {!user && (
        <Btn kind="primary" size="sm" onClick={() => navigate('/login')}>
          {isMobile ? 'Sign in' : 'Login / Sign Up'}
        </Btn>
      )}
    </nav>
  );
}
