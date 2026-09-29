(function(){
if(window.__arkAdminPopupReady)return;window.__arkAdminPopupReady=true;
const style=document.createElement('style');style.textContent=`
#arkSharedAdminLoginModal{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:16px;background:rgba(3,31,22,.72);backdrop-filter:blur(5px)}
#arkSharedAdminLoginModal.hidden{display:none}
#arkSharedAdminLoginModal .ark-admin-window{position:relative;width:min(370px,calc(100vw - 30px));background:#fffdf7;border:1px solid rgba(231,198,107,.62);border-radius:20px;box-shadow:0 25px 70px rgba(0,0,0,.4);overflow:hidden}
#arkSharedAdminLoginModal .head{text-align:center;padding:20px 20px 9px}.ark-admin-logo{width:70px;height:70px;object-fit:contain;display:block;margin:0 auto 8px}
#arkSharedAdminLoginModal .eyebrow{margin:0 0 3px;color:#c99a3a;font:800 9px Arial;letter-spacing:1.7px}
#arkSharedAdminLoginModal h3{margin:0;color:#073f2d;font:700 23px Georgia,serif}.ark-admin-sub{margin:5px 0 13px;color:#607066;font:11px Arial}
#arkSharedAdminLoginModal form{display:grid;gap:9px;padding:0 20px 18px}#arkSharedAdminLoginModal label{display:block;margin:0 0 4px;color:#073f2d;font:800 10px Arial}
#arkSharedAdminLoginModal input{width:100%;box-sizing:border-box;padding:10px 11px;border:1px solid #d8d1c2;border-radius:10px;background:#fff;color:#17392c;font:13px Arial;outline:none}
#arkSharedAdminLoginModal .btn{width:100%;border:0;border-radius:10px;padding:10px 13px;background:linear-gradient(135deg,#c99a3a,#e7c66b);color:#17301f;font:900 12px Arial;cursor:pointer}
#arkSharedAdminLoginModal .msg{min-height:16px;color:#a52c35;font:700 10px Arial;text-align:center}.ark-admin-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border:0;border-radius:50%;background:#fff;color:#073f2d;font-size:21px;cursor:pointer}
`;document.head.appendChild(style);
function mount(){
 if(document.getElementById('adminLoginModal')||document.getElementById('arkSharedAdminLoginModal'))return;
 const m=document.createElement('div');m.id='arkSharedAdminLoginModal';m.className='hidden';m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');
 m.innerHTML=`<div class="ark-admin-window"><button class="ark-admin-close" type="button" aria-label="Close Admin Login">×</button><div class="head"><img class="ark-admin-logo" src="assets/ark-logo-reference.png" alt="The Ark Spa & Salon"><p class="eyebrow">THE ARK · ADMIN CENTER</p><h3>Secure Admin Login</h3><p class="ark-admin-sub">Sign in to manage The Ark Spa & Salon.</p></div><form><div><label>Admin ID</label><input id="arkSharedAdminId" type="text" autocomplete="username" required></div><div><label>Password</label><input id="arkSharedAdminPass" type="password" autocomplete="current-password" required></div><button class="btn" type="submit">Login to Admin</button><div class="msg" role="alert"></div></form></div>`;
 document.body.appendChild(m);const form=m.querySelector('form'),id=m.querySelector('#arkSharedAdminId'),pass=m.querySelector('#arkSharedAdminPass'),msg=m.querySelector('.msg'),btn=m.querySelector('.btn');
 const close=()=>{m.classList.add('hidden');document.body.style.removeProperty('overflow');msg.textContent='';pass.value=''};
 window.openAdminLogin=()=>{m.classList.remove('hidden');document.body.style.overflow='hidden';id.focus()};
 window.closeAdminLogin=close;m.querySelector('.ark-admin-close').onclick=close;m.onclick=e=>{if(e.target===m)close()};
 form.onsubmit=async e=>{e.preventDefault();msg.textContent='';btn.disabled=true;btn.textContent='Signing in…';try{if(!window.adminAuth)throw new Error('Admin authentication is not ready. Please refresh.');const raw=id.value.trim(),email=raw.toLowerCase()==='admin'?'admin@thearkspa.com':raw;const result=await window.adminAuth.signInWithEmailAndPassword(email,pass.value);if(!result?.user)throw new Error('Login completed without an active admin session.');window.location.replace('admin.html?v=20260929-auth-final')}catch(err){msg.textContent=err?.message||'Login failed.';btn.disabled=false;btn.textContent='Login to Admin';pass.value=''}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.classList.contains('hidden'))close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();