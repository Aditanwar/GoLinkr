package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golinkr/internal/models"
	"golinkr/internal/repository"
)

type APIKeyHandler struct {
	repo *repository.PostgresRepository
}

func NewAPIKeyHandler(repo *repository.PostgresRepository) *APIKeyHandler {
	return &APIKeyHandler{
		repo: repo,
	}
}

type CreateAPIKeyRequest struct {
	Name      string     `json:"name" binding:"required,min=1,max=100"`
	ExpiresAt *time.Time `json:"expires_at"`
}

func (h *APIKeyHandler) Create(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(int64)

	var req CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate secure random key: sl_ + 32 hex characters
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate key"})
		return
	}
	keyStr := fmt.Sprintf("sl_%s", hex.EncodeToString(bytes))

	apiKey := &models.APIKey{
		UserID:    userID,
		Key:       keyStr,
		Name:      req.Name,
		ExpiresAt: req.ExpiresAt,
	}

	err := h.repo.CreateAPIKey(c.Request.Context(), apiKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save api key"})
		return
	}

	c.JSON(http.StatusCreated, apiKey)
}

func (h *APIKeyHandler) List(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(int64)

	apiKeys, err := h.repo.ListAPIKeys(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list api keys"})
		return
	}

	c.JSON(http.StatusOK, apiKeys)
}

func (h *APIKeyHandler) Delete(c *gin.Context) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	userID := userIDVal.(int64)

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid api key id"})
		return
	}

	err = h.repo.DeleteAPIKey(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "api key revoked successfully"})
}
