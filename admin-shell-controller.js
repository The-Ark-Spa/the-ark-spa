(function(){
'use strict';
const PANELS={main:'mainPanel',appointments:'appointmentsPanel',recovery:'recoveryPanel'};
const SECTION_OWNER={'Rates':'main','Offers':'main','Hero':'main','Hero Section':'main','Gallery':'main','Logo':'main','Contact':'main','Social Media':'main','Booking Mode':'main','Appointments':'appointments','Recovery & Reset':'recovery'};
const panel=n=>document.getElementById(PANELS[n]);
function title(card){return(card.querySelector('.section-toggle h2')?.textContent||'').trim()}
function enforce(){
  const cards=[...document.querySelectorAll('.admin-section-card')], grouped={main:{},appointments:{},recovery:{}};
  cards.forEach(card=>{const o=SECTION_OWNER[title(card)];if(o)(grouped[o][title(card)]||=[]).push(card)});
  Object.entries(grouped).forEach(([owner,map])=>{const target=panel(owner);if(!target)return;Object.values(map).forEach(list=>{const keep=list.find(c=>c.parentElement===target)||list[0];list.forEach(c=>{if(c!==keep)c.remove()});if(keep.parentElement!==target)target.appendChild(keep)})});
}
function showTab(name){
  enforce();const active=PANELS[name]?name:'main';
  Object.entries(PANELS).forEach(([key,id])=>{const el=document.getElementById(id);if(!el)return;const on=key===active;el.hidden=!on;el.classList.toggle('active',on);el.classList.toggle('hidden',!on);el.setAttribute('aria-hidden',on?'false':'true');el.style.display=on?'block':'none';if(!on)el.querySelectorAll('.admin-section-card.open').forEach(c=>c.classList.remove('open'))});
  document.querySelectorAll('.admin-tab[data-tab]').forEach(t=>{const on=t.dataset.tab===active;t.classList.toggle('active',on);t.setAttribute('aria-selected',on?'true':'false')});
  if(active==='appointments'&&typeof window.loadAppointments==='function')Promise.resolve(window.loadAppointments()).catch(console.error);
}
function toggle(toggle){
  const card=toggle.closest('.admin-section-card'),owner=card?.closest('.admin-panel');if(!card||!owner)return;
  const open=!card.classList.contains('open');owner.querySelectorAll(':scope > .admin-section-card.open').forEach(c=>{if(c!==card)c.classList.remove('open')});card.classList.toggle('open',open);
}
function busy(btn,label,task){
  if(!btn||btn.dataset.busy==='1')return;
  btn.dataset.busy='1';btn.dataset.oldText=btn.textContent;btn.disabled=true;btn.classList.add('is-busy');btn.textContent=label||'Working…';
  Promise.resolve().then(task).catch(e=>console.error('Admin action failed:',e)).finally(()=>{btn.disabled=false;btn.classList.remove('is-busy');btn.textContent=btn.dataset.oldText||btn.textContent;delete btn.dataset.oldText;btn.dataset.busy='0'});
}
const idActions={
 savePct:['savePercentage','Saving…'],deactivatePct:[()=>deactivateOfferType('percentage'),'Updating…'],
 saveSp:['saveSpecial','Saving…'],deactivateSp:[()=>deactivateOfferType('special'),'Updating…'],
 uploadGallery:['handleUploadGallery','Uploading…'],galleryApply:['applyGalleryPlacement','Applying…'],galleryRemove:['removeSelectedGalleryFromLibrary','Removing…'],galleryViewLocation:['openGalleryLocationModal','Opening…'],gallerySelectAll:['selectAllGallery','Selecting…'],
 uploadLogo:['handleUploadLogo','Uploading…'],removeLogo:['handleRemoveLogo','Removing…'],saveContact:['handleSaveContact','Saving…'],saveSocial:['handleSaveSocial','Saving…'],saveBooking:['handleSaveBooking','Saving…'],
 refreshAppointments:['loadAppointments','Refreshing…'],exportAppointments:[()=>document.getElementById('appointmentExportModal')?.classList.remove('hidden'),'Opening…'],
 backupBtn:['downloadSiteBackup','Creating…'],resetRates:['handleResetRates','Resetting…'],resetOffers:['handleResetOffers','Resetting…'],resetGallery:['handleResetGallery','Resetting…'],restoreApproved:['handleRestoreApproved','Restoring…'],
 heroAddImage:['heroUploadImage','Adding…'],heroRemoveCustom:['heroRemoveCustom','Removing…'],heroResetAdjust:['heroResetAdjust','Resetting…'],heroSavePreview:['heroSavePreview','Saving…'],heroApplyLive:['heroApplyLive','Applying…'],heroDiscardPreview:['heroDiscardPreview','Discarding…'],
 heroDesktopTab:[()=>{heroEditorDevice='desktop';heroDesktopTab.classList.add('active');heroMobileTab.classList.remove('active');heroRenderEditor()},'Switching…'],heroMobileTab:[()=>{heroEditorDevice='mobile';heroMobileTab.classList.add('active');heroDesktopTab.classList.remove('active');heroRenderEditor()},'Switching…'],
 closeGalleryLocation:[()=>galleryLocationModal.classList.add('hidden'),'Closing…'],closeAppointmentExport:[()=>appointmentExportModal.classList.add('hidden'),'Closing…'],
 downloadAppointmentsExcelBtn:[()=>{appointmentExportModal.classList.add('hidden');exportAppointmentsExcel()},'Preparing…'],downloadAppointmentsPdfBtn:[()=>{appointmentExportModal.classList.add('hidden');exportAppointmentsPdf()},'Preparing…'],
 closeAppointmentView:['closeAppointmentView','Closing…']
};
function callAction(btn,entry){const task=typeof entry[0]==='function'?entry[0]:window[entry[0]];if(typeof task==='function')busy(btn,entry[1],()=>task(btn))}
function init(){
  enforce();window.showTab=showTab;
  document.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button');if(b&&!b.disabled)b.classList.add('pressed')},{passive:true});
  document.addEventListener('pointerup',e=>e.target.closest?.('button')?.classList.remove('pressed'),{passive:true});
  document.addEventListener('pointercancel',e=>e.target.closest?.('button')?.classList.remove('pressed'),{passive:true});
  document.addEventListener('click',e=>{
    const tab=e.target.closest?.('.admin-tab[data-tab]');if(tab){e.preventDefault();showTab(tab.dataset.tab);return}
    const sec=e.target.closest?.('.admin-section-card>.section-toggle');if(sec){e.preventDefault();toggle(sec);return}
    const logout=e.target.closest?.('#logoutBtn');if(logout){e.preventDefault();if(logout.dataset.busy==='1')return;busy(logout,'Logging out…',async()=>{if(window.adminAuth?.signOut)await window.adminAuth.signOut();window.location.replace('index.html')});return}
    const preview=e.target.closest?.('#heroPreviewTapArea');if(preview&&typeof window.heroOpenAdjust==='function'){e.preventDefault();window.heroOpenAdjust();return}
    const b=e.target.closest?.('button');if(b&&idActions[b.id]){e.preventDefault();callAction(b,idActions[b.id]);return}
    const adminAction=e.target.closest?.('[data-admin-action]');if(adminAction){e.preventDefault();const fn=window[adminAction.dataset.adminAction];if(typeof fn==='function')busy(adminAction,adminAction.dataset.busyLabel||'Working…',()=>fn(adminAction));return}
    const rateCat=e.target.closest?.('[data-rate-category]');if(rateCat){e.preventDefault();window.selectRateCategory?.(rateCat.dataset.rateCategory);return}
    const rateItem=e.target.closest?.('[data-rate-name]');if(rateItem){e.preventDefault();window.selectRate?.(rateItem.dataset.rateName);return}
    const offer=e.target.closest?.('[data-offer-action]');if(offer){e.preventDefault();const fn=window[offer.dataset.offerAction];if(typeof fn==='function')busy(offer,'Updating…',()=>fn(offer.dataset.offerType));return}
    const g=e.target.closest?.('[data-gallery-action]');if(g){e.preventDefault();const fn=window[g.dataset.galleryAction];if(typeof fn!=='function')return;const id=g.dataset.galleryId,p=g.dataset.galleryPlacement;busy(g,'Working…',()=>g.dataset.galleryAction==='toggleGallerySelection'?fn(id):g.dataset.galleryAction==='openGalleryLocationModal'?fn(id):g.dataset.galleryAction==='openGalleryPlacementImages'?fn(p):g.dataset.galleryAction==='removeGalleryFromPlacement'?fn(id,p):fn(g));return}
    const ap=e.target.closest?.('[data-appointment-action]');if(ap){e.preventDefault();const fn=window[ap.dataset.appointmentAction];if(typeof fn!=='function')return;const id=ap.dataset.appointmentId,status=ap.dataset.status;busy(ap,'Working…',()=>status?fn(id,status):fn(id,ap));return}
    if(e.target.closest?.('.gallery-image-preview-close')){window.closeGalleryImagePreview?.();return}
  },true);
  document.addEventListener('change',e=>{
    if(e.target.id==='pctCategory')window.fillOfferItems?.(e.target.value,'pctItems');
    if(e.target.id==='spCategory')window.fillOfferItems?.(e.target.value,'spItems');
    if(e.target.id==='galleryWhereUse')window.gallerySelectPlacement?.(e.target.value);
    if(e.target.id==='heroImageFile')window.heroChooseImage?.(e);
    if(e.target.id==='heroAdjustModeSwitch'){const n=Number(e.target.value);window.heroModalSetMode?.(n===0?'text':n===2?'image':'normal')}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const h=document.getElementById('heroAdjustModal');if(h?.classList.contains('open'))window.heroCloseAdjust?.();const g=document.getElementById('galleryLocationModal');if(g&&!g.classList.contains('hidden'))g.classList.add('hidden');const a=document.getElementById('appointmentViewModal');if(a&&!a.classList.contains('hidden'))window.closeAppointmentView?.()}});
  if(typeof window.bindGalleryLibrary==='function')window.bindGalleryLibrary();
  if(typeof window.bindGalleryImagePreview==='function')window.bindGalleryImagePreview();
  showTab('main');window.__arkAdminControllerReady=true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();