# Ark Backend Provisioning Status

Last checked: 2026-11-23 (Asia/Kolkata)

## Completed

- Existing D1 database `thearkspadata` has schema and migrations `0001` through `0005`; migration ledger includes the latest migration.
- D1 contains website content, appointments, audit events, login throttling, sessions, backup inventory, idempotency, content revisions, image storage and private Admin credential table.
- Approved website defaults were seeded; multi-person appointment columns were smoke-tested.
- R2 bindings and dependencies have been removed from Worker source and configuration.
- Worker `the-ark-spa-api` deployed successfully with D1 binding, Admin email and exact GitHub Pages origin.
- Worker session secret has been provisioned as a Cloudflare secret.
- Admin login reads a salted PBKDF2 password hash from private D1, not from GitHub or a public Worker variable.
- Staged public/Admin pages and API adapters remain separate from original live pages.

## Remaining before live cutover

- Provision the Admin password hash in D1. This requires the site owner to choose/set the password through a secure bootstrap flow; no default or guessed password is being installed.
- Verify Worker health and actual browser API requests, then test login/logout/session expiry/rate limiting, content edits, appointments, image upload/read/delete and backup export/read-back.
- Test Android Chrome and desktop, including static-site fallback on API outage.
- Only after all tests pass, promote staged HTML to live filenames. Keep original Supabase project and original HTML files for rollback.

## Limits

- Public image uploads are limited to 1 MB each to fit D1 row-size constraints.
- D1 quotas and provider outages remain possible; download periodic backups and keep an independent copy.
- No R2 subscription, bucket, GitHub write token or paid storage service is required.
- Worker deployment is complete, but Admin credential provisioning, end-to-end acceptance and live website cutover are not complete.
