package model

// InboxSeverity classifies an inbox alert's urgency.
type InboxSeverity string

const (
	InboxCritical InboxSeverity = "critical"
	InboxUrgent   InboxSeverity = "urgent"
	InboxRoutine  InboxSeverity = "routine"
)

// SlaTone colors the SLA chip.
type SlaTone string

const (
	SlaDanger SlaTone = "danger"
	SlaOK     SlaTone = "ok"
	SlaMuted  SlaTone = "muted"
)

// InboxMetric is a single reading shown on an inbox card.
type InboxMetric struct {
	Label     string `json:"label"`
	Value     string `json:"value"`
	Threshold string `json:"threshold"`
}

// InboxSLA is the SLA chip (label + tone).
type InboxSLA struct {
	Label string  `json:"label"`
	Tone  SlaTone `json:"tone"`
}

// InboxMeter is the right-hand readout (sustained duration or forecast window).
type InboxMeter struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

// InboxItem is one alert card awaiting team triage.
type InboxItem struct {
	ID          string        `json:"id"`
	Severity    InboxSeverity `json:"severity"`
	Title       string        `json:"title"`
	Context     string        `json:"context"`
	TimeAgo     string        `json:"timeAgo"`
	SLA         InboxSLA      `json:"sla"`
	Metrics     []InboxMetric `json:"metrics"`
	Meter       InboxMeter    `json:"meter"`
	Recommended string        `json:"recommended"`
}

// AlertInboxPage is the payload for the Alert Inbox screen.
type AlertInboxPage struct {
	AvgAck  string      `json:"avgAck"`
	SLANote string      `json:"slaNote"`
	Filters []FilterTab `json:"filters"`
	Items   []InboxItem `json:"items"`
}
