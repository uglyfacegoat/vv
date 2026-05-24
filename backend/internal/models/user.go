package models

import (
	"github.com/google/uuid"
	"time"
)

type Role struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
}

type User struct {
	ID            uuid.UUID    `json:"id"`
	Email         string       `json:"email"`
	PasswordHash  string       `json:"-"`
	RoleID        int          `json:"role_id"`
	CCID          *int         `json:"cc_id,omitempty"`
	EnterpriseID  *uuid.UUID   `json:"enterprise_id,omitempty"`
	EnterpriseKey string       `json:"enterprise_key,omitempty"`
	Enterprise    string       `json:"enterprise,omitempty"`
	Profile       UserProfile  `json:"profile"`
	Settings      UserSettings `json:"settings"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

type UserProfile struct {
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	Position   string `json:"position"`
	Department string `json:"department"`
	AvatarURL  string `json:"avatar_url"`
}

type UserSettings struct {
	Threshold          int    `json:"threshold"`
	OverspendThreshold int    `json:"overspend_threshold"`
	SavingThreshold    int    `json:"saving_threshold"`
	NumberFormat       string `json:"number_format"`
	Currency           string `json:"currency"`
	NotifyImport       bool   `json:"notify_import"`
	NotifyOverspend    bool   `json:"notify_overspend"`
	NotifyWeekly       bool   `json:"notify_weekly"`
	EmailNotify        bool   `json:"email_notify"`
	Theme              string `json:"theme"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	RoleID   int    `json:"role_id"`
	Role     string `json:"role"`
	CCID     *int   `json:"cc_id,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type TokenResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user,omitempty"`
	Role  string `json:"role,omitempty"`
}

type AccountResponse struct {
	User *User  `json:"user"`
	Role string `json:"role"`
}

type UpdateProfileRequest struct {
	Profile UserProfile `json:"profile"`
}

type UpdateSettingsRequest struct {
	Settings UserSettings `json:"settings"`
}
