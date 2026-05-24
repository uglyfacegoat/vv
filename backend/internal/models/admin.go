package models

import (
	"time"

	"github.com/google/uuid"
)

type AdminUserSummary struct {
	ID              uuid.UUID `json:"id"`
	Email           string    `json:"email"`
	Role            string    `json:"role"`
	RoleDisplayName string    `json:"role_display_name"`
	CCID            *int      `json:"cc_id,omitempty"`
	CCName          *string   `json:"cc_name,omitempty"`
	ProfileName     string    `json:"profile_name"`
	Department      string    `json:"department"`
	PlanRows        int       `json:"plan_rows"`
	FactRows        int       `json:"fact_rows"`
	StateKeys       int       `json:"state_keys"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type AdminRoleSummary struct {
	Role            string `json:"role"`
	RoleDisplayName string `json:"role_display_name"`
	Users           int    `json:"users"`
}

type AdminDataSummary struct {
	CostCenters int `json:"cost_centers"`
	Items       int `json:"items"`
	PlanRows    int `json:"plan_rows"`
	FactRows    int `json:"fact_rows"`
	Imports     int `json:"imports"`
}

type AdminStateSummary struct {
	UserID    uuid.UUID `json:"user_id"`
	Email     string    `json:"email"`
	Key       string    `json:"key"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AdminImportSummary struct {
	Kind       string    `json:"kind"`
	Filename   string    `json:"filename"`
	Status     string    `json:"status"`
	Inserted   int       `json:"inserted"`
	Updated    int       `json:"updated"`
	Errors     int       `json:"errors"`
	ImportedAt time.Time `json:"imported_at"`
}

type AdminOverview struct {
	Users   []AdminUserSummary   `json:"users"`
	Roles   []AdminRoleSummary   `json:"roles"`
	Data    AdminDataSummary     `json:"data"`
	States  []AdminStateSummary  `json:"states"`
	Imports []AdminImportSummary `json:"imports"`
}
