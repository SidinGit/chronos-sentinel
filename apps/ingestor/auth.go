package main

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/redis/go-redis/v9"
	pb "github.com/siddhartha/chronos-sentinel/ingestor/proto"
)

const (
	// pairingTTL is how long a pairing code stays valid in Redis.
	// Matches the ExpiresIn value sent to the agent.
	pairingTTL = 5 * time.Minute

	// redisPairingPrefix namespaces pairing keys to avoid collisions.
	redisPairingPrefix = "pairing:"
)

// PairingState holds the state of a pending device pairing.
// Stored as JSON in Redis with a TTL — no manual cleanup needed.
type PairingState struct {
	UserCode string `json:"user_code"`
	IsPaired bool   `json:"is_paired"`
	ApiKey   string `json:"api_key,omitempty"`
}

type authServer struct {
	pb.UnimplementedAuthServiceServer
	rdb *redis.Client
}

// NewAuthServer creates an auth server backed by Redis.
func NewAuthServer(rdb *redis.Client) *authServer {
	return &authServer{rdb: rdb}
}

// InitiatePairing generates a 6-digit code, stores it in Redis with a 5-minute TTL,
// and returns the code to the desktop agent. The agent displays this code to the user,
// who then enters it on the web dashboard to complete the link.
func (s *authServer) InitiatePairing(ctx context.Context, req *pb.PairingRequest) (*pb.PairingResponse, error) {
	code := generateRandomCode()

	state := PairingState{UserCode: code}
	data, err := json.Marshal(state)
	if err != nil {
		return nil, fmt.Errorf("marshal pairing state: %w", err)
	}

	key := redisPairingPrefix + req.HardwareId
	if err := s.rdb.Set(ctx, key, data, pairingTTL).Err(); err != nil {
		return nil, fmt.Errorf("redis set pairing: %w", err)
	}

	return &pb.PairingResponse{
		UserCode:  code,
		ExpiresIn: int32(pairingTTL.Seconds()),
	}, nil
}

// CheckPairingStatus is polled by the desktop agent after InitiatePairing.
// The web dashboard's /api/auth/pair endpoint sets IsPaired=true and ApiKey
// on the Redis key when the user submits the correct code.
func (s *authServer) CheckPairingStatus(ctx context.Context, req *pb.PairingRequest) (*pb.TokenResponse, error) {
	key := redisPairingPrefix + req.HardwareId

	data, err := s.rdb.Get(ctx, key).Bytes()
	if err == redis.Nil {
		// Key expired or never existed
		return &pb.TokenResponse{Authenticated: false}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("redis get pairing: %w", err)
	}

	var state PairingState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, fmt.Errorf("unmarshal pairing state: %w", err)
	}

	if state.IsPaired {
		// Pairing complete — clean up the key
		s.rdb.Del(ctx, key)

		return &pb.TokenResponse{
			Authenticated: true,
			ApiKey:        state.ApiKey,
		}, nil
	}

	return &pb.TokenResponse{Authenticated: false}, nil
}

// generateRandomCode produces a 6-digit numeric code for device pairing.
// Uses crypto/rand for unpredictable output.
func generateRandomCode() string {
	n, err := rand.Int(rand.Reader, big.NewInt(999999))
	if err != nil {
		return "000000"
	}
	return fmt.Sprintf("%06d", n.Int64())
}