package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"net/http"

	pb "github.com/siddhartha/chronos-sentinel/ingestor/proto"
)

type telemetryServer struct {
	pb.UnimplementedTelemetryServer
	sessionChan chan *pb.ActivityFrame
	pulse       *PulseCache
}

func (s *telemetryServer) StreamLogs(stream pb.Telemetry_StreamLogsServer) error {
	for {
		frame, err := stream.Recv()
		if err != nil {
			return err
		}

		// Update Pulse (Redis) state for live tracking
		err = s.pulse.Update(context.Background(), frame)
		if err != nil {
			log.Printf("Pulse Update Error: %v", err)
		}

		// Push the raw frame to the worker.
		// The worker publishes to RabbitMQ and updates the Redis feed.
		s.sessionChan <- frame

		// Immediate Ack
		if err := stream.Send(&pb.SyncResponse{
			LastProcessedUuid: frame.Uuid,
			Success:           true,
		}); err != nil {
			return err
		}
	}
}

// authInterceptor validates the API key from gRPC metadata on every unary call.
// Stream RPCs (like StreamLogs) should use a stream interceptor variant in production.
func authInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// Whitelist pairing endpoints since the device has no API Key yet
	if info.FullMethod == "/activity.AuthService/InitiatePairing" ||
		info.FullMethod == "/activity.AuthService/CheckPairingStatus" {
		return handler(ctx, req)
	}

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok || len(md["authorization"]) == 0 {
		return nil, status.Errorf(codes.Unauthenticated, "API Key missing")
	}
	// TODO: Validate key against DB
	return handler(ctx, req)
}

func main() {
	loadEnv()
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Println("🚀 Chronos Ingestor starting...")

	// ── RabbitMQ ──────────────────────────────────────────────
	amqpConn, amqpChan, err := ConnectRabbitMQ()
	if err != nil {
		log.Fatalf("❌ Failed to connect to RabbitMQ: %v", err)
	}
	defer amqpConn.Close()
	defer amqpChan.Close()

	// ── Redis ────────────────────────────────────────────────
	rdb, err := ConnectRedis()
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}

	pulseCache := NewPulseCache(rdb)

	// ── Worker Pool (Publisher & Feed Writer) ─────────────────
	sessionChan := make(chan *pb.ActivityFrame, 1000)
	worker := NewWorker(amqpChan, rdb)
	go worker.Start(sessionChan)

	// ── gRPC Server ──────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "50051"
	}
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("❌ Failed to listen on :%s: %v", port, err)
	}

	s := grpc.NewServer(
		grpc.UnaryInterceptor(authInterceptor),
	)
	pb.RegisterTelemetryServer(s, &telemetryServer{
		sessionChan: sessionChan,
		pulse:       pulseCache,
	})
	pb.RegisterAuthServiceServer(s, NewAuthServer(rdb))

	// ── HTTP Health Check (For Render / UptimeRobot) ─────────
	go func() {
		http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("HEALTHY"))
		})
		log.Println("🏥 Health check server running on :8080")
		if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Printf("❌ Health check server failed: %v", err)
		}
	}()

	// ── Graceful Shutdown ────────────────────────────────────
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("🛑 Shutting down ingestor...")
		s.GracefulStop()
	}()

	log.Println("⏱️  Go Nexus Ingestor running on :50051...")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("❌ Failed to serve: %v", err)
	}
}
