package models

import (
	"time"
)

// User represents a user account
type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// URL represents a shortened link
type URL struct {
	ID           int64      `json:"id"`
	UserID       *int64     `json:"user_id,omitempty"` // nullable if anonymous shorten
	LongURL      string     `json:"long_url"`
	ShortCode    string     `json:"short_code"`
	PasswordHash *string    `json:"-"`                 // hashed password for access
	IsProtected  bool       `json:"is_protected"`      // helper to indicate password requirement
	ExpiresAt    *time.Time `json:"expires_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	ClicksCount  int64      `json:"clicks_count"`
}

// ClickLog records a single redirection event for analytics
type ClickLog struct {
	ID        int64     `json:"id"`
	URLID     int64     `json:"url_id"`
	ClickedAt time.Time `json:"clicked_at"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	Referrer  string    `json:"referrer"`
	Country   string    `json:"country"`
}

// APIKey represents an API access key for developers
type APIKey struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"user_id"`
	Key        string     `json:"key"`
	Name       string     `json:"name"`
	CreatedAt  time.Time  `json:"created_at"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
}

// SystemMetrics defines the system health metrics response payload
type SystemMetrics struct {
	ActiveGoroutines int64              `json:"active_goroutines"`
	MemoryAllocBytes uint64             `json:"memory_alloc_bytes"`
	MemorySysBytes   uint64             `json:"memory_sys_bytes"`
	CPUUsagePercent  float64            `json:"cpu_usage_percent"`
	DBPoolOpenConns  int32              `json:"db_pool_open_conns"`
	DBPoolIdleConns  int32              `json:"db_pool_idle_conns"`
	CacheHitRatio    float64            `json:"cache_hit_ratio"`
	TotalRequests    int64              `json:"total_requests"`
	RequestsPerSec   float64            `json:"requests_per_second"`
	LatencyMedianMs  float64            `json:"latency_median_ms"`
	LatencyP95Ms     float64            `json:"latency_p95_ms"`
	LatencyP99Ms     float64            `json:"latency_p99_ms"`
	Timestamp        time.Time          `json:"timestamp"`
}

// DashboardStats holds summary counters for the UI dashboard
type DashboardStats struct {
	TotalUrls      int64 `json:"total_urls"`
	TotalClicks    int64 `json:"total_clicks"`
	ClicksToday    int64 `json:"clicks_today"`
	CacheHitRate   float64 `json:"cache_hit_rate"`
}
