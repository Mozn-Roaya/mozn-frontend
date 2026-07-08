package handler

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/mozn/early-warning-dashboard/server/internal/model"
)

// AdminProvider is the slice of the admin service the handler depends on.
type AdminProvider interface {
	Stations(ctx context.Context) (model.StationsPage, error)
	AlertInbox(ctx context.Context) (model.AlertInboxPage, error)
	Thresholds(ctx context.Context) (model.ThresholdsPage, error)
	Users(ctx context.Context) (model.UsersPage, error)
	AlertHistory(ctx context.Context) (model.AlertHistoryPage, error)
	ActivityLog(ctx context.Context) (model.ActivityLogPage, error)
	Settings(ctx context.Context) (model.SettingsPage, error)
}

// AdminHandler serves the endpoints backing the admin screens.
type AdminHandler struct {
	service AdminProvider
	logger  *slog.Logger
}

// NewAdminHandler builds an admin handler around the given service.
func NewAdminHandler(service AdminProvider, logger *slog.Logger) *AdminHandler {
	return &AdminHandler{service: service, logger: logger}
}

// Register attaches the admin routes to the mux. Every route loads one service
// page and serves it as JSON through jsonEndpoint.
func (h *AdminHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/stations", jsonEndpoint(h.logger, "stations", h.service.Stations))
	mux.HandleFunc("GET /api/v1/alert-inbox", jsonEndpoint(h.logger, "alert inbox", h.service.AlertInbox))
	mux.HandleFunc("GET /api/v1/thresholds", jsonEndpoint(h.logger, "thresholds", h.service.Thresholds))
	mux.HandleFunc("GET /api/v1/users", jsonEndpoint(h.logger, "users", h.service.Users))
	mux.HandleFunc("GET /api/v1/history/alerts", jsonEndpoint(h.logger, "alert history", h.service.AlertHistory))
	mux.HandleFunc("GET /api/v1/history/activity", jsonEndpoint(h.logger, "activity log", h.service.ActivityLog))
	mux.HandleFunc("GET /api/v1/settings", jsonEndpoint(h.logger, "settings", h.service.Settings))
}

// jsonEndpoint adapts a context-taking loader into an http.HandlerFunc that
// writes the loaded value as JSON, logging and returning 500 on failure. name
// labels the log line and error message.
func jsonEndpoint[T any](
	logger *slog.Logger,
	name string,
	load func(context.Context) (T, error),
) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		data, err := load(r.Context())
		if err != nil {
			logger.Error("failed to load "+name, "error", err)
			writeError(w, http.StatusInternalServerError, "failed to load "+name)
			return
		}
		writeJSON(w, http.StatusOK, data)
	}
}
