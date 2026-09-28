const COOKIE_NAME='ark_admin_session';
const SESSION_TTL=8*60*60;

function b64u(bytes){
  let s='';
  const a=new Uint8Array(bytes);
  for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64uDecode(s){
  s=s.replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const bin=atob(s),out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
  return out;
}
function timingSafeEqual(a,b){
  if(a.length!==b.length)return false;
  let x=0;
  for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);
  return x===0;
}
async function hmac(secret,data){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(data)));
}
async function createSession(env,email){
  const payload=b64u(new TextEncoder().encode(JSON.stringify({e:email,exp:Math.floor(Date.now()/1000)+SESSION_TTL})));
  const sig=b64u(await hmac(env.SESSION_SECRET,payload));
  return payload+'.'+sig;
}
async function readSession(request,env){
  const raw=request.headers.get('Cookie')||'';
  const match=raw.match(new RegExp('(?:^|;\\s*)'+COOKIE_NAME+'=([^;]+)'));
  if(!match||!env.SESSION_SECRET)return null;
  const token=match[1],parts=token.split('.');
  if(parts.length!==2)return null;
  const expected=b64u(await hmac(env.SESSION_SECRET,parts[0]));
  if(!timingSafeEqual(expected,parts[1]))return null;
  try{
    const data=JSON.parse(new TextDecoder().decode(b64uDecode(parts[0])));
    if(!data.e||!data.exp||data.exp<=Math.floor(Date.now()/1000))return null;
    return data;
  }catch(_){return null}
}
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}
function cors(request,headers){
  const origin=request.headers.get('Origin');
  if(origin)headers.set('Access-Control-Allow-Origin',origin);
  headers.set('Access-Control-Allow-Credentials','true');
  headers.set('Vary','Origin');
  return headers;
}
function cookie(value,maxAge){
  return COOKIE_NAME+'='+value+'; Max-Age='+maxAge+'; Path=/; HttpOnly; Secure; SameSite=Lax';
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(!url.pathname.startsWith('/api/admin/'))return new Response('Not Found',{status:404});
    if(request.method==='OPTIONS'){
      const h=cors(request,new Headers());
      h.set('Access-Control-Allow-Methods','POST,GET,OPTIONS');
      h.set('Access-Control-Allow-Headers','Content-Type');
      return new Response(null,{status:204,headers:h});
    }
    const headers=cors(request,new Headers());

    if(request.method==='POST'&&url.pathname==='/api/admin/login'){
      try{
        const body=await request.json();
        const email=String(body?.email||'').trim();
        const password=String(body?.password||'');
        if(!env.ADMIN_EMAIL||!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return json({ok:false,error:'Admin login service is not configured.'},503);
        if(!email||!password||!timingSafeEqual(email,env.ADMIN_EMAIL)||!timingSafeEqual(password,env.ADMIN_PASSWORD)){
          return json({ok:false,error:'Invalid admin ID or password.'},401);
        }
        const token=await createSession(env,email);
        headers.set('Set-Cookie',cookie(token,SESSION_TTL));
        headers.set('cache-control','no-store');
        return new Response(JSON.stringify({ok:true}),{status:200,headers});
      }catch(_){return json({ok:false,error:'Invalid login request.'},400)}
    }

    if(request.method==='GET'&&url.pathname==='/api/admin/session'){
      const session=await readSession(request,env);
      return json(session?{ok:true,email:session.e}:{ok:false},session?200:401);
    }

    if(request.method==='POST'&&url.pathname==='/api/admin/logout'){
      headers.set('Set-Cookie',cookie('',0));
      return new Response(JSON.stringify({ok:true}),{status:200,headers});
    }

    return json({ok:false,error:'Not found.'},404);
  }
};
