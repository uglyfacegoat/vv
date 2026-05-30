package models

import (
	"time"

	"github.com/google/uuid"
)

type AdminUserSummary struct {
	ID              uuid.UUID  `json:"id"`
	Email           string     `json:"email"`
	Role            string     `json:"role"`
	RoleDisplayName string     `json:"role_display_name"`
	EnterpriseID    uuid.UUID  `json:"enterprise_id"`
	EnterpriseKey   string     `json:"enterprise_key"`
	EnterpriseName  string     `json:"enterprise_name"`
	CCID            *int       `json:"cc_id,omitempty"`
	CCName          *string    `json:"cc_name,omitempty"`
	ProfileName     string     `json:"profile_name"`
	Department      string     `json:"department"`
	PlanRows        int        `json:"plan_rows"`
	FactRows        int        `json:"fact_rows"`
	ImportRows      int        `json:"import_rows"`
	StateKeys       int        `json:"state_keys"`
	LastImportAt    *time.Time `json:"last_import_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type AdminRoleSummary struct {
	Role            string `json:"role"`
	RoleDisplayName string `json:"role_display_name"`
	Users           int    `json:"users"`
}

type AdminDataSummary struct {
	Enterprises         int `json:"enterprises"`
	CostCenters         int `json:"cost_centers"`
	Items               int `json:"items"`
	PlanRows            int `json:"plan_rows"`
	FactRows            int `json:"fact_rows"`
	Imports             int `json:"imports"`
	AuditEvents         int `json:"audit_events"`
	EnterpriseStateKeys int `json:"enterprise_state_keys"`
	UserStateKeys       int `json:"user_state_keys"`
}

type AdminStateSummary struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	Key       string    `json:"key"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AdminImportSummary struct {
	Kind          string     `json:"kind"`
	Filename      string     `json:"filename"`
	Status        string     `json:"status"`
	Inserted      int        `json:"inserted"`
	Updated       int        `json:"updated"`
	Errors        int        `json:"errors"`
	ImportedAt    time.Time  `json:"imported_at"`
	UserID        *uuid.UUID `json:"user_id,omitempty"`
	Email         string     `json:"email"`
	EnterpriseID  *uuid.UUID `json:"enterprise_id,omitempty"`
	EnterpriseKey string     `json:"enterprise_key"`
}

type AdminEnterpriseSummary struct {
	ID                  uuid.UUID  `json:"id"`
	Key                 string     `json:"key"`
	Name                string     `json:"name"`
	Users               int        `json:"users"`
	CostCenters         int        `json:"cost_centers"`
	Items               int        `json:"items"`
	PlanRows            int        `json:"plan_rows"`
	FactRows            int        `json:"fact_rows"`
	Imports             int        `json:"imports"`
	AuditEvents         int        `json:"audit_events"`
	EnterpriseStateKeys int        `json:"enterprise_state_keys"`
	LastActivityAt      *time.Time `json:"last_activity_at,omitempty"`
	CreatedAt           time.Time  `json:"created_at"`
}

type AdminEnterpriseStateSummary struct {
	EnterpriseID  uuid.UUID `json:"enterprise_id"`
	EnterpriseKey string    `json:"enterprise_key"`
	Key           string    `json:"key"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type AdminAuditSummary struct {
	ID            uuid.UUID  `json:"id"`
	EnterpriseID  *uuid.UUID `json:"enterprise_id,omitempty"`
	EnterpriseKey string     `json:"enterprise_key"`
	UserID        *uuid.UUID `json:"user_id,omitempty"`
	Email         string     `json:"email"`
	Action        string     `json:"action"`
	Entity        string     `json:"entity"`
	EntityID      string     `json:"entity_id"`
	Metadata      string     `json:"metadata"`
	CreatedAt     time.Time  `json:"created_at"`
}

type AdminOverview struct {
	Users            []AdminUserSummary            `json:"users"`
	Roles            []AdminRoleSummary            `json:"roles"`
	Data             AdminDataSummary              `json:"data"`
	States           []AdminStateSummary           `json:"states"`
	EnterpriseStates []AdminEnterpriseStateSummary `json:"enterprise_states"`
	Enterprises      []AdminEnterpriseSummary      `json:"enterprises"`
	Imports          []AdminImportSummary          `json:"imports"`
	Audit            []AdminAuditSummary           `json:"audit"`
}
