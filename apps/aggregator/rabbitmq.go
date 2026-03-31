package main

import (
	"fmt"
	"log"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

const queueName = "activity-events"

// ConnectRabbitMQ establishes a connection to CloudAMQP,
// opens a channel, declares the durable work queue,
// and returns a delivery channel for consuming messages.
func ConnectRabbitMQ() (*amqp.Connection, <-chan amqp.Delivery, error) {
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		return nil, nil, fmt.Errorf("RABBITMQ_URL not set")
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		return nil, nil, fmt.Errorf("amqp dial: %w", err)
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, nil, fmt.Errorf("amqp channel: %w", err)
	}

	// Declare the same durable queue the Producer publishes to.
	_, err = ch.QueueDeclare(
		queueName,
		true,  // durable
		false, // auto-delete
		false, // exclusive
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, nil, fmt.Errorf("queue declare: %w", err)
	}

	// Prefetch 1 — process one message at a time.
	// This ensures fair dispatch if we ever scale to multiple consumers.
	if err := ch.Qos(1, 0, false); err != nil {
		ch.Close()
		conn.Close()
		return nil, nil, fmt.Errorf("qos: %w", err)
	}

	// Start consuming. Returns a Go channel that delivers messages.
	deliveries, err := ch.Consume(
		queueName,
		"",    // consumer tag (auto-generated)
		false, // auto-ack = false (we ACK manually after processing)
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,   // args
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, nil, fmt.Errorf("consume: %w", err)
	}

	log.Printf("✅ Connected to RabbitMQ Consumer (queue: %s, prefetch: 1)", queueName)
	return conn, deliveries, nil
}
