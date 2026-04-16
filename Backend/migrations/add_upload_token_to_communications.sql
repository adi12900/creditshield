-- Migration: Add upload token columns to communications table
-- Date: 2026-04-16
-- Description: Add columns for secure document upload links with token-based authentication

BEGIN;

-- Add new columns to existing communications table
ALTER TABLE communications 
ADD COLUMN IF NOT EXISTS upload_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_error TEXT;

-- Create index for token lookups (fast validation)
CREATE INDEX IF NOT EXISTS ix_communications_upload_token 
ON communications (upload_token) 
WHERE upload_token IS NOT NULL;

-- Create index for token expiration queries (cleanup jobs)
CREATE INDEX IF NOT EXISTS ix_communications_token_expires_at 
ON communications (token_expires_at) 
WHERE token_expires_at IS NOT NULL;

-- Update status check constraint to include new statuses
ALTER TABLE communications 
DROP CONSTRAINT IF EXISTS communications_status_check;

ALTER TABLE communications 
ADD CONSTRAINT communications_status_check 
CHECK (status IN ('Pending', 'Delivered', 'Failed'));

COMMIT;

-- Verification queries
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'communications' 
-- AND column_name IN ('upload_token', 'token_expires_at', 'delivery_error');

-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'communications' 
-- AND indexname LIKE '%token%';
