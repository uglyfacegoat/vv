package repository

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func defaultProfile(email string, role string) models.UserProfile {
	local := strings.Split(email, "@")[0]
	if local == "" {
		local = "Пользователь"
	}
	position := "Финансовый аналитик"
	department := "Финансы"
	switch role {
	case "controller":
		position = "Контролёр планирования"
	case "manager":
		position = "Руководитель подразделения"
		department = "ЦФО"
	}
	return models.UserProfile{Name: local, Position: position, Department: department}
}

func defaultSettings() models.UserSettings {
	return models.UserSettings{
		Threshold:          10,
		OverspendThreshold: 15,
		SavingThreshold:    15,
		NumberFormat:       "ru",
		Currency:           "RUB",
		NotifyImport:       true,
		NotifyOverspend:    true,
		NotifyWeekly:       false,
		EmailNotify:        true,
		Theme:              "dark",
	}
}

func normalizeProfile(profile models.UserProfile, email string, role string) models.UserProfile {
	defaults := defaultProfile(email, role)
	if strings.TrimSpace(profile.Name) == "" {
		profile.Name = defaults.Name
	}
	if strings.TrimSpace(profile.Position) == "" {
		profile.Position = defaults.Position
	}
	if strings.TrimSpace(profile.Department) == "" {
		profile.Department = defaults.Department
	}
	return profile
}

func normalizeSettings(settings models.UserSettings) models.UserSettings {
	defaults := defaultSettings()
	if settings.Threshold == 0 && settings.NumberFormat == "" && settings.Currency == "" && settings.Theme == "" {
		return defaults
	}
	if settings.Threshold == 0 {
		settings.Threshold = defaults.Threshold
	}
	if settings.OverspendThreshold == 0 {
		settings.OverspendThreshold = defaults.OverspendThreshold
	}
	if settings.SavingThreshold == 0 {
		settings.SavingThreshold = defaults.SavingThreshold
	}
	if settings.NumberFormat == "" {
		settings.NumberFormat = defaults.NumberFormat
	}
	if settings.Currency == "" {
		settings.Currency = defaults.Currency
	}
	if settings.Theme == "" {
		settings.Theme = defaults.Theme
	}
	return settings
}

func scanUser(row pgx.Row) (*models.User, string, error) {
	var user models.User
	var roleName string
	var profileRaw, settingsRaw []byte
	err := row.Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.RoleID, &user.CCID,
		&profileRaw, &settingsRaw, &user.CreatedAt, &user.UpdatedAt, &roleName,
	)
	if err != nil {
		return nil, "", err
	}
	if len(profileRaw) > 0 {
		_ = json.Unmarshal(profileRaw, &user.Profile)
	}
	if len(settingsRaw) > 0 {
		_ = json.Unmarshal(settingsRaw, &user.Settings)
	}
	user.Profile = normalizeProfile(user.Profile, user.Email, roleName)
	user.Settings = normalizeSettings(user.Settings)
	return &user, roleName, nil
}

// CreateUser вставляет пользователя в БД
func (r *UserRepository) CreateUser(ctx context.Context, u *models.User) error {
	profile, _ := json.Marshal(normalizeProfile(u.Profile, u.Email, ""))
	settings, _ := json.Marshal(normalizeSettings(u.Settings))
	q := `INSERT INTO users (email, password_hash, role_id, cc_id, profile, settings)
		  VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(ctx, q, u.Email, u.PasswordHash, u.RoleID, u.CCID, profile, settings).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	return err
}

func (r *UserRepository) GetRoleIDByName(ctx context.Context, name string) (int, error) {
	var id int
	err := r.db.QueryRow(ctx, `SELECT id FROM roles WHERE name = $1`, name).Scan(&id)
	return id, err
}

// GetUserByEmail со встроенным ролевым запросом
func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, string, error) {
	q := `
		SELECT u.id, u.email, u.password_hash, u.role_id, u.cc_id, u.profile, u.settings, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		JOIN roles r ON u.role_id = r.id
		WHERE u.email = $1
	`
	user, roleName, err := scanUser(r.db.QueryRow(ctx, q, email))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, "", nil
		}
		return nil, "", err
	}
	return user, roleName, nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, string, error) {
	q := `
		SELECT u.id, u.email, u.password_hash, u.role_id, u.cc_id, u.profile, u.settings, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		JOIN roles r ON u.role_id = r.id
		WHERE u.id = $1
	`
	user, roleName, err := scanUser(r.db.QueryRow(ctx, q, id))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, "", nil
		}
		return nil, "", err
	}
	return user, roleName, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id uuid.UUID, profile models.UserProfile) (*models.User, string, error) {
	current, roleName, err := r.GetUserByID(ctx, id)
	if err != nil || current == nil {
		return current, roleName, err
	}
	profile = normalizeProfile(profile, current.Email, roleName)
	raw, _ := json.Marshal(profile)
	_, err = r.db.Exec(ctx, `UPDATE users SET profile = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, id, raw)
	if err != nil {
		return nil, "", err
	}
	return r.GetUserByID(ctx, id)
}

func (r *UserRepository) UpdateSettings(ctx context.Context, id uuid.UUID, settings models.UserSettings) (*models.User, string, error) {
	settings = normalizeSettings(settings)
	raw, _ := json.Marshal(settings)
	_, err := r.db.Exec(ctx, `UPDATE users SET settings = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, id, raw)
	if err != nil {
		return nil, "", err
	}
	return r.GetUserByID(ctx, id)
}

func (r *UserRepository) GetState(ctx context.Context, userID uuid.UUID, key string) ([]byte, error) {
	var raw []byte
	err := r.db.QueryRow(ctx, `SELECT value FROM user_state WHERE user_id = $1 AND key = $2`, userID, key).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) {
		return []byte("null"), nil
	}
	return raw, err
}

func (r *UserRepository) SetState(ctx context.Context, userID uuid.UUID, key string, value json.RawMessage) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO user_state (user_id, key, value, updated_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id, key)
		DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
	`, userID, key, value)
	return err
}
