DROP INDEX IF EXISTS idx_fact_user_period;
DROP INDEX IF EXISTS idx_plan_user_period;
DROP INDEX IF EXISTS idx_fact_user_period_cc_item_unique;
DROP INDEX IF EXISTS idx_plan_user_period_cc_item_unique;

ALTER TABLE fact DROP COLUMN IF EXISTS user_id;
ALTER TABLE plan DROP COLUMN IF EXISTS user_id;

ALTER TABLE plan ADD CONSTRAINT plan_period_cc_id_item_id_key UNIQUE (period, cc_id, item_id);
ALTER TABLE fact ADD CONSTRAINT fact_period_cc_id_item_id_key UNIQUE (period, cc_id, item_id);
