import type { ReactNode } from 'react';
import { T } from '../../lib/tokens';
import type { Role } from '../../lib/tokens';
import { RoleBadge } from '../ui/Badge';
import { useUIStore } from '../../store/uiStore';
import { useWindowWidth, BREAKPOINTS } from '../../hooks/useWindowWidth';

interface HeaderProps {
  title: string;
  crumbs?: string;
  role: Role;
  right?: ReactNode;
}

export function Header({ title, crumbs, role, right }: HeaderProps) {
  const { toggleSidebar } = useUIStore();
  const width    = useWindowWidth();
  const isMobile = width < BREAKPOINTS.tablet;

  return (
    <header style={{
      height: 60, flexShrink: 0, borderBottom: `1px solid ${T.border}`,
      background: 'rgba(10,12,16,0.7)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', padding: '0 26px', gap: 18,
    }}>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text2, display: 'grid', placeItems: 'center', flexShrink: 0 }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {crumbs && !isMobile && (
          <div style={{ fontFamily: T.fM, fontSize: 11, color: T.text3, letterSpacing: 0.5, marginBottom: 2 }}>
            {crumbs}
          </div>
        )}
        <h1 style={{ margin: 0, fontFamily: T.fD, fontSize: 18, fontWeight: 600, color: T.text, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h1>
      </div>

      {right}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <RoleBadge role={role} size="sm" />
      </div>
    </header>
  );
}
