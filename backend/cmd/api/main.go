package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/repository"
	"backend/pkg/auth"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Подключение к БД: нужно передать строчку вроде "postgres://user:pass@localhost:5432/dbname"
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/vv_db?sslmode=disable"
	}

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("База данных недоступна: %v", err)
	}
	fmt.Println("Успешное подключение к PostgreSQL!")

	migrationsDir := os.Getenv("MIGRATIONS_DIR")
	if err := database.RunMigrations(context.Background(), pool, migrationsDir); err != nil {
		log.Fatalf("Ошибка применения миграций: %v", err)
	}
	fmt.Println("Миграции БД применены!")

	// Инициализация роутера
	r := chi.NewRouter()

	// Базовые middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	})

	// Роуты API
	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("pong"))
	})

	// Инициализация репозиториев
	userRepo := repository.NewUserRepository(pool)
	businessRepo := repository.NewBusinessRepository(pool)
	adminRepo := repository.NewAdminRepository(pool)

	// Инициализация хендлеров
	authHandler := handlers.NewAuthHandler(userRepo)
	businessHandler := handlers.NewBusinessHandler(businessRepo)
	importHandler := handlers.NewImportHandler(businessRepo)
	adminHandler := handlers.NewAdminHandler(adminRepo, userRepo)

	// API Авторизации (публичные роуты)
	r.Post("/api/v1/auth/register", authHandler.Register)
	r.Post("/api/v1/auth/login", authHandler.Login)

	// Бизнес-логика (защищенные роуты)
	r.Group(func(r chi.Router) {
		r.Use(auth.RequireAuth())

		r.Get("/api/v1/auth/me", authHandler.GetMe)
		r.Patch("/api/v1/profile", authHandler.UpdateProfile)
		r.Patch("/api/v1/account/settings", authHandler.UpdateSettings)
		r.Get("/api/v1/account/state/{key}", authHandler.GetState)
		r.Put("/api/v1/account/state/{key}", authHandler.SetState)
		r.Get("/api/v1/admin/overview", adminHandler.GetOverview)

		r.Get("/api/v1/cost-centers", businessHandler.GetCostCenters)
		r.Post("/api/v1/cost-centers", businessHandler.CreateCostCenter)
		r.Put("/api/v1/cost-centers/{id}", businessHandler.UpdateCostCenter)
		r.Delete("/api/v1/cost-centers/{id}", businessHandler.DeleteCostCenter)

		r.Get("/api/v1/items", businessHandler.GetItems)
		r.Post("/api/v1/items", businessHandler.CreateItem)
		r.Put("/api/v1/items/{id}", businessHandler.UpdateItem)
		r.Delete("/api/v1/items/{id}", businessHandler.DeleteItem)

		r.Post("/api/v1/plan", businessHandler.SavePlan)
		r.Post("/api/v1/fact", businessHandler.SaveFact)

		r.Get("/api/v1/report", businessHandler.GetReport)
		r.Get("/api/v1/report/export", businessHandler.ExportReport)
		r.Get("/api/v1/data/{kind}", businessHandler.GetDataEntries)
		r.Put("/api/v1/data/{kind}", businessHandler.UpsertDataEntry)
		r.Delete("/api/v1/data/{kind}", businessHandler.DeleteDataEntry)
		r.Delete("/api/v1/data", businessHandler.ClearData)
		r.Get("/api/v1/settings/threshold", businessHandler.GetThreshold)
		r.Put("/api/v1/settings/threshold", businessHandler.UpdateThreshold)
		r.Post("/api/import/cost-centers", importHandler.ImportCostCenters)
		r.Post("/api/import/items", importHandler.ImportItems)
		r.Post("/api/import/plan", importHandler.ImportPlan)
		r.Post("/api/import/fact", importHandler.ImportFact)
		r.Get("/api/import/completeness", importHandler.CheckCompleteness)
		r.Get("/api/import/logs", importHandler.GetLogs)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("HTTP сервер запущен на порту %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
