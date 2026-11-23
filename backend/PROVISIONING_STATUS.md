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
- Backend source is on GitHub `main`; Worker JavaScript syntax was checked after the current changes.
- Added provider-neutral browser API client, Worker-backed Admin auth adapter, and a public app adapter with last-known-good local cache.
- Staged alternate `.worker.html` pages for the public pages, booking, login and Admin, plus staged login/navigation helpers. Inline scripts were syntax-checked. The original live HTML files remain unchanged.
- The staged Admin now calls the API for content saves, appointment list/status/delete, gallery/hero/logo uploads, gallery asset deletion and private backup export.

## Still blocked / not provisioned

- R2 is not enabled yet. The public image bucket and separate private backup bucket have not been created.
- The new Worker `the-ark-spa-api` has not been deployed.
- The existing `the-ark-admin-auth` Worker remains separate and unchanged. Its current settings show legacy `ADMIN_PASSWORD` rather than the new `ADMIN_PASSWORD_HASH`, and it does not yet have the new D1/R2 bindings.
- No new Admin password or Worker secrets have been provisioned.
- No public site content or appointment data has been imported into D1; the `site_content` table is intentionally empty.
- Original website/Admin HTML files have not been switched to the new adapters; the staged variants are not live.
- No deployment, DNS change, or live website change has been made.

## Next gates

1. Enable R2 and create distinct public-assets and private-backups buckets.
2. Provision a fresh Admin identity and Worker secrets; do not reuse old credentials.
3. Deploy the new Worker to a staging origin, then verify CORS/session behavior on Android Chrome and desktop. Cross-site cookies may be blocked; a same-site API hostname is the reliable production solution.
4. Finish and verify the remaining Recovery restore/reset behavior and every Admin control against the staged UI. The backup export endpoint exists; restore endpoint is still pending.
5. Verify backup restore and public cached fallback.
6. Obtain explicit approval before public cutover or deployment.
