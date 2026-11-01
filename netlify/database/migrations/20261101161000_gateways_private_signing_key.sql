-- Generate a persistent, high-entropy signing key inside the private Netlify Database.
-- The secret is never committed, returned by any API, or stored in a browser.
-- Four independent version-4 UUID values provide approximately 488 random bits.
CREATE TABLE gateways_private_secrets (
 id text PRIMARY KEY,
 secret text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO gateways_private_secrets (id,secret)
VALUES ('lunch-qr-v1',
 replace(gen_random_uuid()::text,'-','') ||
 replace(gen_random_uuid()::text,'-','') ||
 replace(gen_random_uuid()::text,'-','') ||
 replace(gen_random_uuid()::text,'-',''))
ON CONFLICT (id) DO NOTHING;
CREATE TRIGGER gateways_private_secrets_immutable
BEFORE UPDATE OR DELETE ON gateways_private_secrets
FOR EACH ROW EXECUTE FUNCTION gateways_block_history_mutation();
