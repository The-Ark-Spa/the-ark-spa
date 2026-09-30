/* THE ARK — Controlled Admin Shell + Action Controller
   Single navigation owner, single delegated action owner.
   Existing Supabase/data functions remain the service layer.
*/
(function(){
  'use strict';

  const PANELS={main:'mainPanel',appointments:'appointmentsPanel',recovery:'recoveryPanel'};

  const SECTION_OWNER={
    'Rates':'main','Offers':'main','Hero Section':'main','Gallery':'main',
    'Logo':'main','Contact':'main','Social Media':'main','Booking Mode':'main',
    'Appointments':'appointments','Recovery & Reset':'recovery'
  };

  const panel=name=>document.getElementById(PANELS[name]);

  function sectionTitle(card){
    return (card.querySelector('.section-toggle h2')?.textContent||'').trim();
  }

  function enforceSectionPlacement(){
    const cards=[...document.querySelectorAll('.admin-section-card')];
    const grouped={main:{},appointments:{},recovery:{}};
    cards.forEach(card=>{
      const owner=SECTION_OWNER[sectionTitle(card)];
      if(owner)(grouped[owner][sectionTitle(card)] ||= []).push(card);
    });
    Object.entries(grouped).forEach(([owner,byTitle])=>{
      const target=panel(owner);
      if(!target)return;
      Object.values(byTitle).forEach(list=>{
        const keeper=list.find(card=>card.parentElement===target)||list[0];
        list.forEach(card=>{if(card!==keeper)card.remove()});
        if(keeper.parentElement!==target)target.appendChild(keeper);
      });
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
      if(!visible)el.querySelectorAll('.admin-section-card.open').forEach(c=>c.classList.remove('open'));
    });
    document.querySelectorAll('.admin-tab[data-tab]').forEach(tab=>{
      const selected=tab.dataset.tab===active;
      tab.classList.toggle('active',selected);
      tab.setAttribute('aria-selected',selected?'true':'false');
    });
    if(active==='appointments'&&typeof window.loadAppointments==='function'){
      Promise.resolve(window.loadAppointments()).catch(e=>console.error('Appointments load failed:',e));
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
    if(open)card.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function setBusy(button,busy,label){
    if(!button)return;
    if(busy){
      button.dataset.arkOriginalText=button.textContent;
      button.disabled=true;
      button.classList.add('is-busy');
      button.textContent=label||'Saving…';
    }else{
      button.disabled=false;
      button.classList.remove('is-busy');
      if(button.dataset.arkOriginalText!=null){
        button.textContent=button.dataset.arkOriginalText;
        delete button.dataset.arkOriginalText;
      }
    }
  }

  async function runAction(button,fn,label){
    if(!button||button.dataset.arkActionBusy==='1')return;
    button.dataset.arkActionBusy='1';
    setBusy(button,true,label||'Working…');
    try{
      await Promise.resolve(fn());
    }catch(error){
      console.error('Admin action failed:',error);
    }finally{
      setBusy(button,false);
      button.dataset.arkActionBusy='0';
    }
  }

  function actionFromId(id){
    const map={
      savePct:['savePercentage','Saving…'],deactivatePct:[()=>deactivateOfferType('percentage'),'Updating…'],
      saveSp:['saveSpecial','Saving…'],deactivateSp:[()=>deactivateOfferType('special'),'Updating…'],
      uploadGallery:['handleUploadGallery','Uploading…'],
      galleryApply:['applyGalleryPlacement','Applying…'],galleryRemove:['removeSelectedGalleryFromLibrary','Removing…'],
      galleryViewLocation:['openGalleryLocationModal','Opening…'],
      gallerySelectAll:['selectAllGallery','Selecting…'],
      uploadLogo:['handleUploadLogo','Uploading…'],removeLogo:['handleRemoveLogo','Removing…'],
      saveContact:['handleSaveContact','Saving…'],saveSocial:['handleSaveSocial','Saving…'],
      saveBooking:['handleSaveBooking','Saving…'],
      refreshAppointments:['loadAppointments','Refreshing…'],
      exportAppointments:[()=>document.getElementById('appointmentExportModal')?.classList.remove('hidden'),'Opening…'],
      backupBtn:['downloadSiteBackup','Creating…'],resetRates:['handleResetRates','Resetting…'],
      resetOffers:['handleResetOffers','Resetting…'],resetGallery:['handleResetGallery','Resetting…'],
      restoreApproved:['handleRestoreApproved','Restoring…'],
      heroAddImage:['heroUploadImage','Adding…'],heroRemoveCustom:['heroRemoveCustom','Removing…'],
      heroResetAdjust:['heroResetAdjust','Resetting…'],heroSavePreview:['heroSavePreview','Saving…'],
      heroApplyLive:['heroApplyLive','Applying…'],heroDiscardPreview:['heroDiscardPreview','Discarding…'],
      closeAppointmentExport:[()=>document.getElementById('appointmentExportModal')?.classList.add('hidden'),'Closing…'],
      downloadAppointmentsExcelBtn:[()=>{document.getElementById('appointmentExportModal')?.classList.add('hidden');exportAppointmentsExcel()},'Preparing…'],
      downloadAppointmentsPdfBtn:[()=>{document.getElementById('appointmentExportModal')?.classList.add('hidden');exportAppointmentsPdf()},'Preparing…']
    };
    return map[id];
  }

  function bind(){
    enforceSectionPlacement();

    document.addEventListener('pointerdown',e=>{
      const button=e.target.closest?.('button');
      if(button&&!button.disabled)button.classList.add('pressed');
    },{passive:true});

    ['pointerup','pointercancel'].forEach(type=>document.addEventListener(type,e=>{
      const button=e.target.closest?.('button');
      if(button)button.classList.remove('pressed');
    },{passive:true}));

    document.addEventListener('click',e=>{
      const tab=e.target.closest?.('.admin-tab[data-tab]');
      if(tab){e.preventDefault();setPanel(tab.dataset.tab);return;}

      const toggle=e.target.closest?.('.admin-section-card>.section-toggle');
      if(toggle){e.preventDefault();toggleSection(toggle);return;}

      const action=e.target.closest?.('[data-admin-action]');
      if(action){
        e.preventDefault();
        const fnName=action.dataset.adminAction;
        const fn=typeof window[fnName]==='function'?window[fnName]:null;
        if(fn)runAction(action,()=>fn(action),action.dataset.busyLabel||'Working…');
        return;
      }

      const idAction=actionFromId(e.target.closest?.('button')?.id);
      if(idAction){
        e.preventDefault();
        const target=e.target.closest('button');
        const task=typeof idAction[0]==='function'?idAction[0]:window[idAction[0]];
        if(typeof task==='function')runAction(target,()=>task(target),idAction[1]);
        return;
      }

      const rateCat=e.target.closest?.('[data-rate-category]');
      if(rateCat){e.preventDefault();window.selectRateCategory?.(rateCat.dataset.rateCategory);return;}
      const rateItem=e.target.closest?.('[data-rate-name]');
      if(rateItem){e.preventDefault();window.selectRate?.(rateItem.dataset.rateName);return;}

      const offerAction=e.target.closest?.('[data-offer-action]');
      if(offerAction){
        e.preventDefault();
        const type=offerAction.dataset.offerType;
        const fn=window[offerAction.dataset.offerAction];
        if(typeof fn==='function')runAction(offerAction,()=>fn(type),'Updating…');
        return;
      }

      const appointmentAction=e.target.closest?.('[data-appointment-action]');
      if(appointmentAction){
        e.preventDefault();
        const id=appointmentAction.dataset.appointmentId;
        const fn=window[appointmentAction.dataset.appointmentAction];
        if(typeof fn!=='function')return;
        const status=appointmentAction.dataset.status;
        runAction(appointmentAction,()=>status?fn(id,status):fn(id,appointmentAction),'Working…');
      }

      const galleryAction=e.target.closest?.('[data-gallery-action]');
      if(galleryAction){
        e.preventDefault();
        const fn=window[galleryAction.dataset.galleryAction];
        if(typeof fn==='function')runAction(galleryAction,()=>fn(galleryAction),'Working…');
      }
    },true);

    document.addEventListener('change',e=>{
      if(e.target.id==='pctCategory')window.fillOfferItems?.(e.target.value,'pctItems');
      if(e.target.id==='spCategory')window.fillOfferItems?.(e.target.value,'spItems');
      if(e.target.id==='galleryWhereUse')window.gallerySelectPlacement?.(e.target.value);
      if(e.target.id==='heroImageFile'&&typeof window.heroChooseImage==='function')window.heroChooseImage(e);
      if(e.target.id==='heroAdjustModeSwitch'&&typeof window.heroModalSetMode==='function'){
        const n=Number(e.target.value);window.heroModalSetMode(n===0?'text':n===2?'image':'normal');
      }
    });

    document.addEventListener('keydown',e=>{
      const modal=document.getElementById('heroAdjustModal');
      if(e.key==='Escape'&&modal?.classList.contains('open'))window.heroCloseAdjust?.();
    });

    window.showTab=setPanel;
    window.__arkAdminControllerReady=true;
    setPanel('main');

    if(typeof window.bindGalleryLibrary==='function')window.bindGalleryLibrary();
    if(typeof window.bindGalleryImagePreview==='function')window.bindGalleryImagePreview();
    if(typeof window.resetAdminView==='function')window.resetAdminView();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
