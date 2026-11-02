# Gateways Lunch — Netlify-only backend (staging branch)

This branch introduces the **backend foundation only**. The live Gateways kitchen and student pages continue to run their clearly labeled browser-local demo. Do not enter real student details in that demo.

## Components
- **Netlify Functions:** secured API under `/api/gateways/*`
- **Netlify Identity:** school-invited accounts and server-checked roles
- **Netlify Database:** managed PostgreSQL, versioned migrations, meal history
- **GitHub + Netlify:** existing website and deployments; no Supabase anywhere

## Authentication and authorization
Enable Identity in the Netlify site UI and set **Registration = Open** before using any student data. Each student must receive a verified invitation linked by an administrator to a verified school roster entry.

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
## Verified Netlify deployment blocker — 2026-11-01
The Netlify site is on a team created 2025-05-09 with a Pro subscription, preceding 2025-09-04 credit-based billing. This is expected to be a **Legacy Pro** account. Netlify Database is credit-based-plan only.

Controlled Deploy Preview tests against draft PR #74:
- Full backend + database package + migration: failed Netlify build (exit 4).
- Database package still installed, migration removed, API replaced with a fail-closed diagnostic stub: **failed** Netlify build (exit 4).
- Database package removed, API still a fail-closed stub, migration removed: **ready** Netlify Deploy Preview (no school data enabled).
- Database package added back with fail-closed stub and no migration: **failed** Netlify build (exit 4).

This isolates the Netlify build failure to **database package provisioning**, not SQL migration logic or the browser bundle. The actual Netlify log was not available through the connected deployment diagnostic, so exact provider-side error text is not verified. Netlify's documentation says Netlify Database requires a credit-based billing plan.

**The real API, SQL migration, and front-end build command have all been restored to the secure feature branch.** It remains draft; DO NOT merge to production while the account does not support the database.

To unblock: Netlify team dashboard > Usage & billing > Plan details > Change team plan > select credit-based plan. This is an **irreversible billing change** requiring a Team Owner's decision. Then enable Netlify Identity (Invite only) in the site dashboard, set GATEWAYS_QR_SECRET (at least 32 random chars, Functions scope), rerun the Deploy Preview and confirm working database/Identity endpoints, and perform full cross-device/access-control testing before student rollout.

The environment-variable API returned 422 when attempting to set the secret; it was not created, so configure it in the Netlify UI. No tokens, usernames or real student records are included in the repo.

## Student self-registration (November 1, 2026)
Students are NOT preloaded into the database. The student portal provides a Create Account form for name, grade, lunch period, email, and password.
Netlify Identity handles signup and email confirmation. After verification, the authenticated student submits their application to POST /api/gateways/apply. The server links the Identity user ID and email to an automatically generated internal student ID, with status pending.
The kitchen's Students page shows an Awaiting approval queue with Approve and Decline controls. Email verification proves email ownership, not school enrollment; the school must check enrollment before approving a QR pass.
Public signups never grant gateways_staff or gateways_admin roles. Unapproved accounts never receive QR credentials. Students never see lunch counts or meal history.
**Required dashboard setting:** Enable Netlify Identity and change Registration to OPEN (not Invite only). Keep email verification ON and autoconfirm OFF. This setting cannot be changed by the connector's public API.
Only begin real student enrollment after school approval of age-appropriate privacy, parental permissions where applicable, retention policies, and two-device end-to-end verification. The QR signing key is now generated inside Netlify Database; do not configure an external GATEWAYS_QR_SECRET.
