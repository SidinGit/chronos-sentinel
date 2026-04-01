# Production Deployment Guide

## 1. Dashboard (`apps/web`) — Vercel

Project settings:

- Root directory: `apps/web`
- Framework: `Next.js`
- Install command: `pnpm install`
- Build command: `pnpm turbo build --filter=@chronos/web`
- Output directory: `.next`

Required environment variables:

- `MONGODB_URI` (recommended)
- `REDIS_URL`
- `RABBITMQ_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Supported aliases:

- `MONGODB_URI` or `MONGO_URI`

Optional environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Notes:

- `apps/web` uses `MONGODB_URI || MONGO_URI` for the Mongo connection.
- NextAuth requires `NEXTAUTH_SECRET` and `NEXTAUTH_URL` at runtime.

---

## 2. Ingestor (`apps/ingestor`) — Koyeb

Deployment type: Docker

- Dockerfile path: `apps/ingestor/Dockerfile`
- Exposed port: `50051`

Required environment variables:

- `PORT=50051`
- `REDIS_URL`
- `RABBITMQ_URL`

Notes:

- `apps/ingestor` is a gRPC service and listens on `PORT` (default `50051`).
- It does not require MongoDB.
- Use TCP/gRPC health checks on port `50051` if Koyeb supports them.

---

## 3. Aggregator (`apps/aggregator`) — Railway

Deployment type: Docker

- Dockerfile path: `apps/aggregator/Dockerfile`
- No public port required (background worker)

Required environment variables:

- `MONGODB_URI` or `MONGO_URI`
- `RABBITMQ_URL`

Notes:

- `apps/aggregator` runs as a worker and consumes RabbitMQ messages.
- It connects to MongoDB via `MONGODB_URI || MONGO_URI`.
- No `REDIS_URL` is required.

---

## Local validation commands

```bash
cd /e/chronos-sentinel
pnpm install
pnpm --filter=@chronos/web build
cd apps/ingestor && go test ./...
cd ../aggregator && go test ./...
```

## Docker build commands

```bash
docker build -t chronos-ingestor apps/ingestor
docker build -t chronos-aggregator apps/aggregator
```
