# The Ark Spa API — simple D1 backend

This backend uses Cloudflare Worker + the existing D1 database only. It does not require R2, GitHub write tokens, Supabase, a separate object-storage subscription, or a paid storage add-on.

## Components

- Worker API: login/session, public site content, appointments and Admin edits.
- D1: site content, appointments, sessions, audit history, uploaded public website images and small JSON backup snapshots.
- GitHub Pages: continues hosting the static website and existing assets.

## Configuration

D1 binding: `DB`, database `thearkspadata`.

Worker configuration: `ADMIN_EMAIL=admin@thearkspa.com`, `ALLOWED_ORIGINS=https://the-ark-spa.github.io`.

Worker secret (never commit): `SESSION_SECRET`.

The Admin password hash is created by the one-time `/api/admin/bootstrap` endpoint and stored in the private D1 `admin_credentials` table using PBKDF2-SHA-256. The endpoint requires the `ADMIN_SETUP_CODE` Worker secret and permanently closes after the first Admin account is created. A setup form is staged at `admin-setup.worker.html`.

## Images

Admin uploads JPG/PNG/WebP images up to 1 MB. Image bytes and metadata are stored in D1 and served by the Worker `/assets/*` route. Existing `assets/` files remain untouched. No separate storage product or token is needed. Keep uploads optimized for the small brochure website; D1 has quotas and per-row size limits.

## Backups

A small JSON snapshot (site content and appointments) is stored in D1 with SHA-256 checksum and read-back verification. The API returns the snapshot for download. Download periodic exports and keep an independent copy. D1 is not a substitute for an off-provider disaster-recovery copy.

## API

- `GET /api/health`
- `GET /api/public/site-content`
- `POST /api/appointments`
- `POST /api/admin/bootstrap` (one time only)
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `PUT /api/admin/site-content`
- `GET /api/admin/appointments`
- `PATCH/DELETE /api/admin/appointments/:uuid`
- `GET/POST /api/admin/assets`
- `DELETE /api/admin/assets/:objectKey`
- `GET/POST /api/admin/backups`

## Rollout

Do not switch live HTML until migration `0004_d1_backups.sql` is applied, Worker secrets are set, Worker is deployed, and health/login/content/booking/Admin/image/backup flows pass on Android and desktop. Keep original Supabase-connected HTML and Supabase project for rollback.
