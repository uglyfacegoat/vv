CREATE TABLE IF NOT EXISTS enterprise_state (
    enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enterprise_id, key)
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_enterprise_state_updated_at ON enterprise_state (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_enterprise_created_at ON audit_log (enterprise_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created_at ON audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_created_at ON audit_log (action, created_at DESC);

INSERT INTO enterprise_state (enterprise_id, key, value, updated_at)
SELECT
    e.id,
    'dashboard.defaults',
    jsonb_build_object(
        'period_source', 'latest_loaded_period',
        'scope', 'enterprise',
        'widgets', jsonb_build_array('kpi', 'monthly_plan_fact', 'variance_heatmap', 'detail_table')
    ),
    CURRENT_TIMESTAMP
FROM enterprises e
ON CONFLICT (enterprise_id, key) DO NOTHING;

INSERT INTO enterprise_state (enterprise_id, key, value, updated_at)
SELECT
    e.id,
    'access.policy',
    jsonb_build_object(
        'controller', jsonb_build_object('can_view_all_cost_centers', true, 'can_import', true, 'can_manage_users', false),
        'manager', jsonb_build_object('can_view_assigned_cost_center', true, 'can_import', false, 'can_manage_users', false),
        'analyst', jsonb_build_object('can_view_reports', true, 'can_import', false, 'can_manage_users', false)
    ),
    CURRENT_TIMESTAMP
FROM enterprises e
ON CONFLICT (enterprise_id, key) DO NOTHING;
