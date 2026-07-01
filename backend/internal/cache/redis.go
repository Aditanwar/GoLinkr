package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"swiftlink/internal/models"
)

type RedisCache struct {
	client      *redis.Client
	cacheHits   int64
	cacheMisses int64
}

func NewRedisCache(ctx context.Context, redisURL string) (*RedisCache, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis url: %w", err)
	}

	client := redis.NewClient(opts)

	// Ping redis
	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("failed to ping redis: %w", err)
	}

	return &RedisCache{
		client: client,
	}, nil
}

func (c *RedisCache) Close() {
	if c.client != nil {
		c.client.Close()
	}
}

// GetStats returns cache hits and misses
func (c *RedisCache) GetStats() (hits, misses int64) {
	return atomic.LoadInt64(&c.cacheHits), atomic.LoadInt64(&c.cacheMisses)
}

// GetCacheHitRatio returns the hit ratio (0.0 to 1.0)
func (c *RedisCache) GetCacheHitRatio() float64 {
	hits := atomic.LoadInt64(&c.cacheHits)
	misses := atomic.LoadInt64(&c.cacheMisses)
	total := hits + misses
	if total == 0 {
		return 1.0 // Assume 100% efficient if no lookups
	}
	return float64(hits) / float64(total)
}

// --- CACHE-ASIDE METHODS ---

func (c *RedisCache) GetURL(ctx context.Context, shortCode string) (*models.URL, error) {
	key := fmt.Sprintf("url:%s", shortCode)
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		atomic.AddInt64(&c.cacheMisses, 1)
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	atomic.AddInt64(&c.cacheHits, 1)
	var url models.URL
	if err := json.Unmarshal([]byte(val), &url); err != nil {
		return nil, err
	}
	return &url, nil
}

func (c *RedisCache) SetURL(ctx context.Context, url *models.URL, ttl time.Duration) error {
	key := fmt.Sprintf("url:%s", url.ShortCode)
	bytes, err := json.Marshal(url)
	if err != nil {
		return err
	}
	return c.client.Set(ctx, key, bytes, ttl).Err()
}

func (c *RedisCache) InvalidateURL(ctx context.Context, shortCode string) error {
	key := fmt.Sprintf("url:%s", shortCode)
	return c.client.Del(ctx, key).Err()
}

// --- SLIDING WINDOW RATE LIMITER ---

// AllowRequest checks rate limit under sliding window algorithm using Redis Sorted Sets
// Returns: allowed (bool), retryAfter (time.Duration), error
func (c *RedisCache) AllowRequest(ctx context.Context, ip string, limit int, window time.Duration) (bool, time.Duration, error) {
	key := fmt.Sprintf("rate_limit:%s", ip)
	now := time.Now()
	nowMs := now.UnixNano() / int64(time.Millisecond)
	clearBeforeMs := now.Add(-window).UnixNano() / int64(time.Millisecond)

	// Unique member name to allow duplicate timestamps in same MS
	member := fmt.Sprintf("%d:%s", nowMs, uuid.New().String())

	// Use Redis transaction (pipeline or multi/exec) to perform operations atomicity
	pipe := c.client.TxPipeline()

	// 1. Remove old elements outside sliding window
	pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(clearBeforeMs, 10))

	// 2. Count elements inside the window
	pipe.ZCard(ctx, key)

	// Execute part 1 of transaction
	cmds, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return false, 0, err
	}

	cardCmd, ok := cmds[1].(*redis.IntCmd)
	if !ok {
		return false, 0, fmt.Errorf("unexpected command type for ZCARD")
	}

	count, err := cardCmd.Result()
	if err != nil {
		return false, 0, err
	}

	if int(count) >= limit {
		// Rate limit exceeded. Find the oldest request to calculate retryAfter.
		// Retrieve oldest entry inside the window
		oldestSlice, err := c.client.ZRangeWithScores(ctx, key, 0, 0).Result()
		if err != nil || len(oldestSlice) == 0 {
			// Fallback retry after window duration
			return false, window, nil
		}

		oldestScore := oldestSlice[0].Score
		oldestMs := int64(oldestScore)
		oldestTime := time.Unix(0, oldestMs*int64(time.Millisecond))
		timePassedSinceOldest := now.Sub(oldestTime)
		retryAfter := window - timePassedSinceOldest
		if retryAfter < 0 {
			retryAfter = 1 * time.Second
		}
		return false, retryAfter, nil
	}

	// 3. Add current request to the window and set key TTL
	pipe = c.client.TxPipeline()
	pipe.ZAdd(ctx, key, redis.Z{
		Score:  float64(nowMs),
		Member: member,
	})
	pipe.Expire(ctx, key, window*2) // set TTL longer than window to ensure cleanup
	_, err = pipe.Exec(ctx)
	if err != nil {
		return false, 0, err
	}

	return true, 0, nil
}
