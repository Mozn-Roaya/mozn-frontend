package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
)

// writeJSON encodes payload as JSON with the given status code. Encoding into a
// buffer first means a (theoretical) encode failure is reported as a clean 500
// instead of a second WriteHeader after the status line was already written.
func writeJSON(w http.ResponseWriter, status int, payload any) {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(payload); err != nil {
		http.Error(w, `{"error":"failed to encode response"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_, _ = w.Write(buf.Bytes())
}

// writeError writes a JSON error envelope: {"error": message}.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
