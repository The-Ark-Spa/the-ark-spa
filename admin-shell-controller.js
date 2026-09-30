(function(){
  'use strict';

  const PANELS={
    main:'mainPanel',
    appointments:'appointmentsPanel',
    recovery:'recoveryPanel'
  };

  const MAIN_MARKERS=['rateCategories','offerList','heroEditor','galleryAdmin','logoPreview','contactPhone','socialAdmin'];
  const APPOINTMENT_MARKERS=['bookingMode','appointmentRows'];
  const RECOVERY_MARKERS=['recoveryMsg'];

  function cardHasMarker(card,markers){
    return markers.some(id=>card.querySelector('#'+id));
  }

  function normalizeOwnership(){
    const main=document.getElementById(PANELS.main);
    const appointments=document.getElementById(PANELS.appointments);
    const recovery=document.getElementById(PANELS.recovery);

    [[main,MAIN_MARKERS],[appointments,APPOINTMENT_MARKERS],[recovery,RECOVERY_MARKERS]].forEach(([panel,markers])=>{
      if(!panel)return;
      panel.querySelectorAll(':scope > .admin-section-card').forEach(card=>{
        let allowed=true;
        if(panel===main) allowed=!cardHasMarker(card,APPOINTMENT_MARKERS)&&!cardHasMarker(card,RECOVERY_MARKERS);
        if(panel===appointments) allowed=!cardHasMarker(card,MAIN_MARKERS)&&!cardHasMarker(card,RECOVERY_MARKERS);
        if(panel===recovery) allowed=!cardHasMarker(card,MAIN_MARKERS)&&!cardHasMarker(card,APPOINTMENT_MARKERS);
        card.hidden=!allowed;
        card.setAttribute('aria-hidden',allowed?'false':'true');
        card.style.display=allowed?'':'none';
        if(!allowed)card.classList.remove('open');
      });
    });
  }

  function setPanel(name){
    const active=PANELS[name]?name:'main';
    normalizeOwnership();

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
    if(card.hidden)return;

    const open=!card.classList.contains('open');
    panel.querySelectorAll(':scope > .admin-section-card.open').forEach(other=>{
      if(other!==card)other.classList.remove('open');
    });
    card.classList.toggle('open',open);
  }

  window.showTab=setPanel;

  // Delegated interaction is installed immediately so no DOMContentLoaded race can disable clicks.
  if(!window.__arkAdminControllerDelegated){
    window.__arkAdminControllerDelegated=true;
    document.addEventListener('click',event=>{
      const tab=event.target.closest?.('.admin-tab[data-tab]');
      if(tab){
        event.preventDefault();
        event.stopPropagation();
        setPanel(tab.dataset.tab);
        return;
      }

      const toggle=event.target.closest?.('.admin-section-card > .section-toggle');
      if(toggle){
        event.preventDefault();
        event.stopPropagation();
        toggleSection(toggle.closest('.admin-section-card'));
        return;
      }

      const logout=event.target.closest?.('#logoutBtn');
      if(logout){
        event.preventDefault();
        event.stopPropagation();
        if(logout.dataset.arkLogoutBusy==='1')return;
        logout.dataset.arkLogoutBusy='1';
        logout.disabled=true;
        Promise.resolve(
          window.adminAuth && typeof window.adminAuth.signOut==='function'
            ? window.adminAuth.signOut()
            : null
        ).catch(err=>console.error('Admin logout failed:',err))
         .finally(()=>window.location.replace('index.html'));
      }
    });

    document.addEventListener('pointerdown',event=>{
      const button=event.target.closest?.('button');
      if(button && !button.disabled){
        button.classList.add('pressed');
        window.setTimeout(()=>button.classList.remove('pressed'),140);
      }
    },{passive:true});
  }

  function init(){
    normalizeOwnership();
    document.querySelectorAll('.admin-tab[data-tab]').forEach(tab=>{tab.type='button'});
    document.querySelectorAll('.admin-section-card > .section-toggle').forEach(toggle=>{toggle.type='button'});
    setPanel('main');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init,{once:true});
  }else{
    init();
  }
})();