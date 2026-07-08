package model

// NotificationPref is a toggleable notification preference.
type NotificationPref struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Enabled     bool   `json:"enabled"`
	Highlight   bool   `json:"highlight,omitempty"`
}

// ValidationRule is one data-validation bound.
type ValidationRule struct {
	Metric     string `json:"metric"`
	ValidRange string `json:"validRange"`
	MaxRate    string `json:"maxRate"`
	Active     bool   `json:"active"`
}

// SettingsPage is the payload for the Settings screen.
type SettingsPage struct {
	Notifications   []NotificationPref `json:"notifications"`
	ValidationNote  string             `json:"validationNote"`
	ValidationRules []ValidationRule   `json:"validationRules"`
}
