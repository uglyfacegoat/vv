package repository

import (
	"context"

	"backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	db *pgxpool.Pool
}

func NewAdminRepository(db *pgxpool.Pool) *AdminRepository {
	return &AdminRepository{db: db}
}

func (r *AdminRepository) GetOverview(ctx context.Context) (models.AdminOverview, error) {
	var overview models.AdminOverview

	userRows, err := r.db.Query(ctx, `
		SELECT
			u.id,
			u.email,
			roles.name,
			roles.display_name,
			u.cc_id,
			cc.name,
			COALESCE(u.profile->>'name', split_part(u.email, '@', 1)) as profile_name,
			COALESCE(NULLIF(u.profile->>'department', ''), '') as department,
			(SELECT COUNT(*) FROM plan p WHERE p.user_id = u.id) as plan_rows,
			(SELECT COUNT(*) FROM fact f WHERE f.user_id = u.id) as fact_rows,
			(SELECT COUNT(*) FROM user_state us WHERE us.user_id = u.id) as state_keys,
			u.created_at,
			u.updated_at
		FROM users u
		JOIN roles ON roles.id = u.role_id
		LEFT JOIN cost_centers cc ON cc.cc_id = u.cc_id
		ORDER BY u.created_at DESC, u.email
	`)
	if err != nil {
		return overview, err
	}
	defer userRows.Close()
	for userRows.Next() {
		var user models.AdminUserSummary
		if err := userRows.Scan(
			&user.ID, &user.Email, &user.Role, &user.RoleDisplayName, &user.CCID, &user.CCName,
			&user.ProfileName, &user.Department, &user.PlanRows, &user.FactRows, &user.StateKeys,
			&user.CreatedAt, &user.UpdatedAt,
		); err != nil {
			return overview, err
		}
		overview.Users = append(overview.Users, user)
	}
	if err := userRows.Err(); err != nil {
		return overview, err
	}

	roleRows, err := r.db.Query(ctx, `
		SELECT roles.name, roles.display_name, COUNT(users.id)
		FROM roles
		LEFT JOIN users ON users.role_id = roles.id
		GROUP BY roles.id, roles.name, roles.display_name
		ORDER BY roles.name
	`)
	if err != nil {
		return overview, err
	}
	defer roleRows.Close()
	for roleRows.Next() {
		var role models.AdminRoleSummary
		if err := roleRows.Scan(&role.Role, &role.RoleDisplayName, &role.Users); err != nil {
			return overview, err
		}
		overview.Roles = append(overview.Roles, role)
	}
	if err := roleRows.Err(); err != nil {
		return overview, err
	}

	if err := r.db.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM cost_centers),
			(SELECT COUNT(*) FROM items),
			(SELECT COUNT(*) FROM plan),
			(SELECT COUNT(*) FROM fact),
			(SELECT COUNT(*) FROM imports_log)
	`).Scan(&overview.Data.CostCenters, &overview.Data.Items, &overview.Data.PlanRows, &overview.Data.FactRows, &overview.Data.Imports); err != nil {
		return overview, err
	}

	stateRows, err := r.db.Query(ctx, `
		SELECT us.user_id, u.email, us.key, us.updated_at
		FROM user_state us
		JOIN users u ON u.id = us.user_id
		ORDER BY us.updated_at DESC
		LIMIT 50
	`)
	if err != nil {
		return overview, err
	}
	defer stateRows.Close()
	for stateRows.Next() {
		var state models.AdminStateSummary
		if err := stateRows.Scan(&state.UserID, &state.Email, &state.Key, &state.UpdatedAt); err != nil {
			return overview, err
		}
		overview.States = append(overview.States, state)
	}
	if err := stateRows.Err(); err != nil {
		return overview, err
	}

	importRows, err := r.db.Query(ctx, `
		SELECT kind, filename, status, inserted_count, updated_count, error_count, imported_at
		FROM imports_log
		ORDER BY imported_at DESC
		LIMIT 50
	`)
	if err != nil {
		return overview, err
	}
	defer importRows.Close()
	for importRows.Next() {
		var item models.AdminImportSummary
		if err := importRows.Scan(&item.Kind, &item.Filename, &item.Status, &item.Inserted, &item.Updated, &item.Errors, &item.ImportedAt); err != nil {
			return overview, err
		}
		overview.Imports = append(overview.Imports, item)
	}
	if err := importRows.Err(); err != nil {
		return overview, err
	}

	return overview, nil
}
