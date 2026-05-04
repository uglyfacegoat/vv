DROP INDEX IF EXISTS idx_items_code_unique;
DROP INDEX IF EXISTS idx_cost_centers_code_unique;

ALTER TABLE items
    DROP COLUMN IF EXISTS active,
    DROP COLUMN IF EXISTS code;

ALTER TABLE cost_centers
    DROP COLUMN IF EXISTS active,
    DROP COLUMN IF EXISTS owner,
    DROP COLUMN IF EXISTS code;
