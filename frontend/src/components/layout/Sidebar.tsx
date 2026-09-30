import { Link, useLocation } from 'react-router-dom';
import { T } from '../../lib/tokens';
import type { Role } from '../../lib/tokens';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: (userId: string) => string;
  roles?: Role[];
  gated?: boolean;
}

const NAV: NavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',    icon: 'dashboard', path: () => '/dashboard' },
  { id: 'problems',      label: 'Problems',     icon: 'problems',  path: () => '/problems' },
  { id: 'editorials',    label: 'Editorials',   icon: 'book',      path: () => '/editorials' },
  { id: 'contests',      label: 'Contests',     icon: 'contests',  path: () => '/contests' },
  { id: 'squad',         label: 'My Squad',     icon: 'squad',     path: () => '/squad', roles: ['SQUAD_MEMBER', 'SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN'] },
  { id: 'users',         label: 'Members',      icon: 'profile',   path: () => '/users' },
  { id: 'announcements', label: 'Announcements',icon: 'announce',  path: () => '/announcements' },
  { id: 'profile',       label: 'Profile',      icon: 'profile',   path: (id) => `/profile/${id}` },
  { id: 'settings',      label: 'Settings',     icon: 'settings',  path: () => '/settings/extension' },
  { id: 'admin',         label: 'Admin',        icon: 'admin',     path: () => '/admin', roles: ['ADMIN', 'SUPER_ADMIN'], gated: true },
];

function navForRole(role: Role): NavItem[] {
  return NAV.filter((n) => !n.roles || n.roles.includes(role));
}

interface SidebarProps {
  userId: string;
  role: Role;
  userName: string;
  squadName?: string | null;
}

export function Sidebar({ userId, role, userName, squadName }: SidebarProps) {
  const location    = useLocation();
  const { signOut } = useAuth();
  const { sidebarCollapsed, toggleCollapsed, setSidebarOpen } = useUIStore();
  const width       = useWindowWidth();
  const isMobile    = width < BREAKPOINTS.tablet;
  const collapsed   = !isMobile && sidebarCollapsed;
  const W           = collapsed ? 64 : 236;

  const items = navForRole(role);

  function isActive(n: NavItem) {
    const p = n.path(userId);
    if (n.id === 'profile') return location.pathname.startsWith('/profile/');
    if (n.id === 'users') return location.pathname === '/users';
    return location.pathname === p || location.pathname.startsWith(p + '/');
  }

  function handleNavClick() {
    if (isMobile) setSidebarOpen(false);
  }

  return (
    <aside style={{
      width: W, flexShrink: 0, background: T.surface,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', height: '100%',
      transition: 'width .2s ease',
      overflow: 'hidden',
    }}>
      {/* Logo / collapse toggle */}
      <div style={{ padding: collapsed ? '20px 0' : '20px 18px 18px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        {!collapsed && <Logo size={19} />}
        {collapsed && (
          <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(150deg,#16323a,#0c1418)', border: `1px solid ${T.accentLine}` }}>
            <span style={{ fontFamily: T.fD, fontWeight: 700, fontSize: 16, color: T.accent }}>ƒ</span>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text3, display: 'grid', placeItems: 'center', padding: 4, borderRadius: 6 }}
          >
            <Icon name={collapsed ? 'chevron' : 'chevron'} size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .2s' }} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ padding: collapsed ? '6px 8px' : '6px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map((n) => {
          const on = isActive(n);
          return (
            <Link
              key={n.id}
              to={n.path(userId)}
              onClick={handleNavClick}
              title={collapsed ? n.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 11,
                padding: collapsed ? '10px 0' : '9px 12px',
                borderRadius: 9, textDecoration: 'none', position: 'relative',
                fontFamily: T.fD, fontSize: 13.5, fontWeight: on ? 600 : 500,
                color: on ? T.text : T.text2,
                background: on ? T.accentGhost : 'transparent',
                boxShadow: on ? `inset 0 0 0 1px ${T.accentLine}` : 'none',
              }}
            >
              {on && !collapsed && (
                <span style={{ position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 3, background: T.accent }} />
              )}
              <Icon name={n.icon} size={17} style={{ color: on ? T.accent : T.text3, flexShrink: 0 }} />
              {!collapsed && n.label}
              {!collapsed && n.gated && (
                <span style={{ marginLeft: 'auto', fontFamily: T.fM, fontSize: 9, letterSpacing: 1, color: '#e7b765', border: '1px solid rgba(231,183,101,0.4)', borderRadius: 4, padding: '1px 4px' }}>
                  ADMIN
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ padding: collapsed ? '10px 8px' : 12, borderTop: `1px solid ${T.border}` }}>
        {collapsed ? (
          <button
            onClick={signOut}
            title="Sign out"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: T.text3 }}
          >
            <Icon name="logout" size={17} />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 10 }}>
            <Avatar name={userName} size={36} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: T.fD, fontWeight: 600, fontSize: 13, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap' }}>{squadName ?? 'Community'}</div>
            </div>
            <button onClick={signOut} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: T.text3 }} title="Sign out">
              <Icon name="logout" size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
