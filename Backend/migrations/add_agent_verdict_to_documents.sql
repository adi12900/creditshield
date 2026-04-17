-- Add agent_verdict column to documents table for AI verification results
ALTER TABLE documents ADD COLUMN IF NOT EXISTS agent_verdict TEXT;
