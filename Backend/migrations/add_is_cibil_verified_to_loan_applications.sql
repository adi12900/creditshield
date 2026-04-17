ALTER TABLE public.loan_applications
ADD COLUMN IF NOT EXISTS is_cibil_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS ix_loan_applications_is_cibil_verified
ON public.loan_applications USING btree (is_cibil_verified);