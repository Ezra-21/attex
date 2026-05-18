# Roles & Permissions

## Role hierarchy

```
SUPER_ADMIN (4)
    └── ADMIN (3)
            └── SQUAD_LEAD (2)
                    └── SQUAD_MEMBER (1)
                            └── COMMUNITY (0)
```

Each higher role inherits all permissions of lower roles. The `AtLeast(min)` helper enforces this hierarchy in middleware.

## Permission matrix

| Action | COMMUNITY | SQUAD_MEMBER | SQUAD_LEAD | ADMIN | SUPER_ADMIN |
|--------|:---------:|:------------:|:----------:|:-----:|:-----------:|
| View public stats / announcements | ✅ | ✅ | ✅ | ✅ | ✅ |
| Log submissions | — | ✅ | ✅ | ✅ | ✅ |
| View problems / contests | — | ✅ | ✅ | ✅ | ✅ |
| Write / vote editorials | — | ✅ | ✅ | ✅ | ✅ |
| Preview problem from URL | — | — | ✅ | ✅ | ✅ |
| Add problem to library | — | — | ✅ | ✅ | ✅ |
| Manage squad curriculum | — | — | own squad | ✅ | ✅ |
| Post squad announcement | — | — | own squad | ✅ | ✅ |
| Sync contest (squad) | — | — | own squad | ✅ | ✅ |
| List / manage all users | — | — | — | ✅ | ✅ |
| Create invitations | — | — | — | ✅ | ✅ |
| Post global announcement | — | — | — | ✅ | ✅ |
| Sync contest (any) | — | — | — | ✅ | ✅ |
| Toggle open signup | — | — | — | — | ✅ |

## Onboarding flow

1. A new user signs up via Supabase auth.
2. If **open signup is disabled** (default), they need a valid invitation link first.
3. After first login, their account is **inactive** (`is_active = false`).
4. They must call `POST /api/users/me/complete-profile` (full_name, telegram_handle, codeforces_handle required).
5. An admin then assigns them a role and squad from the Admin panel.
