package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
	amqp "github.com/rabbitmq/amqp091-go"
	pb "github.com/siddhartha/chronos-sentinel/ingestor/proto"
)

// FeedEntry is what gets stored in the Redis feed list
// and eventually read by the Next.js dashboard for the "Recent Sessions" table.
type FeedEntry struct {
	DeviceID    string `json:"device_id"`
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	IsIdle      bool   `json:"is_idle"`
	Timestamp   int64  `json:"timestamp"`
}

// Worker publishes activity events to RabbitMQ and writes
// the live feed to Redis. It does NOT write to MongoDB.
type Worker struct {
	amqpChan *amqp.Channel
	rdb      *redis.Client
}

func NewWorker(amqpChan *amqp.Channel, rdb *redis.Client) *Worker {
	return &Worker{
		amqpChan: amqpChan,
		rdb:      rdb,
	}
}

func (w *Worker) Start(ch chan *pb.ActivityFrame) {
	for frame := range ch {
		w.process(frame)
	}
}

func (w *Worker) process(frame *pb.ActivityFrame) {
	ctx := context.Background()

	// 1. PUBLISH TO RABBITMQ — Consumer will pick this up and upsert MongoDB
	body, err := json.Marshal(frame)
	if err != nil {
		log.Printf("Error marshaling frame: %v", err)
		return
	}

	err = w.amqpChan.PublishWithContext(ctx,
		"",        // default exchange
		queueName, // routing key = queue name
		false,     // mandatory
		false,     // immediate
		amqp.Publishing{
			ContentType:  "application/json",
			DeliveryMode: amqp.Persistent, // survives RabbitMQ restart
			Body:         body,
		},
	)
	if err != nil {
		log.Printf("Error publishing to RabbitMQ: %v", err)
	}

	// 2. WRITE TO REDIS FEED — Dashboard reads this for "Recent Sessions" (ephemeral)
	feedKey := "feed:" + frame.DeviceId
	entry := FeedEntry{
		DeviceID:    frame.DeviceId,
		AppName:     frame.AppName,
		WindowTitle: frame.WindowTitle,
		IsIdle:      frame.IsIdle,
		Timestamp:   time.Now().UnixMilli(),
	}
	feedData, _ := json.Marshal(entry)

	// LPUSH adds to front of list, LTRIM keeps only the latest 50
	w.rdb.LPush(ctx, feedKey, feedData)
	w.rdb.LTrim(ctx, feedKey, 0, 49)
	// Set a TTL on the feed key so it auto-expires if device goes offline
	w.rdb.Expire(ctx, feedKey, 5*time.Minute)
}