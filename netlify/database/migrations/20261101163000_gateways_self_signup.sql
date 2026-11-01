-- Add verified-email account linkage for student-initiated applications.
-- Existing school data remains intact; production migrations are additive.
ALTER TABLE gateways_students ADD COLUMN account_email text;
CREATE UNIQUE INDEX gateways_students_account_email_idx ON gateways_students (lower(account_email)) WHERE account_email IS NOT NULL;
CREATE INDEX gateways_students_pending_idx ON gateways_students(created_at) WHERE status='pending';
