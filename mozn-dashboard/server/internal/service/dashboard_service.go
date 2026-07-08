// Package service holds the business logic that sits between the HTTP handlers
// and the data repositories.
package service

import (
	"context"
	"fmt"

	"github.com/mozn/early-warning-dashboard/server/internal/model"
)

// OverviewReader is the slice of the repository this service depends on,
// declared consumer-side so the data source stays swappable.
type OverviewReader interface {
	Overview(ctx context.Context) (model.DashboardOverview, error)
}

// DashboardService assembles the data shown on the dashboard screen.
type DashboardService struct {
	repo OverviewReader
}

// NewDashboardService wires a service to its data source.
func NewDashboardService(repo OverviewReader) *DashboardService {
	return &DashboardService{repo: repo}
}

// Overview returns the full dashboard payload.
func (s *DashboardService) Overview(ctx context.Context) (model.DashboardOverview, error) {
	overview, err := s.repo.Overview(ctx)
	if err != nil {
		return model.DashboardOverview{}, fmt.Errorf("load dashboard overview: %w", err)
	}
	return overview, nil
}
