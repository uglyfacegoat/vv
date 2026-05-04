ALTER TABLE users
    ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE users
SET profile = jsonb_build_object(
    'name', split_part(email, '@', 1),
    'position', COALESCE(profile->>'position', ''),
    'department', COALESCE(profile->>'department', ''),
    'phone', COALESCE(profile->>'phone', '')
)
WHERE profile = '{}'::jsonb;
