import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { Role } from '../../lib/tokens';

interface Props {
  requiredRole?: Role;
}

export function ProtectedRoute({ requiredRole }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (authLoading || profileLoading) {
    return (
      <div style={{ background: '#0a0c10', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid #272d39', borderTopColor: '#25d6c1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile && !profile.is_active) return <Navigate to="/complete-profile" replace />;

  const ROLE_ORDER: Role[] = ['COMMUNITY', 'SQUAD_MEMBER', 'SQUAD_LEAD', 'ADMIN', 'SUPER_ADMIN'];
  if (requiredRole && profile) {
    const userTier = ROLE_ORDER.indexOf(profile.role as Role);
    const requiredTier = ROLE_ORDER.indexOf(requiredRole);
    if (userTier < requiredTier) return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (loading || profileLoading) return null;

  if (user) {
    // null profile = row not yet created (trigger race). Treat as inactive.
    if (!profile || !profile.is_active) return <Navigate to="/complete-profile" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function ActiveGuard() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (loading || profileLoading) return null;

  // Must be authenticated to reach /complete-profile
  if (!user) return <Navigate to="/login" replace />;

  // Active users don't need to complete profile again
  if (profile?.is_active) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
