# План–Факт бюджет подразделения — Web App (React + Go + Postgres, источник: 1С CSV)

Цель: сделать веб-приложение для план-факт анализа бюджета по **периодам (YYYY-MM)**, **ЦФО** и **статьям затрат**.  
Источник данных — выгрузки из 1С в CSV. В приложении данные валидируются, складываются в Postgres (витрина), строятся отчёты/дашборды, есть экспорт результата в CSV.

---

## 1) Что вы делаете (в одном абзаце)
1С выгружает 4 CSV (ЦФО, статьи, план, факт). Вы загружаете их в веб-приложение. Бекенд на Go проверяет данные, кладёт в Postgres без дублей. Затем UI показывает отчёт “План–Факт” с фильтрами, KPI качества планирования и графики (plan vs fact + heatmap). Отчёт можно выгрузить обратно в CSV.

---

## 2) Выбранная архитектура (Вариант A)
- **1С** — источник данных (внешняя система), отдаёт CSV.
- **Go API** — импорт/валидации/агрегации/экспорт.
- **PostgreSQL** — витрина для быстрых отчётов + логирование импортов + настройки.
- **React UI** — таблицы, фильтры, дашборд.

Почему Postgres нужен, даже если “база — 1С”:
- отчёты и агрегации должны быть быстрыми и интерактивными;
- контроль дублей при повторных загрузках;
- хранение порогов, логов импортов, пользователей/ролей.

---

## 3) Стек
### Frontend
- React + TypeScript + Vite
- UI: MUI (DataGrid) **или** Tailwind + shadcn/ui
- Charts: Recharts (plan vs fact), Apache ECharts (heatmap)

### Backend
- Go + Gin (REST)
- encoding/csv (импорт/экспорт)
- go-playground/validator (валидации DTO)
- Swagger (swaggo) — документация API

### DB
- PostgreSQL
- migrations: golang-migrate
- SQL: SQLC + pgx (рекомендовано) **или** GORM

### Auth
- JWT
- roles: `analyst`, `manager`, `controller`

---

## 4) MVP: что обязательно должно работать (чтобы кейс приняли)
### MVP функциональность
1) Импорт 4 CSV: `cost_centers`, `items`, `plan`, `fact`  
2) Валидации (минимум 5)  
3) Расчёт `delta`, `delta_pct`, `status`  
4) Отчёт “План–Факт” (таблица + фильтры)  
5) KPI: доля строк “в норме”, среднее абсолютное отклонение  
6) Экспорт результата в CSV  
7) README с формулами + контрольные примеры

---

## 5) Данные и правила
### 5.1 Справочники
**cost_centers**
- `cc_id` (int) — ID ЦФО
- `name` (text) — название

**items**
- `item_id` (int)
- `name` (text)
- `type` (enum) ∈ {`OPEX`, `CAPEX`}

### 5.2 Факты
**plan**
- `period` (YYYY-MM)
- `cc_id`
- `item_id`
- `amount_plan` (numeric >= 0)

**fact**
- `period` (YYYY-MM)
- `cc_id`
- `item_id`
- `amount_fact` (numeric >= 0)

Ключевая связка:
- `(period, cc_id, item_id)` должна существовать и в plan, и в fact

### 5.3 Формулы
- `delta = amount_fact - amount_plan`
- `delta_pct = delta / amount_plan`  
  *Если план = 0: в MVP делаем правило:*  
  - если `amount_plan = 0` и `amount_fact = 0` → `delta_pct = 0`
  - если `amount_plan = 0` и `amount_fact > 0` → `delta_pct = NULL`, `status = "Нет плана"` (или отдельный статус)

### 5.4 Порог и статусы
Порог по умолчанию: `threshold = 0.10` (±10%)

Статус:
- `IN_NORM`: abs(delta_pct) <= threshold
- `OVERSPEND`: delta_pct > threshold
- `SAVING`: delta_pct < -threshold
- `NO_PLAN`: amount_plan = 0 (по правилу выше)

---

## 6) Валидации (минимум 5 — делаем 8)
В импорте (Go) обязательно проверяем:

1) **Формат периода**: строго `YYYY-MM`  
2) **Ссылочная целостность**: `cc_id` существует в `cost_centers`  
3) **Ссылочная целостность**: `item_id` существует в `items`  
4) **Тип статьи**: `items.type` ∈ {OPEX, CAPEX}  
5) **Суммы**: `amount_plan >= 0`, `amount_fact >= 0` (возвраты НЕ включаем в MVP)  
6) **Нет дублей** внутри одного CSV по ключу `(period, cc_id, item_id)`  
7) **Полнота**: после загрузки plan+fact нет “дыр”: комбинация есть в plan, но нет в fact (и наоборот)  
8) **Единый набор периодов**: проверка что периоды в plan и fact совпадают (минимум пересечение полное)

Ошибки импорта должны быть возвращены в UI списком (строка CSV + причина).

---

## 7) Модель БД (Postgres) — минимальная
### 7.1 Таблицы (DDL-идея)
**cost_centers**
- cc_id PK
- name

**items**
- item_id PK
- name
- type (CHECK IN ('OPEX','CAPEX'))

**plan**
- period (text 'YYYY-MM')
- cc_id FK
- item_id FK
- amount_plan numeric
- PK/UNIQUE (period, cc_id, item_id)

**fact**
- period
- cc_id FK
- item_id FK
- amount_fact numeric
- PK/UNIQUE (period, cc_id, item_id)

**imports_log** (рекомендуемо)
- id uuid
- kind ('cost_centers','items','plan','fact')
- filename
- file_hash
- imported_at
- user_id (nullable для MVP)
- threshold_used
- status ('SUCCESS','FAILED')
- error_count int

**settings** (опционально)
- key PK
- value

---

## 8) Основные запросы (что должен уметь бек)
### 8.1 Отчёт “План–Факт” (строки)
Фильтры:
- `from`, `to` (период)
- `cc_id` (опционально)
- `type` (OPEX/CAPEX, опционально)
- `threshold` (float, опционально, default 0.10)

Выход:
- period, cc_id, cc_name
- item_id, item_name, type
- amount_plan, amount_fact
- delta
- delta_pct
- status

### 8.2 KPI
На том же фильтре:
- `share_in_norm = count(status=IN_NORM)/count(all without NO_PLAN)` (или с NO_PLAN — зафиксируйте правило)
- `mean_abs_delta_pct = avg(abs(delta_pct))` (без NULL/NO_PLAN)

Дополнительно (после MVP):
- топ-10 отклонений по abs(delta_pct)
- доля OPEX/CAPEX по ЦФО

---

## 9) UI: экраны и поведение
### 9.1 Страница Import
- 4 секции загрузки (по очереди или все сразу):
  - cost_centers.csv
  - items.csv
  - plan.csv
  - fact.csv
- После загрузки показывать:
  - сколько строк импортировано
  - сколько ошибок
  - список ошибок (номер строки + причина)
- Кнопка “Проверить полноту” (или автоматом после загрузки plan+fact)

### 9.2 Страница Report
- Фильтры (сверху):
  - период from/to
  - ЦФО (dropdown)
  - тип статьи (OPEX/CAPEX/ALL)
  - threshold (ввод: 0.10 = 10%)
- Таблица:
  - period, ЦФО, статья, тип, план, факт, Δ, Δ%, статус
- Кнопка “Export CSV”

### 9.3 Страница Dashboard
- KPI карточки:
  - % в норме
  - среднее abs отклонение
- График plan vs fact (например, по месяцам или по типам)
- Heatmap:
  - по оси Y: ЦФО
  - по оси X: статьи (или наоборот)
  - значение: abs(delta_pct) или delta_pct

---

## 10) API контракт (MVP)
### Import
- `POST /api/import/cost-centers` (multipart/form-data file)
- `POST /api/import/items`
- `POST /api/import/plan`
- `POST /api/import/fact`

Ответ:
```json
{
  "inserted": 580,
  "updated": 20,
  "auto_created": 0,
  "errors": [
    {"row": 15, "message": "invalid period format"},
    {"row": 88, "message": "cc_id not found"}
  ]
}
```

---

## 11) Текущее состояние реализации

### Запуск
```bash
docker compose up -d --build
```

- UI: `http://localhost`
- API healthcheck: `http://localhost/ping`
- Backend API также проброшен на `http://localhost:8080`

### Реализованные backend endpoint'ы
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` — текущий аккаунт, профиль и персональные настройки.
- `PATCH /api/v1/profile` — сохранение полей профиля пользователя.
- `PATCH /api/v1/account/settings` — сохранение персональных настроек пользователя.
- `GET /api/v1/account/state/{key}` / `PUT /api/v1/account/state/{key}` — JSON-состояние пользователя (например, напоминания).
- `GET /api/v1/settings/threshold` / `PUT /api/v1/settings/threshold` — системный порог отчета.
- `GET /api/v1/cost-centers`, `POST /api/v1/cost-centers`, `PUT /api/v1/cost-centers/{id}`, `DELETE /api/v1/cost-centers/{id}`
- `GET /api/v1/items`, `POST /api/v1/items`, `PUT /api/v1/items/{id}`, `DELETE /api/v1/items/{id}`
- `POST /api/import/cost-centers`
- `POST /api/import/items`
- `POST /api/import/plan`
- `POST /api/import/fact`
- `GET /api/import/completeness`
- `GET /api/v1/report`
- `GET /api/v1/report/export`

### Import CSV
Формат: `multipart/form-data`, поле файла называется `file`.

Для `plan` и `fact` есть опция:
- `auto_create_refs=true` — если ЦФО или статья не найдены, backend создаст заглушку (`ЦФО <id>`, `Статья <id>`, тип статьи по умолчанию `OPEX`).

Это нужно для сценария из Miro “Автосоздание элементов”. Для строгой проверки оставьте опцию выключенной.

### Report
Параметры:
- `from=YYYY-MM`
- `to=YYYY-MM`
- `cc_id=1` опционально
- `type=OPEX|CAPEX` опционально
- `status=IN_NORM|OVERSPEND|SAVING|NO_PLAN` опционально
- `threshold=0.10`

CSV export использует те же параметры:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost/api/v1/report/export?from=2026-01&to=2026-03&threshold=0.10" \
  -o report.csv
```

### 1C `.dt`
В корне лежит `проектная_деятельность.dt`. Это бинарный дамп базы 1С (`1CIBDmpF3`). В рамках web-MVP он хранится как исходный артефакт 1С; приложение импортирует CSV-выгрузки из 1С, потому что browser/Go API не умеют читать `.dt` без платформы 1С.

### Demo CSV
Папка `demo-data/` содержит наборы:
- `base/` — справочники.
- `c1_ideal/` — идеальный план-факт.
- `c2_overspend/` — перерасход.
- `c3_mixed/` — смешанный сценарий.
- `c4_invalid/` — ошибки валидации.
- `c5_large_timeseries/` — большой набор для проверки графиков: 15 ЦФО, 25 статей, 24 месяца, больше 5 500 строк fact и 6 000 строк plan.
