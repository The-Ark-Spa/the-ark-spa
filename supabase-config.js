// The Ark Spa & Salon — Supabase-only backend
const SUPABASE_URL='https://nxgbwfxnnfghlyehmlkv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_2ikgNJ5MCBd3VU2HlEUm6A_YE8cesBO';

window.supabaseReady=true;
window.supabaseConfig={projectId:'nxgbwfxnnfghlyehmlkv'};
window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
  auth:{
    persistSession:true,
    autoRefreshToken:true,
    detectSessionInUrl:false
  }
});

function makeSnap(value){
  return {
    exists:()=>value!==null&&value!==undefined,
    val:()=>value,
    forEach:(cb)=>{
      if(value&&typeof value==='object'){
        Object.keys(value).forEach(k=>cb({key:k,val:()=>value[k]}));
      }
    }
  };
}

function normalizePath(path){
  return String(path||'').replace(/^\/+|\/+$/g,'');
}

function nestedGet(root,parts){
  let v=root;
  for(const k of parts){
    if(v===null||v===undefined)return null;
    v=v[k];
  }
  return v;
}

function nestedSet(root,parts,value){
  if(!parts.length)return value;
  let cur=root;
  for(let i=0;i<parts.length-1;i++){
    const k=parts[i];
    if(!cur[k]||typeof cur[k]!=='object'||Array.isArray(cur[k]))cur[k]={};
    cur=cur[k];
  }
  cur[parts[parts.length-1]]=value;
  return root;
}

function makeRef(path){
  path=normalizePath(path);
  const parts=path.split('/').filter(Boolean);
  let channel=null;

  const api={
    async once(){
      if(path==='siteContent'||path.startsWith('siteContent/')){
        const {data,error}=await window.supabaseClient
          .from('site_content')
          .select('data')
          .eq('id',true)
          .maybeSingle();
        if(error)throw error;
        const value=path==='siteContent'
          ?data?.data??null
          :nestedGet(data?.data||{},parts.slice(1));
        return makeSnap(value);
      }

      if(path==='appointments'||path.startsWith('appointments/')){
        if(path==='appointments'){
          const {data,error}=await window.supabaseClient
            .from('appointments')
            .select('*')
            .order('created_at',{ascending:false});
          if(error)throw error;
          const obj={};
          (data||[]).forEach(row=>obj[row.id]=row);
          return makeSnap(obj);
        }

        const {data,error}=await window.supabaseClient
          .from('appointments')
          .select('*')
          .eq('id',parts[1])
          .maybeSingle();
        if(error)throw error;
        return makeSnap(data);
      }

      return makeSnap(null);
    },

    async update(patch){
      if(path==='siteContent'||path.startsWith('siteContent/')){
        const {data:row,error:e}=await window.supabaseClient
          .from('site_content')
          .select('data')
          .eq('id',true)
          .single();
        if(e)throw e;

        let root=JSON.parse(JSON.stringify(row.data||{}));
        root=path==='siteContent'
          ?Object.assign(root,patch)
          :nestedSet(root,parts.slice(1),patch);

        const {error}=await window.supabaseClient
          .from('site_content')
          .update({data:root,updated_at:new Date().toISOString()})
          .eq('id',true);
        if(error)throw error;
        return;
      }

      if(path.startsWith('appointments/')){
        const {error}=await window.supabaseClient
          .from('appointments')
          .update(patch)
          .eq('id',parts[1]);
        if(error)throw error;
        return;
      }

      throw new Error('Unsupported Supabase update path: '+path);
    },

    async set(value){
      if(path==='siteContent'||path.startsWith('siteContent/'))return api.update(value);

      if(path.startsWith('appointments/')){
        const {error}=await window.supabaseClient
          .from('appointments')
          .update(value)
          .eq('id',parts[1]);
        if(error)throw error;
        return;
      }

      throw new Error('Unsupported Supabase set path: '+path);
    },

    async remove(){
      if(path==='siteContent'||path.startsWith('siteContent/')){
        const {data:row,error:e}=await window.supabaseClient
          .from('site_content')
          .select('data')
          .eq('id',true)
          .single();
        if(e)throw e;

        const root=JSON.parse(JSON.stringify(row.data||{}));
        if(path==='siteContent')Object.keys(root).forEach(k=>delete root[k]);
        else nestedSet(root,parts.slice(1),null);

        const {error}=await window.supabaseClient
          .from('site_content')
          .update({data:root,updated_at:new Date().toISOString()})
          .eq('id',true);
        if(error)throw error;
        return;
      }

      if(path.startsWith('appointments/')){
        const {error}=await window.supabaseClient
          .from('appointments')
          .delete()
          .eq('id',parts[1]);
        if(error)throw error;
        return;
      }

      throw new Error('Unsupported Supabase remove path: '+path);
    },

    push(){
      return {
        async set(value){
          const {error}=await window.supabaseClient
            .from('appointments')
            .insert(value);
          if(error)throw error;
        }
      };
    },

    orderByChild(){return api},

    on(event,callback,errorCallback){
      if(event!=='value')throw new Error('Only value subscriptions are supported.');

      const emit=async()=>{
        try{
          callback(await api.once());
        }catch(e){
          if(errorCallback)errorCallback(e);
          else console.warn('Supabase realtime read failed:',e);
        }
      };

      emit();

      const table=path.startsWith('appointments')?'appointments':'site_content';
      channel=window.supabaseClient
        .channel('ark-live-'+table+'-'+Math.random().toString(36).slice(2))
        .on('postgres_changes',{event:'*',schema:'public',table},emit)
        .subscribe(status=>{
          if(status==='CHANNEL_ERROR'&&errorCallback){
            errorCallback(new Error('Supabase Realtime channel error'));
          }
        });

      return callback;
    },

    off(){
      if(channel){
        window.supabaseClient.removeChannel(channel);
        channel=null;
      }
    }
  };

  return api;
}

window.db={ref:makeRef};

window.storage={
  ref(){
    return {
      child(path){
        return {
          async delete(){
            const {error}=await window.supabaseClient
              .storage
              .from('ark-gallery')
              .remove([String(path)]);
            if(error)throw error;
          }
        };
      }
    };
  },
  refFromURL(){return null;}
};