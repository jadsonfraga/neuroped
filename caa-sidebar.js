(function(){
  function n(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
  function make(){
    var a=document.createElement('a');
    a.href='./comunicacao-alternativa.html';
    a.textContent='💬 CAA';
    a.setAttribute('aria-label','CAA');
    a.style.cssText='display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin:4px 0;padding:10px 12px;border-radius:12px;text-decoration:none;color:#1a6b65;background:rgba(26,107,101,.08);border:1px solid rgba(26,107,101,.22);font-weight:800';
    return a;
  }
  function run(){
    if(document.querySelector('a[href="./comunicacao-alternativa.html"]')) return true;
    var items=[].slice.call(document.querySelectorAll('a,button,[role="button"],li,span,div'));
    var sec=null;
    for(var i=0;i<items.length;i++){
      var el=items[i];
      if(n(el.textContent).indexOf('secretaria')<0) continue;
      var row=el.closest('a,button,[role="button"],li')||el;
      var r=row.getBoundingClientRect();
      if(r.left<420 && r.width>80 && r.height>12 && r.height<110){sec=row;break;}
    }
    if(!sec) return false;
    sec.insertAdjacentElement('afterend',make());
    return true;
  }
  var k=0,t=setInterval(function(){k++; if(run()||k>80) clearInterval(t);},250);
})();
