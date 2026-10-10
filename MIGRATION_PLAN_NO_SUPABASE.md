# The Ark Spa & Salon — Supabase Exit Plan

## Goal
Remove dependency on a trial-based Supabase project without taking the live website offline or losing business data.

## Cloudflare connection audit — 10 October 2026
- The connected Cloudflare integration is authenticated and can read the account.
- Account ID: `4e8165157d8809981ebcc715c54a99dd`.
- An existing Worker named `the-ark-admin-auth` is present, with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` secrets configured. Its deployed code currently covers only admin login/session/logout routes; it is not the website's full data backend.
- D1 database list is empty.
- R2 bucket listing is blocked because R2 has not been enabled in the Cloudflare Dashboard.
- Attempting to create D1 returned a Cloudflare authentication error.
- Attempting to create a separate staging Worker returned a resource-access error. The existing production-ish Worker was not modified.
- The existing Worker echoes any request Origin in CORS responses and allows credentials. Do not use it for website writes until allowed origins are restricted and CSRF protection is added.
- No database, bucket, or staging Worker was created by these attempts.

## Work committed to GitHub
- `backend/schema.sql`: D1 schema for site content, appointments, and audit events.
- `backend/worker.js`: staged API scaffold for health, public content read, appointment intake, admin login/session/logout, site content writes, and appointment list/status changes.
- `backend/wrangler.toml.example`: non-secret binding template.
- `backend/README.md`: setup steps, secret format, endpoint inventory, and remaining safety work.

This is source-code preparation only. It has not been deployed, connected to a live database, or tested end-to-end yet. Login rate limiting and R2 upload/list/delete endpoints still need implementation before production cutover.

## No-card path — 10 October 2026

The user chose not to add a payment card. R2 is therefore **not a prerequisite for the first database/API migration stage**. The initial no-card path is to provision Cloudflare Workers + D1 on the existing account and keep existing static-site hosting unchanged. Gallery uploads must remain disabled/not cut over until a storage provider is selected; do not fake upload success or silently discard files. Existing gallery assets must be backed up and their current URLs inventoried before any frontend change.

A fresh read-only account check confirmed:
- D1 databases: none.
- Workers KV namespaces: none.
- Worker scripts: only `the-ark-admin-auth`.
- Creating D1 and creating a KV namespace both returned Cloudflare API error `10000: Authentication error`. This is an API authorization/connection-scope blocker, not a reason to add a card.
- R2 remains unenabled because its setup screen asks for card information.

Next action: fix/reauthorize the connected Cloudflare integration with account-level permissions to create D1 databases and Workers (and later deploy/update a Worker). Do not ask the user for card details. Retry resource provisioning only after the permission issue is resolved.

## Chosen target
Cloudflare Workers + D1 + R2, with the existing static site hosted on its current static host.

- **Workers**: server-side API and authorization. Never put an admin password, API secret, or privileged token in browser JavaScript.
- **D1**: structured records for site content, appointments, and offers (offers currently live in the site-content data structure unless the full data audit finds otherwise).
- **R2**: gallery and logo files.
- **Admin authentication**: server-verified session cookie, strong password hash, exact-origin allowlist, CSRF protections, rate-limited login, and server-side validation.
- **Recovery**: export current site content, appointments, offer data, and uploaded files before migration; keep dated independent backups and test restore.

Cloudflare's free tier is quota-limited. This removes the trial-expiration failure mode but is not an unlimited-capacity guarantee. Add quota/health monitoring and documented recovery. Do not silently fall back to fake success.

## Safe migration sequence
1. **Unblock Cloudflare provisioning**: enable R2 in the Cloudflare Dashboard and grant the connected Cloudflare integration/token permission to create D1 databases and Workers. Re-check permissions before retrying.
2. **Inventory and backup first**: export the `site_content` record, all appointment rows, offer records/paths, gallery/logo objects, and current admin identity metadata. Keep the original Supabase project untouched until restore is verified.
3. **Provision target resources**: create D1 tables and the R2 bucket; configure Worker secrets/bindings; deploy the API on a staging URL.
4. **Complete and test API**: add durable login rate limiting, R2 upload/list/delete, backup/restore, and tests for health, public site-content read, authorized content write, appointment create/list/update/export, login/logout/session, and failure cases. Validate authorization server-side on every admin endpoint and restrict CORS to exact site origins.
5. **Import and reconcile**: import data and assets, compare record counts and checksums, and verify rates/offers/gallery/logo/appointments.
6. **Switch frontend**: replace Supabase calls and script tags only after staging tests pass. Preserve current public design and admin behavior.
7. **Verify before retiring Supabase**: test mobile and desktop; invalid login; unauthorized writes; appointment submission; admin CRUD; uploads; backup and restore; quota/error handling. Keep a rollback path until verified.
8. **Operational safeguards**: scheduled backups, health checks, alerts before quotas are exhausted, documented restore steps, and explicit errors when an operation fails.

## Important safety rule
Do not delete or disable Supabase before data export, successful import, and end-to-end verification. GitHub source access alone does not grant access to export private database rows or storage objects. No deployment or data migration is claimed by this document.

## Acceptance checklist
- [ ] Cloudflare D1 and R2 provisioned with least-privilege permissions.
- [ ] Existing public website remains available during staging.
- [ ] Admin identity is verified by the server, not just browser-side checks.
- [ ] Unauthenticated and non-admin write requests are rejected.
- [ ] CORS is limited to exact Ark website origins; CSRF protection is tested.
- [ ] Appointments and current site content match source data.
- [ ] Gallery and logo files load after import.
- [ ] Backup can be restored into a clean target environment.
- [ ] Mobile and desktop end-to-end checks pass.
- [ ] Rollback and quota-exhaustion behavior are documented.
