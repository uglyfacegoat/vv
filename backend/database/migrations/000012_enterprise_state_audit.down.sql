DROP INDEX IF EXISTS idx_audit_log_action_created_at;
DROP INDEX IF EXISTS idx_audit_log_user_created_at;
DROP INDEX IF EXISTS idx_audit_log_enterprise_created_at;
DROP INDEX IF EXISTS idx_enterprise_state_updated_at;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS enterprise_state;
