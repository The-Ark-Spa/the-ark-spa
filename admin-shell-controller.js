(function(){
  'use strict';

  const PANEL_IDS={main:'mainPanel',appointments:'appointmentsPanel',recovery:'recoveryPanel'};

  function setPanel(name){
    const active=PANEL_IDS[name]?name:'main';
    Object.entries(PANEL_IDS).forEach(([key,id])=>{
      const panel=document.getElementById(id);
      if(!panel)return;
      const on=key===active;
      panel.classList.toggle('active',on);
      panel.classList.toggle('hidden',!on);
      panel.hidden=!on;
      panel.setAttribute('aria-hidden',on?'false':'true');
      panel.style.setProperty('display',on?'block':'none','important');
      panel.style.setProperty('visibility',on?'visible':'hidden','important');
      panel.style.setProperty('pointer-events',on?'auto':'none','important');
      panel.style.setProperty('opacity',on?'1':'0','important');
      if(!on) panel.querySelectorAll('.admin-section-card.open').forEach(card=>card.classList.remove('open'));
    });
    document.querySelectorAll('.admin-tab[data-tab]').forEach(btn=>{
      const on=btn.dataset.tab===active;
      btn.classList.toggle('active',on);
      btn.setAttribute('aria-selected',on?'true':'false');
    });
    if(active==='appointments' && typeof window.loadAppointments==='function'){
      try{ window.loadAppointments(); }catch(e){ console.error('Appointments load failed:',e); }
    }
  }

  window.showTab=setPanel;

  function handleSectionToggle(toggle){
    const card=toggle.closest('.admin-section-card');
    const panel=card && toggle.closest('.admin-panel');
    if(!card||!panel)return;
    const willOpen=!card.classList.contains('open');
    panel.querySelectorAll(':scope > .admin-section-card.open').forEach(other=>{
      if(other!==card)other.classList.remove('open');
    });
    card.classList.toggle('open',willOpen);
  }

  document.addEventListener('click',function(e){
    const tab=e.target.closest && e.target.closest('.admin-tab[data-tab]');
    if(tab){
      e.preventDefault();
      e.stopImmediatePropagation();
      setPanel(tab.dataset.tab);
      return;
    }

    const toggle=e.target.closest && e.target.closest('.section-toggle');
    if(toggle){
      e.preventDefault();
      e.stopImmediatePropagation();
      handleSectionToggle(toggle);
      return;
    }

    const logout=e.target.closest && e.target.closest('#logoutBtn');
    if(logout){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(logout.dataset.arkLogoutBusy==='1')return;
      logout.dataset.arkLogoutBusy='1';
      logout.disabled=true;
      Promise.resolve(window.adminAuth && window.adminAuth.signOut ? window.adminAuth.signOut() : null)
        .catch(err=>console.error('Admin logout failed:',err))
        .finally(()=>window.location.replace('index.html'));
    }
  },true);

  function init(){
    setPanel('main');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
