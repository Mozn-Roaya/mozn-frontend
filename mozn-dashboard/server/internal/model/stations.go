package model

// StationOpStatus is the operational status of a station in the list view.
type StationOpStatus string

const (
	StationOpOnline      StationOpStatus = "online"
	StationOpOffline     StationOpStatus = "offline"
	StationOpMaintenance StationOpStatus = "maintenance"
	StationOpAnomaly     StationOpStatus = "anomaly"
	StationOpWarning     StationOpStatus = "warning"
)

// StationRow is one station in the stations table.
type StationRow struct {
	ID     string          `json:"id"`
	Name   string          `json:"name"`
	NameAr string          `json:"nameAr"`
	Region string          `json:"region"`
	Status StationOpStatus `json:"status"`
	// Reading is the latest or status-driving metric, e.g. "Rainfall 28 mm/hr".
	Reading     string `json:"reading"`
	Signal      int    `json:"signal"`
	Battery     *int   `json:"battery"`
	LastReading string `json:"lastReading"`
}

// StationRegionGroup groups stations under a region with a coverage count.
type StationRegionGroup struct {
	Region string       `json:"region"`
	Online int          `json:"online"`
	Total  int          `json:"total"`
	Rows   []StationRow `json:"rows"`
}

// StationsPage is the payload for the Stations screen.
type StationsPage struct {
	Total         int                  `json:"total"`
	RegionCount   int                  `json:"regionCount"`
	NeedAttention int                  `json:"needAttention"`
	Filters       []FilterTab          `json:"filters"`
	Groups        []StationRegionGroup `json:"groups"`
}
