const SESSION_COOKIE = 'ark_admin_session';
const SESSION_SECONDS = 8 * 60 * 60;
const MAX_BODY_BYTES = 1_000_000;

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extra
    }
  });
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);
}

function requestOriginAllowed(request, env) {
  const origin = request.headers.get('Origin');
  return !!origin && allowedOrigins(env).includes(origin);
}

function responseHeaders(request, env, extra = {}) {
  const headers = new Headers(extra);
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.append('Vary', 'Origin');
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', 'no-store');
  return headers;
}

function withCors(request, env, response) {
  const headers = responseHeaders(request, env, response.headers);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function cookie(value, maxAge) {
  return `${SESSION_COOKIE}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('Invalid hex');
  return new Uint8Array(hex.match(/.{2}/g).map(v => parseInt(v, 16)));
}
function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function unb64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const raw = atob(s);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function equalConstantTime(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}
async function verifyPassword(password, stored) {
  // Format: pbkdf2-sha256$iterations$salt-hex$derived-key-hex
  const parts = String(stored || '').split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) return false;
  const salt = hexToBytes(parts[2]);
  const expected = parts[3].toLowerCase();
  if (salt.length < 16 || !/^(?:[0-9a-f]{2}){32}$/i.test(expected)) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return equalConstantTime(bytesToHex(bits), expected);
}
async function createSession(env, email) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ e: email, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS, n: crypto.randomUUID() })));
  return payload + '.' + b64url(await hmac(env.SESSION_SECRET, payload));
}
async function readSession(request, env) {
  const raw = request.headers.get('Cookie') || '';
  const match = raw.match(/(?:^|;\s*)ark_admin_session=([^;]+)/);
  if (!match || !env.SESSION_SECRET) return null;
  const parts = match[1].split('.');
  if (parts.length !== 2) return null;
  const expected = b64url(await hmac(env.SESSION_SECRET, parts[0]));
  if (!equalConstantTime(expected, parts[1])) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(unb64url(parts[0])));
    if (!payload.e || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    if (payload.e !== env.ADMIN_EMAIL) return null;
    return payload;
  } catch { return null; }
}
async function readJson(request, maxBytes = MAX_BODY_BYTES) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > maxBytes) throw new Error('Request body is too large.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new Error('Request body is too large.');
  return JSON.parse(text);
}
function requireMutationOrigin(request, env) {
  return requestOriginAllowed(request, env);
}
async function requireAdmin(request, env) {
  return readSession(request, env);
}
async function audit(env, actor, action, resource, requestId) {
  try {
    await env.DB.prepare('INSERT INTO audit_events (request_id, actor, action, resource) VALUES (?, ?, ?, ?)')
      .bind(requestId, actor, action, resource).run();
  } catch (error) {
    // Audit failure is intentionally visible in logs; sensitive mutation callers decide whether to fail closed.
    console.error('audit_write_failed', action, resource, String(error));
    throw new Error('Audit record could not be written; operation was not confirmed.');
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      const origin = request.headers.get('Origin');
      if (!origin || !allowedOrigins(env).includes(origin)) return json({ ok: false, error: 'Origin not allowed.' }, 403);
      return new Response(null, { status: 204, headers: responseHeaders(request, env, {
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Request-ID',
        'Access-Control-Max-Age': '600'
      }) });
    }

    if (path === '/api/health' && method === 'GET') {
      return withCors(request, env, json({ ok: true, service: 'the-ark-spa-api', requestId }));
    }
    if (!env.DB) return withCors(request, env, json({ ok: false, error: 'Database binding is not configured.', requestId }, 503));

    if (path === '/api/public/site-content' && method === 'GET') {
      try {
        const row = await env.DB.prepare('SELECT data, updated_at FROM site_content WHERE id = 1').first();
        if (!row) return withCors(request, env, json({ ok: false, error: 'Site content has not been imported yet.', requestId }, 503));
        return withCors(request, env, json({ ok: true, data: JSON.parse(row.data), updatedAt: row.updated_at, requestId }));
      } catch (error) {
        console.error('public_content_read_failed', requestId, String(error));
        return withCors(request, env, json({ ok: false, error: 'Site content is temporarily unavailable.', requestId }, 503));
      }
    }

    if (path === '/api/appointments' && method === 'POST') {
      if (!requireMutationOrigin(request, env)) return withCors(request, env, json({ ok: false, error: 'Origin not allowed.', requestId }, 403));
      try {
        const body = await readJson(request, 20_000);
        const phone = String(body.phone || '').trim();
        const date = String(body.date || '').trim();
        const time = String(body.time || '').trim();
        if (!phone || phone.length > 30 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
          return withCors(request, env, json({ ok: false, error: 'Please provide a valid phone number, date and time.', requestId }, 400));
        }
        const id = crypto.randomUUID();
        await env.DB.prepare(`INSERT INTO appointments
          (id,name,phone,email,service,offer,guests,date,time,final_price,total_amount,status,created_at,updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
          .bind(id, String(body.name || '').slice(0, 200), phone, String(body.email || '').slice(0, 254),
            String(body.service || '').slice(0, 500), String(body.offer || '').slice(0, 500),
            Math.min(20, Math.max(1, Number.parseInt(body.guests || 1, 10) || 1)), date, time,
            String(body.finalPrice || '').slice(0, 100), Number.isFinite(Number(body.totalAmount)) ? Number(body.totalAmount) : null,
            'Pending').run();
        return withCors(request, env, json({ ok: true, id, status: 'Pending', requestId }, 201));
      } catch (error) {
        console.error('appointment_create_failed', requestId, String(error));
        return withCors(request, env, json({ ok: false, error: 'Appointment could not be saved. Please try again.', requestId }, 503));
      }
    }

    if (path === '/api/admin/login' && method === 'POST') {
      if (!requireMutationOrigin(request, env)) return withCors(request, env, json({ ok: false, error: 'Origin not allowed.', requestId }, 403));
      try {
        if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
          return withCors(request, env, json({ ok: false, error: 'Admin login is not configured.', requestId }, 503));
        }
        const body = await readJson(request, 10_000);
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!email || email.length > 254 || !password || password.length > 1024 ||
            !equalConstantTime(email, String(env.ADMIN_EMAIL).toLowerCase()) ||
            !(await verifyPassword(password, env.ADMIN_PASSWORD_HASH))) {
          return withCors(request, env, json({ ok: false, error: 'Invalid admin ID or password.', requestId }, 401));
        }
        const token = await createSession(env, env.ADMIN_EMAIL);
        return withCors(request, env, json({ ok: true, requestId }, 200, { 'Set-Cookie': cookie(token, SESSION_SECONDS) }));
      } catch (error) {
        console.error('admin_login_failed', requestId, String(error));
        return withCors(request, env, json({ ok: false, error: 'Invalid login request.', requestId }, 400));
      }
    }

    if (path === '/api/admin/session' && method === 'GET') {
      const session = await requireAdmin(request, env);
      return withCors(request, env, json(session ? { ok: true, email: session.e, requestId } : { ok: false, requestId }, session ? 200 : 401));
    }

    if (path === '/api/admin/logout' && method === 'POST') {
      if (!requireMutationOrigin(request, env)) return withCors(request, env, json({ ok: false, error: 'Origin not allowed.', requestId }, 403));
      return withCors(request, env, json({ ok: true, requestId }, 200, { 'Set-Cookie': cookie('', 0) }));
    }

    if (path.startsWith('/api/admin/')) {
      const session = await requireAdmin(request, env);
      if (!session) return withCors(request, env, json({ ok: false, error: 'Admin authentication required.', requestId }, 401));
      if (!requireMutationOrigin(request, env) && method !== 'GET') return withCors(request, env, json({ ok: false, error: 'Origin not allowed.', requestId }, 403));

      if (path === '/api/admin/site-content' && method === 'PUT') {
        try {
          const body = await readJson(request);
          const data = body.data;
          if (!data || typeof data !== 'object' || Array.isArray(data)) return withCors(request, env, json({ ok: false, error: 'Site content must be a JSON object.', requestId }, 400));
          const encoded = JSON.stringify(data);
          if (encoded.length > MAX_BODY_BYTES) return withCors(request, env, json({ ok: false, error: 'Site content is too large.', requestId }, 413));
          await env.DB.prepare(`INSERT INTO site_content (id,data,updated_at) VALUES (1,?,strftime('%Y-%m-%dT%H:%M:%fZ','now'))
            ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at`).bind(encoded).run();
          await audit(env, session.e, 'site_content.write', 'site_content:1', requestId);
          return withCors(request, env, json({ ok: true, requestId }));
        } catch (error) {
          console.error('site_content_write_failed', requestId, String(error));
          return withCors(request, env, json({ ok: false, error: 'Site content save could not be verified.', requestId }, 503));
        }
      }

      if (path === '/api/admin/appointments' && method === 'GET') {
        try {
          const status = String(url.searchParams.get('status') || '');
          const limit = Math.min(500, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '100', 10) || 100));
          const result = status
            ? await env.DB.prepare('SELECT * FROM appointments WHERE status = ? ORDER BY created_at DESC LIMIT ?').bind(status, limit).all()
            : await env.DB.prepare('SELECT * FROM appointments ORDER BY created_at DESC LIMIT ?').bind(limit).all();
          return withCors(request, env, json({ ok: true, appointments: result.results || [], requestId }));
        } catch (error) {
          console.error('appointments_list_failed', requestId, String(error));
          return withCors(request, env, json({ ok: false, error: 'Appointments could not be loaded.', requestId }, 503));
        }
      }

      const appointmentMatch = path.match(/^\/api\/admin\/appointments\/([0-9a-f-]{36})$/i);
      if (appointmentMatch && method === 'PATCH') {
        try {
          const body = await readJson(request, 10_000);
          const status = String(body.status || '');
          if (!['Pending','Confirmed','Completed','Cancelled','No-show'].includes(status)) return withCors(request, env, json({ ok: false, error: 'Invalid appointment status.', requestId }, 400));
          const result = await env.DB.prepare(`UPDATE appointments SET status=?,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`).bind(status, appointmentMatch[1]).run();
          if (!result.meta?.changes) return withCors(request, env, json({ ok: false, error: 'Appointment not found.', requestId }, 404));
          await audit(env, session.e, 'appointment.status', appointmentMatch[1], requestId);
          return withCors(request, env, json({ ok: true, requestId }));
        } catch (error) {
          console.error('appointment_update_failed', requestId, String(error));
          return withCors(request, env, json({ ok: false, error: 'Appointment update could not be verified.', requestId }, 503));
        }
      }
    }

    return withCors(request, env, json({ ok: false, error: 'Not found.', requestId }, 404));
  }
};
