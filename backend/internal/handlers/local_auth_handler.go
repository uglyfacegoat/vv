package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"backend/internal/models"
	"backend/pkg/auth"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type localStoredUser struct {
	User         models.User `json:"user"`
	PasswordHash string      `json:"password_hash"`
	Role         string      `json:"role"`
}

type localStore struct {
	Users       map[string]localStoredUser            `json:"users"`
	States      map[string]map[string]json.RawMessage `json:"states"`
	Threshold   float64                               `json:"threshold"`
	CostCenters []models.CostCenter                   `json:"cost_centers"`
	Items       []models.Item                         `json:"items"`
	Plan        []models.Plan                         `json:"plan"`
	Fact        []models.Fact                         `json:"fact"`
	Imports     map[string][]models.ImportLogEntry    `json:"imports"`
}

type LocalAuthHandler struct {
	mu    sync.Mutex
	path  string
	store localStore
}

const (
	localDemoLogin    = "123"
	localDemoPassword = "456"
)

func NewLocalAuthHandler(path string) (*LocalAuthHandler, error) {
	if strings.TrimSpace(path) == "" {
		path = ".local/auth.json"
	}
	h := &LocalAuthHandler{
		path: path,
		store: localStore{
			Users:       map[string]localStoredUser{},
			States:      map[string]map[string]json.RawMessage{},
			Threshold:   0.10,
			CostCenters: localDefaultCostCenters(),
			Items:       localDefaultItems(),
			Imports:     map[string][]models.ImportLogEntry{},
		},
	}
	raw, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return h, nil
	}
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(raw, &h.store); err != nil {
		return nil, err
	}
	if h.store.Users == nil {
		h.store.Users = map[string]localStoredUser{}
	}
	if h.store.States == nil {
		h.store.States = map[string]map[string]json.RawMessage{}
	}
	if h.store.Threshold <= 0 {
		h.store.Threshold = 0.10
	}
	if len(h.store.CostCenters) == 0 {
		h.store.CostCenters = localDefaultCostCenters()
	}
	if len(h.store.Items) == 0 {
		h.store.Items = localDefaultItems()
	}
	if h.store.Imports == nil {
		h.store.Imports = map[string][]models.ImportLogEntry{}
	}
	return h, nil
}

func localDefaultSettings() models.UserSettings {
	return models.UserSettings{
		Threshold:          10,
		OverspendThreshold: 15,
		SavingThreshold:    15,
		NumberFormat:       "ru",
		Currency:           "RUB",
		NotifyImport:       true,
		NotifyOverspend:    true,
		EmailNotify:        true,
		Theme:              "dark",
	}
}

func localRoleID(role string) (int, bool) {
	switch role {
	case "analyst":
		return 1, true
	case "manager":
		return 2, true
	case "controller":
		return 3, true
	default:
		return 0, false
	}
}

func localProfile(email, role string) models.UserProfile {
	profile := models.UserProfile{Name: strings.Split(email, "@")[0], Department: "Финансы"}
	switch role {
	case "controller":
		profile.Position = "Контролёр планирования"
	case "manager":
		profile.Position = "Руководитель подразделения"
		profile.Department = "ЦФО"
	default:
		profile.Position = "Финансовый аналитик"
	}
	return profile
}

func localDemoStoredUser() (localStoredUser, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(localDemoPassword), bcrypt.DefaultCost)
	if err != nil {
		return localStoredUser{}, err
	}
	now := time.Now()
	user := models.User{
		ID:            uuid.New(),
		Email:         localDemoLogin,
		RoleID:        1,
		EnterpriseKey: "demo",
		Enterprise:    "demo",
		Profile:       localProfile(localDemoLogin, "analyst"),
		Settings:      localDefaultSettings(),
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	return localStoredUser{User: user, PasswordHash: string(hash), Role: "analyst"}, nil
}

func (h *LocalAuthHandler) saveLocked() error {
	if err := os.MkdirAll(filepath.Dir(h.path), 0o700); err != nil {
		return err
	}
	raw, err := json.MarshalIndent(h.store, "", "  ")
	if err != nil {
		return err
	}
	tmp := h.path + ".tmp"
	if err := os.WriteFile(tmp, raw, 0o600); err != nil {
		return err
	}
	return os.Rename(tmp, h.path)
}

func (h *LocalAuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !strings.Contains(email, "@") || strings.HasSuffix(email, "@") || len(req.Password) < 8 {
		http.Error(w, "email and password with at least 8 chars are required", http.StatusBadRequest)
		return
	}
	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = "analyst"
	}
	roleID, ok := localRoleID(role)
	if !ok {
		http.Error(w, "invalid role", http.StatusBadRequest)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()
	if _, exists := h.store.Users[email]; exists {
		http.Error(w, "email already exists", http.StatusConflict)
		return
	}
	domain := strings.SplitN(email, "@", 2)[1]
	now := time.Now()
	user := models.User{
		ID:            uuid.New(),
		Email:         email,
		RoleID:        roleID,
		CCID:          req.CCID,
		EnterpriseKey: domain,
		Enterprise:    domain,
		Profile:       localProfile(email, role),
		Settings:      localDefaultSettings(),
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	h.store.Users[email] = localStoredUser{User: user, PasswordHash: string(hash), Role: role}
	if err := h.saveLocked(); err != nil {
		delete(h.store.Users, email)
		http.Error(w, "failed to create user", http.StatusInternalServerError)
		return
	}
	token, err := auth.GenerateToken(user.ID, role, user.CCID)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, models.TokenResponse{Token: token, User: &user, Role: role})
}

func (h *LocalAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	h.mu.Lock()
	stored, exists := h.store.Users[email]
	if email == localDemoLogin && req.Password == localDemoPassword {
		if !exists {
			var err error
			stored, err = localDemoStoredUser()
			if err != nil {
				h.mu.Unlock()
				http.Error(w, "internal error", http.StatusInternalServerError)
				return
			}
			h.store.Users[email] = stored
			if err := h.saveLocked(); err != nil {
				delete(h.store.Users, email)
				h.mu.Unlock()
				http.Error(w, "failed to create user", http.StatusInternalServerError)
				return
			}
		}
		h.mu.Unlock()
		token, err := auth.GenerateToken(stored.User.ID, stored.Role, stored.User.CCID)
		if err != nil {
			http.Error(w, "failed to generate token", http.StatusInternalServerError)
			return
		}
		user := stored.User
		writeJSON(w, http.StatusOK, models.TokenResponse{Token: token, User: &user, Role: stored.Role})
		return
	}
	h.mu.Unlock()
	if !exists || bcrypt.CompareHashAndPassword([]byte(stored.PasswordHash), []byte(req.Password)) != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}
	token, err := auth.GenerateToken(stored.User.ID, stored.Role, stored.User.CCID)
	if err != nil {
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}
	user := stored.User
	writeJSON(w, http.StatusOK, models.TokenResponse{Token: token, User: &user, Role: stored.Role})
}

func (h *LocalAuthHandler) accountForRequest(r *http.Request) (string, localStoredUser, bool) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		return "", localStoredUser{}, false
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	for email, stored := range h.store.Users {
		if stored.User.ID == claims.UserID {
			return email, stored, true
		}
	}
	return "", localStoredUser{}, false
}

func (h *LocalAuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	user := stored.User
	writeJSON(w, http.StatusOK, models.AccountResponse{User: &user, Role: stored.Role})
}

func (h *LocalAuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	email, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	if strings.TrimSpace(req.Profile.Name) == "" {
		req.Profile.Name = stored.User.Profile.Name
	}
	stored.User.Profile = req.Profile
	stored.User.UpdatedAt = time.Now()
	h.mu.Lock()
	h.store.Users[email] = stored
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to update profile", http.StatusInternalServerError)
		return
	}
	user := stored.User
	writeJSON(w, http.StatusOK, models.AccountResponse{User: &user, Role: stored.Role})
}

func (h *LocalAuthHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req models.UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if req.Settings.Threshold < 1 || req.Settings.Threshold > 30 {
		http.Error(w, "threshold must be between 1 and 30", http.StatusBadRequest)
		return
	}
	email, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	stored.User.Settings = req.Settings
	stored.User.UpdatedAt = time.Now()
	h.mu.Lock()
	h.store.Users[email] = stored
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to update settings", http.StatusInternalServerError)
		return
	}
	user := stored.User
	writeJSON(w, http.StatusOK, models.AccountResponse{User: &user, Role: stored.Role})
}

func (h *LocalAuthHandler) GetState(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	key := strings.TrimSpace(chi.URLParam(r, "key"))
	h.mu.Lock()
	raw, exists := h.store.States[stored.User.ID.String()][key]
	h.mu.Unlock()
	if !exists {
		raw = json.RawMessage("null")
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(raw)
}

func (h *LocalAuthHandler) SetState(w http.ResponseWriter, r *http.Request) {
	_, stored, ok := h.accountForRequest(r)
	if !ok {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	key := strings.TrimSpace(chi.URLParam(r, "key"))
	if key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}
	var raw json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&raw); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	h.mu.Lock()
	userStates := h.store.States[stored.User.ID.String()]
	if userStates == nil {
		userStates = map[string]json.RawMessage{}
		h.store.States[stored.User.ID.String()] = userStates
	}
	userStates[key] = raw
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save state", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *LocalAuthHandler) GetThreshold(w http.ResponseWriter, r *http.Request) {
	h.mu.Lock()
	threshold := h.store.Threshold
	h.mu.Unlock()
	writeJSON(w, http.StatusOK, map[string]float64{"threshold": threshold})
}

func (h *LocalAuthHandler) UpdateThreshold(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Threshold float64 `json:"threshold"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Threshold <= 0 || req.Threshold > 1 {
		http.Error(w, "threshold must be between 0 and 1", http.StatusBadRequest)
		return
	}
	h.mu.Lock()
	h.store.Threshold = req.Threshold
	err := h.saveLocked()
	h.mu.Unlock()
	if err != nil {
		http.Error(w, "failed to save threshold", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]float64{"threshold": req.Threshold})
}
