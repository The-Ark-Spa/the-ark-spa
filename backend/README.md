# The Ark Spa API — migration/staging backend

This is the independent backend being built to replace the Supabase dependency. The public website and Admin UI are **not cut over yet**. Do not deploy or disable the existing integration until the frontend adapter, data import, authentication, storage and end-to-end checks are complete.

## Components

- `worker.js`: public content read, appointment intake, admin authentication/session, content writes, appointment management, asset metadata and R2 image upload/delete.
- `schema.sql`: readable baseline schema reference.
- `migrations/0001_initial_schema.sql`: tracked initial D1 schema applied by Wrangler.
- `migrations/0002_resilience.sql`: persistent login throttling, revocable sessions, backup inventory, R2 object metadata, idempotency storage and content revisions.
- `migrations/0003_appointment_details.sql`: per-person therapy, offer, duration and rate fields required by the existing multi-guest booking UI.
- `wrangler.toml.example`: D1/R2 binding template.

## Required resources and configuration

- D1 binding: `DB`; database must have `schema.sql` and all migrations through `0003_appointment_details.sql` applied before this Worker version can serve authenticated requests.
- R2 binding: `ASSETS`; create the public image bucket and enable R2 before image upload can be enabled.
- R2 binding: `BACKUPS`; create a **separate private bucket** for customer/appointment backups. Never expose this bucket through a public domain.
- Worker variable: `ASSET_PUBLIC_BASE_URL`; HTTPS base URL of the public R2 custom domain, ending with the bucket's public path. Never put account secrets here.

Worker secrets (never commit these or place them in browser JavaScript):
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`, format `pbkdf2-sha256$iterations$saltHex$derivedKeyHex` (100,000–1,000,000 iterations, 16-byte or larger salt, 32-byte derived key)
- `SESSION_SECRET`, a long random secret
- `ALLOWED_ORIGINS`, exact comma-separated origins only; no wildcard

Provision a fresh Admin identity. Do not reuse an old password or copy secrets from the existing Worker. Password hashes and session secrets must be generated locally and set as Worker secrets.

## Implemented API routes

- `GET /api/health`
- `GET /api/public/site-content`
- `POST /api/appointments`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `PUT /api/admin/site-content`
- `GET /api/admin/appointments`
- `PATCH /api/admin/appointments/:uuid`
- `DELETE /api/admin/appointments/:uuid`
- `GET /api/admin/assets`
- `POST /api/admin/assets` (multipart fields: `file`, `purpose`; purpose is gallery, hero or logo)
- `DELETE /api/admin/assets/:objectKey`
- `GET /api/admin/backups`
- `POST /api/admin/backups` (creates, stores and checksum-verifies a private backup; returns a downloadable JSON snapshot)

## Security and availability notes

- Admin sessions are signed, stored by token hash in D1, expire after eight hours and can be revoked on logout.
- Login throttling is persisted in D1 (per normalized identity and source IP); eight failed attempts in a rolling 15-minute window cause a temporary 429 response.
- Mutations require an exact allowed Origin. Admin writes require a valid session and successful audit write.
- The session cookie is HttpOnly, Secure and SameSite=None because the current GitHub Pages origin and a workers.dev API are cross-site. Some browsers block third-party cookies regardless of SameSite. A same-site API hostname/custom domain is the reliable production arrangement; do not assume cross-site cookie login works until verified on Android Chrome and desktop browsers.
- Image uploads are limited to JPG/PNG/WebP and 8 MB; D1 stores metadata while R2 stores bytes. The public R2 base URL must be HTTPS.
- D1/R2 quotas and provider outages remain possible. Keep independent off-provider backups and test restore; this architecture reduces provider coupling but cannot promise zero downtime.
- The public static site must keep a last-known-good local cache/default rendering path and must not wait for the API to render its shell.

## Cutover gate — not yet satisfied

1. Confirm the exact live UI data contract and replace every Supabase call in the website, booking page and Admin.
2. Implement and test approved-state restore and per-section reset operations against the existing Recovery UI.
3. Build the provider-neutral browser API adapter and new Admin auth adapter; verify all existing controls still work.
4. Export/reconcile approved public content and image references only if needed; user has asked for a new Admin account and no old Supabase records migration. Do not delete the Supabase project.
5. Apply D1 schema + migration to the new D1 database; provision R2, secrets and an API origin.
6. Test login, logout, session expiry/revocation, throttling, save/read-back, booking, appointment update/delete, image upload/delete, backups and restore.
7. Test Android and desktop, API outage fallback, and quota/error behavior.
8. Only after the user explicitly authorizes it: deploy and cut over. Keep rollback instructions and the old Supabase project intact.

The D1 schema setup is a staging-resource change and is complete. No Worker deployment, DNS change, or public website cutover has been made.

## Current provisioning

See [PROVISIONING_STATUS.md](PROVISIONING_STATUS.md) for the latest verified resource state. The D1 base schema and resilience migration are applied. R2 buckets and the new Worker deployment remain pending. The existing `the-ark-admin-auth` Worker has not been changed.
