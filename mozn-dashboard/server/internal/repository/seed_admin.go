package repository

import (
	"context"

	"github.com/mozn/early-warning-dashboard/server/internal/model"
)

// The admin screens are served by an empty, in-memory placeholder repository.
// Each method returns a freshly-built empty payload for its screen until a
// real data source is wired in.

func (r *InMemoryRepository) Stations(_ context.Context) (model.StationsPage, error) {
	return model.StationsPage{
		Total: 0, RegionCount: 0, NeedAttention: 0,
		Filters: []model.FilterTab{}, Groups: []model.StationRegionGroup{},
	}, nil
}

func (r *InMemoryRepository) AlertInbox(_ context.Context) (model.AlertInboxPage, error) {
	return model.AlertInboxPage{
		AvgAck: "", SLANote: "",
		Filters: []model.FilterTab{}, Items: []model.InboxItem{},
	}, nil
}

func (r *InMemoryRepository) Thresholds(_ context.Context) (model.ThresholdsPage, error) {
	return model.ThresholdsPage{
		Metrics: []model.MetricThresholds{},
		Impact:  model.ThresholdImpact{Note: "", Stations: []model.ImpactStation{}},
		Changes: []model.ThresholdChange{},
	}, nil
}

func (r *InMemoryRepository) Users(_ context.Context) (model.UsersPage, error) {
	return model.UsersPage{
		AdminCount: 0, GovCount: 0,
		Filters: []model.FilterTab{}, Users: []model.UserRow{},
	}, nil
}

func (r *InMemoryRepository) AlertHistory(_ context.Context) (model.AlertHistoryPage, error) {
	return model.AlertHistoryPage{
		Ranges: []string{}, Regions: []string{}, Types: []string{}, Severities: []string{},
		Rows: []model.AlertHistoryRow{},
	}, nil
}

func (r *InMemoryRepository) ActivityLog(_ context.Context) (model.ActivityLogPage, error) {
	return model.ActivityLogPage{
		Categories: []string{}, Users: []string{}, Groups: []model.ActivityDayGroup{},
	}, nil
}

func (r *InMemoryRepository) Settings(_ context.Context) (model.SettingsPage, error) {
	return model.SettingsPage{
		Notifications: []model.NotificationPref{}, ValidationNote: "",
		ValidationRules: []model.ValidationRule{},
	}, nil
}
