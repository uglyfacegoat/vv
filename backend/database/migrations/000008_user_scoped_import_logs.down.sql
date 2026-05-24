DROP INDEX IF EXISTS idx_imports_log_user_id_imported_at;

ALTER TABLE imports_log
    DROP COLUMN IF EXISTS user_id;
