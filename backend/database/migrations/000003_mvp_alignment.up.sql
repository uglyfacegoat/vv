UPDATE roles SET name = 'analyst', display_name = 'Финансовый аналитик'
WHERE name = 'financial_analyst';

UPDATE roles SET name = 'manager', display_name = 'Руководитель подразделения'
WHERE name = 'head_of_unit';

UPDATE roles SET name = 'controller', display_name = 'Контролёр планирования'
WHERE name = 'planning_controller';

INSERT INTO roles (name, display_name) VALUES
    ('analyst', 'Финансовый аналитик'),
    ('manager', 'Руководитель подразделения'),
    ('controller', 'Контролёр планирования')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS imports_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(50) NOT NULL CHECK (kind IN ('cost_centers','items','plan','fact')),
    filename VARCHAR(255) NOT NULL,
    file_hash VARCHAR(128) NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    threshold_used NUMERIC(8, 4) NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS','FAILED')),
    inserted_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES ('threshold', '0.10')
ON CONFLICT (key) DO NOTHING;
