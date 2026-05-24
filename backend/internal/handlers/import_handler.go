package handlers

import (
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/auth"
	"github.com/google/uuid"
)

type ImportHandler struct {
	repo *repository.BusinessRepository
}

func NewImportHandler(repo *repository.BusinessRepository) *ImportHandler {
	return &ImportHandler{repo: repo}
}

var periodRE = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)

func (h *ImportHandler) ImportCostCenters(w http.ResponseWriter, r *http.Request) {
	h.importCSV(w, r, "cost_centers")
}

func (h *ImportHandler) ImportItems(w http.ResponseWriter, r *http.Request) {
	h.importCSV(w, r, "items")
}

func (h *ImportHandler) ImportPlan(w http.ResponseWriter, r *http.Request) {
	h.importCSV(w, r, "plan")
}

func (h *ImportHandler) ImportFact(w http.ResponseWriter, r *http.Request) {
	h.importCSV(w, r, "fact")
}

func (h *ImportHandler) CheckCompleteness(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	result, err := h.repo.CheckCompleteness(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ImportHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	limit := 20
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			http.Error(w, "limit must be positive integer", http.StatusBadRequest)
			return
		}
		limit = parsed
	}
	logs, err := h.repo.GetImportLogs(r.Context(), claims.UserID, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, logs)
}

func (h *ImportHandler) importCSV(w http.ResponseWriter, r *http.Request, kind string) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	if err := r.ParseMultipartForm(12 << 20); err != nil {
		http.Error(w, "multipart form with file is required", http.StatusBadRequest)
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "file field is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, err := io.ReadAll(io.LimitReader(file, 10<<20+1))
	if err != nil {
		http.Error(w, "failed to read file", http.StatusBadRequest)
		return
	}
	if len(data) > 10<<20 {
		http.Error(w, "file is too large", http.StatusBadRequest)
		return
	}

	hashBytes := sha256.Sum256(data)
	fileHash := hex.EncodeToString(hashBytes[:])
	result := h.processCSV(r, kind, data)
	status := "SUCCESS"
	if len(result.Errors) > 0 {
		status = "FAILED"
	}
	_ = h.repo.LogImport(r.Context(), claims.UserID, kind, header.Filename, fileHash, status, result.Inserted, result.Updated, len(result.Errors))
	writeJSON(w, http.StatusOK, result)
}

func (h *ImportHandler) processCSV(r *http.Request, kind string, data []byte) models.ImportResult {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		return models.ImportResult{Errors: []models.ImportError{{Row: 1, Message: "unauthorized"}}}
	}
	reader := csv.NewReader(strings.NewReader(strings.TrimPrefix(string(data), "\uFEFF")))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true
	if strings.Count(string(data[:min(len(data), 4096)]), ";") > strings.Count(string(data[:min(len(data), 4096)]), ",") {
		reader.Comma = ';'
	}

	records, err := reader.ReadAll()
	if err != nil {
		return models.ImportResult{Errors: []models.ImportError{{Row: 1, Message: fmt.Sprintf("invalid CSV: %v", err)}}}
	}
	if len(records) < 2 {
		return models.ImportResult{Errors: []models.ImportError{{Row: 1, Message: "CSV must contain header and at least one data row"}}}
	}

	header := normalizeHeader(records[0])
	result := models.ImportResult{Errors: []models.ImportError{}}
	seen := map[string]bool{}
	autoCreateRefs := r.FormValue("auto_create_refs") == "1" || strings.EqualFold(r.FormValue("auto_create_refs"), "true")
	for idx, record := range records[1:] {
		row := idx + 2
		values := mapRecord(header, record)
		switch kind {
		case "cost_centers":
			h.importCostCenterRow(r, row, values, &result)
		case "items":
			h.importItemRow(r, row, values, &result)
		case "plan":
			h.importPlanRow(r, claims.UserID, row, values, seen, autoCreateRefs, &result)
		case "fact":
			h.importFactRow(r, claims.UserID, row, values, seen, autoCreateRefs, &result)
		}
	}
	return result
}

func (h *ImportHandler) importCostCenterRow(r *http.Request, row int, values map[string]string, result *models.ImportResult) {
	ccID, err := requiredInt(values, "cc_id")
	if err != nil {
		addImportError(result, row, err.Error())
		return
	}
	name := strings.TrimSpace(values["name"])
	if name == "" {
		addImportError(result, row, "name is required")
		return
	}
	code := strings.TrimSpace(values["code"])
	owner := strings.TrimSpace(values["owner"])
	if owner == "" {
		owner = "CSV импорт"
	}
	exists, _ := h.repo.CostCenterExists(r.Context(), ccID)
	if _, err := h.repo.UpsertCostCenter(r.Context(), models.CostCenter{ID: ccID, Code: code, Name: name, Owner: owner, Active: true}); err != nil {
		addImportError(result, row, err.Error())
		return
	}
	countUpsert(result, exists)
}

func (h *ImportHandler) importItemRow(r *http.Request, row int, values map[string]string, result *models.ImportResult) {
	itemID, err := requiredInt(values, "item_id")
	if err != nil {
		addImportError(result, row, err.Error())
		return
	}
	name := strings.TrimSpace(values["name"])
	itemType := strings.ToUpper(strings.TrimSpace(values["type"]))
	if name == "" {
		addImportError(result, row, "name is required")
		return
	}
	if itemType != "OPEX" && itemType != "CAPEX" {
		addImportError(result, row, "type must be OPEX or CAPEX")
		return
	}
	code := strings.TrimSpace(values["code"])
	exists, _ := h.repo.ItemExists(r.Context(), itemID)
	if _, err := h.repo.UpsertItem(r.Context(), models.Item{ID: itemID, Code: code, Name: name, Type: models.ItemType(itemType), Active: true}); err != nil {
		addImportError(result, row, err.Error())
		return
	}
	countUpsert(result, exists)
}

func (h *ImportHandler) importPlanRow(r *http.Request, userID uuid.UUID, row int, values map[string]string, seen map[string]bool, autoCreateRefs bool, result *models.ImportResult) {
	period, ccID, itemID, amount, ok := h.parsePlanFactRow(r, row, values, "amount_plan", seen, autoCreateRefs, result)
	if !ok {
		return
	}
	if err := h.repo.UpsertPlan(r.Context(), userID, models.Plan{Period: period, CCID: ccID, ItemID: itemID, AmountPlan: amount}); err != nil {
		addImportError(result, row, err.Error())
		return
	}
	result.Inserted++
}

func (h *ImportHandler) importFactRow(r *http.Request, userID uuid.UUID, row int, values map[string]string, seen map[string]bool, autoCreateRefs bool, result *models.ImportResult) {
	period, ccID, itemID, amount, ok := h.parsePlanFactRow(r, row, values, "amount_fact", seen, autoCreateRefs, result)
	if !ok {
		return
	}
	if err := h.repo.UpsertFact(r.Context(), userID, models.Fact{Period: period, CCID: ccID, ItemID: itemID, AmountFact: amount}); err != nil {
		addImportError(result, row, err.Error())
		return
	}
	result.Inserted++
}

func (h *ImportHandler) parsePlanFactRow(r *http.Request, row int, values map[string]string, amountField string, seen map[string]bool, autoCreateRefs bool, result *models.ImportResult) (string, int, int, float64, bool) {
	period := strings.TrimSpace(values["period"])
	if !periodRE.MatchString(period) {
		addImportError(result, row, "invalid period format, expected YYYY-MM")
		return "", 0, 0, 0, false
	}
	ccID, err := requiredInt(values, "cc_id")
	if err != nil {
		addImportError(result, row, err.Error())
		return "", 0, 0, 0, false
	}
	itemID, err := requiredInt(values, "item_id")
	if err != nil {
		addImportError(result, row, err.Error())
		return "", 0, 0, 0, false
	}
	amount, err := strconv.ParseFloat(strings.ReplaceAll(strings.TrimSpace(values[amountField]), ",", "."), 64)
	if err != nil || amount < 0 {
		addImportError(result, row, amountField+" must be numeric and >= 0")
		return "", 0, 0, 0, false
	}
	key := fmt.Sprintf("%s:%d:%d", period, ccID, itemID)
	if seen[key] {
		addImportError(result, row, "duplicate key inside CSV: period, cc_id, item_id")
		return "", 0, 0, 0, false
	}
	seen[key] = true
	if exists, err := h.repo.CostCenterExists(r.Context(), ccID); err != nil || !exists {
		if !autoCreateRefs {
			addImportError(result, row, fmt.Sprintf("cc_id=%d not found", ccID))
			return "", 0, 0, 0, false
		}
		if _, err := h.repo.UpsertCostCenter(r.Context(), models.CostCenter{ID: ccID, Name: fmt.Sprintf("ЦФО %d", ccID), Owner: "Автосоздание", Active: true}); err != nil {
			addImportError(result, row, fmt.Sprintf("failed to auto-create cc_id=%d: %v", ccID, err))
			return "", 0, 0, 0, false
		}
		result.AutoCreated++
	}
	if exists, err := h.repo.ItemExists(r.Context(), itemID); err != nil || !exists {
		if !autoCreateRefs {
			addImportError(result, row, fmt.Sprintf("item_id=%d not found", itemID))
			return "", 0, 0, 0, false
		}
		if _, err := h.repo.UpsertItem(r.Context(), models.Item{ID: itemID, Name: fmt.Sprintf("Статья %d", itemID), Type: models.TypeOPEX, Active: true}); err != nil {
			addImportError(result, row, fmt.Sprintf("failed to auto-create item_id=%d: %v", itemID, err))
			return "", 0, 0, 0, false
		}
		result.AutoCreated++
	}
	return period, ccID, itemID, amount, true
}

func normalizeHeader(record []string) []string {
	header := make([]string, len(record))
	for i, value := range record {
		header[i] = strings.ToLower(strings.TrimSpace(value))
	}
	return header
}

func mapRecord(header []string, record []string) map[string]string {
	values := map[string]string{}
	for i, key := range header {
		if i < len(record) {
			values[key] = strings.TrimSpace(record[i])
		}
	}
	return values
}

func requiredInt(values map[string]string, key string) (int, error) {
	value := strings.TrimSpace(values[key])
	if value == "" {
		return 0, fmt.Errorf("%s is required", key)
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be integer", key)
	}
	return parsed, nil
}

func addImportError(result *models.ImportResult, row int, message string) {
	result.Errors = append(result.Errors, models.ImportError{Row: row, Message: message})
}

func countUpsert(result *models.ImportResult, existed bool) {
	if existed {
		result.Updated++
	} else {
		result.Inserted++
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
