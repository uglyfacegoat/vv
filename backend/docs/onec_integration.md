# Интеграция с 1С (REST/JSON)

Кратко: реализован простой REST API для обмена данными с 1С. Защита — заголовок `X-1C-Token`.

Переменные окружения (на сервере/в контейнере):
- `ONEC_TOKEN` — секретный токен, который 1С отправляет в заголовке `X-1C-Token` или `Authorization: Bearer <token>`.
- `ONEC_USER_EMAIL` — email сервисного пользователя 1С. Если пользователя нет, backend создаст его автоматически. Важно: домен email задаёт компанию/enterprise, данные будут видны пользователям с тем же доменом. По умолчанию: `onec@company.ru`.
- `ONEC_USER_ID` — опциональный UUID пользователя из таблицы `users`. Нужен только если вы хотите жёстко привязать интеграцию к уже существующему пользователю; при наличии этой переменной `ONEC_USER_EMAIL` не используется для записи plan/fact.

Эндпоинты:
- `GET /api/1c/status` — проверка токена, доступности интеграции и сервисного пользователя.
- `POST /api/1c/cost-centers` — upsert списка центров затрат.
  - Тело: `{ "items": [ {"cc_id": 1, "code": "CC-001", "name": "ЦФО 1", "owner": "..."}, ... ] }`
- `POST /api/1c/items` — upsert списка статей.
  - Тело: `{ "items": [ {"item_id": 10, "code": "ITM-010", "name": "Аренда", "type": "OPEX"}, ... ] }`
- `POST /api/1c/plan` — upsert плановых значений.
  - Тело: `{ "items": [ {"period":"2026-05", "cc_id":1, "item_id":10, "amount":12345.67}, ... ] }`
- `POST /api/1c/fact` — upsert фактических значений.
  - Тело: `{ "items": [ {"period":"2026-05", "cc_id":1, "item_id":10, "amount":12345.67}, ... ] }`

Формат ответа для загрузки: JSON `{ "processed": <число> }` при успехе.

Примеры curl (замените `HOST` и `TOKEN`):

```bash
# проверка связи
curl -X GET https://HOST/api/1c/status \
  -H "X-1C-Token: TOKEN"
```

```bash
# upsert cost centers
curl -X POST https://HOST/api/1c/cost-centers \
  -H "Content-Type: application/json" \
  -H "X-1C-Token: TOKEN" \
  -d '{"items":[{"cc_id":1,"code":"CC-001","name":"ЦФО 1","owner":"1С"}]}'

# upsert items
curl -X POST https://HOST/api/1c/items \
  -H "Content-Type: application/json" \
  -H "X-1C-Token: TOKEN" \
  -d '{"items":[{"item_id":10,"code":"ITM-010","name":"Аренда","type":"OPEX"}]}'

# upsert plan
curl -X POST https://HOST/api/1c/plan \
  -H "Content-Type: application/json" \
  -H "X-1C-Token: TOKEN" \
  -d '{"items":[{"period":"2026-05","cc_id":1,"item_id":10,"amount":12345.67}] }'

# upsert fact
curl -X POST https://HOST/api/1c/fact \
  -H "Content-Type: application/json" \
  -H "X-1C-Token: TOKEN" \
  -d '{"items":[{"period":"2026-05","cc_id":1,"item_id":10,"amount":12000.00}] }'
```

Советы по настройке в 1С:
- Можно создать внешнюю обработку, которая формирует JSON и отправляет HTTP POST на указанные URL.
- В обработке укажите заголовок `X-1C-Token` со значением из `ONEC_TOKEN`.
- Для быстрой проверки сначала вызовите `GET /api/1c/status`: ответ должен содержать `"ok": true`.
- `ONEC_USER_EMAIL` должен иметь тот же домен, что и пользователи проекта. Например, если пользователи входят как `manager@acme.ru`, задайте `ONEC_USER_EMAIL=onec@acme.ru`.
- Отправку можно делать по расписанию или триггерить при проведении документов/обновлении справочников.

Тестирование и отладка:
- Если используете `ONEC_USER_ID`, убедитесь, что UUID соответствует реальному пользователю в БД. Иначе plan/fact будут отклоняться.
- Если используете авто-пользователя через `ONEC_USER_EMAIL`, backend создаст его при первом запросе к `/api/1c/status`, `/api/1c/plan` или `/api/1c/fact`.
- Логи импортов можно смотреть в админке (или таблице `imports_log`).

Дальнейшие улучшения (опционально):
- Поддержка аутентификации по IP и mutual TLS.
- Валидация и детализация ошибок в ответах.
- Добавить batch-id и идемпотентность по файлам/пакетам.

Файл с реализацией: [backend/internal/handlers/onec_handler.go](backend/internal/handlers/onec_handler.go)
