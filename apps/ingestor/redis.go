package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// ConnectRedis initializes a Redis client from the REDIS_URL env var.
// Supports both standard Redis URIs and Redis Cloud/Upstash URIs.
//
// If REDIS_URL is not set, falls back to localhost:6379 for local dev.
func ConnectRedis() (*redis.Client, error) {
	redisURL := os.Getenv("REDIS_URL")

	var opts *redis.Options
	var err error

	if redisURL != "" {
		// Parse connection string (e.g., redis://:password@host:port/0)
		opts, err = redis.ParseURL(redisURL)
		if err != nil {
			return nil, fmt.Errorf("redis parse URL: %w", err)
		}
	} else {
		// Local dev fallback
		opts = &redis.Options{
			Addr: "localhost:6379",
			DB:   0,
		}
	}

	// Constrain the pool for free-tier Redis Cloud (30 conn limit).
	// Default is 10 per client — way too aggressive for our use case.
	opts.PoolSize = 3
	opts.MinIdleConns = 1
	opts.ConnMaxIdleTime = 30 * time.Second

	client := redis.NewClient(opts)

	// Verify connectivity
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}

	log.Println("✅ Connected to Redis")
	return client, nil
}
