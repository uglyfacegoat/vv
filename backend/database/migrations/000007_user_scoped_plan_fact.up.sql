ALTER TABLE plan
    ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE fact
    ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE plan DROP CONSTRAINT IF EXISTS plan_period_cc_id_item_id_key;
ALTER TABLE fact DROP CONSTRAINT IF EXISTS fact_period_cc_id_item_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_user_period_cc_item_unique
    ON plan (user_id, period, cc_id, item_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fact_user_period_cc_item_unique
    ON fact (user_id, period, cc_id, item_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plan_user_period ON plan (user_id, period);
CREATE INDEX IF NOT EXISTS idx_fact_user_period ON fact (user_id, period);
