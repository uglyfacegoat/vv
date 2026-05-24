DROP INDEX IF EXISTS idx_imports_log_enterprise_imported_at;
DROP INDEX IF EXISTS idx_fact_enterprise_period;
DROP INDEX IF EXISTS idx_plan_enterprise_period;
DROP INDEX IF EXISTS idx_fact_enterprise_period_cc_item_unique;
DROP INDEX IF EXISTS idx_plan_enterprise_period_cc_item_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_user_period_cc_item_unique
    ON plan (user_id, period, cc_id, item_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fact_user_period_cc_item_unique
    ON fact (user_id, period, cc_id, item_id)
    WHERE user_id IS NOT NULL;

ALTER TABLE imports_log DROP COLUMN IF EXISTS enterprise_id;
ALTER TABLE fact DROP COLUMN IF EXISTS enterprise_id;
ALTER TABLE plan DROP COLUMN IF EXISTS enterprise_id;
ALTER TABLE users DROP COLUMN IF EXISTS enterprise_id;
DROP TABLE IF EXISTS enterprises;
