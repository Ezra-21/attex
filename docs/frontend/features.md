# Features

## Landing page

- Public stats (member count, problems solved, contests held)
- Latest global announcements feed
- Daily Bible verse widget
- Login / signup entry point
- Links to Privacy Policy and Terms of Service

## Dashboard

- Personal stats (problem count, daily streak)
- Recent submissions
- Upcoming or recent contests
- Quick-access links to Problems, Contests, and Squad pages

## Problems

- Full library with platform filter, tag filter, and full-text search
- Log a solve manually via the **Log Solve** modal (paste URL + accepted code)
- Squad leads can also add new problems to the library
- View submission code with syntax highlighting

## Editorials

- Community-written Markdown editorials per problem
- Upvote / downvote system (net score displayed)
- Write, edit, and delete your own editorials
- GFM (GitHub Flavored Markdown) rendering including code blocks

## Contests

- List of all synced Codeforces contests
- Detailed standings per contest with rank and rating delta
- Squad leads can trigger a new sync from the contest detail page

## Announcements

- Accessible publicly (global-only, read-only) and from the authenticated sidebar
- **Squad Leads** can post announcements scoped to their own squad. `squad_id` is required in the request body and must match the caller's squad.
- **Admins / Super Admins** can post:
  - **Globally** (visible to everyone), or
  - **Squad-targeted** — select one or more squads; one announcement record is created per squad
- Post modal has **Write / Preview** tabs — body is full Markdown with GFM rendering
- Announcement cards render the body as Markdown

## Squad curriculum

- Track → Topic → Problem hierarchy
- Squad leads can create tracks, add topics, and assign problems from the library
- Problem name is a direct link to the external problem page
- Each problem row has an **Editorial** button (book icon) linking to `/problems/:id/editorials`
- Unsolved problems show a **Submit** button that opens the Log Solve modal pre-filled with the problem's URL, name, and platform
- Roster members are clickable → navigates to their profile page
- Fully responsive on mobile (single-column layout, compact progress bars)

## Members directory (`/users`)

- Lists all active, non-banned members ordered by problem count
- Search by name or Codeforces handle
- Filter by squad (dropdown from squad list)
- Click any member row → navigates to their profile
- Shows role badge, squad badge, and solve count per row

## Profile

- View any member's profile (handle links, squad, stats, recent submissions, role history)
- Edit your own profile fields (bio, handles, Telegram, LinkedIn)
- Activity heatmap (last 16 weeks)

## Settings

- Manage your API key (generate / revoke)
- Used by the browser extension to authenticate without a JWT

## Admin panel

- User management (role + squad combined assignment, ban)
- Squad management (create, rename, delete)
- Invitation management (create and list invitation links — email sent automatically via Resend)
- Contest sync (any squad)
- Reconcile problem counts (repair tool)
- Toggle open signup (Super Admin only)

## Legal pages

- `/privacy` — Privacy Policy
- `/terms` — Terms of Service
- Consent shown at signup and profile completion
