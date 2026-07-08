package model

// UserRole is an account's access level.
type UserRole string

const (
	RoleSuperAdmin UserRole = "Super Admin"
	RoleGovEditor  UserRole = "Gov Editor"
	RoleGovViewer  UserRole = "Gov Viewer"
)

// UserRow is one account in the users table.
type UserRow struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Email      string   `json:"email"`
	Initials   string   `json:"initials"`
	Role       UserRole `json:"role"`
	Regions    string   `json:"regions"`
	LastActive string   `json:"lastActive"`
	Active     bool     `json:"active"`
}

// UsersPage is the payload for the Users & Access screen.
type UsersPage struct {
	AdminCount int         `json:"adminCount"`
	GovCount   int         `json:"govCount"`
	Filters    []FilterTab `json:"filters"`
	Users      []UserRow   `json:"users"`
}
