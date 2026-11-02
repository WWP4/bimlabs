-- Store a student-provided contact phone in the protected school database.
-- Existing student rows remain valid and no grade is required for new applications.
ALTER TABLE gateways_students ADD COLUMN IF NOT EXISTS phone_number text;
