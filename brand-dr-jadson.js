(function(){
'use strict';
window.NeuroPedBrand={html:function(){return '<div class="drj-wordmark"><div class="drj-emblem">JF</div><div><div class="drj-name">Dr. Jadson Fraga</div><div class="drj-sub">Neuropediatria · CRM-PE 25227 · RQE 17756</div></div></div>'}};
function boot(){document.querySelectorAll('[data-drj-brand]').forEach(function(el){if(!el.dataset.ready){el.innerHTML=window.NeuroPedBrand.html();el.dataset.ready='1'}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();