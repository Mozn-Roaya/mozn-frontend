// Command api is the HTTP entrypoint for the MOZN dashboard backend.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/mozn/early-warning-dashboard/server/internal/handler"
	"github.com/mozn/early-warning-dashboard/server/internal/repository"
	"github.com/mozn/early-warning-dashboard/server/internal/service"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	if err := run(logger); err != nil {
		logger.Error("server exited with error", "error", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	// Compose the layers: repository -> service -> handler.
	repo := repository.NewInMemoryRepository()
	dashboard := handler.NewDashboardHandler(service.NewDashboardService(repo), logger)
	admin := handler.NewAdminHandler(service.NewAdminService(repo), logger)

	router := handler.NewRouter(dashboard, admin, logger, handler.Config{
		AllowedOrigins: allowedOrigins(),
	})

	srv := &http.Server{
		Addr:              ":" + port(),
		Handler:           router,
		ReadTimeout:       5 * time.Second,
		ReadHeaderTimeout: 5 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Run the server until an interrupt signal triggers graceful shutdown.
	serverErr := make(chan error, 1)
	go func() {
		logger.Info("api listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErr <- err
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	select {
	case err := <-serverErr:
		return err
	case <-stop:
		logger.Info("shutting down")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return srv.Shutdown(ctx)
	}
}

func port() string {
	if p := os.Getenv("PORT"); p != "" {
		return p
	}
	return "8080"
}

func allowedOrigins() []string {
	if v := os.Getenv("ALLOWED_ORIGINS"); v != "" {
		parts := strings.Split(v, ",")
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		return parts
	}
	return []string{"http://localhost:3000"}
}
