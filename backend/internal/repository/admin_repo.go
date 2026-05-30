package repository

import (
	"context"
	"time"

	"backend/internal/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	db *pgxpool.Pool
}

func NewAdminRepository(db *pgxpool.Pool) *AdminRepository {
	return &AdminRepository{db: db}
}

func nullableUUID(value pgtype.UUID) *uuid.UUID {
	if !value.Valid {
		return nil
	}
	id, err := uuid.FromBytes(value.Bytes[:])
	if err != nil {
		return nil
	}
	return &id
}

func nullableTime(value pgtype.Timestamptz) *time.Time {
	if !value.Valid {
		return nil
	}
	t := value.Time
	return &t
}

func (r *AdminRepository) GetOverview(ctx context.Context) (models.AdminOverview, error) {
	var overview models.AdminOverview

	userRows, err := r.db.Query(ctx, `
		SELECT
			u.id,
			u.email,
			roles.name,
			roles.display_name,
			COALESCE(u.enterprise_id, '00000000-0000-0000-0000-000000000000'::uuid),
			COALESCE(e.key, ''),
			COALESCE(e.name, ''),
			u.cc_id,
			cc.name,
			COALESCE(u.profile->>'name', split_part(u.email, '@', 1)) as profile_name,
			COALESCE(NULLIF(u.profile->>'department', ''), '') as department,
			(SELECT COUNT(*) FROM plan p WHERE p.enterprise_id = u.enterprise_id) as plan_rows,
			(SELECT COUNT(*) FROM fact f WHERE f.enterprise_id = u.enterprise_id) as fact_rows,
			(SELECT COUNT(*) FROM imports_log l WHERE l.user_id = u.id) as import_rows,
			(SELECT COUNT(*) FROM user_state us WHERE us.user_id = u.id) as state_keys,
			(SELECT MAX(imported_at) FROM imports_log l WHERE l.user_id = u.id) as last_import_at,
			u.created_at,
			u.updated_at
		FROM users u
		JOIN roles ON roles.id = u.role_id
		LEFT JOIN enterprises e ON e.id = u.enterprise_id
		LEFT JOIN cost_centers cc ON cc.cc_id = u.cc_id
		ORDER BY u.created_at DESC, u.email
	`)
	if err != nil {
		return overview, err
	}
	defer userRows.Close()
	for userRows.Next() {
		var user models.AdminUserSummary
		var lastImportAt pgtype.Timestamptz
		if err := userRows.Scan(
			&user.ID, &user.Email, &user.Role, &user.RoleDisplayName,
			&user.EnterpriseID, &user.EnterpriseKey, &user.EnterpriseName,
			&user.CCID, &user.CCName, &user.ProfileName, &user.Department,
			&user.PlanRows, &user.FactRows, &user.ImportRows, &user.StateKeys,
			&lastImportAt, &user.CreatedAt, &user.UpdatedAt,
		); err != nil {
			return overview, err
		}
		user.LastImportAt = nullableTime(lastImportAt)
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
			(SELECT COUNT(*) FROM enterprises),
			(SELECT COUNT(*) FROM cost_centers),
			(SELECT COUNT(*) FROM items),
			(SELECT COUNT(*) FROM plan),
			(SELECT COUNT(*) FROM fact),
			(SELECT COUNT(*) FROM imports_log),
			(SELECT COUNT(*) FROM audit_log),
			(SELECT COUNT(*) FROM enterprise_state),
			(SELECT COUNT(*) FROM user_state)
	`).Scan(
		&overview.Data.Enterprises, &overview.Data.CostCenters, &overview.Data.Items,
		&overview.Data.PlanRows, &overview.Data.FactRows, &overview.Data.Imports,
		&overview.Data.AuditEvents, &overview.Data.EnterpriseStateKeys, &overview.Data.UserStateKeys,
	); err != nil {
		return overview, err
	}

	enterpriseRows, err := r.db.Query(ctx, `
		SELECT
			e.id,
			e.key,
			e.name,
			(SELECT COUNT(*) FROM users u WHERE u.enterprise_id = e.id) as users,
			(SELECT COUNT(DISTINCT p.cc_id) FROM plan p WHERE p.enterprise_id = e.id) as cost_centers,
			(SELECT COUNT(DISTINCT p.item_id) FROM plan p WHERE p.enterprise_id = e.id) as items,
			(SELECT COUNT(*) FROM plan p WHERE p.enterprise_id = e.id) as plan_rows,
			(SELECT COUNT(*) FROM fact f WHERE f.enterprise_id = e.id) as fact_rows,
			(SELECT COUNT(*) FROM imports_log l WHERE l.enterprise_id = e.id) as imports,
			(SELECT COUNT(*) FROM audit_log a WHERE a.enterprise_id = e.id) as audit_events,
			(SELECT COUNT(*) FROM enterprise_state es WHERE es.enterprise_id = e.id) as enterprise_state_keys,
			GREATEST(
				COALESCE((SELECT MAX(imported_at) FROM imports_log l WHERE l.enterprise_id = e.id), e.created_at),
				COALESCE((SELECT MAX(created_at) FROM audit_log a WHERE a.enterprise_id = e.id), e.created_at),
				COALESCE((SELECT MAX(updated_at) FROM enterprise_state es WHERE es.enterprise_id = e.id), e.created_at)
			) as last_activity_at,
			e.created_at
		FROM enterprises e
		ORDER BY last_activity_at DESC, e.created_at DESC
	`)
	if err != nil {
		return overview, err
	}
	defer enterpriseRows.Close()
	for enterpriseRows.Next() {
		var enterprise models.AdminEnterpriseSummary
		var lastActivityAt pgtype.Timestamptz
		if err := enterpriseRows.Scan(
			&enterprise.ID, &enterprise.Key, &enterprise.Name, &enterprise.Users,
			&enterprise.CostCenters, &enterprise.Items, &enterprise.PlanRows, &enterprise.FactRows,
			&enterprise.Imports, &enterprise.AuditEvents, &enterprise.EnterpriseStateKeys,
			&lastActivityAt, &enterprise.CreatedAt,
		); err != nil {
			return overview, err
		}
		enterprise.LastActivityAt = nullableTime(lastActivityAt)
		overview.Enterprises = append(overview.Enterprises, enterprise)
	}
	if err := enterpriseRows.Err(); err != nil {
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

	enterpriseStateRows, err := r.db.Query(ctx, `
		SELECT es.enterprise_id, e.key, es.key, es.updated_at
		FROM enterprise_state es
		JOIN enterprises e ON e.id = es.enterprise_id
		ORDER BY es.updated_at DESC
		LIMIT 50
	`)
	if err != nil {
		return overview, err
	}
	defer enterpriseStateRows.Close()
	for enterpriseStateRows.Next() {
		var state models.AdminEnterpriseStateSummary
		if err := enterpriseStateRows.Scan(&state.EnterpriseID, &state.EnterpriseKey, &state.Key, &state.UpdatedAt); err != nil {
			return overview, err
		}
		overview.EnterpriseStates = append(overview.EnterpriseStates, state)
	}
	if err := enterpriseStateRows.Err(); err != nil {
		return overview, err
	}

	importRows, err := r.db.Query(ctx, `
		SELECT l.kind, l.filename, l.status, l.inserted_count, l.updated_count, l.error_count, l.imported_at,
		       l.user_id, COALESCE(u.email, ''), l.enterprise_id, COALESCE(e.key, '')
		FROM imports_log l
		LEFT JOIN users u ON u.id = l.user_id
		LEFT JOIN enterprises e ON e.id = l.enterprise_id
		ORDER BY l.imported_at DESC
		LIMIT 80
	`)
	if err != nil {
		return overview, err
	}
	defer importRows.Close()
	for importRows.Next() {
		var item models.AdminImportSummary
		var userID, enterpriseID pgtype.UUID
		if err := importRows.Scan(
			&item.Kind, &item.Filename, &item.Status, &item.Inserted, &item.Updated, &item.Errors,
			&item.ImportedAt, &userID, &item.Email, &enterpriseID, &item.EnterpriseKey,
		); err != nil {
			return overview, err
		}
		item.UserID = nullableUUID(userID)
		item.EnterpriseID = nullableUUID(enterpriseID)
		overview.Imports = append(overview.Imports, item)
	}
	if err := importRows.Err(); err != nil {
		return overview, err
	}

	auditRows, err := r.db.Query(ctx, `
		SELECT a.id, a.enterprise_id, COALESCE(e.key, ''), a.user_id, COALESCE(u.email, ''),
		       a.action, a.entity, a.entity_id, a.metadata::text, a.created_at
		FROM audit_log a
		LEFT JOIN users u ON u.id = a.user_id
		LEFT JOIN enterprises e ON e.id = a.enterprise_id
		ORDER BY a.created_at DESC
		LIMIT 120
	`)
	if err != nil {
		return overview, err
	}
	defer auditRows.Close()
	for auditRows.Next() {
		var item models.AdminAuditSummary
		var enterpriseID, userID pgtype.UUID
		if err := auditRows.Scan(
			&item.ID, &enterpriseID, &item.EnterpriseKey, &userID, &item.Email,
			&item.Action, &item.Entity, &item.EntityID, &item.Metadata, &item.CreatedAt,
		); err != nil {
			return overview, err
		}
		item.EnterpriseID = nullableUUID(enterpriseID)
		item.UserID = nullableUUID(userID)
		overview.Audit = append(overview.Audit, item)
	}
	if err := auditRows.Err(); err != nil {
		return overview, err
	}

	return overview, nil
}
