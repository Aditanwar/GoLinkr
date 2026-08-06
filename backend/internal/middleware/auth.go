package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golinkr/internal/repository"
	"golinkr/internal/services"
)

func AuthMiddleware(authService *services.AuthService, repo *repository.PostgresRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Check API Key first (for programmatic API requests)
		apiKey := c.GetHeader("X-API-Key")
		if apiKey != "" {
			keyRecord, err := repo.GetAPIKeyByKey(c.Request.Context(), apiKey)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database error during api key validation"})
				c.Abort()
				return
			}
			if keyRecord == nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid api key"})
				c.Abort()
				return
			}
			// Optional: check expiry
			if keyRecord.ExpiresAt != nil && keyRecord.ExpiresAt.Before(time.Now()) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "api key expired"})
				c.Abort()
				return
			}

			// Update key's last used time asynchronously
			go func(keyStr string) {
				_ = repo.UpdateAPIKeyLastUsed(c.Request.Context(), keyStr)
			}(apiKey)

			c.Set("user_id", keyRecord.UserID)
			c.Set("auth_method", "api_key")
			c.Next()
			return
		}

		// 2. Check JWT Token (for dashboard browser requests)
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization format must be Bearer <token>"})
			c.Abort()
			return
		}

		claims, err := authService.ValidateToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("auth_method", "jwt")
		c.Next()
	}
}
