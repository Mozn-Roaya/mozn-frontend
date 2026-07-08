package model

// ThresholdMetric identifies a measured metric.
type ThresholdMetric string

const (
	MetricRainfall    ThresholdMetric = "rainfall"
	MetricWind        ThresholdMetric = "wind"
	MetricWater       ThresholdMetric = "water"
	MetricTemperature ThresholdMetric = "temperature"
)

// TierMode is whether a tier updates automatically or needs manual action.
type TierMode string

const (
	TierAuto   TierMode = "auto"
	TierManual TierMode = "manual"
)

// ThresholdTier is one severity tier within a metric.
type ThresholdTier struct {
	Name        string   `json:"name"`
	Mode        TierMode `json:"mode"`
	Description string   `json:"description"`
	Value       string   `json:"value"`
	Unit        string   `json:"unit"`
	Sustained   string   `json:"sustained"`
}

// ScaleStop is one labeled stop on the threshold scale bar.
type ScaleStop struct {
	Label string `json:"label"`
	Value string `json:"value"`
	Tone  string `json:"tone"`
}

// MetricThresholds groups the tiers and scale for one metric.
type MetricThresholds struct {
	Metric              ThresholdMetric `json:"metric"`
	Label               string          `json:"label"`
	Unit                string          `json:"unit"`
	PerStationOverrides bool            `json:"perStationOverrides"`
	Tiers               []ThresholdTier `json:"tiers"`
	Scale               []ScaleStop     `json:"scale"`
}

// ImpactStation is a station whose state would change if thresholds applied.
type ImpactStation struct {
	Name string `json:"name"`
	Tier string `json:"tier"`
	Tone string `json:"tone"`
	Note string `json:"note,omitempty"`
}

// ThresholdChange is one row of the threshold change history.
type ThresholdChange struct {
	ID     string `json:"id"`
	Change string `json:"change"`
	By     string `json:"by"`
	When   string `json:"when"`
}

// ThresholdImpact is the impact-preview block.
type ThresholdImpact struct {
	Note     string          `json:"note"`
	Stations []ImpactStation `json:"stations"`
}

// ThresholdsPage is the payload for the Alerts & Thresholds screen.
type ThresholdsPage struct {
	Metrics []MetricThresholds `json:"metrics"`
	Impact  ThresholdImpact    `json:"impact"`
	Changes []ThresholdChange  `json:"changes"`
}
