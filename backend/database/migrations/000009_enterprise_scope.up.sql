CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE RESTRICT;

INSERT INTO enterprises (key, name)
SELECT DISTINCT lower(split_part(email, '@', 2)), lower(split_part(email, '@', 2))
FROM users
WHERE email LIKE '%@%'
ON CONFLICT (key) DO NOTHING;

UPDATE users u
SET enterprise_id = e.id
FROM enterprises e
WHERE u.enterprise_id IS NULL
  AND e.key = lower(split_part(u.email, '@', 2));

ALTER TABLE plan
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE;

ALTER TABLE fact
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE;

ALTER TABLE imports_log
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE;

UPDATE plan p
SET enterprise_id = u.enterprise_id
FROM users u
WHERE p.enterprise_id IS NULL AND p.user_id = u.id;

UPDATE fact f
SET enterprise_id = u.enterprise_id
FROM users u
WHERE f.enterprise_id IS NULL AND f.user_id = u.id;

UPDATE imports_log l
SET enterprise_id = u.enterprise_id
FROM users u
WHERE l.enterprise_id IS NULL AND l.user_id = u.id;

DELETE FROM plan p
USING plan newer
WHERE p.ctid < newer.ctid
  AND p.enterprise_id = newer.enterprise_id
  AND p.period = newer.period
  AND p.cc_id = newer.cc_id
  AND p.item_id = newer.item_id;

DELETE FROM fact f
USING fact newer
WHERE f.ctid < newer.ctid
  AND f.enterprise_id = newer.enterprise_id
  AND f.period = newer.period
  AND f.cc_id = newer.cc_id
  AND f.item_id = newer.item_id;

DROP INDEX IF EXISTS idx_plan_user_period_cc_item_unique;
DROP INDEX IF EXISTS idx_fact_user_period_cc_item_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_enterprise_period_cc_item_unique
    ON plan (enterprise_id, period, cc_id, item_id)
    WHERE enterprise_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fact_enterprise_period_cc_item_unique
    ON fact (enterprise_id, period, cc_id, item_id)
    WHERE enterprise_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plan_enterprise_period ON plan (enterprise_id, period);
CREATE INDEX IF NOT EXISTS idx_fact_enterprise_period ON fact (enterprise_id, period);
CREATE INDEX IF NOT EXISTS idx_imports_log_enterprise_imported_at ON imports_log (enterprise_id, imported_at DESC);
