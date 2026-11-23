# Ark Backend Provisioning Status

Last checked: 2026-11-23 (Asia/Kolkata)

## Completed

- Existing D1 database `thearkspadata` is provisioned with schema and migrations `0001` through `0004`; migration ledger verified.
- D1 contains website content, appointments, audit events, login throttling, sessions, backup inventory, idempotency, content revisions and image storage.
- Existing approved defaults (20 menu entries and 5 gallery entries) were seeded and verified.
- Multi-person booking detail columns were added and smoke-tested.
- Worker source on GitHub main was syntax-checked and deployed as `the-ark-spa-api`.
- Cloudflare deployment returned success with D1 binding, Admin email and exact GitHub Pages origin configured.
- Backend now uses D1 only for content, appointments, small public image uploads (1 MB maximum) and small JSON backup snapshots. No R2 or GitHub write token is required.
- Staged Worker-backed public and Admin pages/adapters are present on GitHub main; original live HTML remains unchanged.
- Admin sessions use a revocable bearer token in tab-scoped sessionStorage.

## Remaining prerequisites

- Set Worker secrets `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` in Cloudflare. These cannot be committed to GitHub.
- Verify live Worker health, login/logout/session expiry/throttling, content save/read-back, appointments, image upload/read/delete, backup export/read-back and Recovery actions.
- Test Android Chrome, desktop and API-outage fallback.
- Only after all tests pass, promote staged HTML to live filenames. Keep original Supabase project and old HTML files for rollback.

## Limits

- Public image uploads are limited to 1 MB each to fit D1 row-size constraints; optimize images before upload.
- D1 quotas and provider outages remain possible. Download periodic backups and keep an independent copy.
- No R2 subscription, bucket, GitHub token or paid storage service is part of this architecture.
- The new Worker is deployed, but Admin secrets and full end-to-end acceptance are not yet complete. Live website cutover has not happened.
