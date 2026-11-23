# Ark Backend Provisioning Status

Last checked: 2026-11-23 (Asia/Kolkata)

## Completed

- Existing D1 database `thearkspadata` has the initial schema and migrations through `0003_appointment_details.sql`.
- D1 includes site content, appointments, audit events, login throttling, sessions, backup inventory, idempotency, content revisions and image metadata.
- Approved defaults (20 menu entries and 5 gallery entries) were seeded and verified.
- Multi-person booking detail columns were added and smoke-tested.
- Staged Worker-backed public and Admin pages/adapters are present on GitHub main; original live HTML remains unchanged.
- Admin sessions use a revocable bearer token in tab-scoped sessionStorage.
- Backend now uses D1 alone for content, appointments, small public image uploads and small JSON backup snapshots. R2 and GitHub write tokens are not required.

## Remaining prerequisites

- Apply migration `0004_d1_backups.sql` to add D1 backup snapshot and image byte columns.
- Provision Worker secrets: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `ALLOWED_ORIGINS`.
- Deploy Worker `the-ark-spa-api` with the existing D1 binding.
- Verify login/logout/session expiry/throttling, content save/read-back, appointments, image upload/read/delete, backup export/read-back and Recovery actions.
- Test Android Chrome, desktop and API-outage fallback.
- Only after all tests pass, promote staged HTML to live filenames. Keep original Supabase project and old HTML files for rollback.

## Limits

- Public image uploads are limited to 1 MB each to fit D1 row-size constraints; optimize images before upload.
- D1 quotas and provider outages remain possible. Download periodic backups and keep an independent copy.
- No R2 subscription, bucket, GitHub token or paid storage service is part of this architecture.
- No Worker deployment or live website cutover is claimed complete until verified.
