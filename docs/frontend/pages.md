# Pages & Routes

All routes are defined in `frontend/src/app/router.tsx`.

## Public routes (no auth required)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LandingPage` | Public landing with stats, announcements, and daily verse |
| `/announcements` | `AnnouncementsPage` | Global announcements — public read-only view |
| `/privacy` | `PrivacyPage` | Privacy Policy |
| `/terms` | `TermsPage` | Terms of Service |
| `/login` | `LoginPage` | Email + password sign-in |
| `/signup` | `SignupPage` | Registration (requires invitation if open signup is off) |
| `/invite` | `InvitePage` | Reads `?token=` from URL and pre-fills email on signup |
| `/forgot-password` | `ForgotPasswordPage` | Request a password reset email |
| `/reset-password` | `ResetPasswordPage` | Set new password from reset link |

## Semi-protected routes

| Path | Component | Notes |
|------|-----------|-------|
| `/complete-profile` | `CompleteProfilePage` | JWT required but account may be inactive. Includes consent to Privacy Policy and Terms of Service. |

## Protected routes (active account required)

Wrapped in `<ProtectedRoute>` → redirects to `/login` if unauthenticated.
Wrapped in `<AppShell>` → renders the sidebar + header.

| Path | Component | Min role | Notes |
|------|-----------|----------|-------|
| `/dashboard` | `DashboardPage` | Any active | Personal stats, recent activity |
| `/problems` | `ProblemsPage` | Any active | Problem library with filters and submit |
| `/problems/:id/editorials` | `EditorialPage` | Any active | Read and write Markdown editorials |
| `/submissions/:id` | `SubmissionViewPage` | Any active | Syntax-highlighted code viewer |
| `/editorials` | `EditorialsListPage` | Any active | Browse all editorials |
| `/contests` | `ContestsPage` | Any active | Synced contest list |
| `/contests/:id` | `ContestDetailPage` | Any active | Standings + upsolve toggle |
| `/profile/:userID` | `ProfilePage` | Any active | Any member's profile (own or others) |
| `/users` | `UsersPage` | Any active | Member directory with search and squad filter |
| `/announcements` | `AnnouncementsPage` | Any active | Global + squad announcements; post button for Squad Leads and Admins |
| `/settings/extension` | `SettingsPage` | Any active | API key management for the browser extension |
| `/squad` | `SquadPage` | `SQUAD_MEMBER`+ | Squad curriculum tree (Track → Topic → Problem) |
| `/admin` | `AdminPage` | `ADMIN`+ | User management, invitations, squads, contest sync |
