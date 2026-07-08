package service

import (
	"context"
	"fmt"

	"github.com/mozn/early-warning-dashboard/server/internal/model"
)

// AdminRepository is the data source for the admin screens.
type AdminRepository interface {
	Stations(ctx context.Context) (model.StationsPage, error)
	AlertInbox(ctx context.Context) (model.AlertInboxPage, error)
	Thresholds(ctx context.Context) (model.ThresholdsPage, error)
	Users(ctx context.Context) (model.UsersPage, error)
	AlertHistory(ctx context.Context) (model.AlertHistoryPage, error)
	ActivityLog(ctx context.Context) (model.ActivityLogPage, error)
	Settings(ctx context.Context) (model.SettingsPage, error)
}

// AdminService serves the data behind the admin navigation screens.
type AdminService struct {
	repo AdminRepository
}

// NewAdminService wires the admin service to its data source.
func NewAdminService(repo AdminRepository) *AdminService {
	return &AdminService{repo: repo}
}

// Stations returns the stations admin page.
func (s *AdminService) Stations(ctx context.Context) (model.StationsPage, error) {
	return loadPage(ctx, "stations", s.repo.Stations)
}

// AlertInbox returns the alert-inbox admin page.
func (s *AdminService) AlertInbox(ctx context.Context) (model.AlertInboxPage, error) {
	return loadPage(ctx, "alert inbox", s.repo.AlertInbox)
}

// Thresholds returns the thresholds admin page.
func (s *AdminService) Thresholds(ctx context.Context) (model.ThresholdsPage, error) {
	return loadPage(ctx, "thresholds", s.repo.Thresholds)
}

// Users returns the users admin page.
func (s *AdminService) Users(ctx context.Context) (model.UsersPage, error) {
	return loadPage(ctx, "users", s.repo.Users)
}

// AlertHistory returns the alert-history admin page.
func (s *AdminService) AlertHistory(ctx context.Context) (model.AlertHistoryPage, error) {
	return loadPage(ctx, "alert history", s.repo.AlertHistory)
}

// ActivityLog returns the activity-log admin page.
func (s *AdminService) ActivityLog(ctx context.Context) (model.ActivityLogPage, error) {
	return loadPage(ctx, "activity log", s.repo.ActivityLog)
}

// Settings returns the settings admin page.
func (s *AdminService) Settings(ctx context.Context) (model.SettingsPage, error) {
	return loadPage(ctx, "settings", s.repo.Settings)
}

// loadPage runs load and wraps any failure with the resource name so callers
// get an error like "load stations: <cause>".
func loadPage[T any](
	ctx context.Context,
	resource string,
	load func(context.Context) (T, error),
) (T, error) {
	page, err := load(ctx)
	if err != nil {
		var zero T
		return zero, fmt.Errorf("load %s: %w", resource, err)
	}
	return page, nil
}
