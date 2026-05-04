package repository

import (
	"context"
	"strconv"

	"backend/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BusinessRepository struct {
	db *pgxpool.Pool
}

func NewBusinessRepository(db *pgxpool.Pool) *BusinessRepository {
	return &BusinessRepository{db: db}
}

// Cost Centers
func (r *BusinessRepository) GetCostCenters(ctx context.Context) ([]models.CostCenter, error) {
	rows, err := r.db.Query(ctx, "SELECT cc_id, code, name, owner, active FROM cost_centers ORDER BY cc_id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ccs []models.CostCenter
	for rows.Next() {
		var cc models.CostCenter
		if err := rows.Scan(&cc.ID, &cc.Code, &cc.Name, &cc.Owner, &cc.Active); err != nil {
			return nil, err
		}
		ccs = append(ccs, cc)
	}
	return ccs, nil
}

func (r *BusinessRepository) CreateCostCenter(ctx context.Context, cc *models.CostCenter) error {
	if cc.Active == false {
		// explicit false is allowed; zero value from old clients should still create inactive only if sent as false.
	}
	if _, err := r.db.Exec(ctx, `SELECT setval(pg_get_serial_sequence('cost_centers', 'cc_id'), COALESCE((SELECT MAX(cc_id) FROM cost_centers), 1), true)`); err != nil {
		return err
	}
	q := `
		INSERT INTO cost_centers (code, name, owner, active)
		VALUES (NULLIF($1, ''), $2, $3, $4)
		RETURNING cc_id, COALESCE(code, ''), owner, active
	`
	err := r.db.QueryRow(ctx, q, cc.Code, cc.Name, cc.Owner, cc.Active).Scan(&cc.ID, &cc.Code, &cc.Owner, &cc.Active)
	if err != nil {
		return err
	}
	if cc.Code == "" {
		cc.Code = "CC-" + strconv.FormatInt(int64(cc.ID), 10)
		_, err = r.db.Exec(ctx, `UPDATE cost_centers SET code = $2 WHERE cc_id = $1`, cc.ID, cc.Code)
	}
	return err
}

func (r *BusinessRepository) UpsertCostCenter(ctx context.Context, cc models.CostCenter) (bool, error) {
	tag, err := r.db.Exec(ctx, `
		INSERT INTO cost_centers (cc_id, code, name, owner, active)
		VALUES ($1, COALESCE(NULLIF($2, ''), 'CC-' || LPAD($1::text, 3, '0')), $3, $4, $5)
		ON CONFLICT (cc_id) DO UPDATE
		SET code = EXCLUDED.code, name = EXCLUDED.name, owner = EXCLUDED.owner, active = EXCLUDED.active
	`, cc.ID, cc.Code, cc.Name, cc.Owner, cc.Active)
	return tag.RowsAffected() > 0, err
}

func (r *BusinessRepository) UpdateCostCenter(ctx context.Context, cc models.CostCenter) error {
	return r.db.QueryRow(ctx, `
		UPDATE cost_centers
		SET code = NULLIF($2, ''), name = $3, owner = $4, active = $5
		WHERE cc_id = $1
		RETURNING cc_id, COALESCE(code, ''), name, owner, active
	`, cc.ID, cc.Code, cc.Name, cc.Owner, cc.Active).Scan(&cc.ID, &cc.Code, &cc.Name, &cc.Owner, &cc.Active)
}

func (r *BusinessRepository) DeleteCostCenter(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM cost_centers WHERE cc_id = $1`, id)
	return err
}

// Items
func (r *BusinessRepository) GetItems(ctx context.Context) ([]models.Item, error) {
	rows, err := r.db.Query(ctx, "SELECT item_id, code, name, type, active FROM items ORDER BY item_id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Item
	for rows.Next() {
		var item models.Item
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.Type, &item.Active); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *BusinessRepository) CreateItem(ctx context.Context, item *models.Item) error {
	if _, err := r.db.Exec(ctx, `SELECT setval(pg_get_serial_sequence('items', 'item_id'), COALESCE((SELECT MAX(item_id) FROM items), 1), true)`); err != nil {
		return err
	}
	err := r.db.QueryRow(ctx, `
		INSERT INTO items (code, name, type, active)
		VALUES (NULLIF($1, ''), $2, $3, $4)
		RETURNING item_id, COALESCE(code, ''), active
	`, item.Code, item.Name, item.Type, item.Active).Scan(&item.ID, &item.Code, &item.Active)
	if err != nil {
		return err
	}
	if item.Code == "" {
		item.Code = "ITM-" + strconv.FormatInt(int64(item.ID), 10)
		_, err = r.db.Exec(ctx, `UPDATE items SET code = $2 WHERE item_id = $1`, item.ID, item.Code)
	}
	return err
}

func (r *BusinessRepository) UpsertItem(ctx context.Context, item models.Item) (bool, error) {
	tag, err := r.db.Exec(ctx, `
		INSERT INTO items (item_id, code, name, type, active)
		VALUES ($1, COALESCE(NULLIF($2, ''), 'ITM-' || LPAD($1::text, 3, '0')), $3, $4, $5)
		ON CONFLICT (item_id) DO UPDATE
		SET code = EXCLUDED.code, name = EXCLUDED.name, type = EXCLUDED.type, active = EXCLUDED.active
	`, item.ID, item.Code, item.Name, item.Type, item.Active)
	return tag.RowsAffected() > 0, err
}

func (r *BusinessRepository) UpdateItem(ctx context.Context, item models.Item) error {
	return r.db.QueryRow(ctx, `
		UPDATE items
		SET code = NULLIF($2, ''), name = $3, type = $4, active = $5
		WHERE item_id = $1
		RETURNING item_id, COALESCE(code, ''), name, type, active
	`, item.ID, item.Code, item.Name, item.Type, item.Active).Scan(&item.ID, &item.Code, &item.Name, &item.Type, &item.Active)
}

func (r *BusinessRepository) DeleteItem(ctx context.Context, id int) error {
	_, err := r.db.Exec(ctx, `DELETE FROM items WHERE item_id = $1`, id)
	return err
}

func (r *BusinessRepository) CostCenterExists(ctx context.Context, id int) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM cost_centers WHERE cc_id = $1)`, id).Scan(&exists)
	return exists, err
}

func (r *BusinessRepository) ItemExists(ctx context.Context, id int) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM items WHERE item_id = $1)`, id).Scan(&exists)
	return exists, err
}

// Plan/Fact
func (r *BusinessRepository) CreatePlan(ctx context.Context, p *models.Plan) error {
	q := `INSERT INTO plan (period, cc_id, item_id, amount_plan) 
		  VALUES ($1, $2, $3, $4) 
		  ON CONFLICT (period, cc_id, item_id) DO UPDATE SET amount_plan = $4
		  RETURNING id`
	return r.db.QueryRow(ctx, q, p.Period, p.CCID, p.ItemID, p.AmountPlan).Scan(&p.ID)
}

func (r *BusinessRepository) CreateFact(ctx context.Context, f *models.Fact) error {
	q := `INSERT INTO fact (period, cc_id, item_id, amount_fact) 
		  VALUES ($1, $2, $3, $4) 
		  ON CONFLICT (period, cc_id, item_id) DO UPDATE SET amount_fact = $4
		  RETURNING id`
	return r.db.QueryRow(ctx, q, f.Period, f.CCID, f.ItemID, f.AmountFact).Scan(&f.ID)
}

func (r *BusinessRepository) UpsertPlan(ctx context.Context, p models.Plan) error {
	q := `INSERT INTO plan (period, cc_id, item_id, amount_plan)
		  VALUES ($1, $2, $3, $4)
		  ON CONFLICT (period, cc_id, item_id) DO UPDATE SET amount_plan = EXCLUDED.amount_plan`
	_, err := r.db.Exec(ctx, q, p.Period, p.CCID, p.ItemID, p.AmountPlan)
	return err
}

func (r *BusinessRepository) UpsertFact(ctx context.Context, f models.Fact) error {
	q := `INSERT INTO fact (period, cc_id, item_id, amount_fact)
		  VALUES ($1, $2, $3, $4)
		  ON CONFLICT (period, cc_id, item_id) DO UPDATE SET amount_fact = EXCLUDED.amount_fact`
	_, err := r.db.Exec(ctx, q, f.Period, f.CCID, f.ItemID, f.AmountFact)
	return err
}

func (r *BusinessRepository) GetPlanFactReport(ctx context.Context, period string) ([]models.PlanFactRow, error) {
	q := `
		SELECT 
			COALESCE(p.period, f.period) as period,
			cc.cc_id,
			cc.name as cc_name,
			i.item_id,
			i.name as item_name,
			i.type as item_type,
			COALESCE(p.amount_plan, 0) as amount_plan,
			COALESCE(f.amount_fact, 0) as amount_fact,
			(COALESCE(f.amount_fact, 0) - COALESCE(p.amount_plan, 0)) as delta,
			CASE
				WHEN COALESCE(p.amount_plan, 0) = 0 AND COALESCE(f.amount_fact, 0) > 0 THEN NULL
				WHEN COALESCE(p.amount_plan, 0) = 0 THEN 0
				ELSE (COALESCE(f.amount_fact, 0) - COALESCE(p.amount_plan, 0)) / COALESCE(p.amount_plan, 0)
			END as delta_pct,
			CASE
				WHEN COALESCE(p.amount_plan, 0) = 0 AND COALESCE(f.amount_fact, 0) > 0 THEN 'NO_PLAN'
				WHEN ABS(CASE WHEN COALESCE(p.amount_plan, 0) = 0 THEN 0 ELSE (COALESCE(f.amount_fact, 0) - COALESCE(p.amount_plan, 0)) / COALESCE(p.amount_plan, 0) END) <= 0.10 THEN 'IN_NORM'
				WHEN (COALESCE(f.amount_fact, 0) - COALESCE(p.amount_plan, 0)) / COALESCE(p.amount_plan, 0) > 0.10 THEN 'OVERSPEND'
				ELSE 'SAVING'
			END as status
		FROM cost_centers cc
		CROSS JOIN items i
		LEFT JOIN plan p ON cc.cc_id = p.cc_id AND i.item_id = p.item_id AND p.period = $1
		LEFT JOIN fact f ON cc.cc_id = f.cc_id AND i.item_id = f.item_id AND f.period = $1
		WHERE p.id IS NOT NULL OR f.id IS NOT NULL
		ORDER BY cc.name, i.name
	`
	rows, err := r.db.Query(ctx, q, period)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var report []models.PlanFactRow
	for rows.Next() {
		var row models.PlanFactRow
		err := rows.Scan(
			&row.Period, &row.CCID, &row.CCName, &row.ItemID, &row.ItemName, &row.ItemType,
			&row.AmountPlan, &row.AmountFact, &row.Delta, &row.DeltaPct, &row.Status,
		)
		if err != nil {
			return nil, err
		}
		report = append(report, row)
	}
	return report, nil
}

func (r *BusinessRepository) GetReport(ctx context.Context, from, to string, ccID *int, itemType *string, status *string, threshold float64) (models.ReportResponse, error) {
	q := `
		WITH report_rows AS (
			SELECT
				COALESCE(p.period, f.period) as period,
				cc.cc_id,
				cc.name as cc_name,
				i.item_id,
				i.name as item_name,
				i.type as item_type,
				COALESCE(p.amount_plan, 0)::float8 as amount_plan,
				COALESCE(f.amount_fact, 0)::float8 as amount_fact,
				(COALESCE(f.amount_fact, 0) - COALESCE(p.amount_plan, 0))::float8 as delta,
				CASE
					WHEN COALESCE(p.amount_plan, 0) = 0 AND COALESCE(f.amount_fact, 0) > 0 THEN NULL
					WHEN COALESCE(p.amount_plan, 0) = 0 THEN 0::float8
					ELSE ((COALESCE(f.amount_fact, 0) - COALESCE(p.amount_plan, 0)) / COALESCE(p.amount_plan, 0))::float8
				END as delta_pct
			FROM plan p
			FULL OUTER JOIN fact f ON f.period = p.period AND f.cc_id = p.cc_id AND f.item_id = p.item_id
			JOIN cost_centers cc ON cc.cc_id = COALESCE(p.cc_id, f.cc_id)
			JOIN items i ON i.item_id = COALESCE(p.item_id, f.item_id)
		)
		SELECT
			period, cc_id, cc_name, item_id, item_name, item_type,
			amount_plan, amount_fact, delta, delta_pct,
			CASE
				WHEN amount_plan = 0 AND amount_fact > 0 THEN 'NO_PLAN'
				WHEN ABS(delta_pct) <= $5 THEN 'IN_NORM'
				WHEN delta_pct > $5 THEN 'OVERSPEND'
				ELSE 'SAVING'
			END as status
		FROM report_rows
		WHERE period >= $1 AND period <= $2
			AND ($3::int IS NULL OR cc_id = $3)
			AND ($4::text IS NULL OR item_type = $4)
		ORDER BY period, cc_name, item_name
	`
	rows, err := r.db.Query(ctx, q, from, to, ccID, itemType, threshold)
	if err != nil {
		return models.ReportResponse{}, err
	}
	defer rows.Close()

	var result models.ReportResponse
	for rows.Next() {
		var row models.PlanFactRow
		if err := rows.Scan(
			&row.Period, &row.CCID, &row.CCName, &row.ItemID, &row.ItemName, &row.ItemType,
			&row.AmountPlan, &row.AmountFact, &row.Delta, &row.DeltaPct, &row.Status,
		); err != nil {
			return models.ReportResponse{}, err
		}
		if status != nil && row.Status != *status {
			continue
		}
		result.Rows = append(result.Rows, row)
		result.KPI.TotalPlan += row.AmountPlan
		result.KPI.TotalFact += row.AmountFact
		result.KPI.TotalDelta += row.Delta
	}

	var denominator, inNorm, absCount int
	var absSum float64
	for _, row := range result.Rows {
		if row.Status != "NO_PLAN" {
			denominator++
			if row.Status == "IN_NORM" {
				inNorm++
			}
		}
		if row.DeltaPct != nil {
			absCount++
			if *row.DeltaPct < 0 {
				absSum -= *row.DeltaPct
			} else {
				absSum += *row.DeltaPct
			}
		}
	}
	if denominator > 0 {
		result.KPI.ShareInNorm = float64(inNorm) / float64(denominator)
	}
	if absCount > 0 {
		result.KPI.MeanAbsDeltaPct = absSum / float64(absCount)
	}
	return result, rows.Err()
}

func (r *BusinessRepository) CheckCompleteness(ctx context.Context) (models.CompletenessResult, error) {
	res := models.CompletenessResult{PeriodMismatch: []string{}}
	err := r.db.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM plan p LEFT JOIN fact f ON f.period = p.period AND f.cc_id = p.cc_id AND f.item_id = p.item_id WHERE f.id IS NULL),
			(SELECT COUNT(*) FROM fact f LEFT JOIN plan p ON p.period = f.period AND p.cc_id = f.cc_id AND p.item_id = f.item_id WHERE p.id IS NULL)
	`).Scan(&res.MissingInFact, &res.MissingInPlan)
	if err != nil {
		return res, err
	}

	rows, err := r.db.Query(ctx, `
		WITH pp AS (SELECT DISTINCT period FROM plan),
		     fp AS (SELECT DISTINCT period FROM fact)
		SELECT 'period ' || pp.period || ' есть в plan, но нет в fact'
		FROM pp LEFT JOIN fp USING (period) WHERE fp.period IS NULL
		UNION ALL
		SELECT 'period ' || fp.period || ' есть в fact, но нет в plan'
		FROM fp LEFT JOIN pp USING (period) WHERE pp.period IS NULL
		ORDER BY 1
	`)
	if err != nil {
		return res, err
	}
	defer rows.Close()
	for rows.Next() {
		var msg string
		if err := rows.Scan(&msg); err != nil {
			return res, err
		}
		res.PeriodMismatch = append(res.PeriodMismatch, msg)
	}
	return res, rows.Err()
}

func (r *BusinessRepository) LogImport(ctx context.Context, kind, filename, hash, status string, inserted, updated, errorCount int) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO imports_log (kind, filename, file_hash, status, inserted_count, updated_count, error_count)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, kind, filename, hash, status, inserted, updated, errorCount)
	return err
}

func (r *BusinessRepository) GetThreshold(ctx context.Context) (float64, error) {
	var raw string
	err := r.db.QueryRow(ctx, `SELECT value FROM settings WHERE key = 'threshold'`).Scan(&raw)
	if err != nil {
		return 0.10, err
	}
	value, err := strconv.ParseFloat(raw, 64)
	if err != nil || value <= 0 {
		return 0.10, err
	}
	return value, nil
}

func (r *BusinessRepository) SetThreshold(ctx context.Context, threshold float64) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO settings (key, value) VALUES ('threshold', $1)
		ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
	`, strconv.FormatFloat(threshold, 'f', 4, 64))
	return err
}
