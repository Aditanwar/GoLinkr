package repository

import (
	"context"
	_ "embed"
	"errors"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golinkr/internal/models"
)

//go:embed schema.sql
var schemaSQL string

type PostgresRepository struct {
	pool       *pgxpool.Pool
	queryCount int64
}

func NewPostgresRepository(ctx context.Context, connStr string) (*PostgresRepository, error) {
	config, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %w", err)
	}

	// Adjust pool settings if needed
	config.MaxConns = 25
	config.MinConns = 2
	config.MaxConnIdleTime = 30 * time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Ping database
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	repo := &PostgresRepository{
		pool: pool,
	}

	// Run migration schema
	if err := repo.runSchema(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to run schema: %w", err)
	}

	return repo, nil
}

func (r *PostgresRepository) Close() {
	if r.pool != nil {
		r.pool.Close()
	}
}

func (r *PostgresRepository) GetPool() *pgxpool.Pool {
	return r.pool
}

// GetQueryCount returns the total number of executed database operations
func (r *PostgresRepository) GetQueryCount() int64 {
	return atomic.LoadInt64(&r.queryCount)
}

func (r *PostgresRepository) incrementQuery() {
	atomic.AddInt64(&r.queryCount, 1)
}

func (r *PostgresRepository) runSchema(ctx context.Context) error {
	r.incrementQuery()
	_, err := r.pool.Exec(ctx, schemaSQL)
	return err
}

// --- USER METHODS ---

func (r *PostgresRepository) CreateUser(ctx context.Context, username, email, pwdHash string) (*models.User, error) {
	r.incrementQuery()
	query := `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, username, email, created_at, updated_at
	`
	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, username, email, pwdHash).Scan(
		&user.ID, &user.Username, &user.Email, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *PostgresRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	r.incrementQuery()
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (r *PostgresRepository) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	r.incrementQuery()
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// --- URL METHODS ---

func (r *PostgresRepository) CreateURL(ctx context.Context, url *models.URL) error {
	r.incrementQuery()
	query := `
		INSERT INTO urls (user_id, long_url, short_code, password_hash, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at, clicks_count
	`
	return r.pool.QueryRow(ctx, query, url.UserID, url.LongURL, url.ShortCode, url.PasswordHash, url.ExpiresAt).Scan(
		&url.ID, &url.CreatedAt, &url.UpdatedAt, &url.ClicksCount,
	)
}

func (r *PostgresRepository) GetURLByShortCode(ctx context.Context, shortCode string) (*models.URL, error) {
	r.incrementQuery()
	query := `
		SELECT id, user_id, long_url, short_code, password_hash, expires_at, created_at, updated_at, clicks_count
		FROM urls
		WHERE short_code = $1
	`
	url := &models.URL{}
	err := r.pool.QueryRow(ctx, query, shortCode).Scan(
		&url.ID, &url.UserID, &url.LongURL, &url.ShortCode, &url.PasswordHash, &url.ExpiresAt, &url.CreatedAt, &url.UpdatedAt, &url.ClicksCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	url.IsProtected = url.PasswordHash != nil && *url.PasswordHash != ""
	return url, nil
}

func (r *PostgresRepository) GetURLByID(ctx context.Context, id int64) (*models.URL, error) {
	r.incrementQuery()
	query := `
		SELECT id, user_id, long_url, short_code, password_hash, expires_at, created_at, updated_at, clicks_count
		FROM urls
		WHERE id = $1
	`
	url := &models.URL{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&url.ID, &url.UserID, &url.LongURL, &url.ShortCode, &url.PasswordHash, &url.ExpiresAt, &url.CreatedAt, &url.UpdatedAt, &url.ClicksCount,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	url.IsProtected = url.PasswordHash != nil && *url.PasswordHash != ""
	return url, nil
}

func (r *PostgresRepository) UpdateURL(ctx context.Context, url *models.URL) error {
	r.incrementQuery()
	query := `
		UPDATE urls
		SET long_url = $1, password_hash = $2, expires_at = $3, updated_at = NOW()
		WHERE id = $4 AND (user_id = $5 OR $5 IS NULL)
	`
	tag, err := r.pool.Exec(ctx, query, url.LongURL, url.PasswordHash, url.ExpiresAt, url.ID, url.UserID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("url not found or unauthorized")
	}
	return nil
}

func (r *PostgresRepository) DeleteURL(ctx context.Context, id int64, userID int64) error {
	r.incrementQuery()
	query := `
		DELETE FROM urls
		WHERE id = $1 AND user_id = $2
	`
	tag, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("url not found or unauthorized")
	}
	return nil
}

func (r *PostgresRepository) ListURLs(ctx context.Context, userID int64, limit, offset int) ([]*models.URL, int64, error) {
	r.incrementQuery()
	countQuery := `SELECT COUNT(*) FROM urls WHERE user_id = $1`
	var total int64
	err := r.pool.QueryRow(ctx, countQuery, userID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	r.incrementQuery()
	query := `
		SELECT id, user_id, long_url, short_code, password_hash, expires_at, created_at, updated_at, clicks_count
		FROM urls
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.pool.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var urls []*models.URL
	for rows.Next() {
		u := &models.URL{}
		err := rows.Scan(
			&u.ID, &u.UserID, &u.LongURL, &u.ShortCode, &u.PasswordHash, &u.ExpiresAt, &u.CreatedAt, &u.UpdatedAt, &u.ClicksCount,
		)
		if err != nil {
			return nil, 0, err
		}
		u.IsProtected = u.PasswordHash != nil && *u.PasswordHash != ""
		urls = append(urls, u)
	}

	return urls, total, nil
}

func (r *PostgresRepository) IncrementClicksCount(ctx context.Context, urlID int64) error {
	r.incrementQuery()
	query := `
		UPDATE urls
		SET clicks_count = clicks_count + 1
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, urlID)
	return err
}

// --- CLICK LOG METHODS ---

func (r *PostgresRepository) CreateClickLog(ctx context.Context, log *models.ClickLog) error {
	r.incrementQuery()
	query := `
		INSERT INTO clicks (url_id, ip_address, user_agent, referrer, country)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, clicked_at
	`
	return r.pool.QueryRow(ctx, query, log.URLID, log.IPAddress, log.UserAgent, log.Referrer, log.Country).Scan(
		&log.ID, &log.ClickedAt,
	)
}

func (r *PostgresRepository) GetClickLogsByURLID(ctx context.Context, urlID int64, limit, offset int) ([]*models.ClickLog, error) {
	r.incrementQuery()
	query := `
		SELECT id, url_id, clicked_at, ip_address, user_agent, referrer, country
		FROM clicks
		WHERE url_id = $1
		ORDER BY clicked_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.pool.Query(ctx, query, urlID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []*models.ClickLog
	for rows.Next() {
		l := &models.ClickLog{}
		err := rows.Scan(
			&l.ID, &l.URLID, &l.ClickedAt, &l.IPAddress, &l.UserAgent, &l.Referrer, &l.Country,
		)
		if err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, nil
}

func (r *PostgresRepository) GetDashboardStats(ctx context.Context, userID int64) (*models.DashboardStats, error) {
	r.incrementQuery()
	query := `
		SELECT 
			COUNT(u.id) as total_urls,
			COALESCE(SUM(u.clicks_count), 0) as total_clicks,
			(
				SELECT COUNT(c.id) 
				FROM clicks c 
				JOIN urls u2 ON c.url_id = u2.id 
				WHERE u2.user_id = $1 AND c.clicked_at >= NOW() - INTERVAL '1 day'
			) as clicks_today
		FROM urls u
		WHERE u.user_id = $1
	`
	stats := &models.DashboardStats{}
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&stats.TotalUrls, &stats.TotalClicks, &stats.ClicksToday,
	)
	if err != nil {
		return nil, err
	}
	return stats, nil
}

func (r *PostgresRepository) GetDailyClicksStats(ctx context.Context, urlID int64) (map[string]int64, error) {
	r.incrementQuery()
	query := `
		SELECT TO_CHAR(clicked_at, 'YYYY-MM-DD') as day, COUNT(*) as count
		FROM clicks
		WHERE url_id = $1 AND clicked_at >= NOW() - INTERVAL '7 days'
		GROUP BY day
		ORDER BY day
	`
	rows, err := r.pool.Query(ctx, query, urlID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int64)
	for rows.Next() {
		var day string
		var count int64
		if err := rows.Scan(&day, &count); err != nil {
			return nil, err
		}
		stats[day] = count
	}
	return stats, nil
}

func (r *PostgresRepository) GetCountryStats(ctx context.Context, urlID int64) (map[string]int64, error) {
	r.incrementQuery()
	query := `
		SELECT country, COUNT(*) as count
		FROM clicks
		WHERE url_id = $1
		GROUP BY country
		ORDER BY count DESC
	`
	rows, err := r.pool.Query(ctx, query, urlID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int64)
	for rows.Next() {
		var country string
		var count int64
		if err := rows.Scan(&country, &count); err != nil {
			return nil, err
		}
		stats[country] = count
	}
	return stats, nil
}

func (r *PostgresRepository) GetBrowserStats(ctx context.Context, urlID int64) (map[string]int64, error) {
	r.incrementQuery()
	query := `
		SELECT 
			CASE 
				WHEN user_agent ILIKE '%chrome%' THEN 'Chrome'
				WHEN user_agent ILIKE '%firefox%' THEN 'Firefox'
				WHEN user_agent ILIKE '%safari%' AND NOT user_agent ILIKE '%chrome%' THEN 'Safari'
				WHEN user_agent ILIKE '%edge%' THEN 'Edge'
				ELSE 'Other'
			END as browser,
			COUNT(*) as count
		FROM clicks
		WHERE url_id = $1
		GROUP BY browser
		ORDER BY count DESC
	`
	rows, err := r.pool.Query(ctx, query, urlID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stats := make(map[string]int64)
	for rows.Next() {
		var browser string
		var count int64
		if err := rows.Scan(&browser, &count); err != nil {
			return nil, err
		}
		stats[browser] = count
	}
	return stats, nil
}

// --- API KEY METHODS ---

func (r *PostgresRepository) CreateAPIKey(ctx context.Context, apiKey *models.APIKey) error {
	r.incrementQuery()
	query := `
		INSERT INTO api_keys (user_id, key, name, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`
	return r.pool.QueryRow(ctx, query, apiKey.UserID, apiKey.Key, apiKey.Name, apiKey.ExpiresAt).Scan(
		&apiKey.ID, &apiKey.CreatedAt,
	)
}

func (r *PostgresRepository) GetAPIKeyByKey(ctx context.Context, keyStr string) (*models.APIKey, error) {
	r.incrementQuery()
	query := `
		SELECT id, user_id, key, name, created_at, expires_at, last_used_at
		FROM api_keys
		WHERE key = $1
	`
	apiKey := &models.APIKey{}
	err := r.pool.QueryRow(ctx, query, keyStr).Scan(
		&apiKey.ID, &apiKey.UserID, &apiKey.Key, &apiKey.Name, &apiKey.CreatedAt, &apiKey.ExpiresAt, &apiKey.LastUsedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return apiKey, nil
}

func (r *PostgresRepository) ListAPIKeys(ctx context.Context, userID int64) ([]*models.APIKey, error) {
	r.incrementQuery()
	query := `
		SELECT id, user_id, key, name, created_at, expires_at, last_used_at
		FROM api_keys
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apiKeys []*models.APIKey
	for rows.Next() {
		k := &models.APIKey{}
		err := rows.Scan(
			&k.ID, &k.UserID, &k.Key, &k.Name, &k.CreatedAt, &k.ExpiresAt, &k.LastUsedAt,
		)
		if err != nil {
			return nil, err
		}
		apiKeys = append(apiKeys, k)
	}
	return apiKeys, nil
}

func (r *PostgresRepository) DeleteAPIKey(ctx context.Context, id int64, userID int64) error {
	r.incrementQuery()
	query := `
		DELETE FROM api_keys
		WHERE id = $1 AND user_id = $2
	`
	tag, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("api key not found or unauthorized")
	}
	return nil
}

func (r *PostgresRepository) UpdateAPIKeyLastUsed(ctx context.Context, key string) error {
	r.incrementQuery()
	query := `
		UPDATE api_keys
		SET last_used_at = NOW()
		WHERE key = $1
	`
	_, err := r.pool.Exec(ctx, query, key)
	return err
}
