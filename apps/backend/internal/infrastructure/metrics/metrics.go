// Package metrics defines Prometheus counters and histograms for chat
// request tracking, latency measurement, cache hit rates, and upload monitoring.
// Metrics are auto-registered via promauto and exposed at /metrics.
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Metrics provides Prometheus metrics for the application.	
var (
	ChatRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "chat_requests_total",
		Help: "Total number of chat requests",
	}, []string{"language", "status"})
	ChatBlockedTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "chat_blocked_total",
		Help: "Total number of blocked chat requests",
	}, []string{"reason"})
	FeedbackTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "feedback_total",
		Help: "Total number of feedback submissions",
	}, []string{"type"}) 
	ChatLatencySeconds = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "chat_latency_seconds",
		Help:    "Chat response latency in seconds",
		Buckets: []float64{0.1, 0.25, 0.5, 1, 2, 5, 10, 30},
	}, []string{"language"})
	CacheHitsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "cache_hits_total",
		Help: "Total cache hits and misses",
	}, []string{"result"}) 
	DocumentUploadsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "document_uploads_total",
		Help: "Total document upload attempts",
	}, []string{"status"}) 
)
