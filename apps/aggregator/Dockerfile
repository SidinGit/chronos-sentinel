# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/aggregator .

# Final stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates
COPY --from=builder /app/aggregator /usr/local/bin/aggregator

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/aggregator"]
