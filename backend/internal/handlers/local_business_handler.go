package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"backend/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func localDefaultCostCenters() []models.CostCenter {
	return []models.CostCenter{
		{ID: 1, Code: "CC-001", Name: "Производство", Owner: "Операционный блок", Active: true},
		{ID: 2, Code: "CC-002", Name: "Коммерция", Owner: "Коммерческий блок", Active: true},
		{ID: 3, Code: "CC-003", Name: "ИТ", Owner: "Технологический блок", Active: true},
	}
}

func localDefaultItems() []models.Item {
	return []models.Item{
		{ID: 1, Code: "ITM-001", Name: "ФОТ", Type: models.TypeOPEX, Active: true},
		{ID: 2, Code: "ITM-002", Name: "Аренда", Type: models.TypeOPEX, Active: true},
		{ID: 3, Code: "ITM-003", Name: "Оборудование", Type: models.TypeCAPEX, Active: true},
	}
}

func (h *LocalAuthHandler) GetCostCenters(w http.ResponseWriter, _ *http.Request) {
	h.mu.Lock()
	items := append([]models.CostCenter(nil), h.store.CostCenters...)
	h.mu.Unlock()
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	writeJSON(w, http.StatusOK, items)
}

func (h *LocalAuthHandler) CreateCostCenter(w http.ResponseWriter, r *http.Request) {
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
	h.mu.Lock()
	cc.ID = h.nextLocalCostCenterIDLocked()
	if cc.Code == "" {
		cc.Code = fmt.Sprintf("CC-%03d", cc.ID)
	}
	if h.localCostCenterCodeExistsLocked(cc.Code, 0) {
		h.mu.Unlock()
		http.Error(w, "duplicate cost center code", http.StatusConflict)
		return
	}
	h.store.CostCenters = append(h.store.CostCenters, cc)
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save cost center", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, cc)
}

func (h *LocalAuthHandler) UpdateCostCenter(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
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
	if cc.Code == "" {
		cc.Code = fmt.Sprintf("CC-%03d", id)
	}
	if cc.Owner == "" {
		cc.Owner = "Финансовый блок"
	}
	h.mu.Lock()
	if h.localCostCenterCodeExistsLocked(cc.Code, id) {
		h.mu.Unlock()
		http.Error(w, "duplicate cost center code", http.StatusConflict)
		return
	}
	updated := false
	for i := range h.store.CostCenters {
		if h.store.CostCenters[i].ID == id {
			h.store.CostCenters[i] = cc
			updated = true
			break
		}
	}
	if !updated {
		h.mu.Unlock()
		http.Error(w, "cost center not found", http.StatusNotFound)
		return
	}
	err = h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save cost center", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, cc)
}

func (h *LocalAuthHandler) DeleteCostCenter(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		http.Error(w, "id must be integer", http.StatusBadRequest)
		return
	}
	h.mu.Lock()
	found := false
	filtered := h.store.CostCenters[:0]
	for _, cc := range h.store.CostCenters {
		if cc.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, cc)
	}
	if !found {
		h.mu.Unlock()
		http.Error(w, "cost center not found", http.StatusNotFound)
		return
	}
	h.store.CostCenters = filtered
	h.removeLocalDataForCostCenterLocked(id)
	err = h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to delete cost center", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *LocalAuthHandler) GetItems(w http.ResponseWriter, _ *http.Request) {
	h.mu.Lock()
	items := append([]models.Item(nil), h.store.Items...)
	h.mu.Unlock()
	sort.Slice(items, func(i, j int) bool { return items[i].ID < items[j].ID })
	writeJSON(w, http.StatusOK, items)
}

func (h *LocalAuthHandler) CreateItem(w http.ResponseWriter, r *http.Request) {
	var item models.Item
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	item.Code = strings.TrimSpace(item.Code)
	item.Name = strings.TrimSpace(item.Name)
	item.Type = models.ItemType(strings.ToUpper(strings.TrimSpace(string(item.Type))))
	if item.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if item.Type != models.TypeOPEX && item.Type != models.TypeCAPEX {
		http.Error(w, "type must be OPEX or CAPEX", http.StatusBadRequest)
		return
	}
	item.Active = true
	h.mu.Lock()
	item.ID = h.nextLocalItemIDLocked()
	if item.Code == "" {
		item.Code = fmt.Sprintf("ITM-%03d", item.ID)
	}
	if h.localItemCodeExistsLocked(item.Code, 0) {
		h.mu.Unlock()
		http.Error(w, "duplicate item code", http.StatusConflict)
		return
	}
	h.store.Items = append(h.store.Items, item)
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save item", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *LocalAuthHandler) UpdateItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
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
	item.Type = models.ItemType(strings.ToUpper(strings.TrimSpace(string(item.Type))))
	if item.Name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	if item.Type != models.TypeOPEX && item.Type != models.TypeCAPEX {
		http.Error(w, "type must be OPEX or CAPEX", http.StatusBadRequest)
		return
	}
	if item.Code == "" {
		item.Code = fmt.Sprintf("ITM-%03d", id)
	}
	h.mu.Lock()
	if h.localItemCodeExistsLocked(item.Code, id) {
		h.mu.Unlock()
		http.Error(w, "duplicate item code", http.StatusConflict)
		return
	}
	updated := false
	for i := range h.store.Items {
		if h.store.Items[i].ID == id {
			h.store.Items[i] = item
			updated = true
			break
		}
	}
	if !updated {
		h.mu.Unlock()
		http.Error(w, "item not found", http.StatusNotFound)
		return
	}
	err = h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save item", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func (h *LocalAuthHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil || id <= 0 {
		http.Error(w, "id must be integer", http.StatusBadRequest)
		return
	}
	h.mu.Lock()
	found := false
	filtered := h.store.Items[:0]
	for _, item := range h.store.Items {
		if item.ID == id {
			found = true
			continue
		}
		filtered = append(filtered, item)
	}
	if !found {
		h.mu.Unlock()
		http.Error(w, "item not found", http.StatusNotFound)
		return
	}
	h.store.Items = filtered
	h.removeLocalDataForItemLocked(id)
	err = h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to delete item", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *LocalAuthHandler) ImportCostCenters(w http.ResponseWriter, r *http.Request) {
	h.importLocalCSV(w, r, "cost_centers")
}

func (h *LocalAuthHandler) ImportItems(w http.ResponseWriter, r *http.Request) {
	h.importLocalCSV(w, r, "items")
}

func (h *LocalAuthHandler) ImportPlan(w http.ResponseWriter, r *http.Request) {
	h.importLocalCSV(w, r, "plan")
}

func (h *LocalAuthHandler) ImportFact(w http.ResponseWriter, r *http.Request) {
	h.importLocalCSV(w, r, "fact")
}

func (h *LocalAuthHandler) importLocalCSV(w http.ResponseWriter, r *http.Request, kind string) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
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
	if err != nil || len(data) > 10<<20 {
		http.Error(w, "failed to read file or file is too large", http.StatusBadRequest)
		return
	}
	records, err := readLocalCSV(data)
	if err != nil {
		writeJSON(w, http.StatusOK, models.ImportResult{Errors: []models.ImportError{{Row: 1, Message: err.Error()}}})
		return
	}

	h.mu.Lock()
	result := h.applyLocalImportLocked(stored.User.ID, kind, records, r.FormValue("auto_create_refs") == "true")
	status := "SUCCESS"
	if len(result.Errors) > 0 {
		status = "FAILED"
	}
	key := stored.User.ID.String()
	h.store.Imports[key] = append([]models.ImportLogEntry{{
		Kind: kind, Filename: header.Filename, Status: status, Inserted: result.Inserted,
		Updated: result.Updated, Errors: len(result.Errors), ImportedAt: time.Now().Format(time.RFC3339),
	}}, h.store.Imports[key]...)
	saveErr := h.saveLocked()
	h.mu.Unlock()
	if saveErr != nil {
		http.Error(w, "failed to save imported data", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func readLocalCSV(data []byte) ([][]string, error) {
	reader := csv.NewReader(strings.NewReader(strings.TrimPrefix(string(data), "\uFEFF")))
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true
	sample := string(data[:min(len(data), 4096)])
	if strings.Count(sample, ";") > strings.Count(sample, ",") {
		reader.Comma = ';'
	}
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("invalid CSV: %v", err)
	}
	if len(records) < 2 {
		return nil, fmt.Errorf("CSV must contain header and at least one data row")
	}
	return records, nil
}

func (h *LocalAuthHandler) applyLocalImportLocked(userID uuid.UUID, kind string, records [][]string, autoCreate bool) models.ImportResult {
	result := models.ImportResult{Errors: []models.ImportError{}}
	header := normalizeHeader(records[0])
	seen := map[string]bool{}
	for index, record := range records[1:] {
		row := index + 2
		values := mapRecord(header, record)
		switch kind {
		case "cost_centers":
			id, err := requiredInt(values, "cc_id")
			name := strings.TrimSpace(values["name"])
			if err != nil || name == "" {
				message := "name is required"
				if err != nil {
					message = err.Error()
				}
				addImportError(&result, row, message)
				continue
			}
			cc := models.CostCenter{ID: id, Code: strings.TrimSpace(values["code"]), Name: name, Owner: strings.TrimSpace(values["owner"]), Active: true}
			if cc.Code == "" {
				cc.Code = fmt.Sprintf("CC-%03d", id)
			}
			if cc.Owner == "" {
				cc.Owner = "CSV импорт"
			}
			if h.upsertLocalCostCenterLocked(cc) {
				result.Updated++
			} else {
				result.Inserted++
			}
		case "items":
			id, err := requiredInt(values, "item_id")
			name := strings.TrimSpace(values["name"])
			itemType := models.ItemType(strings.ToUpper(strings.TrimSpace(values["type"])))
			if err != nil || name == "" || (itemType != models.TypeOPEX && itemType != models.TypeCAPEX) {
				message := "type must be OPEX or CAPEX"
				if err != nil {
					message = err.Error()
				} else if name == "" {
					message = "name is required"
				}
				addImportError(&result, row, message)
				continue
			}
			item := models.Item{ID: id, Code: strings.TrimSpace(values["code"]), Name: name, Type: itemType, Active: true}
			if item.Code == "" {
				item.Code = fmt.Sprintf("ITM-%03d", id)
			}
			if h.upsertLocalItemLocked(item) {
				result.Updated++
			} else {
				result.Inserted++
			}
		case "plan", "fact":
			amountField := "amount_plan"
			if kind == "fact" {
				amountField = "amount_fact"
			}
			period, ccID, itemID, amount, valid := h.validateLocalDataRowLocked(row, values, amountField, seen, autoCreate, &result)
			if !valid {
				continue
			}
			updated := h.upsertLocalDataLocked(userID, kind, period, ccID, itemID, amount)
			if updated {
				result.Updated++
			} else {
				result.Inserted++
			}
		}
	}
	return result
}

func (h *LocalAuthHandler) validateLocalDataRowLocked(row int, values map[string]string, amountField string, seen map[string]bool, autoCreate bool, result *models.ImportResult) (string, int, int, float64, bool) {
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
	if !h.localCostCenterExistsLocked(ccID) {
		if !autoCreate {
			addImportError(result, row, fmt.Sprintf("cc_id=%d not found", ccID))
			return "", 0, 0, 0, false
		}
		h.upsertLocalCostCenterLocked(models.CostCenter{ID: ccID, Code: fmt.Sprintf("CC-%03d", ccID), Name: fmt.Sprintf("ЦФО %d", ccID), Owner: "Автосоздание", Active: true})
		result.AutoCreated++
	}
	if !h.localItemExistsLocked(itemID) {
		if !autoCreate {
			addImportError(result, row, fmt.Sprintf("item_id=%d not found", itemID))
			return "", 0, 0, 0, false
		}
		h.upsertLocalItemLocked(models.Item{ID: itemID, Code: fmt.Sprintf("ITM-%03d", itemID), Name: fmt.Sprintf("Статья %d", itemID), Type: models.TypeOPEX, Active: true})
		result.AutoCreated++
	}
	return period, ccID, itemID, amount, true
}

func (h *LocalAuthHandler) upsertLocalCostCenterLocked(cc models.CostCenter) bool {
	for i, current := range h.store.CostCenters {
		if current.ID == cc.ID {
			h.store.CostCenters[i] = cc
			return true
		}
	}
	h.store.CostCenters = append(h.store.CostCenters, cc)
	return false
}

func (h *LocalAuthHandler) upsertLocalItemLocked(item models.Item) bool {
	for i, current := range h.store.Items {
		if current.ID == item.ID {
			h.store.Items[i] = item
			return true
		}
	}
	h.store.Items = append(h.store.Items, item)
	return false
}

func (h *LocalAuthHandler) nextLocalCostCenterIDLocked() int {
	next := 1
	for _, cc := range h.store.CostCenters {
		if cc.ID >= next {
			next = cc.ID + 1
		}
	}
	return next
}

func (h *LocalAuthHandler) nextLocalItemIDLocked() int {
	next := 1
	for _, item := range h.store.Items {
		if item.ID >= next {
			next = item.ID + 1
		}
	}
	return next
}

func (h *LocalAuthHandler) localCostCenterExistsLocked(id int) bool {
	for _, cc := range h.store.CostCenters {
		if cc.ID == id {
			return true
		}
	}
	return false
}

func (h *LocalAuthHandler) localCostCenterCodeExistsLocked(code string, exceptID int) bool {
	for _, cc := range h.store.CostCenters {
		if cc.ID != exceptID && strings.EqualFold(cc.Code, code) {
			return true
		}
	}
	return false
}

func (h *LocalAuthHandler) localItemExistsLocked(id int) bool {
	for _, item := range h.store.Items {
		if item.ID == id {
			return true
		}
	}
	return false
}

func (h *LocalAuthHandler) localItemCodeExistsLocked(code string, exceptID int) bool {
	for _, item := range h.store.Items {
		if item.ID != exceptID && strings.EqualFold(item.Code, code) {
			return true
		}
	}
	return false
}

func (h *LocalAuthHandler) removeLocalDataForCostCenterLocked(ccID int) {
	plan := h.store.Plan[:0]
	for _, item := range h.store.Plan {
		if item.CCID != ccID {
			plan = append(plan, item)
		}
	}
	h.store.Plan = plan
	fact := h.store.Fact[:0]
	for _, item := range h.store.Fact {
		if item.CCID != ccID {
			fact = append(fact, item)
		}
	}
	h.store.Fact = fact
}

func (h *LocalAuthHandler) removeLocalDataForItemLocked(itemID int) {
	plan := h.store.Plan[:0]
	for _, item := range h.store.Plan {
		if item.ItemID != itemID {
			plan = append(plan, item)
		}
	}
	h.store.Plan = plan
	fact := h.store.Fact[:0]
	for _, item := range h.store.Fact {
		if item.ItemID != itemID {
			fact = append(fact, item)
		}
	}
	h.store.Fact = fact
}

func (h *LocalAuthHandler) upsertLocalDataLocked(userID uuid.UUID, kind, period string, ccID, itemID int, amount float64) bool {
	if kind == "plan" {
		for i, item := range h.store.Plan {
			if item.UserID == userID && item.Period == period && item.CCID == ccID && item.ItemID == itemID {
				h.store.Plan[i].AmountPlan = amount
				return true
			}
		}
		h.store.Plan = append(h.store.Plan, models.Plan{UserID: userID, Period: period, CCID: ccID, ItemID: itemID, AmountPlan: amount})
		return false
	}
	for i, item := range h.store.Fact {
		if item.UserID == userID && item.Period == period && item.CCID == ccID && item.ItemID == itemID {
			h.store.Fact[i].AmountFact = amount
			return true
		}
	}
	h.store.Fact = append(h.store.Fact, models.Fact{UserID: userID, Period: period, CCID: ccID, ItemID: itemID, AmountFact: amount})
	return false
}

func (h *LocalAuthHandler) GetImportLogs(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	h.mu.Lock()
	logs := append([]models.ImportLogEntry(nil), h.store.Imports[stored.User.ID.String()]...)
	h.mu.Unlock()
	if len(logs) > limit {
		logs = logs[:limit]
	}
	writeJSON(w, http.StatusOK, logs)
}

func (h *LocalAuthHandler) GetDataEntries(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	kind := chi.URLParam(r, "kind")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	h.mu.Lock()
	entries := h.localEntriesLocked(stored.User.ID, kind)
	h.mu.Unlock()
	sort.Slice(entries, func(i, j int) bool { return entries[i].Period > entries[j].Period })
	if len(entries) > limit {
		entries = entries[:limit]
	}
	writeJSON(w, http.StatusOK, entries)
}

func (h *LocalAuthHandler) SavePlan(w http.ResponseWriter, r *http.Request) {
	h.saveLocalDataEntry(w, r, "plan")
}

func (h *LocalAuthHandler) SaveFact(w http.ResponseWriter, r *http.Request) {
	h.saveLocalDataEntry(w, r, "fact")
}

func (h *LocalAuthHandler) saveLocalDataEntry(w http.ResponseWriter, r *http.Request, kind string) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	var req models.UpsertDataEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if err := h.validateLocalDataInput(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.mu.Lock()
	if !h.localCostCenterExistsLocked(req.CCID) || !h.localItemExistsLocked(req.ItemID) {
		h.mu.Unlock()
		http.Error(w, "cc_id or item_id not found", http.StatusBadRequest)
		return
	}
	h.upsertLocalDataLocked(stored.User.ID, kind, req.Period, req.CCID, req.ItemID, req.Amount)
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save data entry", http.StatusInternalServerError)
		return
	}
	if kind == "plan" {
		writeJSON(w, http.StatusOK, models.Plan{UserID: stored.User.ID, Period: req.Period, CCID: req.CCID, ItemID: req.ItemID, AmountPlan: req.Amount})
		return
	}
	writeJSON(w, http.StatusOK, models.Fact{UserID: stored.User.ID, Period: req.Period, CCID: req.CCID, ItemID: req.ItemID, AmountFact: req.Amount})
}

func (h *LocalAuthHandler) UpsertDataEntry(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
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
	if err := h.validateLocalDataInput(req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.mu.Lock()
	if !h.localCostCenterExistsLocked(req.CCID) || !h.localItemExistsLocked(req.ItemID) {
		h.mu.Unlock()
		http.Error(w, "cc_id or item_id not found", http.StatusBadRequest)
		return
	}
	h.upsertLocalDataLocked(stored.User.ID, kind, req.Period, req.CCID, req.ItemID, req.Amount)
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save data entry", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *LocalAuthHandler) DeleteDataEntry(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
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
	h.mu.Lock()
	if kind == "plan" {
		plan := h.store.Plan[:0]
		for _, item := range h.store.Plan {
			if !(item.UserID == stored.User.ID && item.Period == period && item.CCID == ccID && item.ItemID == itemID) {
				plan = append(plan, item)
			}
		}
		h.store.Plan = plan
	} else {
		fact := h.store.Fact[:0]
		for _, item := range h.store.Fact {
			if !(item.UserID == stored.User.ID && item.Period == period && item.CCID == ccID && item.ItemID == itemID) {
				fact = append(fact, item)
			}
		}
		h.store.Fact = fact
	}
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to delete data entry", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *LocalAuthHandler) ClearData(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	h.mu.Lock()
	plan := h.store.Plan[:0]
	for _, item := range h.store.Plan {
		if item.UserID != stored.User.ID {
			plan = append(plan, item)
		}
	}
	h.store.Plan = plan
	fact := h.store.Fact[:0]
	for _, item := range h.store.Fact {
		if item.UserID != stored.User.ID {
			fact = append(fact, item)
		}
	}
	h.store.Fact = fact
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to clear data", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *LocalAuthHandler) validateLocalDataInput(req models.UpsertDataEntryRequest) error {
	if !periodRE.MatchString(strings.TrimSpace(req.Period)) {
		return fmt.Errorf("invalid period format, expected YYYY-MM")
	}
	if req.CCID <= 0 || req.ItemID <= 0 || req.Amount < 0 {
		return fmt.Errorf("period, cc_id, item_id and non-negative amount are required")
	}
	return nil
}

func (h *LocalAuthHandler) localEntriesLocked(userID uuid.UUID, kind string) []models.DataEntry {
	entries := []models.DataEntry{}
	if kind == "plan" {
		for _, item := range h.store.Plan {
			if item.UserID == userID {
				entries = append(entries, h.localEntryLocked("plan", item.Period, item.CCID, item.ItemID, item.AmountPlan))
			}
		}
	} else {
		for _, item := range h.store.Fact {
			if item.UserID == userID {
				entries = append(entries, h.localEntryLocked("fact", item.Period, item.CCID, item.ItemID, item.AmountFact))
			}
		}
	}
	return entries
}

func (h *LocalAuthHandler) localEntryLocked(kind, period string, ccID, itemID int, amount float64) models.DataEntry {
	entry := models.DataEntry{Kind: kind, Period: period, CCID: ccID, ItemID: itemID, Amount: amount}
	for _, cc := range h.store.CostCenters {
		if cc.ID == ccID {
			entry.CCName = cc.Name
			break
		}
	}
	for _, item := range h.store.Items {
		if item.ID == itemID {
			entry.ItemName = item.Name
			entry.Type = string(item.Type)
			break
		}
	}
	return entry
}

func (h *LocalAuthHandler) CheckCompleteness(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	h.mu.Lock()
	plan, fact := map[string]bool{}, map[string]bool{}
	planPeriods, factPeriods := map[string]bool{}, map[string]bool{}
	for _, item := range h.store.Plan {
		if item.UserID == stored.User.ID {
			plan[fmt.Sprintf("%s:%d:%d", item.Period, item.CCID, item.ItemID)] = true
			planPeriods[item.Period] = true
		}
	}
	for _, item := range h.store.Fact {
		if item.UserID == stored.User.ID {
			fact[fmt.Sprintf("%s:%d:%d", item.Period, item.CCID, item.ItemID)] = true
			factPeriods[item.Period] = true
		}
	}
	h.mu.Unlock()
	result := models.CompletenessResult{PeriodMismatch: []string{}}
	for key := range plan {
		if !fact[key] {
			result.MissingInFact++
		}
	}
	for key := range fact {
		if !plan[key] {
			result.MissingInPlan++
		}
	}
	for period := range planPeriods {
		if !factPeriods[period] {
			result.PeriodMismatch = append(result.PeriodMismatch, "period "+period+" есть в plan, но нет в fact")
		}
	}
	for period := range factPeriods {
		if !planPeriods[period] {
			result.PeriodMismatch = append(result.PeriodMismatch, "period "+period+" есть в fact, но нет в plan")
		}
	}
	sort.Strings(result.PeriodMismatch)
	writeJSON(w, http.StatusOK, result)
}

func (h *LocalAuthHandler) GetReport(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	from, to := r.URL.Query().Get("from"), r.URL.Query().Get("to")
	filterType, filterStatus := r.URL.Query().Get("type"), r.URL.Query().Get("status")
	ccFilter, _ := strconv.Atoi(r.URL.Query().Get("cc_id"))
	threshold, _ := strconv.ParseFloat(r.URL.Query().Get("threshold"), 64)
	if threshold <= 0 {
		threshold = 0.10
	}

	h.mu.Lock()
	rows := map[string]*models.PlanFactRow{}
	for _, item := range h.store.Plan {
		if item.UserID != stored.User.ID {
			continue
		}
		entry := h.localEntryLocked("plan", item.Period, item.CCID, item.ItemID, item.AmountPlan)
		key := fmt.Sprintf("%s:%d:%d", item.Period, item.CCID, item.ItemID)
		rows[key] = &models.PlanFactRow{Period: entry.Period, CCID: entry.CCID, CCName: entry.CCName, ItemID: entry.ItemID, ItemName: entry.ItemName, ItemType: entry.Type, AmountPlan: entry.Amount}
	}
	for _, item := range h.store.Fact {
		if item.UserID != stored.User.ID {
			continue
		}
		key := fmt.Sprintf("%s:%d:%d", item.Period, item.CCID, item.ItemID)
		row := rows[key]
		if row == nil {
			entry := h.localEntryLocked("fact", item.Period, item.CCID, item.ItemID, item.AmountFact)
			row = &models.PlanFactRow{Period: entry.Period, CCID: entry.CCID, CCName: entry.CCName, ItemID: entry.ItemID, ItemName: entry.ItemName, ItemType: entry.Type}
			rows[key] = row
		}
		row.AmountFact = item.AmountFact
	}
	h.mu.Unlock()

	result := models.ReportResponse{Rows: []models.PlanFactRow{}}
	for _, row := range rows {
		if (from != "" && row.Period < from) || (to != "" && row.Period > to) || (ccFilter > 0 && row.CCID != ccFilter) || (filterType != "" && filterType != "ALL" && row.ItemType != filterType) {
			continue
		}
		row.Delta = row.AmountFact - row.AmountPlan
		if row.AmountPlan == 0 && row.AmountFact > 0 {
			row.Status = "NO_PLAN"
		} else {
			value := 0.0
			if row.AmountPlan != 0 {
				value = row.Delta / row.AmountPlan
			}
			row.DeltaPct = &value
			switch {
			case math.Abs(value) <= threshold:
				row.Status = "IN_NORM"
			case value > threshold:
				row.Status = "OVERSPEND"
			default:
				row.Status = "SAVING"
			}
		}
		if filterStatus != "" && filterStatus != "ALL" && row.Status != filterStatus {
			continue
		}
		result.Rows = append(result.Rows, *row)
	}
	sort.Slice(result.Rows, func(i, j int) bool {
		return result.Rows[i].Period < result.Rows[j].Period
	})
	var normRows, comparableRows int
	for _, row := range result.Rows {
		result.KPI.TotalPlan += row.AmountPlan
		result.KPI.TotalFact += row.AmountFact
		result.KPI.TotalDelta += row.Delta
		if row.Status != "NO_PLAN" {
			comparableRows++
			if row.Status == "IN_NORM" {
				normRows++
			}
		}
		if row.DeltaPct != nil {
			result.KPI.MeanAbsDeltaPct += math.Abs(*row.DeltaPct)
		}
	}
	if comparableRows > 0 {
		result.KPI.ShareInNorm = float64(normRows) / float64(comparableRows)
		result.KPI.MeanAbsDeltaPct /= float64(comparableRows)
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *LocalAuthHandler) ExportReport(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	report := h.buildLocalReport(r, stored.User.ID)
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

func (h *LocalAuthHandler) buildLocalReport(r *http.Request, userID uuid.UUID) models.ReportResponse {
	from, to := r.URL.Query().Get("from"), r.URL.Query().Get("to")
	if from == "" {
		from = r.URL.Query().Get("period")
	}
	if to == "" {
		to = from
	}
	filterType, filterStatus := r.URL.Query().Get("type"), r.URL.Query().Get("status")
	ccFilter, _ := strconv.Atoi(r.URL.Query().Get("cc_id"))
	threshold, _ := strconv.ParseFloat(r.URL.Query().Get("threshold"), 64)
	if threshold <= 0 {
		threshold = 0.10
	}

	h.mu.Lock()
	rows := map[string]*models.PlanFactRow{}
	for _, item := range h.store.Plan {
		if item.UserID != userID {
			continue
		}
		entry := h.localEntryLocked("plan", item.Period, item.CCID, item.ItemID, item.AmountPlan)
		key := fmt.Sprintf("%s:%d:%d", item.Period, item.CCID, item.ItemID)
		rows[key] = &models.PlanFactRow{Period: entry.Period, CCID: entry.CCID, CCName: entry.CCName, ItemID: entry.ItemID, ItemName: entry.ItemName, ItemType: entry.Type, AmountPlan: entry.Amount}
	}
	for _, item := range h.store.Fact {
		if item.UserID != userID {
			continue
		}
		key := fmt.Sprintf("%s:%d:%d", item.Period, item.CCID, item.ItemID)
		row := rows[key]
		if row == nil {
			entry := h.localEntryLocked("fact", item.Period, item.CCID, item.ItemID, item.AmountFact)
			row = &models.PlanFactRow{Period: entry.Period, CCID: entry.CCID, CCName: entry.CCName, ItemID: entry.ItemID, ItemName: entry.ItemName, ItemType: entry.Type}
			rows[key] = row
		}
		row.AmountFact = item.AmountFact
	}
	h.mu.Unlock()

	result := models.ReportResponse{Rows: []models.PlanFactRow{}}
	for _, row := range rows {
		if (from != "" && row.Period < from) || (to != "" && row.Period > to) || (ccFilter > 0 && row.CCID != ccFilter) || (filterType != "" && filterType != "ALL" && row.ItemType != filterType) {
			continue
		}
		row.Delta = row.AmountFact - row.AmountPlan
		if row.AmountPlan == 0 && row.AmountFact > 0 {
			row.Status = "NO_PLAN"
		} else {
			value := 0.0
			if row.AmountPlan != 0 {
				value = row.Delta / row.AmountPlan
			}
			row.DeltaPct = &value
			switch {
			case math.Abs(value) <= threshold:
				row.Status = "IN_NORM"
			case value > threshold:
				row.Status = "OVERSPEND"
			default:
				row.Status = "SAVING"
			}
		}
		if filterStatus != "" && filterStatus != "ALL" && row.Status != filterStatus {
			continue
		}
		result.Rows = append(result.Rows, *row)
	}
	sort.Slice(result.Rows, func(i, j int) bool {
		if result.Rows[i].Period == result.Rows[j].Period {
			if result.Rows[i].CCName == result.Rows[j].CCName {
				return result.Rows[i].ItemName < result.Rows[j].ItemName
			}
			return result.Rows[i].CCName < result.Rows[j].CCName
		}
		return result.Rows[i].Period < result.Rows[j].Period
	})
	var normRows, comparableRows int
	for _, row := range result.Rows {
		result.KPI.TotalPlan += row.AmountPlan
		result.KPI.TotalFact += row.AmountFact
		result.KPI.TotalDelta += row.Delta
		if row.Status != "NO_PLAN" {
			comparableRows++
			if row.Status == "IN_NORM" {
				normRows++
			}
		}
		if row.DeltaPct != nil {
			result.KPI.MeanAbsDeltaPct += math.Abs(*row.DeltaPct)
		}
	}
	if comparableRows > 0 {
		result.KPI.ShareInNorm = float64(normRows) / float64(comparableRows)
		result.KPI.MeanAbsDeltaPct /= float64(comparableRows)
	}
	return result
}

func (h *LocalAuthHandler) GetAdminOverview(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	if stored.Role != "controller" {
		http.Error(w, "admin overview is available only for controller role", http.StatusForbidden)
		return
	}

	h.mu.Lock()
	overview := models.AdminOverview{
		Users:   []models.AdminUserSummary{},
		Roles:   []models.AdminRoleSummary{},
		States:  []models.AdminStateSummary{},
		Imports: []models.AdminImportSummary{},
		Data: models.AdminDataSummary{
			CostCenters: len(h.store.CostCenters),
			Items:       len(h.store.Items),
			PlanRows:    len(h.store.Plan),
			FactRows:    len(h.store.Fact),
		},
	}
	roleCounts := map[string]int{}
	for email, user := range h.store.Users {
		roleCounts[user.Role]++
		stateKeys := 0
		if states := h.store.States[user.User.ID.String()]; states != nil {
			stateKeys = len(states)
			for key := range states {
				overview.States = append(overview.States, models.AdminStateSummary{
					UserID:    user.User.ID,
					Email:     email,
					Key:       key,
					UpdatedAt: user.User.UpdatedAt,
				})
			}
		}
		ccName := h.localCostCenterNamePtrLocked(user.User.CCID)
		overview.Users = append(overview.Users, models.AdminUserSummary{
			ID:              user.User.ID,
			Email:           email,
			Role:            user.Role,
			RoleDisplayName: localRoleDisplayName(user.Role),
			CCID:            user.User.CCID,
			CCName:          ccName,
			ProfileName:     user.User.Profile.Name,
			Department:      user.User.Profile.Department,
			PlanRows:        h.localUserPlanRowsLocked(user.User.ID),
			FactRows:        h.localUserFactRowsLocked(user.User.ID),
			StateKeys:       stateKeys,
			CreatedAt:       user.User.CreatedAt,
			UpdatedAt:       user.User.UpdatedAt,
		})
		for _, entry := range h.store.Imports[user.User.ID.String()] {
			importedAt, _ := time.Parse(time.RFC3339, entry.ImportedAt)
			if importedAt.IsZero() {
				importedAt = time.Now()
			}
			overview.Imports = append(overview.Imports, models.AdminImportSummary{
				Kind:       entry.Kind,
				Filename:   entry.Filename,
				Status:     entry.Status,
				Inserted:   entry.Inserted,
				Updated:    entry.Updated,
				Errors:     entry.Errors,
				ImportedAt: importedAt,
			})
			overview.Data.Imports++
		}
	}
	h.mu.Unlock()

	for _, role := range []string{"analyst", "manager", "controller"} {
		overview.Roles = append(overview.Roles, models.AdminRoleSummary{
			Role:            role,
			RoleDisplayName: localRoleDisplayName(role),
			Users:           roleCounts[role],
		})
	}
	sort.Slice(overview.Users, func(i, j int) bool {
		return overview.Users[i].Email < overview.Users[j].Email
	})
	sort.Slice(overview.States, func(i, j int) bool {
		if overview.States[i].Email == overview.States[j].Email {
			return overview.States[i].Key < overview.States[j].Key
		}
		return overview.States[i].Email < overview.States[j].Email
	})
	sort.Slice(overview.Imports, func(i, j int) bool {
		return overview.Imports[i].ImportedAt.After(overview.Imports[j].ImportedAt)
	})
	writeJSON(w, http.StatusOK, overview)
}

func localRoleDisplayName(role string) string {
	switch role {
	case "controller":
		return "Контролёр планирования"
	case "manager":
		return "Руководитель подразделения"
	default:
		return "Финансовый аналитик"
	}
}

func (h *LocalAuthHandler) localCostCenterNamePtrLocked(ccID *int) *string {
	if ccID == nil {
		return nil
	}
	for _, cc := range h.store.CostCenters {
		if cc.ID == *ccID {
			name := cc.Name
			return &name
		}
	}
	return nil
}

func (h *LocalAuthHandler) localUserPlanRowsLocked(userID uuid.UUID) int {
	count := 0
	for _, item := range h.store.Plan {
		if item.UserID == userID {
			count++
		}
	}
	return count
}

func (h *LocalAuthHandler) localUserFactRowsLocked(userID uuid.UUID) int {
	count := 0
	for _, item := range h.store.Fact {
		if item.UserID == userID {
			count++
		}
	}
	return count
}
