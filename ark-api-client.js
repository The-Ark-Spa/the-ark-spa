// The Ark Spa API client. Kept separate from the UI so the backend origin can be changed without rewriting features.
(function(){
  const base = String(window.ARK_API_BASE || '').replace(/\/+$/, '');
  async function request(path, options = {}) {
    if (!base) throw new Error('The Ark API endpoint is not configured.');
    const headers = new Headers(options.headers || {});
    const init = { ...options, credentials: 'include', headers };
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
      headers.set('Content-Type', 'application/json');
      init.body = JSON.stringify(options.body);
    }
    const response = await fetch(base + path, init);
    const raw = await response.text();
    let payload = {};
    try { payload = raw ? JSON.parse(raw) : {}; } catch { throw new Error('The Ark API returned an unreadable response.'); }
    if (!response.ok || payload.ok === false) {
      const error = new Error(payload.error || ('The Ark API request failed (' + response.status + ').'));
      error.status = response.status;
      error.requestId = payload.requestId || '';
      throw error;
    }
    return payload;
  }
  window.arkApi = {
    base,
    request,
    getPublicContent: () => request('/api/public/site-content'),
    saveContent: (data, expectedUpdatedAt) => request('/api/admin/site-content', { method: 'PUT', body: { data, expectedUpdatedAt } }),
    createAppointment: data => { const key = data.requestId || crypto.randomUUID(); data.requestId = key; return request('/api/appointments', { method: 'POST', body: data, headers: { 'Idempotency-Key': key } }); },
    listAppointments: (query = '') => request('/api/admin/appointments' + query),
    updateAppointment: (id, status) => request('/api/admin/appointments/' + encodeURIComponent(id), { method: 'PATCH', body: { status } }),
    deleteAppointment: id => request('/api/admin/appointments/' + encodeURIComponent(id), { method: 'DELETE' }),
    listAssets: () => request('/api/admin/assets'),
    listBackups: () => request('/api/admin/backups'),
    createBackup: () => request('/api/admin/backups', { method: 'POST', body: {} }),
    uploadAsset: async (file, purpose) => {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', purpose);
      return request('/api/admin/assets', { method: 'POST', body: form });
    },
    deleteAsset: key => request('/api/admin/assets/' + key.split('/').map(encodeURIComponent).join('%2F'), { method: 'DELETE' })
  };
})();