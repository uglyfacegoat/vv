package models

import (
	"github.com/google/uuid"
)

type CostCenter struct {
	ID     int    `json:"cc_id"`
	Code   string `json:"code"`
	Name   string `json:"name"`
	Owner  string `json:"owner"`
	Active bool   `json:"active"`
}

type ItemType string

const (
	TypeOPEX  ItemType = "OPEX"
	TypeCAPEX ItemType = "CAPEX"
)

type Item struct {
	ID     int      `json:"item_id"`
	Code   string   `json:"code"`
	Name   string   `json:"name"`
	Type   ItemType `json:"type"`
	Active bool     `json:"active"`
}

type Plan struct {
	ID         uuid.UUID `json:"id"`
	Period     string    `json:"period"` // YYYY-MM
	CCID       int       `json:"cc_id"`
	ItemID     int       `json:"item_id"`
	AmountPlan float64   `json:"amount_plan"`
}

type Fact struct {
	ID         uuid.UUID `json:"id"`
	Period     string    `json:"period"` // YYYY-MM
	CCID       int       `json:"cc_id"`
	ItemID     int       `json:"item_id"`
	AmountFact float64   `json:"amount_fact"`
}

type PlanFactRow struct {
	Period     string   `json:"period"`
	CCID       int      `json:"cc_id"`
	CCName     string   `json:"cc_name"`
	ItemID     int      `json:"item_id"`
	ItemName   string   `json:"item_name"`
	ItemType   string   `json:"type"`
	AmountPlan float64  `json:"amount_plan"`
	AmountFact float64  `json:"amount_fact"`
	Delta      float64  `json:"delta"`
	DeltaPct   *float64 `json:"delta_pct"`
	Status     string   `json:"status"`
}

type ReportKPI struct {
	ShareInNorm     float64 `json:"share_in_norm"`
	MeanAbsDeltaPct float64 `json:"mean_abs_delta_pct"`
	TotalPlan       float64 `json:"total_plan"`
	TotalFact       float64 `json:"total_fact"`
	TotalDelta      float64 `json:"total_delta"`
}

type ReportResponse struct {
	Rows []PlanFactRow `json:"rows"`
	KPI  ReportKPI     `json:"kpi"`
}

type ImportError struct {
	Row     int    `json:"row"`
	Message string `json:"message"`
}

type ImportResult struct {
	Inserted    int           `json:"inserted"`
	Updated     int           `json:"updated"`
	AutoCreated int           `json:"auto_created"`
	Errors      []ImportError `json:"errors"`
}

type CompletenessResult struct {
	MissingInFact  int      `json:"missing_in_fact"`
	MissingInPlan  int      `json:"missing_in_plan"`
	PeriodMismatch []string `json:"period_mismatch"`
}
