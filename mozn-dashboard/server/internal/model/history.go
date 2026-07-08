package model

// AlertSeverity is the severity of a historical alert.
type AlertSeverity string

const (
	SeverityCritical AlertSeverity = "critical"
	SeverityWarning  AlertSeverity = "warning"
	SeverityWatch    AlertSeverity = "watch"
	SeverityAdvisory AlertSeverity = "advisory"
)

// AlertOutcome is how a historical alert resolved.
type AlertOutcome string

const (
	OutcomeAllClear    AlertOutcome = "all-clear"
	OutcomeAutoCleared AlertOutcome = "auto-cleared"
)

// AlertHistoryRow is one row of the alert history table.
type AlertHistoryRow struct {
	ID       string        `json:"id"`
	Date     string        `json:"date"`
	Time     string        `json:"time"`
	Severity AlertSeverity `json:"severity"`
	Alert    string        `json:"alert"`
	Region   string        `json:"region"`
	AckTime  string        `json:"ackTime"`
	Duration string        `json:"duration"`
	Outcome  AlertOutcome  `json:"outcome"`
}

// AlertHistoryPage is the payload for the Alert History tab.
type AlertHistoryPage struct {
	Ranges     []string          `json:"ranges"`
	Regions    []string          `json:"regions"`
	Types      []string          `json:"types"`
	Severities []string          `json:"severities"`
	Rows       []AlertHistoryRow `json:"rows"`
}
