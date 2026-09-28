# The Ark Spa & Salon — Direct Admin Login

This branch replaces Firebase Authentication for the Admin Login with a server-side Cloudflare Worker session.

## Required Cloudflare secrets

Create these Worker secrets:

- `ADMIN_EMAIL` — the Admin ID/email you want to use.
- `ADMIN_PASSWORD` — the new Admin password.
- `SESSION_SECRET` — a long random secret (at least 32 random characters).

Do not put any of these values in GitHub or in frontend JavaScript.

## Route

Attach the Worker to the same website origin at:

`/api/admin/*`

The Admin page calls:

- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`

The session is an HttpOnly, Secure cookie, so the password is not stored in the browser.

## Important

Firebase Realtime Database remains the project's current database.

Cloudinary remains the project's media storage for Gallery/Hero/Logo.

Firebase Authentication is no longer used by `admin.html`.

Before merging this branch into `main`, deploy the Worker and confirm that `/api/admin/session` is reachable from the live website origin.