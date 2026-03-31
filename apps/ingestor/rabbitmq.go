package main

import (
	"fmt"
	"log"
	"os"

	amqp "github.com/rabbitmq/amqp091-go"
)

const queueName = "activity-events"

// ConnectRabbitMQ establishes a connection to CloudAMQP,
// opens a channel, and declares the durable work queue.
// Returns the connection and channel for the caller to use.
func ConnectRabbitMQ() (*amqp.Connection, *amqp.Channel, error) {
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

	// Declare a durable queue. If it already exists, this is a no-op.
	// Durable = survives RabbitMQ restarts.
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

	log.Printf("✅ Connected to RabbitMQ (queue: %s)", queueName)
	return conn, ch, nil
}
