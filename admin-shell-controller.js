/* The Ark Admin V2 — single shell/navigation controller.
   UI-only controller: authentication, data, storage and business actions stay in app.js. */
(function(){
  'use strict';

  const PANELS={
    main:'mainPanel',
    appointments:'appointmentsPanel',
    recovery:'recoveryPanel'
  };

  let currentPanel='main';

  function panel(name){
    return document.getElementById(PANELS[name]);
  }

  function setPanel(name){
    const active=PANELS[name]?name:'main';
    currentPanel=active;

    Object.entries(PANELS).forEach(([key,id])=>{
      const el=document.getElementById(id);
      if(!el)return;
      const visible=key===active;
      el.hidden=!visible;
      el.classList.toggle('active',visible);
      el.classList.toggle('hidden',!visible);
      el.setAttribute('aria-hidden',visible?'false':'true');
      el.style.display=visible?'block':'none';
      if(!visible){
        el.querySelectorAll('.admin-section-card.open').forEach(card=>card.classList.remove('open'));
      }
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

  window.showTab=setPanel;

  function toggleSection(toggle){
    const card=toggle.closest('.admin-section-card');
    if(!card)return;

    const owner=card.closest('.admin-panel');
    if(!owner)return;

    const open=!card.classList.contains('open');
    owner.querySelectorAll(':scope > .admin-section-card.open').forEach(other=>{
      if(other!==card)other.classList.remove('open');
    });
    card.classList.toggle('open',open);

    if(open){
      window.setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'nearest'}),30);
    }
  }

  function markPressed(button){
    if(!button || button.disabled)return;
    button.classList.add('pressed');
    window.setTimeout(()=>button.classList.remove('pressed'),140);
  }

  document.addEventListener('pointerdown',event=>{
    const button=event.target.closest?.('button');
    if(button)markPressed(button);
  },{passive:true});

  document.addEventListener('click',event=>{
    const tab=event.target.closest?.('.admin-tab[data-tab]');
    if(tab){
      event.preventDefault();
      setPanel(tab.dataset.tab);
      return;
    }

    const toggle=event.target.closest?.('.section-toggle');
    if(toggle){
      event.preventDefault();
      toggleSection(toggle);
      return;
    }

    const logout=event.target.closest?.('#logoutBtn');
    if(logout){
      event.preventDefault();
      if(logout.dataset.arkLogoutBusy==='1')return;
      logout.dataset.arkLogoutBusy='1';
      logout.setAttribute('aria-busy','true');
      logout.disabled=true;

      Promise.resolve(
        window.adminAuth && typeof window.adminAuth.signOut==='function'
          ? window.adminAuth.signOut()
          : null
      ).catch(err=>{
        console.error('Admin logout failed:',err);
      }).finally(()=>{
        window.location.replace('index.html');
      });
    }
  });

  function init(){
    setPanel('main');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();
