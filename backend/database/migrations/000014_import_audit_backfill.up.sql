INSERT INTO audit_log (enterprise_id, user_id, action, entity, entity_id, metadata, created_at)
SELECT
    l.enterprise_id,
    l.user_id,
    'import.' || l.kind,
    'imports_log',
    l.id::text,
    jsonb_build_object(
        'kind', l.kind,
        'filename', l.filename,
        'hash', l.file_hash,
        'status', l.status,
        'inserted', l.inserted_count,
        'updated', l.updated_count,
        'errors', l.error_count
    ),
    l.imported_at
FROM imports_log l
WHERE NOT EXISTS (
    SELECT 1
    FROM audit_log a
    WHERE a.entity = 'imports_log'
      AND a.entity_id = l.id::text
);
