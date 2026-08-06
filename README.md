# GoLinkr

GoLinkr is a production-grade, high-performance, enterprise-ready URL shortening and analytics platform. Built with a Go-based backend (utilizing Gin, Redis, and PostgreSQL) and a responsive, dynamic React + TypeScript frontend, it represents a complete, cache-aside URL redirect engine designed for high throughput and low-latency operations.

## Architecture & Design

GoLinkr utilizes a cache-aside architecture to ensure redirect operations execute under 1-2 milliseconds:
1. **Client Request**: The browser requests a redirect path (e.g., `/r/xyz12`).
2. **Gateway**: The Go (Gin) router intercepts the request and runs middleware checks (sliding-window rate limiter utilizing Redis Sorted Sets, structured request logging).
3. **In-Memory Cache (Redis)**: Performs a cache lookup for the redirect code. On a hit, it redirects immediately.
4. **Persistent Database (PostgreSQL)**: On a cache miss, the backend fetches from PostgreSQL, saves the value back to Redis with a 1-hour TTL, and writes redirection analytics asynchronously.

## Features

- **High-Speed Redirection**: Cache-aside architecture using Redis to minimize database stress and maximize throughput.
- **Advanced Rate Limiting**: Rolling-window rate limits enforced per IP address using Redis Sorted Sets (ZSET).
- **Interactive Metrics Dashboard**: System health metrics monitoring memory, CPU, database connection pool stats, and active goroutines.
- **Bulk Import/Export**: Import links using bulk CSV parsing.
- **QR Code Generation**: Instantly generate downloadable QR codes for redirects.
- **Developer API Key Management**: Generate and manage API keys for system access.
- **Branded & Modern UI**: Responsive layout featuring smooth transitions, dark mode toggle, and glassmorphic panels.

## Technology Stack

- **Backend**: Go (1.21+), Gin Web Framework, go-redis, pgx (PostgreSQL driver).
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, Framer Motion, Recharts.
- **Infrastructure**: Docker Compose, PostgreSQL 15, Redis 7.

## Getting Started

### Prerequisites

- [Docker & Docker Compose](https://www.docker.com/get-started) (Recommended)
- Alternatively, [Go 1.21+](https://go.dev/dl/) and [Node.js 22+](https://nodejs.org/) installed locally.

### Method 1: Running with Docker Compose (Recommended)

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/Aditanwar/GoLinkr.git
   cd GoLinkr
   ```

2. Start the services:
   ```bash
   docker-compose up --build
   ```

3. Access the applications:
   - **Frontend UI**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:8080](http://localhost:8080)
   - **API Health Check**: `curl http://localhost:8080/health`

### Method 2: Running Locally for Development

#### 1. Setup Database & Cache
Ensure PostgreSQL and Redis are running locally. Create a database named `golinkr` and run the schema file located in `backend/internal/repository/schema.sql`.

#### 2. Run the Backend
```bash
cd backend
# Optional: customize environment variables
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/golinkr?sslmode=disable"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET="your-development-jwt-secret"

go run cmd/api/main.go
```

#### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```
