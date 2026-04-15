-- Adds dynamic academic percentages support for education loans.
-- Safe for PostgreSQL.

ALTER TABLE education_loan_details
ADD COLUMN IF NOT EXISTS academic_percentages JSONB NOT NULL DEFAULT '[]'::jsonb;
