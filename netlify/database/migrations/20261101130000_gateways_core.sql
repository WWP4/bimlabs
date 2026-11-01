-- Gateways: secure database foundation. No data is copied from the demo.
CREATE TABLE gateways_students (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_student_id text NOT NULL UNIQUE,
 full_name text NOT NULL,
 grade text,
 lunch_period text NOT NULL,
 identity_user_id text UNIQUE,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','inactive')),
 created_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz,
 approved_by text
);
CREATE TABLE gateways_meal_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 student_id uuid NOT NULL REFERENCES gateways_students(id),
 service_date date NOT NULL,
 event_type text NOT NULL CHECK (event_type IN ('arrival','lunch','second','void')),
 reverses_event_id bigint UNIQUE REFERENCES gateways_meal_events(id),
 actor_identity_id text NOT NULL,
 reason text,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT gateways_reversal_shape CHECK (
  (event_type = 'void' AND reverses_event_id IS NOT NULL AND length(trim(coalesce(reason,''))) >= 12)
  OR (event_type <> 'void' AND reverses_event_id IS NULL)
 )
);
CREATE INDEX gateways_event_student_date ON gateways_meal_events(student_id,service_date);
CREATE INDEX gateways_event_date ON gateways_meal_events(service_date);
CREATE TABLE gateways_menu (
 service_date date PRIMARY KEY,
 title text NOT NULL,
 description text NOT NULL DEFAULT '',
 updated_by text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE gateways_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_identity_id text NOT NULL,
 action text NOT NULL,
 subject_id text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION gateways_block_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Gateways history is append-only';
END; $$;
CREATE TRIGGER gateways_events_append_only BEFORE UPDATE OR DELETE ON gateways_meal_events FOR EACH ROW EXECUTE FUNCTION gateways_block_history_mutation();
CREATE TRIGGER gateways_audit_append_only BEFORE UPDATE OR DELETE ON gateways_audit FOR EACH ROW EXECUTE FUNCTION gateways_block_history_mutation();
