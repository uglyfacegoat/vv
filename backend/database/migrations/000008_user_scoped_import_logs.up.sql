ALTER TABLE imports_log
    ADD COLUMN IF NOT EXISTS user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_imports_log_user_id_imported_at
    ON imports_log (user_id, imported_at DESC);
