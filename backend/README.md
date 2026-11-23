# The Ark Spa API — migration/staging backend

This is the independent backend being built to replace the Supabase dependency. The public website and Admin UI are **not cut over yet**. Do not deploy or disable the existing integration until the frontend adapter, data import, authentication, storage and end-to-end checks are complete.

## Components

- `worker.js`: public content read, appointment intake, admin authentication/session, content writes, appointment management, asset metadata and R2 image upload/delete.
- `schema.sql`: readable baseline schema reference.
- `migrations/0001_initial_schema.sql`: tracked initial D1 schema applied by Wrangler.
- `migrations/0002_resilience.sql`: persistent login throttling, revocable sessions, backup inventory, R2 object metadata, idempotency storage and content revisions.
- `migrations/0003_appointment_details.sql`: per-person therapy, offer, duration and rate fields required by the existing multi-guest booking UI.
- `wrangler.toml.example` and `wrangler.toml`: D1/R2 binding configuration; the deployment config is ready but bindings cannot be activated until R2 is enabled and both buckets exist.

## Required resources and configuration

- D1 binding: `DB`; database must have `schema.sql` and all migrations through `0003_appointment_details.sql` applied before this Worker version can serve authenticated requests.
- R2 binding: `ASSETS`; create the private image bucket. Public images are served through the Worker `/assets/*` route; do not expose the bucket itself.
- R2 binding: `BACKUPS`; create a **separate private bucket** for customer/appointment backups. Never expose this bucket through a public domain.
- Worker variable: `ASSET_PUBLIC_BASE_URL`; set to `https://the-ark-spa-api.bundela-ar143.workers.dev/assets/` for the current Worker origin. Never put account secrets here.

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
- Login returns a signed, revocable bearer token held only in tab-scoped `sessionStorage`; API requests send it in the Authorization header. This avoids relying on third-party cookies between GitHub Pages and workers.dev. The server also sets an HttpOnly cookie as a fallback. Origin allowlisting and server-side session revocation remain enforced. XSS prevention remains important because the browser must hold the bearer token.
- Image uploads are limited to JPG/PNG/WebP and 8 MB; D1 stores metadata while R2 stores bytes. The public R2 base URL must be HTTPS.
- D1/R2 quotas and provider outages remain possible. Keep independent off-provider backups and test restore; this architecture reduces provider coupling but cannot promise zero downtime.
- The public static site must keep a last-known-good local cache/default rendering path and must not wait for the API to render its shell.

## Cutover gate — not yet satisfied

1. The staged frontend pages and adapters are built; their inline JavaScript syntax checks pass and staged pages contain no Supabase references. Original live pages remain untouched.
2. Existing Recovery actions (approved rates/offers/gallery resets and approved-state restore) save through the new API adapter; private server backup creation and checksum verification are implemented. Importing arbitrary backup files is not part of the current Recovery UI.
3. D1 schema and migrations are applied; approved default content is seeded and verified. No legacy Supabase records are migrated, as requested.
4. Enable R2 and create the two configured private buckets, then set Worker secrets for the fresh Admin identity.
5. Deploy the Worker and test login, logout, session expiry/revocation, throttling, save/read-back, booking, appointment update/delete, image upload/delete, backups and Recovery actions.
6. Test Android and desktop, API outage fallback, and quota/error behavior.
7. Promote the staged HTML pages to the live filenames only after those tests pass; keep the old Supabase project and original HTML files available for rollback.

The D1 schema setup and default content seed are complete. No Worker deployment, DNS change, or public website cutover has been made.

## Current provisioning

See [PROVISIONING_STATUS.md](PROVISIONING_STATUS.md) for the latest verified resource state. The D1 base schema and resilience migration are applied. R2 buckets and the new Worker deployment remain pending. The existing `the-ark-admin-auth` Worker has not been changed.
