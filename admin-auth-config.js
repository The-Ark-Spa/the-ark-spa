// The Ark Spa & Salon — Supabase Auth adapter.
(function(){
  function getClient(){
    if(!window.supabaseClient||!window.supabaseClient.auth){
      throw new Error('Supabase Auth is not ready. Please refresh the page.');
    }
    return window.supabaseClient;
  }

  window.adminAuth={
    async setPersistence(){
      getClient();
      return true;
    },

    async signInWithEmailAndPassword(email,password){
      const client=getClient();
      const cleanEmail=String(email||'').trim();
      if(!cleanEmail||!password) throw new Error('Enter the admin email and password.');
      const {data,error}=await client.auth.signInWithPassword({email:cleanEmail,password:String(password)});
      if(error) throw error;
      if(!data||!data.session||!data.user) throw new Error('Supabase login did not return an active session.');
      return {user:data.user,session:data.session};
    },

    async signOut(){
      const {error}=await getClient().auth.signOut();
      if(error) throw error;
    },

    onAuthStateChanged(cb){
      const client=getClient();
      let active=true;
      const deliver=user=>{if(active) cb(user||null);};

      client.auth.getSession().then(({data,error})=>{
        if(!active) return;
        if(error){console.warn('Supabase session check failed:',error);deliver(null);return;}
        deliver(data&&data.session?data.session.user:null);
      }).catch(error=>{
        if(active){console.warn('Supabase session check failed:',error);deliver(null);}
      });

      const {data}=client.auth.onAuthStateChange((_event,session)=>{
        deliver(session?session.user:null);
      });

      return ()=>{
        active=false;
        if(data&&data.subscription) data.subscription.unsubscribe();
      };
    }
  };
})();