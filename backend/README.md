# The Ark Cloudflare API (staging only)

This backend is an additive migration scaffold. It does **not** replace the live Supabase-powered site yet.

## Components

- `worker.js`: health endpoint, public content read, appointment intake, admin login/session, content write, and appointment list/status routes.
- `schema.sql`: D1 schema for site content, appointments, and audit events.
- `wrangler.toml.example`: resource-binding template. Copy to `wrangler.toml` only after the D1 database and R2 bucket have been created.

## Required bindings and secrets

D1 binding: `DB`. R2 binding: `ASSETS` (reserved for the asset API work before frontend cutover).

Worker secrets:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`, format `pbkdf2-sha256$iterations$saltHex$derivedKeyHex` (minimum 100,000 PBKDF2-SHA-256 iterations, 16-byte salt, 32-byte derived key)
- `SESSION_SECRET`, a long random secret
- `ALLOWED_ORIGINS`, exact comma-separated origins, e.g. the HTTPS production origin and a separate staging origin. Do not use wildcard origins.

Do not reuse or expose the password currently stored in an existing Worker secret. Set a fresh admin password/hash as part of a reviewed staging setup. Generate the hash offline with a trusted local script/tool and store only the encoded hash as a Worker secret.

## Staging endpoints currently implemented

- `GET /api/health`
- `GET /api/public/site-content`
- `POST /api/appointments`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `PUT /api/admin/site-content`
- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/:uuid`

Every mutation requires an exact allowed Origin. Admin mutation routes require a signed HttpOnly Secure SameSite=Strict cookie. The login verifier accepts PBKDF2-SHA-256 password hashes. D1 audit records are required for admin content/status changes.

## Known work before production cutover

1. Add a durable login rate limiter (for example a Durable Object or other server-side rate-limit store) and test it. Do not rely on per-isolate memory for security throttling.
2. Implement R2 upload/list/delete endpoints and validate MIME type, file size, object key, and authorization.
3. Add a data export/import script and checksums; reconcile appointments, content, gallery, logo, and any offer data.
4. Review all current admin UI operations against API routes; adapt the frontend only after staging E2E tests.
5. Verify CORS/CSRF, unauthenticated reads/writes, invalid login, session expiry/logout, backups, quota failures, and mobile/desktop.
6. Add a documented restore process and alerting for quota/resource errors.

## Current account provisioning status (2026-10-10)

The connected Cloudflare identity can read the account and list Workers. A D1 list request succeeded, but the attempt to create a D1 database returned an authentication error. Creating a separate staging Worker returned a resource-access error, and the R2 API reports R2 must first be enabled in the Dashboard. These are permissions/provisioning blockers; no D1 database, R2 bucket, or new Worker was created by those attempts.

The existing Worker `the-ark-admin-auth` was left untouched. Do not change the public frontend or disable Supabase until provisioning works, the current Supabase data and assets are exported, imported, and reconciled, and staging tests pass.
