package main

import "time"

const (
	// GapTolerance is the maximum allowed silence between two heartbeats
	// before they are considered separate sessions. Industry standard: 5 minutes.
	GapTolerance = 5 * time.Minute

	// TickInterval controls how often the aggregator polls for new logs.
	TickInterval = 30 * time.Second

	// SafetyBuffer prevents the aggregator from processing logs that the
	// Ingestor might still be writing. This avoids race conditions with
	// in-flight InsertMany operations.
	SafetyBuffer = 30 * time.Second

	// BatchSize caps the number of logs fetched per tick to prevent
	// memory pressure on large backlogs.
	BatchSize = 5000

	// MongoDB connection defaults. Override via environment variables in production.
	DefaultMongoURI = "mongodb://localhost:27017"
	DatabaseName    = "chronos_sentinel"
)
