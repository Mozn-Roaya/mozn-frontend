package handler

import (
	"log/slog"
	"net/http"
)

// Config controls router behavior.
type Config struct {
	// AllowedOrigins is the CORS allow-list for browser requests.
	AllowedOrigins []string
}

// NewRouter builds the HTTP handler with routes and middleware applied.
func NewRouter(
	dashboard *DashboardHandler,
	admin *AdminHandler,
	logger *slog.Logger,
	cfg Config,
) http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", health)
	dashboard.Register(mux)
	admin.Register(mux)

	return recoverMiddleware(logger)(
		logMiddleware(logger)(
			corsMiddleware(cfg.AllowedOrigins)(mux),
		),
	)
}

// health responds with a liveness payload for GET /healthz.
func health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
