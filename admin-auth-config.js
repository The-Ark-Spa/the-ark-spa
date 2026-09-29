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
      let lastUserId='';

      const deliver=async user=>{
        if(!active)return;
        if(!user){
          lastUserId='';
          cb(null);
          return;
        }

        if(lastUserId===String(user.id||''))return;
        lastUserId=String(user.id||'');

        try{
          const verified=await getVerifiedUser();
          if(!isAdminUser(verified)){
            try{await client.auth.signOut({scope:'local'});}catch(e){}
            lastUserId='';
            if(active)cb(null);
            return;
          }
          if(active)cb(verified);
        }catch(e){
          console.warn('Admin identity verification failed:',e);
          try{await client.auth.signOut({scope:'local'});}catch(err){}
          lastUserId='';
          if(active)cb(null);
        }
      };

      client.auth.getSession().then(({data,error})=>{
        if(!active)return;
        if(error){
          console.warn('Supabase session check failed:',error);
          deliver(null);
          return;
        }
        deliver(data&&data.session?data.session.user:null);
      }).catch(error=>{
        if(active){
          console.warn('Supabase session check failed:',error);
          deliver(null);
        }
      });

      const {data}=client.auth.onAuthStateChange((_event,session)=>{
        if(!session){
          lastUserId='';
          deliver(null);
          return;
        }
        deliver(session.user);
      });

      return ()=>{
        active=false;
        if(data&&data.subscription)data.subscription.unsubscribe();
      };
    }
  };
})();