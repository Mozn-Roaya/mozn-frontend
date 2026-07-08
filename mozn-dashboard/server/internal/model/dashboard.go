// Package model defines the domain types and JSON contract for the dashboard.
// These structs mirror the TypeScript types in web/types/dashboard.ts.
package model

// StatTone classifies an overview stat card for color/icon treatment.
type StatTone string

const (
	StatToneOnline      StatTone = "online"
	StatToneOffline     StatTone = "offline"
	StatToneMaintenance StatTone = "maintenance"
	StatToneAnomaly     StatTone = "anomaly"
	StatToneAlert       StatTone = "alert"
)

// StatCard is a single headline metric in the status strip.
type StatCard struct {
	ID    string   `json:"id"`
	Label string   `json:"label"`
	Value int      `json:"value"`
	Total *int     `json:"total,omitempty"`
	Tone  StatTone `json:"tone"`
}

// StationStatus is the live health of a monitoring station.
type StationStatus string

const (
	StationStatusOnline  StationStatus = "online"
	StationStatusWarning StationStatus = "warning"
	StationStatusOffline StationStatus = "offline"
)

// MapAlertSeverity is a weather-alert tier used to colour a map pin. Mirrors the
// public app's severity vocabulary so the two maps read identically; an active
// or forecast alert of higher severity outranks the station's own health status.
// Distinct from the history AlertSeverity (critical/warning/watch/advisory).
type MapAlertSeverity string

const (
	MapSeverityYellow MapAlertSeverity = "yellow"
	MapSeverityOrange MapAlertSeverity = "orange"
	MapSeverityRed    MapAlertSeverity = "red"
)

// AlertCounts is the per-severity tally of a station's active alerts (mirrors
// the public API's `active_alerts`). The map pin takes its colour from the
// highest non-zero tier.
type AlertCounts struct {
	Total  int `json:"total"`
	Yellow int `json:"yellow"`
	Orange int `json:"orange"`
	Red    int `json:"red"`
}

// ForecastAlert is a pending, forecast-driven alert for a station (mirrors the
// public API's `forecast_alerts`). Counts toward the pin colour so the map
// agrees with what the station panel shows.
type ForecastAlert struct {
	AlertID   string           `json:"alertId,omitempty"`
	Severity  MapAlertSeverity `json:"severity,omitempty"`
	Parameter string           `json:"parameter,omitempty"`
	StartsAt  string           `json:"startsAt,omitempty"`
	ExpiresAt string           `json:"expiresAt,omitempty"`
	LeadTime  string           `json:"leadTime,omitempty"`
}

// MapStation is a station plotted on the health map. Latitude and Longitude are
// real WGS84 coordinates, plotted directly on the Leaflet basemap. Region,
// Reading and Updated back the info card shown when a pin is selected.
type MapStation struct {
	ID        string        `json:"id"`
	Name      string        `json:"name"`
	Status    StationStatus `json:"status"`
	Latitude  float64       `json:"latitude"`
	Longitude float64       `json:"longitude"`
	Region    string        `json:"region"`
	// Reading is the latest status-driving metric, e.g. "Rainfall 2 mm/hr".
	// Empty for offline stations (no recent signal).
	Reading string `json:"reading"`
	// Updated is a relative timestamp, e.g. "2 min ago".
	Updated string `json:"updated"`
	// ActiveAlerts and ForecastAlerts drive the pin's severity colour, matching
	// the public map. Optional: absent when a station has no alerts, so the pin
	// falls back to its health status colour.
	ActiveAlerts   *AlertCounts    `json:"activeAlerts,omitempty"`
	ForecastAlerts []ForecastAlert `json:"forecastAlerts,omitempty"`
}

// StationHealthMap is the map panel: heading copy plus plotted stations.
type StationHealthMap struct {
	Title        string       `json:"title"`
	Subtitle     string       `json:"subtitle"`
	CoverageNote string       `json:"coverageNote"`
	Stations     []MapStation `json:"stations"`
}

// AttentionSeverity classifies a "needs attention" item.
type AttentionSeverity string

const (
	AttentionWarning  AttentionSeverity = "warning"
	AttentionAdvisory AttentionSeverity = "advisory"
	AttentionOffline  AttentionSeverity = "offline"
)

// AttentionItem is one row in the "Needs attention" panel.
type AttentionItem struct {
	ID       string            `json:"id"`
	Title    string            `json:"title"`
	Meta     string            `json:"meta"`
	Elapsed  string            `json:"elapsed"`
	Severity AttentionSeverity `json:"severity"`
}

// NeedsAttention is the attention panel with its open count.
type NeedsAttention struct {
	OpenCount int             `json:"openCount"`
	Items     []AttentionItem `json:"items"`
}

// ActivityItem is one row in the recent-activity feed. Mirrors the Activity Log
// row shape so the dashboard panel renders the same columns (actor, action,
// category, source, date/time).
type ActivityItem struct {
	ID       string           `json:"id"`
	Actor    string           `json:"actor"`
	Initials string           `json:"initials"`
	Action   string           `json:"action"`
	Category ActivityCategory `json:"category"`
	Source   string           `json:"source"`
	Date     string           `json:"date"`
	Time     string           `json:"time"`
}

// RegionStat is online/total station coverage for a region.
type RegionStat struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Online int    `json:"online"`
	Total  int    `json:"total"`
}

// DashboardHeader is the page heading and live-sync status.
type DashboardHeader struct {
	Title       string `json:"title"`
	StatusLabel string `json:"statusLabel"`
	Live        bool   `json:"live"`
}

// DashboardOverview is the full payload backing the dashboard screen.
type DashboardOverview struct {
	Header         DashboardHeader  `json:"header"`
	Stats          []StatCard       `json:"stats"`
	Map            StationHealthMap `json:"map"`
	NeedsAttention NeedsAttention   `json:"needsAttention"`
	RecentActivity []ActivityItem   `json:"recentActivity"`
	Regions        []RegionStat     `json:"regions"`
}
