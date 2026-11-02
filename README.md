# Gateways Lunch — dedicated Netlify project

**Target Netlify project:** `gateways-lunch` (`https://gateways-lunch.netlify.app` once deployed).

Standalone Gateways school lunch student and kitchen site, separate from the BIM Labs website. This Git branch contains only the Gateways deployment files; the BIM Labs `main` branch is unchanged.

## Connect the new Netlify site

1. Open https://app.netlify.com/projects/gateways-lunch
2. Choose **Connect to Git provider / Import an existing project** and select GitHub repository `WWP4/bimlabs`.
3. Select production branch **`gateways-lunch-site`**, NOT `main`.
4. Netlify should detect `netlify.toml` here. The build command is `npm run build`, and publish directory is `public`.
5. Deploy the project. Netlify Database will provision a **new, independent PostgreSQL database** and apply the migrations.
6. Enable Netlify Identity for the **new project** and use **Open registration**, email confirmation ON (not autoconfirm).
7. Invite/assign at least one trusted kitchen administrator with the `gateways_admin` role; public sign-ups do not obtain this role.
8. Test account creation, email link back to `https://gateways-lunch.netlify.app`, pending application, approval, QR scan and correct serving totals on two devices.
9. Review parental consent and applicable student privacy rules before onboarding real students.

The **new project's accounts and database are independent** of those on the BIM Labs site; they are NOT automatically copied. Do not remove BIM Labs' old demo until migration and verification are complete.

## Routes

- `/`: student registration, login, QR pass, weekly lunch menu
- `/kitchen.html`: staff kitchen dashboard, meal scans, student approval, menus
- `/api/gateways/health`: database readiness
- `/api/gateways/*`: role-protected Netlify Functions

Migrations create an append-only meal history, staff audit log and signing key stored within Netlify Database. No Supabase and no external backend. In the student UI, meal or plate counts remain hidden.
