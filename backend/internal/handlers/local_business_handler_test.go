package handlers

import (
	"net/http/httptest"
	"testing"

	"backend/internal/models"

	"github.com/google/uuid"
)

func TestLocalCSVImportBuildsReport(t *testing.T) {
	userID := uuid.New()
	h := &LocalAuthHandler{
		store: localStore{
			CostCenters: localDefaultCostCenters(),
			Items:       localDefaultItems(),
			Imports:     map[string][]models.ImportLogEntry{},
		},
	}

	costCenters, err := readLocalCSV([]byte("cc_id;name\n4;Финансы\n"))
	if err != nil {
		t.Fatalf("read cost centers csv: %v", err)
	}
	result := h.applyLocalImportLocked(userID, "cost_centers", costCenters, false)
	if len(result.Errors) != 0 || result.Inserted != 1 {
		t.Fatalf("unexpected cost center import result: %+v", result)
	}

	items, err := readLocalCSV([]byte("item_id;name;type\n6;Маркетинг;OPEX\n"))
	if err != nil {
		t.Fatalf("read items csv: %v", err)
	}
	result = h.applyLocalImportLocked(userID, "items", items, false)
	if len(result.Errors) != 0 || result.Inserted != 1 {
		t.Fatalf("unexpected item import result: %+v", result)
	}

	plan, err := readLocalCSV([]byte("period;cc_id;item_id;amount_plan\n2026-01;4;6;1000\n"))
	if err != nil {
		t.Fatalf("read plan csv: %v", err)
	}
	result = h.applyLocalImportLocked(userID, "plan", plan, false)
	if len(result.Errors) != 0 || result.Inserted != 1 {
		t.Fatalf("unexpected plan import result: %+v", result)
	}

	fact, err := readLocalCSV([]byte("period;cc_id;item_id;amount_fact\n2026-01;4;6;1200\n"))
	if err != nil {
		t.Fatalf("read fact csv: %v", err)
	}
	result = h.applyLocalImportLocked(userID, "fact", fact, false)
	if len(result.Errors) != 0 || result.Inserted != 1 {
		t.Fatalf("unexpected fact import result: %+v", result)
	}

	req := httptest.NewRequest("GET", "/api/v1/report?from=2026-01&to=2026-01&threshold=0.1", nil)
	report := h.buildLocalReport(req, userID)
	if len(report.Rows) != 1 {
		t.Fatalf("expected 1 report row, got %d", len(report.Rows))
	}
	row := report.Rows[0]
	if row.Status != "OVERSPEND" || row.Delta != 200 || row.DeltaPct == nil || *row.DeltaPct != 0.2 {
		t.Fatalf("unexpected report row: %+v", row)
	}
}
