# The Ark Spa API — lightweight backend

This backend uses Cloudflare Worker + the existing D1 database. It does not require R2, Supabase, a separate object-storage subscription, or a paid storage add-on.

## Components

- Worker API: login/session, public site content, appointments, admin edits.
- D1: site content, appointments, sessions, audit history, uploaded-image metadata and small JSON backup snapshots.
- Existing GitHub repository: public website images uploaded by Admin are committed under `uploads/ark/{gallery|hero|logo}/{year}/`. The Worker keeps the GitHub token server-side and serves images from the repository's raw content URL.
- GitHub Pages: continues hosting the static website.

## Configuration

D1 binding: `DB`, database `thearkspadata`.

Worker vars: `GITHUB_OWNER=The-Ark-Spa`, `GITHUB_REPO=the-ark-spa`, `GITHUB_BRANCH=main`.

Worker secrets (never commit these):
- `GITHUB_TOKEN`: fine-grained GitHub token restricted to this repository, Contents read/write only.
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`: `pbkdf2-sha256$iterations$saltHex$derivedKeyHex`.
- `SESSION_SECRET`: long random secret.
- `ALLOWED_ORIGINS`: exact origin `https://the-ark-spa.github.io`.

## Image handling

Uploads accept JPG/PNG/WebP up to 8 MB. The Worker commits the image to the repository's `uploads/` directory using the GitHub Contents API. Public reads are served from raw.githubusercontent.com. Existing `assets/` files remain untouched. Deletion removes only the selected uploaded file and its D1 metadata. GitHub repository storage is public; only upload public website images here. Never put customer information or backups in GitHub.

GitHub API rate limits and repository size apply. For this small brochure website this avoids an extra storage service, but uploads create Git commits and should be used only for website images.

## Backups

A small JSON snapshot (site content and appointments) is stored in D1 with a checksum and read-back verification. The API returns the JSON snapshot for download. D1 is not a replacement for an independent disaster-recovery copy; download periodic exports and keep them separately. No private backup object bucket is used.

## API

- `GET /api/health`
- `GET /api/public/site-content`
- `POST /api/appointments`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `PUT /api/admin/site-content`
- `GET /api/admin/appointments`
- `PATCH/DELETE /api/admin/appointments/:uuid`
- `GET/POST /api/admin/assets`
- `DELETE /api/admin/assets/:objectKey`
- `GET/POST /api/admin/backups`

## Rollout gate

Do not switch the live HTML until the Worker is deployed, secrets are configured, health/login/content/booking/admin/image/backup flows pass, and Android + desktop checks pass. Keep original Supabase-connected HTML and the Supabase project available for rollback. No live website cutover is performed by this source update alone.
