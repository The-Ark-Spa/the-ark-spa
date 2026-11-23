# Ark Backend Provisioning Status

Last checked: 2026-11-23 (Asia/Kolkata)

## Completed

- Existing D1 database `thearkspadata` has schema and migrations `0001` through `0005`; migration ledger includes the latest migration.
- D1 contains website content, appointments, audit events, login throttling, sessions, backup inventory, idempotency, content revisions, image storage and private Admin credential table.
- Approved website defaults were seeded; multi-person appointment columns were smoke-tested.
- R2 bindings and dependencies have been removed from Worker source and configuration.
- Worker `the-ark-spa-api` deployed successfully with D1 binding, Admin email and exact GitHub Pages origin.
- Worker session secret has been provisioned as a Cloudflare secret.
- One-time bootstrap endpoint and setup page `admin-setup.worker.html` are deployed/staged; it hashes the chosen password using PBKDF2-SHA-256 and stores it in private D1. Bootstrap closes after first account creation.
- Staged public/Admin pages and API adapters remain separate from original live pages.

## Remaining before live cutover

- Add the one-time `ADMIN_SETUP_CODE` value as a Worker secret in Cloudflare. Then open the staged setup page, enter that code, and choose a password of at least 14 characters.
- Verify Worker health and actual browser API requests, then test login/logout/session expiry/throttling, content edits, appointments, image upload/read/delete and backup export/read-back.
- Test Android Chrome and desktop, including static-site fallback on API outage.
- Only after all tests pass, promote staged HTML to live filenames. Keep original Supabase project and original HTML files for rollback.

## Limits

- Public image uploads are limited to 1 MB each to fit D1 row-size constraints.
- D1 quotas and provider outages remain possible; download periodic backups and keep an independent copy.
- No R2 subscription, bucket, GitHub write token or paid storage service is required.
- Worker deployment is complete; Admin password initialization, end-to-end acceptance and live website cutover are not complete.
