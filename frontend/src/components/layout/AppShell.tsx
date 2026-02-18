import type { ReactNode } from 'react';
import { T } from '../../lib/tokens';
import type { Role } from '../../lib/tokens';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { FlameDef } from '../ui/Avatar';
import { useUIStore } from '../../store/uiStore';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';

interface AppShellProps {
  children: ReactNode;
  title: string;
  crumbs?: string;
  userId: string;
  role: Role;
  userName: string;
  squadName?: string | null;
  headerRight?: ReactNode;
  scroll?: boolean;
}

export function AppShell({
  children, title, crumbs, userId, role, userName, squadName, headerRight, scroll = true,
}: AppShellProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const width    = useWindowWidth();
  const isMobile = width < BREAKPOINTS.tablet;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: T.bg, position: 'relative' }}>
      <FlameDef />

      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 40, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        // Mobile: fixed overlay; Desktop: static in flow
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .22s ease',
        } : {
          position: 'relative', zIndex: 1,
        }),
      }}>
        <Sidebar userId={userId} role={role} userName={userName} squadName={squadName} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header title={title} crumbs={crumbs} role={role} right={headerRight} />
        <main style={{
          flex: 1,
          overflowY: scroll ? 'auto' : 'hidden',
          overflowX: 'hidden',
          padding: isMobile ? '20px 16px' : '26px 30px',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
