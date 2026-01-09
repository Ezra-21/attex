package tests

import (
	"testing"

	"focus-astu-hub/internal/domain"
)

func TestRoleAtLeast(t *testing.T) {
	cases := []struct {
		name string
		role domain.Role
		min  domain.Role
		want bool
	}{
		{"admin meets squad lead", domain.RoleAdmin, domain.RoleSquadLead, true},
		{"super admin meets admin", domain.RoleSuperAdmin, domain.RoleAdmin, true},
		{"member does not meet lead", domain.RoleSquadMember, domain.RoleSquadLead, false},
		{"community does not meet member", domain.RoleCommunity, domain.RoleSquadMember, false},
		{"role meets itself", domain.RoleSquadLead, domain.RoleSquadLead, true},
		{"community meets community", domain.RoleCommunity, domain.RoleCommunity, true},
		{"super admin meets community", domain.RoleSuperAdmin, domain.RoleCommunity, true},
		{"member does not meet admin", domain.RoleSquadMember, domain.RoleAdmin, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.role.AtLeast(tc.min); got != tc.want {
				t.Errorf("%s.AtLeast(%s) = %v, want %v", tc.role, tc.min, got, tc.want)
			}
		})
	}
}

func TestRoleOrderingIsStrict(t *testing.T) {
	ordered := []domain.Role{
		domain.RoleCommunity,
		domain.RoleSquadMember,
		domain.RoleSquadLead,
		domain.RoleAdmin,
		domain.RoleSuperAdmin,
	}

	// Each role should be >= every role before it and not >= the one after it.
	for i := 1; i < len(ordered); i++ {
		lower, higher := ordered[i-1], ordered[i]
		if !higher.AtLeast(lower) {
			t.Errorf("%s should rank at least %s", higher, lower)
		}
		if lower.AtLeast(higher) {
			t.Errorf("%s should NOT rank at least %s", lower, higher)
		}
	}
}

func TestPlatformConstants(t *testing.T) {
	want := map[domain.Platform]string{
		domain.PlatformLeetCode:   "LEETCODE",
		domain.PlatformCodeforces: "CODEFORCES",
		domain.PlatformAtCoder:    "ATCODER",
		domain.PlatformHackerRank: "HACKERRANK",
		domain.PlatformGFG:        "GFG",
		domain.PlatformOther:      "OTHER",
	}
	for p, s := range want {
		if string(p) != s {
			t.Errorf("platform constant = %q, want %q", string(p), s)
		}
	}
}
