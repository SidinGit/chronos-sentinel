package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	pb "github.com/siddhartha/chronos-sentinel/ingestor/proto"
)

const (
	pulseTTL         = 15 * time.Second
	redisPulsePrefix = "pulse:"
)

// DevicePulse represents the real-time state of a device.
// Cached in Redis for sub-millisecond reads by the Dashboard Pulse API.
type DevicePulse struct {
	DeviceID    string `json:"device_id"`
	AppName     string `json:"app_name"`
	WindowTitle string `json:"window_title"`
	IsIdle      bool   `json:"is_idle"`
	LastSeen    int64  `json:"last_seen"`
}

type PulseCache struct {
	rdb *redis.Client
}

func NewPulseCache(rdb *redis.Client) *PulseCache {
	return &PulseCache{rdb: rdb}
}

// Update writes the latest heartbeat for a device to Redis.
// v3: Simplified — no more SessionID tracking. The Consumer handles session identity.
func (p *PulseCache) Update(ctx context.Context, frame *pb.ActivityFrame) error {
	key := redisPulsePrefix + frame.DeviceId

	pulse := DevicePulse{
		DeviceID:    frame.DeviceId,
		AppName:     frame.AppName,
		WindowTitle: frame.WindowTitle,
		IsIdle:      frame.IsIdle,
		LastSeen:    time.Now().UnixMilli(),
	}

	data, err := json.Marshal(pulse)
	if err != nil {
		return fmt.Errorf("marshal pulse: %w", err)
	}

	return p.rdb.Set(ctx, key, data, pulseTTL).Err()
}

// Get retrieves the current activity for a specific device.
// Returns nil if the device is offline (key expired).
func (p *PulseCache) Get(ctx context.Context, deviceID string) (*DevicePulse, error) {
	key := redisPulsePrefix + deviceID

	data, err := p.rdb.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("redis get pulse: %w", err)
	}

	var pulse DevicePulse
	if err := json.Unmarshal(data, &pulse); err != nil {
		return nil, fmt.Errorf("unmarshal pulse: %w", err)
	}

	return &pulse, nil
}
