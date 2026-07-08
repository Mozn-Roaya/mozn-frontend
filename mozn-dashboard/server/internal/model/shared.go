package model

// FilterTab is a labeled, optionally-counted filter pill used by list screens.
type FilterTab struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Count int    `json:"count"`
}
