package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"golinkr/internal/cache"
	"golinkr/internal/config"
	"golinkr/internal/handlers"
	"golinkr/internal/middleware"
	"golinkr/internal/repository"
	"golinkr/internal/services"
)

func main() {
	log.Println("[SERVER] Starting GoLinkr Backend...")

	// 1. Load Config
	cfg := config.LoadConfig()

	// 2. Initialize Database & Cache
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	repo, err := repository.NewPostgresRepository(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[DATABASE] Connection error: %v", err)
	}
	defer repo.Close()
	log.Println("[DATABASE] Postgres connection pool ready")

	redisCache, err := cache.NewRedisCache(ctx, cfg.RedisURL)
	if err != nil {
		log.Fatalf("[REDIS] Connection error: %v", err)
	}
	defer redisCache.Close()
	log.Println("[REDIS] Redis client connected")

	// 3. Initialize Services
	authService := services.NewAuthService(cfg.JWTSecret)
	urlService := services.NewURLService(repo, redisCache)
	metricsService := services.NewMetricsService(repo, redisCache)

	// 4. Initialize Handlers
	authHandler := handlers.NewAuthHandler(repo, authService)
	urlHandler := handlers.NewURLHandler(repo, redisCache, urlService)
	analyticsHandler := handlers.NewAnalyticsHandler(repo, redisCache)
	apiKeyHandler := handlers.NewAPIKeyHandler(repo)
	metricsHandler := handlers.NewMetricsHandler(metricsService)

	// 5. Setup Router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()

	// Middleware stack
	r.Use(middleware.LoggerMiddleware())
	r.Use(CORSMiddleware())
	r.Use(middleware.MetricsMiddleware(metricsService))
	
	// Apply rate limiting (100 requests per minute)
	r.Use(middleware.RateLimiterMiddleware(redisCache, 100, 1*time.Minute))

	// Recovery middleware
	r.Use(gin.Recovery())

	// 6. Register Routes
	// Redirection route
	r.GET("/r/:code", urlHandler.Redirect)

	api := r.Group("/api/v1")
	{
		// Public Auth routes
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)
		api.POST("/url/resolve/:code", urlHandler.ResolvePassword)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(authService, repo))
		{
			// Auth
			protected.GET("/auth/me", authHandler.Me)

			// URLs
			protected.POST("/shorten", urlHandler.Shorten)
			protected.GET("/urls", urlHandler.List)
			protected.PATCH("/url/:id", urlHandler.Update)
			protected.DELETE("/url/:id", urlHandler.Delete)
			protected.GET("/url/:id/qr", urlHandler.GenerateQR)

			// Bulk operations
			protected.POST("/urls/bulk", urlHandler.BulkShorten)
			protected.POST("/urls/upload-csv", urlHandler.BulkUploadCSV)

			// Analytics
			protected.GET("/analytics/:id", analyticsHandler.GetURLAnalytics)
			protected.GET("/dashboard/summary", analyticsHandler.GetDashboardSummary)

			// API Keys
			protected.POST("/apikeys", apiKeyHandler.Create)
			protected.GET("/apikeys", apiKeyHandler.List)
			protected.DELETE("/apikeys/:id", apiKeyHandler.Delete)

			// System Performance Metrics
			protected.GET("/system/metrics", metricsHandler.GetSystemMetrics)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "timestamp": time.Now()})
	})

	// 7. Start HTTP Server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("[HTTP] Server listening on port %s\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[HTTP] Listen error: %v", err)
		}
	}()

	// 8. Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[SERVER] Shutting down gracefully...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[SERVER] Forced shutdown: %v", err)
	}

	log.Println("[SERVER] Exited successfully.")
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-API-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
