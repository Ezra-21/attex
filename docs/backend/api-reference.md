# API Reference

## Interactive Swagger UI

When the backend is running locally, the full interactive API reference is available at:

```
http://localhost:8080/api/docs
```

You can authorise with your Supabase JWT directly in the Swagger UI — click **Authorize**, paste `Bearer <your-jwt>`, and all requests will include the token.

---

## Endpoint summary

### Public — no auth required

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Health check |
| `GET` | `/api/verse` | Daily Bible verse |
| `GET` | `/api/system/signup-status` | Whether open signup is enabled |
| `GET` | `/api/invite/validate?token=` | Validate an invitation token |
| `POST` | `/api/invite/signup` | Create account via invitation token |
| `POST` | `/api/invite/use` | Mark an invitation token as used |
| `GET` | `/api/announcements/public` | Latest global announcements (landing page) |
| `GET` | `/api/stats/public` | Platform-wide aggregate stats (landing page) |

### Auth — JWT required (inactive accounts allowed)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/users/me/complete-profile` | Complete profile after first sign-in |
| `GET` | `/api/users/me/api-key` | Check if API key exists |
| `POST` | `/api/users/me/api-key` | Generate API key |
| `DELETE` | `/api/users/me/api-key` | Revoke API key |

### Active users — JWT + active account

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/me` | Get own profile |
| `PUT` | `/api/users/me` | Update own profile |
| `GET` | `/api/users/:userID` | Get any user's profile |
| `GET` | `/api/problems` | List problem library |
| `GET` | `/api/problems/search?q=` | Search problems |
| `POST` | `/api/submissions` | Log a solved submission |
| `GET` | `/api/submissions/:submissionID` | Get submission detail |
| `GET` | `/api/users/:userID/submissions` | List user's submissions |
| `GET` | `/api/contests` | List synced contests |
| `GET` | `/api/contests/:contestID/standings` | Contest standings |
| `GET` | `/api/editorials?problem_id=` | List editorials for a problem |
| `POST` | `/api/editorials` | Post a new editorial |
| `PUT` | `/api/editorials/:editorialID` | Edit own editorial |
| `DELETE` | `/api/editorials/:editorialID` | Delete own editorial |
| `POST` | `/api/editorials/:editorialID/vote` | Vote on an editorial (+1 / -1) |
| `GET` | `/api/announcements` | List announcements visible to the caller (global + own squad) |
| `GET` | `/api/squads/:squadID/tracks` | Get squad curriculum |

### Squad Lead — requires `SQUAD_LEAD` role or above

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/problems/preview?url=` | Preview problem metadata from URL |
| `POST` | `/api/problems` | Add problem to library |
| `POST` | `/api/squads/:squadID/tracks` | Create curriculum track |
| `POST` | `/api/tracks/:trackID/topics` | Add topic to track |
| `POST` | `/api/topics/:topicID/problems` | Assign problem to topic |
| `POST` | `/api/announcements` | Post a squad-scoped announcement. Body: `{ squad_id, title, body }`. `squad_id` must match the caller's own squad. |
| `POST` | `/api/squads/:squadID/contests/sync` | Sync Codeforces contest for squad |

### Admin — requires `ADMIN` role or above

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/users` | List all users |
| `PUT` | `/api/admin/users/:userID/role` | Set user role. Body: `{ role, squad_id? }` |
| `PUT` | `/api/admin/users/:userID/squad` | Assign user to squad |
| `PUT` | `/api/admin/users/:userID/ban` | Ban / unban user |
| `GET` | `/api/admin/squads` | List all squads |
| `POST` | `/api/admin/squads` | Create a squad |
| `PUT` | `/api/admin/squads/:squadID` | Rename a squad |
| `DELETE` | `/api/admin/squads/:squadID` | Delete a squad |
| `GET` | `/api/admin/invitations` | List invitations |
| `POST` | `/api/admin/invitations` | Create invitation (sends email via Resend) |
| `POST` | `/api/admin/announcements` | Post announcement. Body: `{ title, body, squad_ids? }`. If `squad_ids` is provided and non-empty, creates one announcement per squad. If omitted, posts globally. |
| `POST` | `/api/admin/contests/sync` | Sync any contest (no squad restriction) |
| `PUT` | `/api/admin/system/signup` | Toggle open signup (**SUPER_ADMIN only**) |
| `POST` | `/api/admin/repair/stats` | Reconcile all user problem counts |

---

## Announcement scoping

### Squad lead (`POST /api/announcements`)

- `squad_id` **required** in the request body.
- The backend validates that `squad_id` equals the caller's own assigned squad. Squad leads cannot post to other squads.
- Announcement is visible only to members of that squad.

### Admin / Super Admin (`POST /api/admin/announcements`)

```json
// Global — visible to everyone
{ "title": "...", "body": "..." }

// Squad-targeted — creates one announcement record per squad
{ "title": "...", "body": "...", "squad_ids": ["uuid-1", "uuid-2"] }
```

Announcement bodies support **Markdown** and are rendered with GFM (GitHub Flavored Markdown) on the frontend.

---

## Authentication

All non-public endpoints require an `Authorization: Bearer <token>` header.

The token can be either:

1. **Supabase JWT** — obtained after signing in via the frontend
2. **API key** — generated from Settings → API Key; used by the browser extension

```bash
# Example with curl
curl -H "Authorization: Bearer eyJhbGci..." http://localhost:8080/api/users/me
```
