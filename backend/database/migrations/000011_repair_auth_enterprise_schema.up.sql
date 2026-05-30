CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL
);

INSERT INTO roles (name, display_name) VALUES
    ('analyst', 'Финансовый аналитик'),
    ('manager', 'Руководитель подразделения'),
    ('controller', 'Контролёр планирования')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE RESTRICT;

INSERT INTO enterprises (key, name)
SELECT DISTINCT lower(split_part(email, '@', 2)), lower(split_part(email, '@', 2))
FROM users
WHERE email LIKE '%@%'
  AND split_part(email, '@', 2) <> ''
ON CONFLICT (key) DO NOTHING;

UPDATE users u
SET enterprise_id = e.id
FROM enterprises e
WHERE u.enterprise_id IS NULL
  AND e.key = lower(split_part(u.email, '@', 2));

ALTER TABLE cost_centers
    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS owner VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE items
    ADD COLUMN IF NOT EXISTS code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE cost_centers
SET code = COALESCE(code, 'CC-' || LPAD(cc_id::text, 3, '0')),
    owner = COALESCE(NULLIF(owner, ''), 'Финансовый блок')
WHERE code IS NULL OR owner = '';

UPDATE items
SET code = COALESCE(code, 'ITM-' || LPAD(item_id::text, 3, '0'))
WHERE code IS NULL;

ALTER TABLE plan
    ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE;

ALTER TABLE fact
    ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS imports_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(50) NOT NULL CHECK (kind IN ('cost_centers','items','plan','fact')),
    filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(128) NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    threshold_used NUMERIC(8, 4) NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS','FAILED')),
    inserted_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0
);

ALTER TABLE imports_log
    ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_plan_enterprise_period ON plan (enterprise_id, period);
CREATE INDEX IF NOT EXISTS idx_fact_enterprise_period ON fact (enterprise_id, period);
CREATE INDEX IF NOT EXISTS idx_imports_log_enterprise_imported_at ON imports_log (enterprise_id, imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_imports_log_user_id_imported_at ON imports_log (user_id, imported_at DESC);
