# Frontend Overview

The frontend is a React + TypeScript single-page application built with Vite.

## Technology stack

| Concern | Library |
|---------|---------|
| Framework | React 18 |
| Language | TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| Server state | TanStack Query |
| Auth | Supabase JS client |
| UI state | Zustand |
| Code highlighting | Custom `CodeViewer` component |
| Markdown rendering | `react-markdown` + `remark-gfm` via `MarkdownRenderer` component |

## Directory structure

```
frontend/src/
├── app/
│   └── router.tsx           # All route definitions and ProtectedRoute wrappers
├── components/
│   ├── layout/              # AppShell, Header, Sidebar, LandingNavbar
│   └── ui/                  # Reusable atomic components (Badge, Avatar, MarkdownRenderer, …)
├── features/
│   ├── admin/               # Admin panel (users, squads, invitations, contest sync)
│   ├── announcements/       # Announcements list + post modal (Markdown, write/preview)
│   ├── auth/                # Login, Signup, CompleteProfile, InvitePage, ForgotPassword, ResetPassword
│   ├── contests/            # Contest list + detail with standings
│   ├── dashboard/           # Dashboard page
│   ├── editorials/          # Editorials list
│   ├── landing/             # Public landing page
│   ├── legal/               # PrivacyPage, TermsPage
│   ├── problems/            # Problem library + submission view + editorial page + LogSolveModal
│   ├── profile/             # User profile page (own and others)
│   ├── settings/            # Settings page (API key management)
│   ├── squad/               # Squad curriculum (mobile-responsive, submit from page, editorial links)
│   └── users/               # Member directory (/users) with search and squad filter
├── hooks/                   # Shared hooks (useAuth, useAppUser, useUserProfile, useWindowWidth)
├── lib/
│   ├── api.ts               # Axios wrapper with automatic JWT attachment
│   ├── supabase.ts          # Supabase client singleton
│   └── tokens.ts            # Design tokens (colors, fonts, breakpoints)
└── store/
    └── uiStore.ts           # Zustand store for sidebar open/collapsed state
```

## Auth flow

1. User signs in with Supabase (email/password or magic link).
2. Supabase issues a JWT stored in `localStorage`.
3. `AuthContext` reads the session and exposes the user to the app.
4. If the profile is incomplete (`is_active = false`), the user is redirected to `/complete-profile`.
5. All authenticated API calls include `Authorization: Bearer <jwt>` via `lib/api.ts`.

## Route protection

| Guard | Purpose |
|-------|---------|
| `ProtectedRoute` | Redirects to `/login` if not authenticated |
| `ActiveGuard` | Redirects to `/complete-profile` if `is_active = false` |
| `ProtectedRoute requiredRole="SQUAD_MEMBER"` | Restricts `/squad` to squad members and above |
| `ProtectedRoute requiredRole="ADMIN"` | Restricts `/admin` to admins and above |
