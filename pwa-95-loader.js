(function(){
'use strict';
if(window.NP_PWA_95_LOADER)return;window.NP_PWA_95_LOADER=true;
function addStyle(h){if(document.querySelector('link[href="'+h+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l)}
function addScript(s){if(document.querySelector('script[src="'+s+'"]'))return;var x=document.createElement('script');x.src=s;x.defer=true;document.body.appendChild(x)}
function mark(){try{document.documentElement.classList.add('np-pwa-ready');document.body&&document.body.classList.add('np-pwa-app')}catch(e){}}
function boot(){
  mark();
  addStyle('./pwa-app-shell.css');
  addScript('./app-shell-open.js');
  addScript('./pwa-95-experience.js');
  addScript('./pwa-home-feed.js');
  addScript('./pwa-bottom-sheet.js');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,250);setTimeout(boot,800);setTimeout(boot,1800);
})();
