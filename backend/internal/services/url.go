package services

import (
	"context"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
	"golinkr/internal/cache"
	"golinkr/internal/models"
	"golinkr/internal/repository"
	"golinkr/pkg/utils"
)

type URLService struct {
	repo       *repository.PostgresRepository
	redisCache *cache.RedisCache
}

func NewURLService(repo *repository.PostgresRepository, redisCache *cache.RedisCache) *URLService {
	return &URLService{
		repo:       repo,
		redisCache: redisCache,
	}
}

// Shorten creates a shortened URL
func (s *URLService) Shorten(ctx context.Context, longURL string, customAlias string, password string, expiresAt *time.Time, userID *int64) (*models.URL, error) {
	if longURL == "" {
		return nil, errors.New("url is required")
	}

	var shortCode string
	if customAlias != "" {
		// Verify custom alias uniqueness
		existing, err := s.repo.GetURLByShortCode(ctx, customAlias)
		if err != nil {
			return nil, err
		}
		if existing != nil {
			return nil, errors.New("custom alias is already taken")
		}
		shortCode = customAlias
	} else {
		// Generate random code and retry on collision
		for i := 0; i < 5; i++ {
			code := utils.GenerateShortCode(6)
			existing, err := s.repo.GetURLByShortCode(ctx, code)
			if err != nil {
				return nil, err
			}
			if existing == nil {
				shortCode = code
				break
			}
		}
		if shortCode == "" {
			return nil, errors.New("unable to generate unique short code, please try again")
		}
	}

	// Encrypt password if provided
	var passwordHash *string
	if password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err != nil {
			return nil, err
		}
		hashStr := string(hash)
		passwordHash = &hashStr
	}

	urlModel := &models.URL{
		UserID:       userID,
		LongURL:      longURL,
		ShortCode:    shortCode,
		PasswordHash: passwordHash,
		ExpiresAt:    expiresAt,
	}

	// Save to DB
	if err := s.repo.CreateURL(ctx, urlModel); err != nil {
		return nil, err
	}

	urlModel.IsProtected = password != ""

	// Set cache in Redis
	_ = s.redisCache.SetURL(ctx, urlModel, 1*time.Hour)

	return urlModel, nil
}

// Resolve checks cache/DB, performs validation, and logs click analytics
func (s *URLService) Resolve(ctx context.Context, shortCode string, password string) (*models.URL, error) {
	// Try Redis cache first
	urlModel, err := s.redisCache.GetURL(ctx, shortCode)
	if err != nil {
		// Log error and continue to DB
		urlModel = nil
	}

	// If cache miss, fetch from PostgreSQL
	if urlModel == nil {
		urlModel, err = s.repo.GetURLByShortCode(ctx, shortCode)
		if err != nil {
			return nil, err
		}
		if urlModel == nil {
			return nil, errors.New("url not found")
		}

		// Set back in cache
		_ = s.redisCache.SetURL(ctx, urlModel, 1*time.Hour)
	}

	// Validate expiry
	if urlModel.ExpiresAt != nil && urlModel.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("url has expired")
	}

	// Validate password if protected
	if urlModel.PasswordHash != nil && *urlModel.PasswordHash != "" {
		if password == "" {
			return nil, errors.New("password required")
		}
		err := bcrypt.CompareHashAndPassword([]byte(*urlModel.PasswordHash), []byte(password))
		if err != nil {
			return nil, errors.New("invalid password")
		}
	}

	return urlModel, nil
}
