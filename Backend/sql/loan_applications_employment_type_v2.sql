-- Expands employment_type values to support dynamic borrower profiles.
-- Safe for PostgreSQL.

DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname
    INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'loan_applications'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%employment_type%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE loan_applications DROP CONSTRAINT %I', constraint_name);
    END IF;
END
$$;

ALTER TABLE loan_applications
ADD CONSTRAINT loan_applications_employment_type_check
CHECK (
    employment_type IN (
        'Salaried',
        'Self Employed',
        'Business Owner',
        'Freelancer',
        'Student',
        'Unemployed'
    )
);
