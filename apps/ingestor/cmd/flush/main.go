package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Load .env from project root
	godotenv.Load("../../.env")

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		log.Fatal("REDIS_URL not set")
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse URL: %v", err)
	}
	opts.PoolSize = 1

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Ping
	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("Ping failed: %v", err)
	}
	fmt.Println("✅ Connected to Redis Cloud")

	// 2. Show current client count
	info, err := client.ClientList(ctx).Result()
	if err != nil {
		log.Fatalf("CLIENT LIST failed: %v", err)
	}
	fmt.Printf("\n📋 Active clients:\n%s\n", info)

	// 3. Flush all data (pulse cache, pairing codes — all ephemeral)
	if err := client.FlushAll(ctx).Err(); err != nil {
		log.Fatalf("FLUSHALL failed: %v", err)
	}
	fmt.Println("🧹 FLUSHALL complete — all keys cleared")

	// 4. Show pool stats
	stats := client.PoolStats()
	fmt.Printf("📊 Pool: Hits=%d Misses=%d Timeouts=%d TotalConns=%d IdleConns=%d\n",
		stats.Hits, stats.Misses, stats.Timeouts, stats.TotalConns, stats.IdleConns)

	client.Close()
	fmt.Println("✅ Done. Zombie connections will expire on their own within ~60s.")
}
