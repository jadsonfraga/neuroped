(function(){
'use strict';
if(window.NP_INSTRUMENTO_453_LOADER)return;
window.NP_INSTRUMENTO_453_LOADER=true;
function add(src,cb){if(document.querySelector('script[src="'+src+'"]')){cb&&cb();return}var s=document.createElement('script');s.src=src;s.onload=function(){cb&&cb()};document.body.appendChild(s)}
function patchTasks(){
  if(typeof window.taskBank==='function'&&!window.taskBank.__np453){
    var old=window.taskBank;
    var fn=function(s){
      if(s&&Array.isArray(s.direct_tasks)&&s.direct_tasks.length)return s.direct_tasks.slice(0,8);
      return old(s);
    };
    fn.__np453=true;
    window.taskBank=fn;
  }
}
function reload(){patchTasks();if(typeof window.load==='function')window.load()}
if(/instrumento\.html/i.test(location.pathname))add('./scales-453-authorial.js',reload);
})();