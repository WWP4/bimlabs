# Gateways Lunch — Netlify-only backend (staging branch)

This branch introduces the **backend foundation only**. The live Gateways kitchen and student pages continue to run their clearly labeled browser-local demo. Do not enter real student details in that demo.

## Components
- **Netlify Functions:** secured API under `/api/gateways/*`
- **Netlify Identity:** school-invited accounts and server-checked roles
- **Netlify Database:** managed PostgreSQL, versioned migrations, meal history
- **GitHub + Netlify:** existing website and deployments; no Supabase anywhere

## Authentication and authorization
Enable Identity in the Netlify site UI and set **Registration = Invite only** before using any student data. Each student must receive a verified invitation linked by an administrator to a verified school roster entry.

Roles (must be assigned by trusted Netlify Identity administrators via app metadata, never in student-controlled profile fields):
- `gateways_admin`: approve/link students, correct a scan with a written reason, manage menus, scan and view roster/aggregates.
- `gateways_staff`: scan, manage menus and read roster/aggregates.
- Student without privileged role: see only their own approved profile, expiring QR pass, and menus.

The app should display actual user profiles only after an authenticated call to `GET /api/gateways/me`. A school ID typed into a signup form is **not** sufficient to verify enrollment.

## Secure API routes
| Method | Path | Access | Behavior |
|---|---|---|---|
| GET | /api/gateways/me | Any authenticated user | Returns own profile, no meal totals |
| GET | /api/gateways/pass | Approved student | Returns signed QR credential (2-minute expiry) |
| GET | /api/gateways/menu | Signed-in user | Returns menu dates and descriptions |
| PUT | /api/gateways/menu | Kitchen staff | Updates menu, appends audit |
| GET | /api/gateways/roster | Kitchen staff | School roster |
| POST | /api/gateways/roster | Admin | Adds verified roster entry as pending |
| PATCH | /api/gateways/roster | Admin | Links verified Identity account and approves/inactivates |
| POST | /api/gateways/scan | Kitchen staff | Signed pass verification, duplicate check, atomic meal event |
| POST | /api/gateways/correct | Admin | Adds reversal event and required correction reason |
| GET | /api/gateways/stats | Kitchen staff | Day totals; not visible to students |

Staff scans lock each student/day while checking lunch rules and inserting the event, preventing concurrent double scans. The student QR credential contains no contact information, is HMAC signed, and expires in two minutes. Signed QR credentials remain bearer tokens: a copied screenshot may work briefly, and staff should check identities when needed.

## Before any production deployment
1. Confirm the school’s privacy requirements, FERPA/COPPA applicability, vendor arrangements and retention periods.
2. Confirm Netlify Database pricing and the desired backup/recovery plan. Database provisioning/compute consumes Netlify credits.
3. Review this feature branch and test builds in a restricted environment. Do not switch real users to the demo login.
4. Enable **Netlify Identity** at https://app.netlify.com/projects/bimlab/identity and set **Invite only**; confirm school-controlled email verification/invitation process and recovery options.
5. In Netlify environment variables, configure `GATEWAYS_QR_SECRET` as a random **at least 32-character** cryptographic signing secret, scoped to **Functions**. Never commit the secret.
6. Install backend dependencies and merge/deploy after reviewing costs. `@netlify/database` is included in package.json; Netlify will provision the database and apply the SQL migration when deployed. Never edit a migration after it has been applied.
7. Build the **real** student signup/login UI using Netlify Identity and replace all localStorage-based registration, pass generation, menu data and kitchen scan writes with function calls. Do not upload fictional demo students as school records.
8. Cross-device test all roles, forged/expired QR codes, simultaneous scans, staff corrections, recovery, backups, and logs. Test Identity in a deployed restricted preview; it does not function under `netlify dev`.
9. Audit any external scripts/assets under school privacy rules before a real student rollout.

## Data integrity
The database has append-only meal and audit event tables; corrections are compensating entries, not edits to scan history. This blocks ordinary client and application updates. It is not a guarantee against a database owner with the ability to disable triggers. Use independent backups/audit exports and least-privileged administrator access when productionizing.

## Current status
The API and schema are **staged implementation code**, not validated against a provisioned school database, and **not a production-ready student system**. No student accounts have been provisioned or migrated. The live demo has not changed.