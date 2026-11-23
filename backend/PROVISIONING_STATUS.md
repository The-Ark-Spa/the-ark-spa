# Ark Backend Provisioning Status

Last checked: 2026-11-23 (Asia/Kolkata)

## Completed

- Existing D1 database `thearkspadata` is provisioned with the initial schema and migrations through `0003_appointment_details.sql`.
- D1 includes site content, appointments, audit events, login throttling, sessions, backup inventory, idempotency, content revisions and uploaded-image metadata.
- Existing approved defaults (20 menu entries and 5 gallery entries) were seeded and verified.
- Multi-person booking detail columns were added and smoke-tested.
- Staged Worker-backed public and Admin pages/adapters are present on GitHub main; original live HTML remains unchanged.
- Admin session uses a revocable bearer token in tab-scoped sessionStorage, avoiding third-party cookie dependence.
- Backend has been changed to use the existing GitHub repository for public website images and D1 for small JSON backup snapshots. R2 is not required by this design.

## Remaining prerequisites

- Apply migration `0004_d1_backups.sql` to the existing D1 database.
- Configure Worker secrets: `GITHUB_TOKEN` (fine-grained token restricted to this repo with Contents read/write), `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `ALLOWED_ORIGINS`.
- Deploy Worker `the-ark-spa-api` with the D1 binding and verify health.
- Verify login/logout/session expiry/throttling, content save/read-back, appointments, GitHub image upload/read/delete, D1 backup export/read-back, and Recovery actions.
- Test Android Chrome, desktop and API-outage fallback.
- Only after all tests pass, promote staged HTML to live filenames. Keep original Supabase project and old HTML files for rollback.

## Important limits

- GitHub uploads are public website images only. Never upload customer records or private backups to the repository.
- GitHub Contents API is rate-limited and every image upload/deletion creates a repository commit.
- D1 backup snapshots have database size limits; download exports periodically and retain an independent copy.
- No R2 subscription, bucket, paid storage service or R2 activation is part of this architecture.
- No Worker deployment or live website cutover is claimed complete until independently verified.
