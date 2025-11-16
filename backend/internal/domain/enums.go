package domain

type Role string

const (
	RoleSuperAdmin  Role = "SUPER_ADMIN"
	RoleAdmin       Role = "ADMIN"
	RoleSquadLead   Role = "SQUAD_LEAD"
	RoleSquadMember Role = "SQUAD_MEMBER"
	RoleCommunity   Role = "COMMUNITY"
)

func (r Role) AtLeast(min Role) bool {
	return roleOrder[r] >= roleOrder[min]
}

var roleOrder = map[Role]int{
	RoleCommunity:   0,
	RoleSquadMember: 1,
	RoleSquadLead:   2,
	RoleAdmin:       3,
	RoleSuperAdmin:  4,
}

type Platform string

const (
	PlatformLeetCode   Platform = "LEETCODE"
	PlatformCodeforces Platform = "CODEFORCES"
	PlatformAtCoder    Platform = "ATCODER"
	PlatformHackerRank Platform = "HACKERRANK"
	PlatformGFG        Platform = "GFG"
	PlatformOther      Platform = "OTHER"
)
