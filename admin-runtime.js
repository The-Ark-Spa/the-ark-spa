(function(){
  'use strict';

  function panelMap(){
    return {
      main:document.getElementById('mainPanel'),
      appointments:document.getElementById('appointmentsPanel'),
      recovery:document.getElementById('recoveryPanel')
    };
  }

  window.showTab=function(tab){
    const allowed=['main','appointments','recovery'];
    if(!allowed.includes(tab)) tab='main';
    const panels=panelMap();

    Object.keys(panels).forEach(function(name){
      const panel=panels[name];
      if(!panel)return;
      const active=name===tab;
      panel.hidden=!active;
      panel.classList.toggle('active',active);
      panel.classList.toggle('hidden',!active);
      panel.setAttribute('aria-hidden',active?'false':'true');
      panel.style.display=active?'block':'none';
      panel.style.visibility=active?'visible':'hidden';
      panel.style.pointerEvents=active?'auto':'none';
      panel.style.opacity=active?'1':'0';
    });

    document.querySelectorAll('.admin-tab').forEach(function(btn){
      const active=btn.dataset.tab===tab;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });

    if(tab==='appointments' && typeof window.loadAppointments==='function'){
      Promise.resolve(window.loadAppointments()).catch(function(e){console.error('Appointments load failed',e);});
    }
  };

  function bindTabs(){
    document.querySelectorAll('.admin-nav .admin-tab').forEach(function(btn){
      if(btn.dataset.arkRuntimeWired==='1')return;
      btn.dataset.arkRuntimeWired='1';
      btn.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        window.showTab(btn.dataset.tab);
      },true);
    });
  }

  function bindSections(){
    document.addEventListener('click',function(e){
      const toggle=e.target.closest('.admin-section-card > .section-toggle');
      if(!toggle)return;
      e.preventDefault();
      e.stopPropagation();
      const card=toggle.closest('.admin-section-card');
      const panel=card&&card.closest('.admin-panel');
      if(!card||!panel)return;
      const open=!card.classList.contains('open');
      panel.querySelectorAll(':scope > .admin-section-card.open').forEach(function(other){
        if(other!==card)other.classList.remove('open');
      });
      card.classList.toggle('open',open);
    },true);
  }

  function bindExistingActions(){
    const map={
      logoutBtn:function(){return window.adminAuth&&window.adminAuth.signOut().then(function(){location.href='index.html';});},
      backupBtn:function(){return window.downloadSiteBackup&&window.downloadSiteBackup();},
      resetRates:function(){return window.handleResetRates&&window.handleResetRates();},
      resetOffers:function(){return window.handleResetOffers&&window.handleResetOffers();},
      resetGallery:function(){return window.handleResetGallery&&window.handleResetGallery();},
      restoreApproved:function(){return window.handleRestoreApproved&&window.handleRestoreApproved();},
      refreshAppointments:function(){return window.loadAppointments&&window.loadAppointments();},
      saveContact:function(){return window.handleSaveContact&&window.handleSaveContact();},
      saveSocial:function(){return window.handleSaveSocial&&window.handleSaveSocial();},
      saveBooking:function(){return window.handleSaveBooking&&window.handleSaveBooking();},
      savePct:function(){return window.savePercentage&&window.savePercentage();},
      saveSp:function(){return window.saveSpecial&&window.saveSpecial();}
    };
    Object.keys(map).forEach(function(id){
      const el=document.getElementById(id);
      if(!el||el.dataset.arkRuntimeAction==='1')return;
      el.dataset.arkRuntimeAction='1';
      el.addEventListener('click',function(e){
        e.preventDefault();
        Promise.resolve().then(map[id]).catch(function(err){console.error('Admin action failed: '+id,err);});
      },true);
    });
  }

  function init(){
    bindTabs();
    bindSections();
    bindExistingActions();
    window.showTab('main');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();