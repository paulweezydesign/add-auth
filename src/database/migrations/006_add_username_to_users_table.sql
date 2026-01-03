-- Add username to users table for examples and convenience
-- NOTE: Core library does not require this field, but many examples/READMEs reference it.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Optional: enforce basic format/length via CHECK (kept permissive to avoid breaking existing data)
-- Create index for lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

COMMENT ON COLUMN users.username IS 'Optional display username (used by examples)';

