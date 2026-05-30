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
