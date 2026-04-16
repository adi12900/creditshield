-- Fix: make sent_by_user_id nullable so system-generated communications work
ALTER TABLE communications ALTER COLUMN sent_by_user_id DROP NOT NULL;
