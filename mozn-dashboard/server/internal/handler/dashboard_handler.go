// Package handler contains the HTTP layer: request routing, the dashboard
// endpoint, JSON encoding and shared middleware.
package handler

import (
	"context"
	"log/slog"
	"net/http"

	"github.com/mozn/early-warning-dashboard/server/internal/model"
)

// OverviewProvider is the slice of the service this handler depends on.
type OverviewProvider interface {
	Overview(ctx context.Context) (model.DashboardOverview, error)
}

// DashboardHandler serves dashboard-related endpoints.
type DashboardHandler struct {
	service OverviewProvider
	logger  *slog.Logger
}

// NewDashboardHandler builds a handler around the given service.
func NewDashboardHandler(service OverviewProvider, logger *slog.Logger) *DashboardHandler {
	return &DashboardHandler{service: service, logger: logger}
}

// Register attaches the dashboard routes to the mux.
func (h *DashboardHandler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/v1/dashboard/overview", h.Overview)
}

// Overview handles GET /api/v1/dashboard/overview.
func (h *DashboardHandler) Overview(w http.ResponseWriter, r *http.Request) {
	overview, err := h.service.Overview(r.Context())
	if err != nil {
		h.logger.Error("failed to load overview", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to load dashboard overview")
		return
	}
	writeJSON(w, http.StatusOK, overview)
}
