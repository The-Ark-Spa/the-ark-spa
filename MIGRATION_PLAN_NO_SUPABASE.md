# The Ark Spa & Salon — Supabase Exit Plan

## Goal
Remove dependency on a trial-based Supabase project without taking the live website offline or losing business data.

## Chosen target
Cloudflare Workers + D1 + R2, with the existing static site hosted on its current static host.

- **Workers**: server-side API and authorization. Never put an admin password, API secret, or privileged token in browser JavaScript.
- **D1**: structured records for site content, appointments, and offers.
- **R2**: gallery and logo files.
- **Admin authentication**: server-verified session cookie; password stored only as a deployment secret in a strong password-hash format. Protect write endpoints, rate-limit login, use CSRF protection for cookie-authenticated mutations, and validate every request.
- **Recovery**: export the current site content, appointments, and uploaded files before migration; keep dated, independently stored backups and test restore.

Cloudflare's free tier is quota-limited, so this removes the *trial-expiration* failure mode but is not an unlimited-capacity guarantee. Add quota/health monitoring and documented recovery. Do not silently fall back to fake success.

## Current dependency map
- `supabase-config.js`: creates the browser Supabase client.
- `admin-auth-config.js` and `admin-login-popup.js`: admin sign-in and session checks.
- `app.js`: reads/writes the `site_content` record and listens for realtime changes.
- `admin.html`: admin content editing, appointments, recovery export, gallery/logo upload.
- `appointment.html`: writes appointment requests.
- Public pages load Supabase scripts even where they only need public site content.

## Safe migration sequence
1. **Inventory and backup first**: export the `site_content` record, all appointment rows, offer records/paths, gallery/logo objects, and the current admin identity metadata. Keep the original Supabase project untouched until restore is verified.
2. **Provision target resources**: create D1 tables and R2 bucket; configure Worker secrets and bindings; deploy the API on a staging URL.
3. **Implement and test API**: health, public site-content read, authorized content write, appointment create/list/update/export, offers, gallery/logo upload/delete, login/logout/session, and backup/restore. Validate authorization server-side on every admin endpoint.
4. **Import and reconcile**: import data and assets, compare record counts and checksums, and verify rates/offers/gallery/logo/appointments.
5. **Switch frontend**: replace Supabase calls and script tags with the new API only after staging tests pass. Preserve current public design and admin behavior.
6. **Verify before retiring Supabase**: test mobile and desktop; invalid login; unauthorized writes; appointment submission; admin CRUD; uploads; backup and restore; quota/error handling. Keep a rollback path until verified.
7. **Operational safeguards**: scheduled backups, health checks, alerts before quotas are exhausted, documented restore steps, and explicit errors when an operation fails.

## Important safety rule
Do not delete or disable Supabase before data export, successful import, and end-to-end verification. GitHub source access alone does not grant access to export private database rows, storage objects, or configure the Cloudflare account. No deployment or data migration is claimed by this document.

## Acceptance checklist
- [ ] Existing public website remains available during staging.
- [ ] Admin identity is verified by the server, not just by browser-side checks.
- [ ] Unauthenticated and non-admin write requests are rejected.
- [ ] Appointments and current site content match the source data.
- [ ] Gallery and logo files load after import.
- [ ] Backup can be restored into a clean target environment.
- [ ] Mobile and desktop end-to-end checks pass.
- [ ] Rollback and quota-exhaustion behavior are documented.
