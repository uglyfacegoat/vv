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
	"golang.org/x/crypto/bcrypt"
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
		&user.EnterpriseID, &user.EnterpriseKey, &user.Enterprise,
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
	q := `
		WITH enterprise AS (
			INSERT INTO enterprises (key, name)
			VALUES (lower(split_part($1, '@', 2)), lower(split_part($1, '@', 2)))
			ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name
			RETURNING id
		)
		INSERT INTO users (email, password_hash, role_id, cc_id, profile, settings, enterprise_id)
		VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM enterprise))
		RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(ctx, q, u.Email, u.PasswordHash, u.RoleID, u.CCID, profile, settings).Scan(&u.ID, &u.CreatedAt, &u.UpdatedAt)
	if err == nil {
		_ = r.EnsureEnterpriseStateDefaults(ctx, u.ID)
		metadata, _ := json.Marshal(map[string]any{"email": u.Email, "role_id": u.RoleID, "cc_id": u.CCID})
		_ = r.LogAudit(ctx, u.ID, "auth.register", "users", u.ID.String(), metadata)
	}
	return err
}

func (r *UserRepository) GetRoleIDByName(ctx context.Context, name string) (int, error) {
	var id int
	err := r.db.QueryRow(ctx, `SELECT id FROM roles WHERE name = $1`, name).Scan(&id)
	return id, err
}

func (r *UserRepository) EnsureServiceUser(ctx context.Context, email string) (uuid.UUID, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || !strings.Contains(email, "@") || strings.HasSuffix(email, "@") {
		return uuid.Nil, errors.New("service user email must contain a domain")
	}

	existing, _, err := r.GetUserByEmail(ctx, email)
	if err != nil {
		return uuid.Nil, err
	}
	if existing != nil {
		return existing.ID, nil
	}

	roleID, err := r.GetRoleIDByName(ctx, "controller")
	if err != nil {
		return uuid.Nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(uuid.NewString()), bcrypt.DefaultCost)
	if err != nil {
		return uuid.Nil, err
	}

	user := &models.User{
		Email:        email,
		PasswordHash: string(hash),
		RoleID:       roleID,
		Profile: models.UserProfile{
			Name:       "1C Integration",
			Position:   "Интеграция 1С",
			Department: "Финансы",
		},
		Settings: defaultSettings(),
	}
	if err := r.CreateUser(ctx, user); err != nil {
		return uuid.Nil, err
	}
	return user.ID, nil
}

// GetUserByEmail со встроенным ролевым запросом
func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, string, error) {
	q := `
		SELECT u.id, u.email, u.password_hash, u.role_id, u.cc_id,
		       u.enterprise_id, COALESCE(e.key, ''), COALESCE(e.name, ''),
		       u.profile, u.settings, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		JOIN roles r ON u.role_id = r.id
		LEFT JOIN enterprises e ON e.id = u.enterprise_id
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
		SELECT u.id, u.email, u.password_hash, u.role_id, u.cc_id,
		       u.enterprise_id, COALESCE(e.key, ''), COALESCE(e.name, ''),
		       u.profile, u.settings, u.created_at, u.updated_at, r.name as role_name
		FROM users u
		JOIN roles r ON u.role_id = r.id
		LEFT JOIN enterprises e ON e.id = u.enterprise_id
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
	metadata, _ := json.Marshal(map[string]any{"name": profile.Name, "position": profile.Position, "department": profile.Department})
	_ = r.LogAudit(ctx, id, "profile.update", "users", id.String(), metadata)
	return r.GetUserByID(ctx, id)
}

func (r *UserRepository) UpdateSettings(ctx context.Context, id uuid.UUID, settings models.UserSettings) (*models.User, string, error) {
	settings = normalizeSettings(settings)
	raw, _ := json.Marshal(settings)
	_, err := r.db.Exec(ctx, `UPDATE users SET settings = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, id, raw)
	if err != nil {
		return nil, "", err
	}
	metadata, _ := json.Marshal(map[string]any{
		"threshold":           settings.Threshold,
		"overspend_threshold": settings.OverspendThreshold,
		"saving_threshold":    settings.SavingThreshold,
		"currency":            settings.Currency,
		"theme":               settings.Theme,
	})
	_ = r.LogAudit(ctx, id, "settings.update", "users", id.String(), metadata)
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
	if err == nil {
		metadata, _ := json.Marshal(map[string]any{"key": key, "bytes": len(value)})
		_ = r.LogAudit(ctx, userID, "state.user.update", "user_state", key, metadata)
	}
	return err
}

func (r *UserRepository) LogAudit(ctx context.Context, userID uuid.UUID, action, entity, entityID string, metadata json.RawMessage) error {
	if len(metadata) == 0 {
		metadata = json.RawMessage(`{}`)
	}
	_, err := r.db.Exec(ctx, `
		INSERT INTO audit_log (enterprise_id, user_id, action, entity, entity_id, metadata)
		SELECT enterprise_id, id, $2, $3, $4, $5::jsonb
		FROM users
		WHERE id = $1
	`, userID, action, entity, entityID, string(metadata))
	return err
}

func (r *UserRepository) EnsureEnterpriseStateDefaults(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `
		WITH enterprise AS (
			SELECT enterprise_id FROM users WHERE id = $1 AND enterprise_id IS NOT NULL
		), dashboard AS (
			INSERT INTO enterprise_state (enterprise_id, key, value, updated_at)
			SELECT enterprise_id, 'dashboard.defaults', jsonb_build_object(
				'period_source', 'latest_loaded_period',
				'scope', 'enterprise',
				'widgets', jsonb_build_array('kpi', 'monthly_plan_fact', 'variance_heatmap', 'detail_table')
			), CURRENT_TIMESTAMP
			FROM enterprise
			ON CONFLICT (enterprise_id, key) DO NOTHING
		)
		INSERT INTO enterprise_state (enterprise_id, key, value, updated_at)
		SELECT enterprise_id, 'access.policy', jsonb_build_object(
			'controller', jsonb_build_object('can_view_all_cost_centers', true, 'can_import', true, 'can_manage_users', false),
			'manager', jsonb_build_object('can_view_assigned_cost_center', true, 'can_import', false, 'can_manage_users', false),
			'analyst', jsonb_build_object('can_view_reports', true, 'can_import', false, 'can_manage_users', false)
		), CURRENT_TIMESTAMP
		FROM enterprise
		ON CONFLICT (enterprise_id, key) DO NOTHING
	`, userID)
	return err
}
