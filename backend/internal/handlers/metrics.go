package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golinkr/internal/services"
)

type MetricsHandler struct {
	metricsService *services.MetricsService
}

func NewMetricsHandler(metricsService *services.MetricsService) *MetricsHandler {
	return &MetricsHandler{
		metricsService: metricsService,
	}
}

func (h *MetricsHandler) GetSystemMetrics(c *gin.Context) {
	metrics := h.metricsService.GetSystemMetrics()
	c.JSON(http.StatusOK, metrics)
}
