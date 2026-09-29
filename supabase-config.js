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

