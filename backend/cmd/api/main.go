package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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

	var pool *pgxpool.Pool
	dbReady := false
	localOnly := os.Getenv("BUDGETIQ_LOCAL_ONLY") == "1" || strings.EqualFold(os.Getenv("BUDGETIQ_LOCAL_ONLY"), "true")
	if localOnly {
		log.Println("BUDGETIQ_LOCAL_ONLY включён: запускаю локальный режим без PostgreSQL и Docker")
	} else {
		var err error
		pool, err = pgxpool.New(context.Background(), dbURL)
		if err != nil {
			log.Printf("PostgreSQL не настроен, запускаю локальный auth-режим: %v", err)
		} else if err := pool.Ping(context.Background()); err != nil {
			log.Printf("PostgreSQL недоступен, запускаю локальный auth-режим: %v", err)
			pool.Close()
			pool = nil
		} else {
			fmt.Println("Успешное подключение к PostgreSQL!")
			migrationsDir := os.Getenv("MIGRATIONS_DIR")
			if err := database.RunMigrations(context.Background(), pool, migrationsDir); err != nil {
				log.Fatalf("Ошибка применения миграций: %v", err)
			}
			fmt.Println("Миграции БД применены!")
			dbReady = true
			defer pool.Close()
		}
	}

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

	if dbReady {
		// Инициализация репозиториев
		userRepo := repository.NewUserRepository(pool)
		businessRepo := repository.NewBusinessRepository(pool)
		adminRepo := repository.NewAdminRepository(pool)

		// Инициализация хендлеров
		authHandler := handlers.NewAuthHandler(userRepo)
		businessHandler := handlers.NewBusinessHandler(businessRepo)
		importHandler := handlers.NewImportHandler(businessRepo)
		onecHandler := handlers.NewOneCHandler(businessRepo, userRepo)
		adminHandler := handlers.NewAdminHandler(adminRepo, userRepo)

		// API Авторизации (публичные роуты)
		r.Post("/api/v1/auth/register", authHandler.Register)
		r.Post("/api/v1/auth/login", authHandler.Login)

		// Endpoints для интеграции с 1С (REST/JSON, защищены токеном X-1C-Token)
		r.Group(func(r chi.Router) {
			r.Use(handlers.RequireOneCToken)
			r.Get("/api/1c/status", onecHandler.Status)
			r.Post("/api/1c/cost-centers", onecHandler.UpsertCostCenters)
			r.Post("/api/1c/items", onecHandler.UpsertItems)
			r.Post("/api/1c/plan", onecHandler.UpsertPlan)
			r.Post("/api/1c/fact", onecHandler.UpsertFact)
		})

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
	} else {
		localAuth, err := handlers.NewLocalAuthHandler(os.Getenv("LOCAL_AUTH_PATH"))
		if err != nil {
			log.Fatalf("Ошибка локального auth-хранилища: %v", err)
		}
		log.Println("Локальная авторизация включена: данные сохраняются в .local/auth.json")
		r.Post("/api/v1/auth/register", localAuth.Register)
		r.Post("/api/v1/auth/login", localAuth.Login)
		r.Group(func(r chi.Router) {
			r.Use(auth.RequireAuth())
			r.Get("/api/v1/auth/me", localAuth.GetMe)
			r.Patch("/api/v1/profile", localAuth.UpdateProfile)
			r.Patch("/api/v1/account/settings", localAuth.UpdateSettings)
			r.Get("/api/v1/account/state/{key}", localAuth.GetState)
			r.Put("/api/v1/account/state/{key}", localAuth.SetState)
			r.Get("/api/v1/report", localAuth.GetReport)
			r.Get("/api/v1/report/export", localAuth.ExportReport)
			r.Get("/api/v1/cost-centers", localAuth.GetCostCenters)
			r.Post("/api/v1/cost-centers", localAuth.CreateCostCenter)
			r.Put("/api/v1/cost-centers/{id}", localAuth.UpdateCostCenter)
			r.Delete("/api/v1/cost-centers/{id}", localAuth.DeleteCostCenter)
			r.Get("/api/v1/items", localAuth.GetItems)
			r.Post("/api/v1/items", localAuth.CreateItem)
			r.Put("/api/v1/items/{id}", localAuth.UpdateItem)
			r.Delete("/api/v1/items/{id}", localAuth.DeleteItem)
			r.Post("/api/v1/plan", localAuth.SavePlan)
			r.Post("/api/v1/fact", localAuth.SaveFact)
			r.Get("/api/v1/admin/overview", localAuth.GetAdminOverview)
			r.Get("/api/v1/settings/threshold", localAuth.GetThreshold)
			r.Put("/api/v1/settings/threshold", localAuth.UpdateThreshold)
			r.Get("/api/v1/data/{kind}", localAuth.GetDataEntries)
			r.Put("/api/v1/data/{kind}", localAuth.UpsertDataEntry)
			r.Delete("/api/v1/data/{kind}", localAuth.DeleteDataEntry)
			r.Delete("/api/v1/data", localAuth.ClearData)
			r.Post("/api/import/cost-centers", localAuth.ImportCostCenters)
			r.Post("/api/import/items", localAuth.ImportItems)
			r.Post("/api/import/plan", localAuth.ImportPlan)
			r.Post("/api/import/fact", localAuth.ImportFact)
			r.Get("/api/import/logs", localAuth.GetImportLogs)
			r.Get("/api/import/completeness", localAuth.CheckCompleteness)
		})
	}

	if staticDir := strings.TrimSpace(os.Getenv("STATIC_DIR")); staticDir != "" {
		fileServer := http.FileServer(http.Dir(staticDir))
		r.Handle("/assets/*", fileServer)
		r.Handle("/favicon.ico", fileServer)
		r.NotFound(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api/") {
				http.NotFound(w, r)
				return
			}
			requested := filepath.Clean(strings.TrimPrefix(r.URL.Path, "/"))
			if requested != "." {
				if info, err := os.Stat(filepath.Join(staticDir, requested)); err == nil && !info.IsDir() {
					fileServer.ServeHTTP(w, r)
					return
				}
			}
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("HTTP сервер запущен на порту %s\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
