package main

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Store encapsulates all MongoDB operations for the aggregator.
// It owns a single *mongo.Database connection, reused across messages.
type Store struct {
	db *mongo.Database
}

// NewStore connects to MongoDB, pings to verify, and returns a Store
// scoped to the chronos_sentinel database.
func NewStore(uri string) (*Store, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("mongo connect: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("mongo ping: %w", err)
	}

	// DatabaseName is defined in config.go
	return &Store{db: client.Database(DatabaseName)}, nil
}

// UpsertSession takes an incoming ActivityFrame from RabbitMQ and updates
// the corresponding session in MongoDB based on the triple-tuple.
func (s *Store) UpsertSession(frame ActivityFrame) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	coll := s.db.Collection("sessions")

	// Partition by day string to keep tracking reset per day
	dateStr := time.UnixMilli(frame.StartTime).UTC().Format("2006-01-02")

	filter := bson.M{
		"device_id":    frame.DeviceId,
		"app_name":     frame.AppName,
		"window_title": frame.WindowTitle,
		"date":         dateStr,
	}

	update := bson.M{
		"$inc": bson.M{
			"duration_ms": 5000, // 5s heartbeat per the new plan
		},
		"$set": bson.M{
			"last_seen": frame.StartTime,
			"is_idle":   frame.IsIdle,
		},
		"$setOnInsert": bson.M{
			"created_at": time.Now(),
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := coll.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("upsert session failed: %w", err)
	}

	return nil
}
