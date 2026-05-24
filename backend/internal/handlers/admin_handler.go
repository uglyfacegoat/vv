package handlers

import (
	"net/http"

	"backend/internal/repository"
	"backend/pkg/auth"
)

type AdminHandler struct {
	repo     *repository.AdminRepository
	userRepo *repository.UserRepository
}

func NewAdminHandler(repo *repository.AdminRepository, userRepo *repository.UserRepository) *AdminHandler {
	return &AdminHandler{repo: repo, userRepo: userRepo}
}

func (h *AdminHandler) GetOverview(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r.Context())
	if claims == nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	_, currentRole, err := h.userRepo.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if currentRole != "controller" {
		http.Error(w, "admin overview is available only for controller role", http.StatusForbidden)
		return
	}
	overview, err := h.repo.GetOverview(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, overview)
}
