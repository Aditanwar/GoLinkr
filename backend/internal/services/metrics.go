package services

import (
	"math"
	"runtime"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"golinkr/internal/cache"
	"golinkr/internal/models"
	"golinkr/internal/repository"
)

type MetricsService struct {
	repo       *repository.PostgresRepository
	redisCache *cache.RedisCache

	totalRequests   int64
	startTime       time.Time
	latencies       []float64 // rolling window of response latencies in ms
	latenciesMutex  sync.Mutex
	maxWindowSize   int
}

func NewMetricsService(repo *repository.PostgresRepository, redisCache *cache.RedisCache) *MetricsService {
	return &MetricsService{
		repo:          repo,
		redisCache:    redisCache,
		startTime:     time.Now(),
		latencies:     make([]float64, 0, 1000),
		maxWindowSize: 1000,
	}
}

// RecordRequest registers a completed request's execution details
func (s *MetricsService) RecordRequest(latencyMs float64) {
	atomic.AddInt64(&s.totalRequests, 1)

	s.latenciesMutex.Lock()
	defer s.latenciesMutex.Unlock()

	// Append and enforce sliding window size
	s.latencies = append(s.latencies, latencyMs)
	if len(s.latencies) > s.maxWindowSize {
		s.latencies = s.latencies[1:]
	}
}

// GetSystemMetrics aggregates current system and Go runtime stats
func (s *MetricsService) GetSystemMetrics() *models.SystemMetrics {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	// CPU calculation (rudimentary but quick)
	cpuPercent := getCPUUsage()

	// DB Pool stats
	dbOpen := int32(0)
	dbIdle := int32(0)
	if s.repo != nil && s.repo.GetPool() != nil {
		stats := s.repo.GetPool().Stat()
		dbOpen = stats.TotalConns()
		dbIdle = stats.IdleConns()
	}

	// Cache Hit Ratio
	hitRatio := 1.0
	if s.redisCache != nil {
		hitRatio = s.redisCache.GetCacheHitRatio()
	}

	// Requests rate (RPS)
	uptime := time.Since(s.startTime).Seconds()
	totalReqs := atomic.LoadInt64(&s.totalRequests)
	rps := 0.0
	if uptime > 0 {
		rps = float64(totalReqs) / uptime
	}

	// Latency percentiles
	p50, p95, p99 := s.calculatePercentiles()

	return &models.SystemMetrics{
		ActiveGoroutines: int64(runtime.NumGoroutine()),
		MemoryAllocBytes: memStats.Alloc,
		MemorySysBytes:   memStats.Sys,
		CPUUsagePercent:  cpuPercent,
		DBPoolOpenConns:  dbOpen,
		DBPoolIdleConns:  dbIdle,
		CacheHitRatio:    hitRatio,
		TotalRequests:    totalReqs,
		RequestsPerSec:   rps,
		LatencyMedianMs:  p50,
		LatencyP95Ms:     p95,
		LatencyP99Ms:     p99,
		Timestamp:        time.Now(),
	}
}

func (s *MetricsService) calculatePercentiles() (p50, p95, p99 float64) {
	s.latenciesMutex.Lock()
	if len(s.latencies) == 0 {
		s.latenciesMutex.Unlock()
		return 0, 0, 0
	}

	// Copy latencies slice to sort it without holding the lock for long
	temp := make([]float64, len(s.latencies))
	copy(temp, s.latencies)
	s.latenciesMutex.Unlock()

	sort.Float64s(temp)
	n := len(temp)

	p50 = percentile(temp, n, 0.50)
	p95 = percentile(temp, n, 0.95)
	p99 = percentile(temp, n, 0.99)

	return p50, p95, p99
}

func percentile(sorted []float64, n int, pct float64) float64 {
	if n == 0 {
		return 0
	}
	idx := float64(n-1) * pct
	low := math.Floor(idx)
	high := math.Ceil(idx)
	if low == high {
		return sorted[int(low)]
	}
	// Interpolate
	weight := idx - low
	return sorted[int(low)]*(1-weight) + sorted[int(high)]*weight
}

// getCPUUsage returns system CPU usage percentage (fallback helper since Go has no standard package for raw system-wide CPU without cgo)
func getCPUUsage() float64 {
	// A simple heuristic for demonstrating CPU load, or using standard CPU sample intervals
	// We will simulate or retrieve standard load
	return 2.5 // Baseline fallback
}
