CREATE TABLE IF NOT EXISTS cost_centers (
    cc_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('OPEX', 'CAPEX'))
);

CREATE TABLE IF NOT EXISTS plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period VARCHAR(10) NOT NULL, -- Format: YYYY-MM
    cc_id INT NOT NULL REFERENCES cost_centers(cc_id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    amount_plan NUMERIC(15, 2) NOT NULL CHECK (amount_plan >= 0),
    UNIQUE (period, cc_id, item_id)
);

CREATE TABLE IF NOT EXISTS fact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period VARCHAR(10) NOT NULL, -- Format: YYYY-MM
    cc_id INT NOT NULL REFERENCES cost_centers(cc_id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    amount_fact NUMERIC(15, 2) NOT NULL CHECK (amount_fact >= 0),
    UNIQUE (period, cc_id, item_id)
);

-- Теперь, когда таблица cost_centers существует, необходимо добавить внешний ключ 
-- колонке cc_id в таблице users, которую мы создали в предыдущей миграции
ALTER TABLE users ADD CONSTRAINT fk_user_cc FOREIGN KEY (cc_id) REFERENCES cost_centers(cc_id) ON DELETE SET NULL;
