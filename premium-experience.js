(function(){
'use strict';
function add(src){if(document.querySelector('script[src="'+src+'"]'))return;var s=document.createElement('script');s.src=src;s.defer=true;document.body.appendChild(s)}
function css(href){if(document.querySelector('link[href="'+href+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.appendChild(l)}
function boot(){css('./brand-dr-jadson.css');css('./app-shell.css');add('./brand-dr-jadson.js');add('./app-shell.js')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();