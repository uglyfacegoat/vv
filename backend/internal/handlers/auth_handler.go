package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/auth"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
}

func NewAuthHandler(repo *repository.UserRepository) *AuthHandler {
	return &AuthHandler{userRepo: repo}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" || len(req.Password) < 8 {
		http.Error(w, "email and password with at least 8 chars are required", http.StatusBadRequest)
		return
	}
	if req.RoleID == 0 {
		if req.Role == "" {
			req.Role = "analyst"
		}
		roleID, err := h.userRepo.GetRoleIDByName(r.Context(), req.Role)
		if err != nil {
			http.Error(w, "invalid role", http.StatusBadRequest)
			return
		}
		req.RoleID = roleID
	}
	if req.Role == "" {
		req.Role = "analyst"
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
		RoleID:       req.RoleID,
		CCID:         req.CCID,
		Profile: models.UserProfile{
			Name: strings.Split(req.Email, "@")[0],
			Position: map[string]string{
				"controller": "Контролёр планирования",
				"manager":    "Руководитель подразделения",
				"analyst":    "Финансовый аналитик",
			}[req.Role],
			Department: map[string]string{
				"manager": "ЦФО",
			}[req.Role],
		},
	}

	err = h.userRepo.CreateUser(r.Context(), user)
	if err != nil {
		log.Printf("register create user failed for %s: %v", req.Email, err)
		writeRegisterError(w, err)
		return
	}

	created, roleName, err := h.userRepo.GetUserByEmail(r.Context(), user.Email)
	if err != nil || created == nil {
		log.Printf("register load user failed for %s: created=%t err=%v", req.Email, created != nil, err)
		http.Error(w, "failed to load user", http.StatusInternalServerError)
		return
	}
	token, err := auth.GenerateToken(created.ID, roleName, created.CCID)
	if err != nil {
		log.Printf("register generate token failed for %s: %v", req.Email, err)
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.TokenResponse{Token: token, User: created, Role: roleName})
}

func writeRegisterError(w http.ResponseWriter, err error) {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			http.Error(w, "email already exists", http.StatusConflict)
			return
		case "23503":
			http.Error(w, "invalid cost center", http.StatusBadRequest)
			return
		}
	}
	http.Error(w, "failed to create user", http.StatusInternalServerError)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	user, roleName, err := h.userRepo.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		log.Printf("login load user failed for %s: %v", req.Email, err)
		http.Error(w, "internal db error", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		http.Error(w, "invalid email or password", http.StatusUnauthorized)
		return
	}
	_ = h.userRepo.LogAudit(r.Context(), user.ID, "auth.login", "users", user.ID.String(), json.RawMessage(`{"source":"web"}`))

	token, err := auth.GenerateToken(user.ID, roleName, user.CCID)
	if err != nil {
		log.Printf("login generate token failed for %s: %v", req.Email, err)
		http.Error(w, "failed to generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.TokenResponse{Token: token, User: user, Role: roleName})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	user, roleName, err := h.userRepo.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		log.Printf("get me load user failed for %s: %v", claims.UserID, err)
		http.Error(w, "internal db error", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "user not found", http.StatusUnauthorized)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AccountResponse{User: user, Role: roleName})
}

func (h *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	user, roleName, err := h.userRepo.UpdateProfile(r.Context(), claims.UserID, req.Profile)
	if err != nil {
		http.Error(w, "failed to update profile", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AccountResponse{User: user, Role: roleName})
}

func (h *AuthHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if req.Settings.Threshold < 1 || req.Settings.Threshold > 30 {
		http.Error(w, "threshold must be between 1 and 30", http.StatusBadRequest)
		return
	}
	user, roleName, err := h.userRepo.UpdateSettings(r.Context(), claims.UserID, req.Settings)
	if err != nil {
		http.Error(w, "failed to update settings", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.AccountResponse{User: user, Role: roleName})
}

func (h *AuthHandler) GetState(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	key := strings.TrimSpace(chi.URLParam(r, "key"))
	if key == "" {
		http.Error(w, "key is required", http.StatusBadRequest)
		return
	}
	raw, err := h.userRepo.GetState(r.Context(), claims.UserID, key)
	if err != nil {
		http.Error(w, "failed to load state", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(raw)
}

func (h *AuthHandler) SetState(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
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
	if err := h.userRepo.SetState(r.Context(), claims.UserID, key, raw); err != nil {
		http.Error(w, "failed to save state", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"ok":true}`))
}
