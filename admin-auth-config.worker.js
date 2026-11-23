// The Ark Spa — independent Worker-backed Admin authentication adapter.
// This file is staged separately; switch admin.html to it only after the Worker is deployed and verified.
(function(){
  async function call(path, options = {}) {
    if (!window.arkApi) throw new Error('The Ark API client is not loaded.');
    return window.arkApi.request(path, options);
  }
  function asUser(email) {
    return email ? { id: String(email).toLowerCase(), email: String(email).toLowerCase() } : null;
  }
  window.adminAuth = {
    async setPersistence() { return true; },
    async signInWithEmailAndPassword(email, password) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !password) throw new Error('Enter the admin email and password.');
      await call('/api/admin/login', { method: 'POST', body: { email: cleanEmail, password: String(password) } });
      const verified = await call('/api/admin/session');
      if (!verified.ok || !verified.email) throw new Error('Admin session verification failed.');
      const user = asUser(verified.email);
      window.dispatchEvent(new CustomEvent('ark-admin-auth-changed', { detail: user }));
      return { user, session: { expiresIn: 8 * 60 * 60 } };
    },
    async getCurrentAdmin() {
      try {
        const result = await call('/api/admin/session');
        return result.ok ? asUser(result.email) : null;
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    async signOut() {
      await call('/api/admin/logout', { method: 'POST', body: {} });
      window.dispatchEvent(new CustomEvent('ark-admin-auth-changed', { detail: null }));
    },
    onAuthStateChanged(callback) {
      let active = true;
      const deliver = user => { if (active) callback(user); };
      const listener = event => deliver(event.detail || null);
      window.addEventListener('ark-admin-auth-changed', listener);
      this.getCurrentAdmin().then(deliver).catch(() => deliver(null));
      return () => {
        active = false;
        window.removeEventListener('ark-admin-auth-changed', listener);
      };
    }
  };
})();