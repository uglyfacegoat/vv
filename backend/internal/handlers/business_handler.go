package handlers

import (
	"encoding/csv"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/auth"
	"github.com/go-chi/chi/v5"
)

type BusinessHandler struct {
	repo *repository.BusinessRepository
}

func NewBusinessHandler(repo *repository.BusinessRepository) *BusinessHandler {
	return &BusinessHandler{repo: repo}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func (h *BusinessHandler) GetCostCenters(w http.ResponseWriter, r *http.Request) {
	ccs, err := h.repo.GetCostCenters(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ccs)
}

func (h *BusinessHandler) CreateCostCenter(w http.ResponseWriter, r *http.Request) {
	var cc models.CostCenter
	if err := json.NewDecoder(r.Body).Decode(&cc); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	cc.Code = strings.TrimSpace(cc.Code)
	cc.Name = strings.TrimSpace(cc.Name)
	cc.Owner = strings.TrimSpace(cc.Owner)
	if cc.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if cc.Owner == "" {
		cc.Owner = "Финансовый блок"
	}
	cc.Active = true
	if err := h.repo.CreateCostCenter(r.Context(), &cc); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cc)
}

func (h *BusinessHandler) UpdateCostCenter(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "id must be integer", http.StatusBadRequest)
		return
	}
	var cc models.CostCenter
	if err := json.NewDecoder(r.Body).Decode(&cc); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	cc.ID = id
	cc.Code = strings.TrimSpace(cc.Code)
	cc.Name = strings.TrimSpace(cc.Name)
	cc.Owner = strings.TrimSpace(cc.Owner)
	if cc.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if err := h.repo.UpdateCostCenter(r.Context(), cc); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, cc)
}

func (h *BusinessHandler) DeleteCostCenter(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "id must be integer", http.StatusBadRequest)
		return
	}
	if err := h.repo.DeleteCostCenter(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *BusinessHandler) GetItems(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.GetItems(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func (h *BusinessHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	var item models.Item
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	item.Code = strings.TrimSpace(item.Code)
	item.Name = strings.TrimSpace(item.Name)
	if item.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if item.Type != models.TypeOPEX && item.Type != models.TypeCAPEX {
		http.Error(w, "type must be OPEX or CAPEX", http.StatusBadRequest)
		return
	}
	item.Active = true
	if err := h.repo.CreateItem(r.Context(), &item); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func (h *BusinessHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "id must be integer", http.StatusBadRequest)
		return
	}
	var item models.Item
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	item.ID = id
	item.Code = strings.TrimSpace(item.Code)
	item.Name = strings.TrimSpace(item.Name)
	if item.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if item.Type != models.TypeOPEX && item.Type != models.TypeCAPEX {
		http.Error(w, "type must be OPEX or CAPEX", http.StatusBadRequest)
		return
	}
	if err := h.repo.UpdateItem(r.Context(), item); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *BusinessHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		http.Error(w, "id must be integer", http.StatusBadRequest)
		return
	}
	if err := h.repo.DeleteItem(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *BusinessHandler) SavePlan(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var p models.Plan
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.repo.CreatePlan(r.Context(), claims.UserID, &p); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(p)
}

func (h *BusinessHandler) SaveFact(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	var f models.Fact
	if err := json.NewDecoder(r.Body).Decode(&f); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	if err := h.repo.CreateFact(r.Context(), claims.UserID, &f); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(f)
}

func (h *BusinessHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	report, ok := h.buildReportFromRequest(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, report)
}

func (h *BusinessHandler) ExportReport(w http.ResponseWriter, r *http.Request) {
	report, ok := h.buildReportFromRequest(w, r)
	if !ok {
		return
	}

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="plan_fact_report.csv"`)
	writer := csv.NewWriter(w)
	writer.Comma = ';'
	defer writer.Flush()

	_ = writer.Write([]string{"period", "cc_id", "cc_name", "item_id", "item_name", "type", "amount_plan", "amount_fact", "delta", "delta_pct", "status"})
	for _, row := range report.Rows {
		deltaPct := ""
		if row.DeltaPct != nil {
			deltaPct = strconv.FormatFloat(*row.DeltaPct, 'f', 6, 64)
		}
		_ = writer.Write([]string{
			row.Period,
			strconv.Itoa(row.CCID),
			row.CCName,
			strconv.Itoa(row.ItemID),
			row.ItemName,
			row.ItemType,
			strconv.FormatFloat(row.AmountPlan, 'f', 2, 64),
			strconv.FormatFloat(row.AmountFact, 'f', 2, 64),
			strconv.FormatFloat(row.Delta, 'f', 2, 64),
			deltaPct,
			row.Status,
		})
	}
}

func (h *BusinessHandler) GetThreshold(w http.ResponseWriter, r *http.Request) {
	threshold, err := h.repo.GetThreshold(r.Context())
	if err != nil {
		http.Error(w, "failed to load threshold", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]float64{"threshold": threshold})
}

func (h *BusinessHandler) UpdateThreshold(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Threshold float64 `json:"threshold"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Threshold <= 0 || req.Threshold > 1 {
		http.Error(w, "threshold must be between 0 and 1", http.StatusBadRequest)
		return
	}
	if err := h.repo.SetThreshold(r.Context(), req.Threshold); err != nil {
		http.Error(w, "failed to save threshold", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]float64{"threshold": req.Threshold})
}

func (h *BusinessHandler) buildReportFromRequest(w http.ResponseWriter, r *http.Request) (models.ReportResponse, bool) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return models.ReportResponse{}, false
	}
	from := r.URL.Query().Get("from")
	to := r.URL.Query().Get("to")
	if from == "" {
		from = r.URL.Query().Get("period")
	}
	if to == "" {
		to = from
	}
	if from == "" || to == "" {
		http.Error(w, "from and to are required", http.StatusBadRequest)
		return models.ReportResponse{}, false
	}
	threshold := 0.10
	if raw := r.URL.Query().Get("threshold"); raw != "" {
		parsed, err := strconv.ParseFloat(raw, 64)
		if err != nil || parsed <= 0 {
			http.Error(w, "threshold must be positive number", http.StatusBadRequest)
			return models.ReportResponse{}, false
		}
		threshold = parsed
	} else if saved, err := h.repo.GetThreshold(r.Context()); err == nil {
		threshold = saved
	}
	var ccID *int
	if raw := r.URL.Query().Get("cc_id"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			http.Error(w, "cc_id must be integer", http.StatusBadRequest)
			return models.ReportResponse{}, false
		}
		ccID = &parsed
	}
	var itemType *string
	if raw := r.URL.Query().Get("type"); raw != "" && raw != "ALL" {
		if raw != "OPEX" && raw != "CAPEX" {
			http.Error(w, "type must be OPEX or CAPEX", http.StatusBadRequest)
			return models.ReportResponse{}, false
		}
		itemType = &raw
	}
	var status *string
	if raw := r.URL.Query().Get("status"); raw != "" && raw != "ALL" {
		if raw != "IN_NORM" && raw != "OVERSPEND" && raw != "SAVING" && raw != "NO_PLAN" {
			http.Error(w, "status must be IN_NORM, OVERSPEND, SAVING or NO_PLAN", http.StatusBadRequest)
			return models.ReportResponse{}, false
		}
		status = &raw
	}

	report, err := h.repo.GetReport(r.Context(), claims.UserID, from, to, ccID, itemType, status, threshold)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return models.ReportResponse{}, false
	}
	return report, true
}

func (h *BusinessHandler) GetDataEntries(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	kind := strings.TrimSpace(chi.URLParam(r, "kind"))
	if kind != "plan" && kind != "fact" {
		http.Error(w, "kind must be plan or fact", http.StatusBadRequest)
		return
	}
	limit := 200
	if raw := r.URL.Query().Get("limit"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			http.Error(w, "limit must be positive integer", http.StatusBadRequest)
			return
		}
		limit = parsed
	}
	entries, err := h.repo.GetDataEntries(r.Context(), claims.UserID, kind, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, entries)
}

func (h *BusinessHandler) UpsertDataEntry(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	kind := strings.TrimSpace(chi.URLParam(r, "kind"))
	if kind != "plan" && kind != "fact" {
		http.Error(w, "kind must be plan or fact", http.StatusBadRequest)
		return
	}
	var req models.UpsertDataEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Period == "" || req.CCID <= 0 || req.ItemID <= 0 || req.Amount < 0 {
		http.Error(w, "period, cc_id, item_id and non-negative amount are required", http.StatusBadRequest)
		return
	}
	if kind == "plan" {
		err := h.repo.UpsertPlan(r.Context(), claims.UserID, models.Plan{Period: req.Period, CCID: req.CCID, ItemID: req.ItemID, AmountPlan: req.Amount})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		err := h.repo.UpsertFact(r.Context(), claims.UserID, models.Fact{Period: req.Period, CCID: req.CCID, ItemID: req.ItemID, AmountFact: req.Amount})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *BusinessHandler) DeleteDataEntry(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	kind := strings.TrimSpace(chi.URLParam(r, "kind"))
	if kind != "plan" && kind != "fact" {
		http.Error(w, "kind must be plan or fact", http.StatusBadRequest)
		return
	}
	period := strings.TrimSpace(r.URL.Query().Get("period"))
	ccID, ccErr := strconv.Atoi(r.URL.Query().Get("cc_id"))
	itemID, itemErr := strconv.Atoi(r.URL.Query().Get("item_id"))
	if period == "" || ccErr != nil || itemErr != nil {
		http.Error(w, "period, cc_id and item_id are required", http.StatusBadRequest)
		return
	}
	if err := h.repo.DeleteDataEntry(r.Context(), claims.UserID, kind, period, ccID, itemID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *BusinessHandler) ClearData(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	if err := h.repo.ClearUserPlanFact(r.Context(), claims.UserID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
