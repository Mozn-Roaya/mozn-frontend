// Package repository provides data sources for the dashboard. The current
// implementation is an empty, in-memory placeholder store; swapping in a
// database means providing the same Overview method the dashboard service
// expects (see service.OverviewReader).
package repository

import (
	"context"

	"github.com/mozn/early-warning-dashboard/server/internal/model"
)

// InMemoryRepository serves empty, read-only dashboard data as a placeholder
// until a real data source is wired in.
type InMemoryRepository struct {
	overview model.DashboardOverview
}

// NewInMemoryRepository builds a repository with an empty placeholder payload.
func NewInMemoryRepository() *InMemoryRepository {
	return &InMemoryRepository{overview: seedOverview()}
}

// Overview returns the placeholder (currently empty) dashboard payload.
func (r *InMemoryRepository) Overview(_ context.Context) (model.DashboardOverview, error) {
	return r.overview, nil
}

func seedOverview() model.DashboardOverview {
	return model.DashboardOverview{
		Header:         model.DashboardHeader{Title: "", StatusLabel: "", Live: false},
		Stats:          []model.StatCard{},
		Map:            model.StationHealthMap{Title: "", Subtitle: "", CoverageNote: "", Stations: []model.MapStation{}},
		NeedsAttention: model.NeedsAttention{OpenCount: 0, Items: []model.AttentionItem{}},
		RecentActivity: []model.ActivityItem{},
		Regions:        []model.RegionStat{},
	}
}
