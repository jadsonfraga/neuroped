/* =====================================================================
   NeuroPed EDJ — Tour guiado de boas-vindas
   Abre no primeiro acesso, ensina passo a passo as potencialidades.
   Botão "?" flutuante para rever a qualquer momento. window.npTour() recomeça.
   Camada externa (não toca no build). Spotlight + carrossel, tema índigo.
   ===================================================================== */
(function () {
  "use strict";
  if (window.__npTour) return; window.__npTour = true;
  var DONE_KEY = 'np_tour_v1_done';
  var INTRO_KEY = 'np_tour_intro_v1';   // destaque grande do botão só na 1ª visita

  var css = ''
    + '.npt-back{position:fixed;inset:0;z-index:99998;background:rgba(8,8,20,.55);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0;transition:opacity .3s ease}'
    + '.npt-back.on{opacity:1}'
    + '.npt-hole{position:fixed;z-index:99999;border-radius:18px;box-shadow:0 0 0 9999px rgba(8,8,20,.62),0 0 0 3px hsl(243 85% 66%),0 0 32px 4px hsl(243 85% 66% / .6);transition:all .35s cubic-bezier(.22,.8,.2,1);pointer-events:none}'
    + '.npt-card{position:fixed;z-index:100000;max-width:344px;width:calc(100vw - 36px);background:linear-gradient(180deg,#15152a,#101022);color:#eee;border:1px solid hsl(243 50% 42% / .55);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.05) inset;padding:18px 18px 14px;font-family:"DM Sans",Inter,system-ui,sans-serif;transition:left .35s cubic-bezier(.22,.8,.2,1),top .35s cubic-bezier(.22,.8,.2,1)}'
    + '.npt-emoji{font-size:30px;line-height:1;margin-bottom:8px}'
    + '.npt-title{font:700 19px/1.2 "DM Sans",Inter,sans-serif;letter-spacing:-.02em;margin:0 0 6px;color:#fff}'
    + '.npt-body{font-size:14px;line-height:1.55;color:#c7c7e6;margin:0 0 14px}'
    + '.npt-row{display:flex;align-items:center;justify-content:space-between;gap:10px}'
    + '.npt-dots{display:flex;gap:6px}'
    + '.npt-dot{width:7px;height:7px;border-radius:50%;background:hsl(243 30% 45%);transition:.2s}'
    + '.npt-dot.on{background:hsl(243 85% 66%);box-shadow:0 0 8px hsl(243 85% 66%)}'
    + '.npt-btns{display:flex;gap:8px}'
    + '.npt-btn{border:0;border-radius:11px;padding:9px 14px;font:700 13px "DM Sans",Inter,sans-serif;cursor:pointer}'
    + '.npt-skip{background:transparent;color:#9a9ac0}'
    + '.npt-x{position:absolute;top:10px;right:10px;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.08);color:#c7c7e6;font:700 17px system-ui;line-height:1;cursor:pointer;display:grid;place-items:center;transition:.2s}'
    + '.npt-x:hover{background:rgba(255,255,255,.16);color:#fff}'
    + '.npt-prev{background:rgba(255,255,255,.09);color:#e6e6ff}'
    + '.npt-next{background:linear-gradient(180deg,hsl(243 82% 64%),hsl(250 76% 56%));color:#fff;box-shadow:0 8px 20px -6px hsl(243 85% 55% / .7)}'
    + '.npt-help{position:fixed;z-index:99990;right:16px;bottom:calc(86px + env(safe-area-inset-bottom,0px));width:46px;height:46px;border-radius:50%;border:0;background:linear-gradient(180deg,hsl(243 82% 64%),hsl(250 76% 56%));color:#fff;font:800 20px system-ui;cursor:pointer;box-shadow:0 10px 28px -6px hsl(243 85% 55% / .7);opacity:.9;transition:transform .2s}'
    + '.npt-help:hover{transform:scale(1.08);opacity:1}'
    + '.npt-help.npt-intro{width:auto;height:60px;padding:0 22px 0 18px;border-radius:30px;font:800 16px system-ui;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;opacity:1;box-shadow:0 18px 44px -8px hsl(243 85% 55% / .9),0 0 0 7px hsl(243 85% 62% / .18);animation:nptIntroPulse 1.15s ease-in-out infinite}'
    + '@keyframes nptIntroPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}'
    + '@media(prefers-reduced-motion:reduce){.npt-help.npt-intro{animation:none}}'
    + '@media(prefers-reduced-motion:reduce){.npt-back,.npt-hole,.npt-card{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function vis(e){ if(!e) return null; var r=e.getBoundingClientRect(); return (r.width>0&&r.height>0)?e:null; }
  function q(sel){ try{ return vis(document.querySelector(sel)); }catch(e){ return null; } }
  function byText(re, sel){
    var els = document.querySelectorAll(sel || '*');
    for (var i=0;i<els.length;i++){ var e=els[i]; if(e.children.length<=3 && re.test((e.textContent||'').trim())){ var r=e.getBoundingClientRect(); if(r.width>0&&r.height>0&&r.top<innerHeight+200&&r.bottom>-200) return e; } }
    return null;
  }

  var STEPS = [
    { emoji:'👋', title:'Bem-vindo ao NeuroPed EDJ', body:'Em 1 minutinho eu mostro o essencial do app de neuropediatria do Dr. Jadson Fraga. Vamos juntos?' },
    { emoji:'🔎', title:'Busca universal', body:'Digite uma queixa — autismo, sono, TDAH — e o app encontra as escalas e ferramentas certas na hora.', find:function(){return q('input[placeholder*="procura" i]')||q('input[type="search"]');} },
    { emoji:'📊', title:'Mais de 500 escalas', body:'Em “Encontrar Escala” você acessa o banco de instrumentos organizado por queixa e faixa etária.', find:function(){return vis(document.querySelectorAll('.card-premium')[0]);} },
    { emoji:'🧒', title:'Testes com a criança', body:'Testes diretos e lúdicos: cognitivo, reconhecimento visual, motricidade e pedagógico — por idade, com mascotes.', find:function(){return byText(/TESTES COM A CRIAN/i)||vis(document.querySelectorAll('.card-premium')[1]);} },
    { emoji:'💬', title:'CAA Gratuita', body:'Comunicação alternativa com voz em português, cartões grandes, favoritos e montagem de frases.', find:function(){return byText(/^CAA$/i,'a,button,span,div');} },
    { emoji:'👨‍👩‍👧', title:'Portal da Família', body:'Conteúdo educativo livre: marcos do desenvolvimento, orientações e psicoeducação para as famílias.', find:function(){return byText(/Fam[íi]lia/i,'a,button,span,div');} },
    { emoji:'🔒', title:'Ambiente demonstrativo', body:'Esta versão é para conhecer o app: nenhum dado real de paciente é salvo no dispositivo. Use à vontade.' },
    { emoji:'✨', title:'Tudo pronto!', body:'Toque no botão “?” no canto inferior sempre que quiser rever este tour. Bom trabalho, Dr. Jadson!' }
  ];

  var idx = 0, back, hole, card, started = false;

  function clearAll(){ [back, hole, card].forEach(function(n){ if(n&&n.parentNode) n.parentNode.removeChild(n); }); back=hole=card=null; }
  function finish(){ clearAll(); try{ localStorage.setItem(DONE_KEY,'1'); }catch(e){} ensureHelp(); }

  function positionCard(target){
    var cw = card.offsetWidth || 320, ch = card.offsetHeight || 200, m = 14;
    if (target){ var r = target.getBoundingClientRect(); var top = r.bottom + 12; if (top + ch > innerHeight - m) top = Math.max(m, r.top - ch - 12); var left = Math.min(Math.max(m, r.left), innerWidth - cw - m); card.style.left = left+'px'; card.style.top = top+'px'; card.style.transform='none'; }
    else { card.style.left='50%'; card.style.top='50%'; card.style.transform='translate(-50%,-50%)'; }
  }

  function show(i){
    idx = Math.max(0, Math.min(STEPS.length-1, i));
    var s = STEPS[idx];
    if (!back){ back = el('div','npt-back'); document.body.appendChild(back); requestAnimationFrame(function(){ back && back.classList.add('on'); }); }
    if (hole && hole.parentNode){ hole.parentNode.removeChild(hole); hole=null; }
    if (!card){ card = el('div','npt-card'); document.body.appendChild(card); }
    var target = s.find ? s.find() : null;
    if (target){
      try{ target.scrollIntoView({block:'center', behavior:'smooth'}); }catch(e){}
      var r = target.getBoundingClientRect();
      hole = el('div','npt-hole');
      hole.style.left=(r.left-6)+'px'; hole.style.top=(r.top-6)+'px'; hole.style.width=(r.width+12)+'px'; hole.style.height=(r.height+12)+'px';
      document.body.appendChild(hole);
    }
    var dots=''; for (var d=0; d<STEPS.length; d++) dots += '<span class="npt-dot'+(d===idx?' on':'')+'"></span>';
    card.innerHTML = '<button class="npt-x" aria-label="Pular e fechar o guia">&times;</button>'
      + '<div class="npt-emoji">'+s.emoji+'</div>'
      + '<h3 class="npt-title">'+s.title+'</h3>'
      + '<p class="npt-body">'+s.body+'</p>'
      + '<div class="npt-row"><div class="npt-dots">'+dots+'</div><div class="npt-btns">'
      + (idx>0 ? '<button class="npt-btn npt-prev">Anterior</button>' : '')
      + '<button class="npt-btn npt-skip">'+(idx>0 ? 'Pular guia' : 'Pular')+'</button>'
      + '<button class="npt-btn npt-next">'+(idx===STEPS.length-1 ? 'Concluir' : 'Próximo')+'</button>'
      + '</div></div>';
    positionCard(target);
    card.querySelector('.npt-next').onclick = function(){ idx===STEPS.length-1 ? finish() : show(idx+1); };
    var p = card.querySelector('.npt-prev'); if (p) p.onclick = function(){ show(idx-1); };
    var sk = card.querySelector('.npt-skip'); if (sk) sk.onclick = finish;
    var xb = card.querySelector('.npt-x'); if (xb) xb.onclick = finish;
    // ESC também fecha/pula o guia
    if (!card.__escBound){ card.__escBound = true; document.addEventListener('keydown', function onEsc(ev){ if(ev.key==='Escape'){ document.removeEventListener('keydown', onEsc); finish(); } }); }
  }

  function ensureHelp(){ if (document.querySelector('.npt-help')) return; var h = el('button','npt-help','?'); h.setAttribute('aria-label','Rever tour do app'); h.title='Rever tour'; h.onclick = function(){ show(0); }; document.body.appendChild(h);
    // 1ª visita (por aparelho): destaca o botão BEM GRANDE por 5s, depois encolhe.
    var seen=false; try{ seen = localStorage.getItem(INTRO_KEY)==='1'; }catch(e){}
    if(!seen){ try{ localStorage.setItem(INTRO_KEY,'1'); }catch(e){}
      h.classList.add('npt-intro'); h.innerHTML='🧭 Tour do app';
      setTimeout(function(){ h.classList.remove('npt-intro'); h.innerHTML='?'; }, 5000);
    }
  }

  function ready(){ var r = document.getElementById('root'); if(!r) return false; var t = (document.body.innerText||''); return r.children.length>0 && r.innerText.trim().length>60 && t.indexOf('143 Medicações')<0; }
  function boot(){
    if (started) return;
    var tries=0;
    var iv=setInterval(function(){
      tries++;
      if (ready()){ clearInterval(iv); started=true; ensureHelp(); /* tour NÃO abre sozinho ao iniciar o app — só pelo botão "?" (npTour) */ }
      else if (tries>70){ clearInterval(iv); ensureHelp(); }
    }, 300);
  }
  if (document.readyState!=='loading') boot(); else window.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('resize', function(){ if (card){ var s=STEPS[idx]; positionCard(s.find?s.find():null); } });
  window.npTour = function(){ show(0); };
})();
