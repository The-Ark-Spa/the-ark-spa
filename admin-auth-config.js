// The Ark Spa & Salon — Supabase Auth adapter. No Firebase dependency.
window.adminAuth={
 async setPersistence(){return true},
 async signInWithEmailAndPassword(email,password){const r=await window.supabaseClient.auth.signInWithPassword({email,password});if(r.error)throw r.error;return {user:r.data.user}},
 async signOut(){const r=await window.supabaseClient.auth.signOut();if(r.error)throw r.error},
 onAuthStateChanged(cb){let active=true;window.supabaseClient.auth.getSession().then(({data})=>{if(active)cb(data.session?.user||null)});const {data}=window.supabaseClient.auth.onAuthStateChange((_e,s)=>{if(active)cb(s?.user||null)});return ()=>{active=false;data.subscription.unsubscribe()} }
};
window.firebase={auth:{Auth:{Persistence:{LOCAL:'LOCAL'}}}};
