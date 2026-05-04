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

CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_centers_code_unique ON cost_centers (code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_items_code_unique ON items (code);

SELECT setval(pg_get_serial_sequence('cost_centers', 'cc_id'), COALESCE((SELECT MAX(cc_id) FROM cost_centers), 1), true);
SELECT setval(pg_get_serial_sequence('items', 'item_id'), COALESCE((SELECT MAX(item_id) FROM items), 1), true);
