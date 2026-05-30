DELETE FROM audit_log
WHERE entity = 'imports_log'
  AND action LIKE 'import.%';
