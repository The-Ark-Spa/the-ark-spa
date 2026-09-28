// The Ark Spa & Salon — single-cloud backend (Supabase)
const SUPABASE_URL='https://nxgbwfxnnfghlyehmlkv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_2ikgNJ5MCBd3VU2HlEUm6A_YE8cesBO';
window.firebaseReady=true;
window.firebaseConfig={projectId:'nxgbwfxnnfghlyehmlkv'};
window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
function makeSnap(value){return {exists:()=>value!==null&&value!==undefined,val:()=>value}}
function makeRef(path){
 path=String(path||'').replace(/^\/+|\/+$/g,'');
 return {
  async once(){
   if(path==='siteContent'||path.startsWith('siteContent/')){
    const {data,error}=await window.supabaseClient.from('site_content').select('data').eq('id',true).maybeSingle();if(error)throw error;
    let v=data?.data||null;if(path!=='siteContent'){for(const k of path.slice(12).split('/').filter(Boolean))v=v==null?null:v[k]}return makeSnap(v)
   }
   if(path==='appointments'){const {data,error}=await window.supabaseClient.from('appointments').select('*').order('created_at',{ascending:false});if(error)throw error;const obj={};(data||[]).forEach(x=>obj[x.id]=x);return makeSnap(obj)}
   return makeSnap(null)
  },
  async update(patch){
   const {data:row,error:e}=await window.supabaseClient.from('site_content').select('data').eq('id',true).single();if(e)throw e;
   const root=JSON.parse(JSON.stringify(row.data||{}));
   if(path==='siteContent')Object.assign(root,patch);else{const key=path.slice(12).split('/').filter(Boolean);let cur=root;for(let i=0;i<key.length-1;i++){cur[key[i]]=cur[key[i]]&&typeof cur[key[i]]==='object'?cur[key[i]]:{};cur=cur[key[i]]}if(key.length)cur[key[key.length-1]]=patch}
   const {error}=await window.supabaseClient.from('site_content').update({data:root,updated_at:new Date().toISOString()}).eq('id',true);if(error)throw error;
  },
  async set(value){return this.update(value)},
  push(){return {async set(value){const {error}=await window.supabaseClient.from('appointments').insert(value);if(error)throw error}}},
  orderByChild(){return this}
 }
}
window.db={ref:makeRef};
window.storage={ref(){return {child(path){return {async delete(){const {error}=await window.supabaseClient.storage.from('ark-gallery').remove([String(path)]);if(error)throw error}}}}},refFromURL(){return null}};
