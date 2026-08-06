package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"golinkr/internal/cache"
	"golinkr/internal/repository"
)

type AnalyticsHandler struct {
	repo       *repository.PostgresRepository
	redisCache *cache.RedisCache
}

func NewAnalyticsHandler(repo *repository.PostgresRepository, redisCache *cache.RedisCache) *AnalyticsHandler {
	return &AnalyticsHandler{
		repo:       repo,
		redisCache: redisCache,
	}
}

func (h *AnalyticsHandler) GetURLAnalytics(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(int64)

	urlID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url id"})
		return
	}

	// Verify ownership
	urlModel, err := h.repo.GetURLByID(c.Request.Context(), urlID)
	if err != nil || urlModel == nil || urlModel.UserID == nil || *urlModel.UserID != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "url not found or unauthorized"})
		return
	}

	// 1. Fetch daily stats (last 7 days)
	dailyStats, err := h.repo.GetDailyClicksStats(c.Request.Context(), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load daily stats"})
		return
	}

	// 2. Fetch country stats
	countryStats, err := h.repo.GetCountryStats(c.Request.Context(), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load country stats"})
		return
	}

	// 3. Fetch browser stats
	browserStats, err := h.repo.GetBrowserStats(c.Request.Context(), urlID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load browser stats"})
		return
	}

	// 4. Fetch recent click logs (last 50 clicks)
	logs, err := h.repo.GetClickLogsByURLID(c.Request.Context(), urlID, 50, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load recent clicks"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":           urlModel,
		"daily_stats":   dailyStats,
		"country_stats": countryStats,
		"browser_stats": browserStats,
		"recent_clicks": logs,
	})
}

func (h *AnalyticsHandler) GetDashboardSummary(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(int64)

	stats, err := h.repo.GetDashboardStats(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch dashboard summary"})
		return
	}

	// Add cache hit ratio
	stats.CacheHitRate = h.redisCache.GetCacheHitRatio()

	c.JSON(http.StatusOK, stats)
}
