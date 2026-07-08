package handler_test

import (
	"bytes"
	"flag"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/mozn/early-warning-dashboard/server/internal/handler"
	"github.com/mozn/early-warning-dashboard/server/internal/repository"
	"github.com/mozn/early-warning-dashboard/server/internal/service"
)

// update regenerates the golden files. Run: go test ./... -update
var update = flag.Bool("update", false, "update golden files")

// newTestRouter wires the full stack exactly as cmd/api does, so the tests
// exercise routing + middleware + handler + service + repository together
// against the seeded in-memory data.
func newTestRouter() http.Handler {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))
	repo := repository.NewInMemoryRepository()
	dashboard := handler.NewDashboardHandler(service.NewDashboardService(repo), logger)
	admin := handler.NewAdminHandler(service.NewAdminService(repo), logger)
	return handler.NewRouter(dashboard, admin, logger, handler.Config{
		AllowedOrigins: []string{"http://localhost:3000"},
	})
}

// TestEndpointsGolden locks every GET endpoint's status, content-type and exact
// JSON body against a golden file. This is the characterization safety net for
// the server refactors (handler split, error wrapping) — the response bytes
// must stay identical. Regenerate intentionally with: go test ./... -update
func TestEndpointsGolden(t *testing.T) {
	router := newTestRouter()

	cases := []struct {
		name string
		path string
	}{
		{"healthz", "/healthz"},
		{"dashboard_overview", "/api/v1/dashboard/overview"},
		{"stations", "/api/v1/stations"},
		{"alert_inbox", "/api/v1/alert-inbox"},
		{"thresholds", "/api/v1/thresholds"},
		{"users", "/api/v1/users"},
		{"history_alerts", "/api/v1/history/alerts"},
		{"history_activity", "/api/v1/history/activity"},
		{"settings", "/api/v1/settings"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, tc.path, nil)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200", rec.Code)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json; charset=utf-8" {
				t.Errorf("content-type = %q, want %q", ct, "application/json; charset=utf-8")
			}

			got := rec.Body.Bytes()
			goldenPath := filepath.Join("testdata", tc.name+".golden.json")

			if *update {
				if err := os.MkdirAll("testdata", 0o755); err != nil {
					t.Fatalf("mkdir testdata: %v", err)
				}
				if err := os.WriteFile(goldenPath, got, 0o644); err != nil {
					t.Fatalf("write golden: %v", err)
				}
				return
			}

			want, err := os.ReadFile(goldenPath)
			if err != nil {
				t.Fatalf("read golden (run `go test ./... -update` to create): %v", err)
			}
			if !bytes.Equal(got, want) {
				t.Errorf("response body differs from golden\n got: %s\nwant: %s", got, want)
			}
		})
	}
}

// TestCORSAllowsConfiguredOrigin characterizes the CORS middleware: a request
// from an allow-listed origin is reflected back with a Vary header. Locks the
// header contract ahead of the handler-package split.
func TestCORSAllowsConfiguredOrigin(t *testing.T) {
	router := newTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:3000" {
		t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, "http://localhost:3000")
	}
	if got := rec.Header().Get("Vary"); got != "Origin" {
		t.Errorf("Vary = %q, want %q", got, "Origin")
	}
}

// TestCORSPreflight characterizes the OPTIONS preflight short-circuit.
func TestCORSPreflight(t *testing.T) {
	router := newTestRouter()

	req := httptest.NewRequest(http.MethodOptions, "/api/v1/stations", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Errorf("preflight status = %d, want 204", rec.Code)
	}
}

// TestMethodNotAllowed characterizes Go 1.22 method-aware routing: a non-GET on
// a GET-only pattern is rejected. Guards the routing contract during the split.
func TestMethodNotAllowed(t *testing.T) {
	router := newTestRouter()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/stations", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want 405", rec.Code)
	}
}

// TestUnknownRouteNotFound characterizes the default 404 for unregistered paths.
func TestUnknownRouteNotFound(t *testing.T) {
	router := newTestRouter()

	req := httptest.NewRequest(http.MethodGet, "/api/v1/does-not-exist", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404", rec.Code)
	}
}
