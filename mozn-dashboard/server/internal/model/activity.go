package model

// ActivityCategory classifies an audit-log entry.
type ActivityCategory string

const (
	CategoryAlert     ActivityCategory = "alert"
	CategoryThreshold ActivityCategory = "threshold"
	CategoryStation   ActivityCategory = "station"
	CategoryUser      ActivityCategory = "user"
	CategoryAuth      ActivityCategory = "auth"
)

// ActivityRow is one audit-log entry.
type ActivityRow struct {
	ID       string           `json:"id"`
	Time     string           `json:"time"`
	Actor    string           `json:"actor"`
	Initials string           `json:"initials"`
	Action   string           `json:"action"`
	Category ActivityCategory `json:"category"`
	Source   string           `json:"source"`
}

// ActivityDayGroup groups audit entries under a day label.
type ActivityDayGroup struct {
	Label string `json:"label"`
	// Date is the group's calendar day as an ISO "2006-01-02" string. The
	// client filters and formats off this rather than parsing the display label.
	Date string        `json:"date"`
	Rows []ActivityRow `json:"rows"`
}

// ActivityLogPage is the payload for the Activity Log tab.
type ActivityLogPage struct {
	Categories []string           `json:"categories"`
	Users      []string           `json:"users"`
	Groups     []ActivityDayGroup `json:"groups"`
}
