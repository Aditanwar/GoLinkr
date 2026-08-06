package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"golinkr/internal/services"
)

func MetricsMiddleware(metricsService *services.MetricsService) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		// Do not track latency for system metrics endpoints themselves to avoid feedback loop skewing latencies
		path := c.Request.URL.Path
		if path == "/api/v1/system/metrics" {
			return
		}

		duration := time.Since(start)
		latencyMs := float64(duration.Nanoseconds()) / 1e6

		metricsService.RecordRequest(latencyMs)
	}
}
