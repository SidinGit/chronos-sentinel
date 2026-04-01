package main

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"syscall"
)

// ActivityFrame represents the incoming JSON message from RabbitMQ.
// It matches the Protobuf schema the Producer sent.
type ActivityFrame struct {
	Uuid        string `json:"uuid"`
	DeviceId    string `json:"device_id"`
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	IsIdle      bool   `json:"is_idle"`
	StartTime   int64  `json:"start_time"`
}

func main() {
	loadEnv()
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Println("🧠 Chronos Consumer (Aggregator) starting...")

	// 1. Connect to MongoDB
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = os.Getenv("MONGODB_URI")
	}
	if mongoURI == "" {
		mongoURI = DefaultMongoURI
	}
	store, err := NewStore(mongoURI)
	if err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}
	log.Println("✅ Connected to MongoDB")

	// 2. Connect to RabbitMQ
	amqpConn, deliveries, err := ConnectRabbitMQ()
	if err != nil {
		log.Fatalf("❌ Failed to connect to RabbitMQ: %v", err)
	}
	defer amqpConn.Close()

	// 3. Graceful shutdown handler
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 4. Start consuming in a dedicated goroutine
	go func() {
		log.Printf("📥 Waiting for activity events...")
		for msg := range deliveries {
			var frame ActivityFrame
			if err := json.Unmarshal(msg.Body, &frame); err != nil {
				log.Printf("⚠️ Failed to unmarshal message: %v", err)
				msg.Reject(false) // Dump invalid messages
				continue
			}

			// Upsert to MongoDB using the Session duration strategy
			err := store.UpsertSession(frame)
			if err != nil {
				log.Printf("❌ Failed to upsert session: %v", err)
				// Put back in queue if the DB is down
				msg.Nack(false, true)
				continue
			}

			// Success! Acknowledge message removing it from the queue
			msg.Ack(false)
			log.Printf("✔️ Processed heartbeat for [%s | %s]", frame.AppName, frame.WindowTitle)
		}
	}()

	<-quit
	log.Println("🛑 Shutting down Consumer...")
}
