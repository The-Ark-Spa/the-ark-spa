(function(){
  'use strict';

  const PANELS={main:'mainPanel',appointments:'appointmentsPanel',recovery:'recoveryPanel'};
  const SECTION_OWNER={
    'Rates':'main','Offers':'main','Hero Section':'main','Gallery':'main','Logo':'main','Contact':'main','Social Media':'main',
    'Booking Mode':'appointments','Appointments':'appointments',
    'Recovery & Reset':'recovery'
  };

  function panel(name){ return document.getElementById(PANELS[name]); }

  function normalizeSections(){
    const seen={main:new Set(),appointments:new Set(),recovery:new Set()};
    document.querySelectorAll('.admin-panel .admin-section-card').forEach(card=>{
      const title=(card.querySelector('.section-toggle h2')||{}).textContent?.trim()||'';
      const owner=SECTION_OWNER[title];
      if(!owner) return;
      const target=panel(owner);
      if(!target) return;
      if(card.parentElement!==target) target.appendChild(card);
      if(seen[owner].has(title)){
        card.remove();
      }else{
        seen[owner].add(title);
      }
    });
    document.querySelectorAll('.admin-section-card>.section-toggle').forEach(btn=>btn.type='button');
  }

  function setPanel(name){
    const active=PANELS[name]?name:'main';
    normalizeSections();
    Object.entries(PANELS).forEach(([key,id])=>{
      const el=document.getElementById(id);
      if(!el)return;
      const visible=key===active;
      el.hidden=!visible;
      el.classList.toggle('active',visible);
      el.classList.toggle('hidden',!visible);
      el.setAttribute('aria-hidden',visible?'false':'true');
      el.style.display=visible?'block':'none';
      if(!visible) el.querySelectorAll('.admin-section-card.open').forEach(card=>card.classList.remove('open'));
    });
    document.querySelectorAll('.admin-tab[data-tab]').forEach(tab=>{
      const selected=tab.dataset.tab===active;
      tab.classList.toggle('active',selected);
      tab.setAttribute('aria-selected',selected?'true':'false');
    });
    if(active==='appointments' && typeof window.loadAppointments==='function'){
      Promise.resolve().then(()=>window.loadAppointments()).catch(err=>console.error('Appointments load failed:',err));
    }
  }

  function toggleSection(toggle){
    const card=toggle.closest('.admin-section-card');
    if(!card)return;
    const owner=card.parentElement;
    if(!owner || !owner.classList.contains('admin-panel'))return;
    const open=!card.classList.contains('open');
    owner.querySelectorAll(':scope > .admin-section-card.open').forEach(other=>{
      if(other!==card)other.classList.remove('open');
    });
    card.classList.toggle('open',open);
  }

  window.showTab=setPanel;

  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest?.('button');
    if(button && !button.disabled){
      button.classList.add('pressed');
      window.setTimeout(()=>button.classList.remove('pressed'),140);
    }
  },{passive:true});

  document.addEventListener('click',event=>{
    const tab=event.target.closest?.('.admin-tab[data-tab]');
    if(tab){ event.preventDefault(); setPanel(tab.dataset.tab); return; }
    const toggle=event.target.closest?.('.admin-section-card>.section-toggle');
    if(toggle){ event.preventDefault(); toggleSection(toggle); return; }
    const logout=event.target.closest?.('#logoutBtn');
    if(logout){
      event.preventDefault();
      if(logout.dataset.arkLogoutBusy==='1')return;
      logout.dataset.arkLogoutBusy='1';
      logout.disabled=true;
      Promise.resolve(window.adminAuth&&typeof window.adminAuth.signOut==='function'?window.adminAuth.signOut():null)
        .catch(err=>console.error('Admin logout failed:',err))
        .finally(()=>window.location.replace('index.html'));
    }
  },true);

  function init(){ normalizeSections(); setPanel('main'); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  const observer=new MutationObserver(()=>normalizeSections());
  observer.observe(document.body,{childList:true,subtree:true});
})();