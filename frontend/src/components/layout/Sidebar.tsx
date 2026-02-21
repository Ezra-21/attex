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