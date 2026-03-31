package main

import "time"

// RawLog mirrors the shape of documents in the `activity_logs` MongoDB collection.
// BSON tags match the explicit bson tags on the proto-generated ActivityFrame struct
// in apps/ingestor/proto/activity.pb.go (snake_case).
type RawLog struct {
	UUID        string `bson:"uuid"`
	DeviceID    string `bson:"device_id"`
	AppName     string `bson:"app_name"`
	WindowTitle string `bson:"window_title"`
	StartTime   int64  `bson:"start_time"`
	DurationMs  int64  `bson:"duration_ms"`
	IsIdle      bool   `bson:"is_idle"`
}

// Session represents a compressed work period: many heartbeats collapsed
// into a single meaningful unit like "45 mins in VS Code".
type Session struct {
	DeviceID       string    `bson:"device_id"`
	AppName        string    `bson:"app_name"`
	StartTime      int64     `bson:"start_time"`
	EndTime        int64     `bson:"end_time"`
	DurationMs     int64     `bson:"duration_ms"`
	HeartbeatCount int       `bson:"heartbeat_count"`
	CreatedAt      time.Time `bson:"created_at"`
}

// AggregatorState persists the watermark cursor so the aggregator knows
// where it left off across restarts. Stored in the `aggregator_state` collection.
type AggregatorState struct {
	ID                string `bson:"_id"`
	LastProcessedTime int64  `bson:"last_processed_time"`
}
