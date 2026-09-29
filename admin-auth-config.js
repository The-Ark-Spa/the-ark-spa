// The Ark Spa & Salon — Supabase Auth adapter.
(function(){
  // Single approved admin identity. Database RLS enforces the same identity server-side.
  const ADMIN_USER_ID='809dec37-2df0-4ff3-b47a-aeaca12b1c00';

  function getClient(){
    if(!window.supabaseClient||!window.supabaseClient.auth){
      throw new Error('Supabase Auth is not ready. Please refresh the page.');
    }
    return window.supabaseClient;
  }

  function isAdminUser(user){
    return !!user&&String(user.id||'')===ADMIN_USER_ID;
  }

  async function getVerifiedUser(){
    const client=getClient();
    const {data,error}=await client.auth.getUser();
    if(error)throw error;
    return data&&data.user?data.user:null;
  }

  async function requireAdmin(){
    const user=await getVerifiedUser();
    if(!isAdminUser(user)){
      try{await getClient().auth.signOut({scope:'local'});}catch(e){}
      throw new Error('This account is not authorized for The Ark Admin Panel.');
    }
    return user;
  }

  window.adminAuth={
    ADMIN_USER_ID,

    async setPersistence(){
      const client=getClient();
      // Persistence/refresh are configured explicitly in supabase-config.js.
      if(!client.auth)throw new Error('Supabase Auth is unavailable.');
      return true;
    },

    async signInWithEmailAndPassword(email,password){
      const client=getClient();
      const cleanEmail=String(email||'').trim();
      if(!cleanEmail||!password)throw new Error('Enter the admin email and password.');

      const {data,error}=await client.auth.signInWithPassword({
        email:cleanEmail,
        password:String(password)
      });
      if(error)throw error;
      if(!data||!data.session||!data.user){
        throw new Error('Supabase login did not return an active session.');
      }

      if(!isAdminUser(data.user)){
        try{await client.auth.signOut({scope:'local'});}catch(e){}
        throw new Error('This account is not authorized for The Ark Admin Panel.');
      }

      // Confirm the identity against the Auth service before granting UI access.
      const verified=await getVerifiedUser();
      if(!isAdminUser(verified)){
        try{await client.auth.signOut({scope:'local'});}catch(e){}
        throw new Error('Admin identity verification failed. Please sign in again.');
      }

      return {user:verified,session:data.session};
    },

    async getCurrentAdmin(){
      try{return await requireAdmin();}catch(e){
        return null;
      }
    },

    async signOut(){
      const {error}=await getClient().auth.signOut();
      if(error)throw error;
    },

    onAuthStateChanged(cb){
      const client=getClient();
      let active=true;
      let lastUserId=null;
      let initialized=false;

      const deliver=(event,session)=>{
        if(!active)return;
        const user=session&&session.user?session.user:null;

        // A refresh can emit intermediate auth events while the persisted
        // session is being restored. Only an explicit SIGNED_OUT event may
        // clear an already-authorized admin session.
        if(!user){
          if(event==='SIGNED_OUT'){
            lastUserId=null;
            initialized=true;
            cb(null);
          }else if(!initialized){
            initialized=true;
            cb(null);
          }
          return;
        }

        const userId=String(user.id||'');
        if(userId!==ADMIN_USER_ID){
          lastUserId=null;
          initialized=true;
          cb(null);
          setTimeout(()=>client.auth.signOut({scope:'local'}).catch(()=>{}),0);
          return;
        }

        initialized=true;
        if(lastUserId===userId)return;
        lastUserId=userId;
        cb(user);
      };

      const {data}=client.auth.onAuthStateChange((event,session)=>{
        setTimeout(()=>deliver(event,session),0);
      });

      return ()=>{
        active=false;
        if(data&&data.subscription)data.subscription.unsubscribe();
      };
    }
  };

  // Defensive login bootstrap: keeps the browser form from performing a native
  // page reload if another inline admin script fails before its own bind() runs.
  document.addEventListener('DOMContentLoaded',()=>{
    const form=document.getElementById('loginForm');
    const emailEl=document.getElementById('email');
    const passwordEl=document.getElementById('password');
    const msg=document.getElementById('loginMsg');
    const loginScreen=document.getElementById('loginScreen');
    const dashboard=document.getElementById('dashboard');
    if(!form||!emailEl||!passwordEl)return;

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      if(msg){msg.classList.add('hidden');msg.textContent='';}

      const rawId=String(emailEl.value||'').trim();
      const password=String(passwordEl.value||'');
      const email=rawId.toLowerCase()==='admin'?'admin@thearkspa.com':rawId;

      try{
        if(!email||!password)throw new Error('Enter the admin email and password.');
        const result=await window.adminAuth.signInWithEmailAndPassword(email,password);
        if(!result||!result.user)throw new Error('Login completed without an admin session.');

        if(loginScreen)loginScreen.classList.add('hidden');
        if(dashboard)dashboard.classList.remove('hidden');

        if(typeof window.resetAdminView==='function')window.resetAdminView();
        if(typeof window.startDashboard==='function')await window.startDashboard();
      }catch(error){
        if(msg){
          msg.textContent=error&&error.message?error.message:'Login failed. Please check the Admin Email and Password.';
          msg.classList.remove('hidden');
        }
        passwordEl.value='';
        console.error('Admin login failed:',error);
      }
    },true);
  });
})();