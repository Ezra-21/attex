import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useNavigate, useRouteError } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute, ActiveGuard } from '../features/auth/ProtectedRoute';
import { LandingErrorBoundary, AppErrorBoundary, PageErrorBoundary } from '../components/ui/ErrorBoundary';
import { T } from '../lib/tokens';
import { Icon } from '../components/ui/Icon';
import { Btn } from '../components/ui/Btn';

import LandingPage from '../features/landing/LandingPage';
import PrivacyPage from '../features/legal/PrivacyPage';
import TermsPage from '../features/legal/TermsPage';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';
import InvitePage from '../features/auth/InvitePage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import CompleteProfilePage from '../features/auth/CompleteProfilePage';
import DashboardPage from '../features/dashboard/DashboardPage';
import ProblemsPage from '../features/problems/ProblemsPage';
import SubmissionViewPage from '../features/problems/SubmissionViewPage';
import EditorialPage from '../features/problems/EditorialPage';
import EditorialsListPage from '../features/editorials/EditorialsListPage';
import ContestsPage from '../features/contests/ContestsPage';
import ContestDetailPage from '../features/contests/ContestDetailPage';
import ProfilePage from '../features/profile/ProfilePage';
import SquadPage from '../features/squad/SquadPage';
import UsersPage from '../features/users/UsersPage';
import AnnouncementsPage from '../features/announcements/AnnouncementsPage';
import SettingsPage from '../features/settings/SettingsPage';

const AdminPage = lazy(() => import('../features/admin/AdminPage'));

// ── 404 / route-error pages ───────────────────────────────────────────────

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: T.surface2, border: `1px solid ${T.border}`, margin: '0 auto 24px' }}>
          <Icon name="search" size={26} style={{ color: T.text3 }} />
        </div>
        <div style={{ fontFamily: T.fM, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: T.accentText, marginBottom: 12 }}>
          404
        </div>
        <h1 style={{ margin: '0 0 10px', fontFamily: T.fD, fontSize: 26, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>
          Page not found
        </h1>
        <p style={{ margin: '0 0 28px', fontFamily: T.fB, fontSize: 14, color: T.text2, lineHeight: 1.6 }}>
          This page doesn't exist or was moved. Head back to the hub.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Btn kind="primary" iconR="arrow" onClick={() => navigate('/')}>Go home</Btn>
          <Btn kind="ghost" onClick={() => navigate(-1)}>Go back</Btn>
        </div>
      </div>
    </div>
  );
}

function RouteErrorPage() {
  const error = useRouteError() as { status?: number; statusText?: string; message?: string } | undefined;
  const navigate = useNavigate();
  const is404 = error?.status === 404;
  return (
    <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 440, textAlign: 'center', padding: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: is404 ? T.surface2 : 'rgba(242,101,79,0.12)', border: `1px solid ${is404 ? T.border : 'rgba(242,101,79,0.4)'}`, margin: '0 auto 24px' }}>
          <Icon name={is404 ? 'search' : 'ban'} size={26} style={{ color: is404 ? T.text3 : T.loss }} />
        </div>
        <div style={{ fontFamily: T.fM, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: is404 ? T.accentText : T.loss, marginBottom: 12 }}>
          {is404 ? '404' : 'Error'}
        </div>
        <h1 style={{ margin: '0 0 10px', fontFamily: T.fD, fontSize: 26, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>
          {is404 ? 'Page not found' : 'Something went wrong'}
        </h1>
        <p style={{ margin: '0 0 28px', fontFamily: T.fB, fontSize: 14, color: T.text2, lineHeight: 1.6 }}>
          {is404
            ? "This page doesn't exist or was moved."
            : (error?.statusText || error?.message || 'An unexpected error occurred.')}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Btn kind="primary" iconR="arrow" onClick={() => navigate('/')}>Go home</Btn>
          <Btn kind="ghost" onClick={() => navigate(-1)}>Go back</Btn>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ background: '#0a0c10', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #272d39', borderTopColor: '#25d6c1', borderRadius: '50%', animation: 'fa-spin 0.7s linear infinite' }} />
    </div>
  );
}

const router = createBrowserRouter([
  // ── Landing shell — public, no sidebar ───────────────────────────────────
  {
    element: <LandingErrorBoundary><Outlet /></LandingErrorBoundary>,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/announcements', element: <AnnouncementsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/terms', element: <TermsPage /> },
    ],
  },

  // ── Auth pages — public only, redirect if already logged in ─────────────
  {
    element: <LandingErrorBoundary><PublicOnlyRoute /></LandingErrorBoundary>,
    children: [
      { path: '/login',            element: <LoginPage /> },
      { path: '/signup',           element: <SignupPage /> },
      { path: '/forgot-password',  element: <ForgotPasswordPage /> },
    ],
  },

  // ── Auth flows that must be reachable even with an active session ─────────
  // /invite: Supabase sets a session from the hash before the page mounts,
  //   so it cannot live inside PublicOnlyRoute (would redirect to /dashboard).
  // /reset-password: same — Supabase injects the recovery session via hash.
  {
    element: <LandingErrorBoundary><Outlet /></LandingErrorBoundary>,
    children: [
      { path: '/invite',         element: <InvitePage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // ── Profile completion — auth required, inactive only ────────────────────
  {
    element: <LandingErrorBoundary><ActiveGuard /></LandingErrorBoundary>,
    children: [
      { path: '/complete-profile', element: <CompleteProfilePage /> },
    ],
  },

  // ── App shell — auth + active required ───────────────────────────────────
  {
    element: <AppErrorBoundary><ProtectedRoute /></AppErrorBoundary>,
    children: [
      { path: '/dashboard',              element: <PageErrorBoundary><DashboardPage /></PageErrorBoundary> },
      { path: '/problems',               element: <PageErrorBoundary><ProblemsPage /></PageErrorBoundary> },
      { path: '/editorials',             element: <PageErrorBoundary><EditorialsListPage /></PageErrorBoundary> },
      { path: '/submissions/:id',        element: <PageErrorBoundary><SubmissionViewPage /></PageErrorBoundary> },
      { path: '/problems/:id/editorials',element: <PageErrorBoundary><EditorialPage /></PageErrorBoundary> },
      { path: '/contests',               element: <PageErrorBoundary><ContestsPage /></PageErrorBoundary> },
      { path: '/contests/:id',           element: <PageErrorBoundary><ContestDetailPage /></PageErrorBoundary> },
      { path: '/profile/:userId',        element: <PageErrorBoundary><ProfilePage /></PageErrorBoundary> },
      { path: '/users',                  element: <PageErrorBoundary><UsersPage /></PageErrorBoundary> },
      { path: '/settings/extension',     element: <PageErrorBoundary><SettingsPage /></PageErrorBoundary> },
      // Squad — SQUAD_MEMBER+
      {
        element: <ProtectedRoute requiredRole="SQUAD_MEMBER" />,
        children: [{ path: '/squad', element: <PageErrorBoundary><SquadPage /></PageErrorBoundary> }],
      },
      // Admin — ADMIN+ (lazy-loaded)
      {
        element: <ProtectedRoute requiredRole="ADMIN" />,
        children: [
          {
            path: '/admin',
            element: (
              <PageErrorBoundary>
                <Suspense fallback={<Spinner />}>
                  <AdminPage />
                </Suspense>
              </PageErrorBoundary>
            ),
          },
        ],
      },
    ],
  },
  // ── Catch-all 404 ────────────────────────────────────────────────────────
  { path: '*', element: <NotFoundPage /> },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
