# Stage 1: Build
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy dependency configs
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api/main.go

# Stage 2: Final minimal execution container
FROM alpine:latest  
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy compiled binary from builder
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
