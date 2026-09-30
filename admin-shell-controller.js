(function(){
  'use strict';

  const PANELS={
    main:'mainPanel',
    appointments:'appointmentsPanel',
    recovery:'recoveryPanel'
  };

  function setPanel(name){
    const active=PANELS[name]?name:'main';

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
      Promise.resolve(window.loadAppointments()).catch(err=>console.error('Appointments load failed:',err));
    }
  }

  function toggleSection(card){
    if(!card)return;
    const panel=card.closest('.admin-panel');
    if(!panel || panel.hidden || panel.classList.contains('hidden'))return;

    const open=!card.classList.contains('open');
    panel.querySelectorAll(':scope > .admin-section-card.open').forEach(other=>{
      if(other!==card)other.classList.remove('open');
    });
    card.classList.toggle('open',open);
  }

  function init(){
    window.showTab=setPanel;

    document.querySelectorAll('.admin-tab[data-tab]').forEach(tab=>{
      if(tab.dataset.arkControllerWired==='1')return;
      tab.dataset.arkControllerWired='1';
      tab.type='button';
      tab.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        setPanel(tab.dataset.tab);
      });
    });

    document.querySelectorAll('.admin-section-card > .section-toggle').forEach(toggle=>{
      if(toggle.dataset.arkControllerWired==='1')return;
      toggle.dataset.arkControllerWired='1';
      toggle.type='button';
      toggle.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        toggleSection(toggle.closest('.admin-section-card'));
      });
    });

    document.addEventListener('pointerdown',event=>{
      const button=event.target.closest?.('button');
      if(button && !button.disabled){
        button.classList.add('pressed');
        window.setTimeout(()=>button.classList.remove('pressed'),140);
      }
    },{passive:true});

    const logout=document.getElementById('logoutBtn');
    if(logout && logout.dataset.arkControllerWired!=='1'){
      logout.dataset.arkControllerWired='1';
      logout.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        if(logout.dataset.arkLogoutBusy==='1')return;
        logout.dataset.arkLogoutBusy='1';
        logout.disabled=true;
        Promise.resolve(
          window.adminAuth && typeof window.adminAuth.signOut==='function'
            ? window.adminAuth.signOut()
            : null
        ).catch(err=>console.error('Admin logout failed:',err))
         .finally(()=>window.location.replace('index.html'));
      });
    }

    setPanel('main');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();