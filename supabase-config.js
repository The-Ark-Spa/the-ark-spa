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

