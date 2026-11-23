# Ark Backend Provisioning Status

Last checked: 2026-11-23 (Asia/Kolkata)

## Completed

- The existing D1 database `thearkspadata` was inspected and confirmed to contain no application tables before setup.
- Applied `backend/schema.sql` followed by `backend/migrations/0002_resilience.sql` to that D1 database.
- Read-only verification confirmed these application tables exist:
  - `site_content`
  - `appointments`
  - `audit_events`
  - `admin_login_attempts`
  - `admin_sessions`
  - `backup_runs`
  - `idempotency_keys`
  - `site_content_revisions`
  - `storage_objects`
- Backend source is on GitHub `main`; the Worker JavaScript syntax was checked after the current changes.
- Added staged browser API and Worker-backed Admin auth adapters. Existing website/Admin HTML still loads the old Supabase integration; no public cutover has occurred.

## Still blocked / not provisioned

- R2 is not enabled yet. The public image bucket and separate private backup bucket have not been created.
- The new Worker `the-ark-spa-api` has not been deployed.
- The existing `the-ark-admin-auth` Worker remains separate and unchanged. Its current settings show legacy `ADMIN_PASSWORD` rather than the new `ADMIN_PASSWORD_HASH`, and it does not yet have the new D1/R2 bindings.
- No new Admin password or Worker secrets have been provisioned.
- No public site content or appointment data has been imported into D1; the `site_content` table is intentionally empty.
- No website/Admin HTML files have been switched to the new adapters.
- No deployment, DNS change, or live website change has been made.

## Next gates

1. Enable R2 and create distinct public-assets and private-backups buckets.
2. Provision a fresh Admin identity and Worker secrets; do not reuse old credentials.
3. Deploy the new Worker to a staging origin, then verify CORS/session behavior on Android Chrome and desktop. Cross-site cookies may be blocked; a same-site API hostname is the reliable production solution.
4. Finish the UI adapter for all existing Admin controls, booking flow and Recovery actions.
5. Verify backup restore and public cached fallback.
6. Obtain explicit approval before public cutover or deployment.
