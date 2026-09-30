(function(){
  'use strict';

  const PANELS={main:'mainPanel',appointments:'appointmentsPanel',recovery:'recoveryPanel'};
  const SECTION_OWNER={
    'Rates':'main','Offers':'main','Hero Section':'main','Gallery':'main','Logo':'main','Contact':'main','Social Media':'main',
    'Booking Mode':'appointments','Appointments':'appointments',
    'Recovery & Reset':'recovery'
  };

  const panel=name=>document.getElementById(PANELS[name]);

  function sectionTitle(card){
    return (card.querySelector('.section-toggle h2')?.textContent||'').trim();
  }

  /*
   * One source of truth for section placement.
   * Do not continuously move cards with a MutationObserver: moving DOM nodes
   * itself creates mutations and can make the UI look duplicated during boot.
   */
  function enforceSectionPlacement(){
    const cards=Array.from(document.querySelectorAll('.admin-section-card'));
    const grouped={main:{},appointments:{},recovery:{}};

    cards.forEach(card=>{
      const title=sectionTitle(card);
      const owner=SECTION_OWNER[title];
      if(owner) (grouped[owner][title] ||= []).push(card);
    });

    Object.entries(grouped).forEach(([owner,byTitle])=>{
      const target=panel(owner);
      if(!target)return;

      Object.values(byTitle).forEach(list=>{
        // Prefer the card already belonging to the correct panel.
        const keeper=list.find(card=>card.parentElement===target) || list[0];
        list.forEach(card=>{ if(card!==keeper) card.remove(); });
        if(keeper.parentElement!==target) target.appendChild(keeper);
      });
    });

    document.querySelectorAll('.admin-section-card>.section-toggle').forEach(btn=>{
      btn.type='button';
    });
  }

  function setPanel(name){
    enforceSectionPlacement();
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
    const owner=card.closest('.admin-panel');
    if(!owner)return;

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
    if(tab){
      event.preventDefault();
      setPanel(tab.dataset.tab);
      return;
    }

    const toggle=event.target.closest?.('.admin-section-card>.section-toggle');
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
      logout.disabled=true;
      Promise.resolve(window.adminAuth&&typeof window.adminAuth.signOut==='function'?window.adminAuth.signOut():null)
        .catch(err=>console.error('Admin logout failed:',err))
        .finally(()=>window.location.replace('index.html'));
    }
  },true);

  function init(){
    enforceSectionPlacement();
    setPanel('main');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();