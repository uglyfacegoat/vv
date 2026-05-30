INSERT INTO cost_centers (cc_id, code, name, owner, active) VALUES
    (1, 'CC-001', 'Производство', 'Операционный блок', TRUE),
    (2, 'CC-002', 'Коммерция', 'Коммерческий блок', TRUE),
    (3, 'CC-003', 'ИТ', 'Технологический блок', TRUE),
    (4, 'CC-004', 'HR', 'HR', TRUE),
    (5, 'CC-005', 'Финансы', 'Финансовый блок', TRUE),
    (6, 'CC-006', 'Логистика', 'Логистика', TRUE),
    (7, 'CC-007', 'Маркетинг', 'Маркетинг', TRUE),
    (8, 'CC-008', 'АХО', 'Административный блок', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO items (item_id, code, name, type, active) VALUES
    (1, 'ITM-001', 'ФОТ', 'OPEX', TRUE),
    (2, 'ITM-002', 'Аренда', 'OPEX', TRUE),
    (3, 'ITM-003', 'ПО и лицензии', 'OPEX', TRUE),
    (4, 'ITM-004', 'Оборудование', 'CAPEX', TRUE),
    (5, 'ITM-005', 'Капремонт', 'CAPEX', TRUE),
    (6, 'ITM-006', 'Маркетинг', 'OPEX', TRUE),
    (7, 'ITM-007', 'Командировки', 'OPEX', TRUE),
    (8, 'ITM-008', 'Подрядчики', 'OPEX', TRUE),
    (9, 'ITM-009', 'Транспорт', 'CAPEX', TRUE),
    (10, 'ITM-010', 'Коммунальные услуги', 'OPEX', TRUE)
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('cost_centers', 'cc_id'), COALESCE((SELECT MAX(cc_id) FROM cost_centers), 1), true);
SELECT setval(pg_get_serial_sequence('items', 'item_id'), COALESCE((SELECT MAX(item_id) FROM items), 1), true);
