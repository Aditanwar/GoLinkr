package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golinkr/internal/cache"
)

func RateLimiterMiddleware(redisCache *cache.RedisCache, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		allowed, retryAfter, err := redisCache.AllowRequest(c.Request.Context(), ip, limit, window)
		if err != nil {
			// Fail open or fail closed? Let's log and allow, or fail closed.
			// In production, we'll log it and proceed so that redis outages don't break the app.
			c.Next()
			return
		}

		if !allowed {
			c.Header("Retry-After", fmt.Sprintf("%.0f", retryAfter.Seconds()))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "too many requests",
				"retry_after": fmt.Sprintf("%.0f seconds", retryAfter.Seconds()),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
