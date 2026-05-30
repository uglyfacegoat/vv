package handlers

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"

	"backend/internal/models"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type OneCHandler struct {
	repo      *repository.BusinessRepository
	userRepo  *repository.UserRepository
	userID    uuid.UUID
	userEmail string
}

func NewOneCHandler(repo *repository.BusinessRepository, userRepo *repository.UserRepository) *OneCHandler {
	var user uuid.UUID
	if raw := os.Getenv("ONEC_USER_ID"); raw != "" {
		u, err := uuid.Parse(raw)
		if err == nil {
			user = u
		}
	}
	userEmail := strings.TrimSpace(os.Getenv("ONEC_USER_EMAIL"))
	if userEmail == "" {
		userEmail = "onec@company.ru"
	}
	return &OneCHandler{repo: repo, userRepo: userRepo, userID: user, userEmail: userEmail}
}

// Middleware: проверяет заголовок X-1C-Token
func RequireOneCToken(next http.Handler) http.Handler {
	token := os.Getenv("ONEC_TOKEN")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if token == "" {
			http.Error(w, "1C integration not configured", http.StatusForbidden)
			return
		}
		provided := strings.TrimSpace(r.Header.Get("X-1C-Token"))
		if provided == "" {
			provided = strings.TrimPrefix(strings.TrimSpace(r.Header.Get("Authorization")), "Bearer ")
		}
		if subtle.ConstantTimeCompare([]byte(provided), []byte(token)) != 1 {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *OneCHandler) integrationUserID(ctx context.Context) (uuid.UUID, error) {
	if h.userID != uuid.Nil {
		return h.userID, nil
	}
	if h.userRepo == nil {
		return uuid.Nil, errors.New("user repository is not configured")
	}
	return h.userRepo.EnsureServiceUser(ctx, h.userEmail)
}

func (h *OneCHandler) Status(w http.ResponseWriter, r *http.Request) {
	userID, err := h.integrationUserID(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":         true,
		"user_id":    userID,
		"user_email": h.userEmail,
		"endpoints": []string{
			"POST /api/1c/cost-centers",
			"POST /api/1c/items",
			"POST /api/1c/plan",
			"POST /api/1c/fact",
		},
	})
}

func (h *OneCHandler) UpsertCostCenters(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Items []models.CostCenter `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	res := map[string]int{"processed": 0}
	for _, cc := range payload.Items {
		cc.Active = true
		if _, err := h.repo.UpsertCostCenter(r.Context(), cc); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res["processed"]++
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *OneCHandler) UpsertItems(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Items []models.Item `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	res := map[string]int{"processed": 0}
	for _, it := range payload.Items {
		it.Active = true
		if _, err := h.repo.UpsertItem(r.Context(), it); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res["processed"]++
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *OneCHandler) UpsertPlan(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Items []struct {
			Period string  `json:"period"`
			CCID   int     `json:"cc_id"`
			ItemID int     `json:"item_id"`
			Amount float64 `json:"amount"`
		} `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	userID, err := h.integrationUserID(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	res := map[string]int{"processed": 0}
	for _, it := range payload.Items {
		if err := h.repo.UpsertPlan(r.Context(), userID, models.Plan{Period: it.Period, CCID: it.CCID, ItemID: it.ItemID, AmountPlan: it.Amount}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res["processed"]++
	}
	writeJSON(w, http.StatusOK, res)
}

func (h *OneCHandler) UpsertFact(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Items []struct {
			Period string  `json:"period"`
			CCID   int     `json:"cc_id"`
			ItemID int     `json:"item_id"`
			Amount float64 `json:"amount"`
		} `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	userID, err := h.integrationUserID(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	res := map[string]int{"processed": 0}
	for _, it := range payload.Items {
		if err := h.repo.UpsertFact(r.Context(), userID, models.Fact{Period: it.Period, CCID: it.CCID, ItemID: it.ItemID, AmountFact: it.Amount}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res["processed"]++
	}
	writeJSON(w, http.StatusOK, res)
}
