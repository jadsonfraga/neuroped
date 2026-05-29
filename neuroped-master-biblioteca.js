/* NeuroPed Master — Biblioteca: conteúdo educacional aberto + farmacoterapia por PIN.
   Catálogo: window.NEUROPED_MASTER_LIB · Conteúdo da obra: window.NEUROPED_MASTER_PRO.
   Educacional aberto: fundamentos, protocolos J26, 100 escalas, diretriz TEA, referências.
   Protegido por PIN (sensível): farmacoterapia (posologia de medicação).
   As 100 escalas são reconstruídas fielmente dos textos-âncora templados da obra. */
(function () {
  "use strict";
  var LIB = window.NEUROPED_MASTER_LIB;
  var PRO = window.NEUROPED_MASTER_PRO;
  if (!LIB) return;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function $(id){ return document.getElementById(id); }
  function cap(s){ s = String(s||''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function low(s){ s = String(s||''); return s.charAt(0).toLowerCase() + s.slice(1); }
  function unlocked(){ try{ return !!(window.NeuroPedMasterAccess && window.NeuroPedMasterAccess.isUnlocked()); }catch(e){ return false; } }

  /* ---------- ícones vetoriais ---------- */
  var ICON = {
    book:'<path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2z"/><path d="M17 3v16"/>',
    compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 0 2-6z"/>',
    list:'<path d="M8 6h11M8 12h11M8 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    pill:'<path d="M10.5 20.5 4 14a4.95 4.95 0 0 1 7-7l6.5 6.5a4.95 4.95 0 0 1-7 7Z"/><path d="m8.5 8.5 7 7"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    shield:'<path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z"/>',
    book2:'<path d="M3 5a2 2 0 0 1 2-2h6v18H5a2 2 0 0 0-2 2zM21 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
  };
  function svg(name, cls){ return '<svg class="ico '+(cls||'')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[name]||'')+'</svg>'; }

  /* ---------- estatísticas ---------- */
  var s = LIB.stats || {};
  var statsEl = $('npm-stats');
  if (statsEl) statsEl.innerHTML =
      stat(s.protocolos, 'Protocolos J26') + stat(s.escalas, 'Escalas passivas')
    + stat(s.capitulos, 'Capítulos') + stat(s.faixasTEA, 'Faixas TEA') + stat(s.classes, 'Classes');
  function stat(b,l){ return '<div class="stat"><b>'+esc(b)+'</b><span>'+esc(l)+'</span></div>'; }

  /* ---------- Sobre a obra ---------- */
  (function(){
    var el = $('sec-sobre'); if (!el) return;
    el.innerHTML =
      '<div class="panel"><h2 class="h-sec">A obra</h2>'
      + '<p class="lead">O <strong>NeuroPed Master</strong> reúne, em linguagem clínica autoral, a leitura passiva da criança em situação natural, a organização do raciocínio terapêutico e a calibração da carga de intervenção no TEA. '+esc(LIB.edition)+'.</p>'
      + '<div class="grid" style="margin-top:6px">'
      +   aboutCard('book','Fundamentos e protocolos','Base conceitual + '+esc(s.protocolos)+' protocolos J26 em '+esc(s.capitulos)+' capítulos.')
      +   aboutCard('layers','100 escalas passivas','Cada lente item a item, com matriz 0–4 e frase de laudo — leitura aberta.')
      +   aboutCard('grid','Diretriz TEA','Matriz idade × nível DSM-5-TR, modelos e defesa técnica — aberta.')
      +   aboutCard('lock','Farmacoterapia','Posologia de medicação por classe — área sensível, liberada por PIN.')
      + '</div>'
      + '<div class="notice"><strong>Conteúdo educacional.</strong> Os fundamentos, protocolos, escalas e a diretriz são material de apoio à organização do raciocínio clínico — não substituem avaliação profissional. A farmacoterapia (doses) fica protegida por PIN por ser conteúdo prescritivo sensível.</div>'
      + '<div class="actions">'
      +   '<a class="btn gold" href="./solicitar-neuroped-master.html">'+svg('mail')+'Solicitar e-book completo</a>'
      +   '<a class="btn ghost" href="./neuroped-master-vitrine.html">Ver a vitrine</a>'
      +   '<a class="btn ghost" href="./central-atalhos.html">← Voltar ao app</a>'
      + '</div></div>';
  })();
  function aboutCard(ic,t,p){ return '<article class="card"><div class="card-ic">'+svg(ic)+'</div><h3>'+esc(t)+'</h3><p>'+esc(p)+'</p></article>'; }

  /* ---------- Fundamentos ---------- */
  (function(){
    var el = $('sec-fundamentos'); if (!el) return;
    var icons = ['clock','layers','compass','search','grid','shield'];
    el.innerHTML =
      '<h2 class="h-sec">Fundamentos da avaliação</h2>'
      + '<p class="lead">A base conceitual da obra: como observar, o que pesar e quando agir.</p>'
      + '<div class="flow">'
      + (LIB.fundamentos||[]).map(function(r,i){ return '<div class="step"><div class="ico-box">'+svg(icons[i]||'compass')+'</div><div><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p></div></div>'; }).join('')
      + '</div>';
  })();

  /* ---------- Protocolos J26 ---------- */
  (function(){
    var el = $('sec-protocolos'); if (!el) return;
    var caps = LIB.capitulos || [];
    el.innerHTML =
      '<h2 class="h-sec">Protocolos J26</h2>'
      + '<p class="lead">'+esc(s.protocolos)+' protocolos autorais em '+esc(s.capitulos)+' capítulos. Busque por código, título ou tema; toque no capítulo para abrir.</p>'
      + '<div class="search">'+svg('search','s-ico')+'<input id="npm-q" type="search" placeholder="Buscar protocolo (ex.: autismo, J26-028, sono…)" aria-label="Buscar protocolo"><span class="count" id="npm-count"></span></div>'
      + '<div id="npm-chaps"></div>';
    var chapsEl = $('npm-chaps'), q = $('npm-q'), countEl = $('npm-count');
    function render(term){
      term = (term||'').trim().toLowerCase(); var total = 0;
      chapsEl.innerHTML = caps.map(function(c){
        var hits = (c.protocolos||[]).filter(function(p){ return !term || (p[0]+' '+p[1]+' '+p[3]+' '+c.titulo).toLowerCase().indexOf(term) >= 0; });
        if (!hits.length) return ''; total += hits.length;
        return '<details class="chap"'+(term?' open':'')+'><summary><span class="n">'+esc(c.n)+'</span><span class="t">'+esc(c.titulo)+'</span><span class="c">'+hits.length+'</span><span class="arw">▸</span></summary>'
          + '<div class="body"><p class="intro">'+esc(c.intro)+'</p>'
          + hits.map(function(p){ return '<div class="prot"><span class="code">'+esc(p[0])+'</span><div style="flex:1"><h4>'+esc(p[1])+'</h4><p>'+esc(p[3])+'</p></div><span class="time">'+svg('clock','t-ico')+esc(p[2])+'</span></div>'; }).join('')
          + '</div></details>';
      }).join('');
      countEl.textContent = term ? (total+' resultado'+(total===1?'':'s')) : (s.protocolos+' protocolos');
      if (term && !total) chapsEl.innerHTML = '<div class="panel"><p style="margin:0;color:var(--muted)">Nenhum protocolo encontrado para “'+esc(term)+'”.</p></div>';
    }
    q.addEventListener('input', function(){ render(q.value); }); render('');
  })();

  /* ===================== GERADOR DAS 100 ESCALAS ===================== */
  function buildScale(item){
    var E = PRO.escalas, md = E.macrodominios[item[2]], tipo = E.tipos[item[3]==='a'?'alerta':'competencia'];
    var nome = item[1], nL = low(nome);
    function fill(t){ return t.replace(/\{N\}/g, cap(nome)).replace(/\{n\}/g, nL).replace(/\{imp\}/g, md.impacto); }
    var niveis = tipo.ancoragem.map(function(a,i){ return { n:i, rotulo:tipo.rotulos[i], ancora:fill(a), fala:tipo.falas[i] }; });
    return {
      n:item[0], nome:nome, tipo:item[3]==='a'?'alerta':'competência', md:md.titulo, faixa:md.faixa,
      legenda:tipo.legenda, niveis:niveis,
      observa:'Este item observa como "'+nome+'" '+md.observa+'.', vidaReal:md.vidaReal,
      traducao:fill(tipo.traducao), armadilha:fill(tipo.armadilha), laudo:fill(tipo.laudo), peso:fill(tipo.peso)
    };
  }
  function renderScaleCard(sc){
    var matriz = '<div class="levels">' + sc.niveis.map(function(l){
      return '<div class="lvl'+(sc.tipo==='alerta'?' alert':'')+'"><div class="b">'+l.n+'</div><div><b>'+esc(l.rotulo)+'</b><small>'+esc(l.ancora)+'</small><em class="fala">“'+esc(l.fala)+'”</em></div></div>';
    }).join('') + '</div>';
    return '<details class="chap scale"><summary>'
      + '<span class="n">'+sc.n+'</span><span class="t">'+esc(sc.nome)+'</span>'
      + '<span class="c '+(sc.tipo==='alerta'?'alert':'comp')+'">'+(sc.tipo==='alerta'?'alerta':'comp.')+'</span><span class="arw">▸</span></summary>'
      + '<div class="body"><p class="intro">'+esc(sc.observa)+'</p>'
      + block('Como costuma aparecer na vida real', sc.vidaReal)
      + block('Tradução clínica silenciosa', sc.traducao)
      + block('Preservação e armadilha de leitura', sc.armadilha)
      + '<div class="legend">'+esc(sc.legenda)+'</div>' + matriz
      + block('Frase possível de laudo', sc.laudo)
      + block('Quando ganha peso documental', sc.peso)
      + '</div></details>';
  }
  function block(t,c){ return '<div class="sub-block"><h5>'+esc(t)+'</h5><p>'+esc(c)+'</p></div>'; }

  /* ---------- 100 Escalas (público) ---------- */
  (function(){
    var el = $('sec-escalas'); if (!el || !PRO) return;
    var E = PRO.escalas;
    el.innerHTML =
      '<h2 class="h-sec">100 Escalas Passivas · sistema 0–4</h2>'
      + '<p class="lead">'+esc(E.principio)+'</p>'
      + '<div class="search">'+svg('search','s-ico')+'<input id="esc-q" type="search" placeholder="Buscar escala (ex.: contato ocular, ecolalia, sono…)" aria-label="Buscar escala"><span class="count" id="esc-count"></span></div>'
      + '<div id="esc-list"></div>'
      + '<div class="notice" style="margin-top:16px">'+esc(E.fechamento)+'</div>';
    var listEl = $('esc-list'), q = $('esc-q'), countEl = $('esc-count');
    var scales = E.itens.map(buildScale);
    function render(term){
      term = (term||'').trim().toLowerCase(); var total = 0;
      listEl.innerHTML = E.macrodominios.map(function(md){
        var hits = scales.filter(function(sc){ return sc.md===md.titulo && (!term || (sc.n+' '+sc.nome+' '+sc.md).toLowerCase().indexOf(term) >= 0); });
        if (!hits.length) return ''; total += hits.length;
        return '<div class="md-group"><div class="md-head"><span class="chip g">'+esc(md.faixa)+'</span><h3>'+esc(md.titulo)+'</h3><span class="md-count">'+hits.length+'</span></div>'
          + hits.map(renderScaleCard).join('') + '</div>';
      }).join('');
      countEl.textContent = term ? (total+' escala'+(total===1?'':'s')) : (E.itens.length+' escalas');
      if (term && !total) listEl.innerHTML = '<div class="panel"><p style="margin:0;color:var(--muted)">Nenhuma escala encontrada para “'+esc(term)+'”.</p></div>';
    }
    q.addEventListener('input', function(){ render(q.value); }); render('');
  })();

  /* ---------- Diretriz TEA + Referências (público) ---------- */
  (function(){
    var el = $('sec-diretriz'); if (!el || !PRO) return;
    var D = PRO.dosimetria, m = D.matriz;
    var thead = '<tr>'+(m.colunas||[]).map(function(c){ return '<th>'+esc(c)+'</th>'; }).join('')+'</tr>';
    var tbody = (m.linhas||[]).map(function(r){ return '<tr>'+r.map(function(c,i){ return i===0 ? '<td>'+esc(c)+'</td>' : '<td><b>'+esc(c)+'</b></td>'; }).join('')+'</tr>'; }).join('');
    var sobe = (D.modulacao.sobe||[]).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('');
    var desce = (D.modulacao.desce||[]).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('');
    var modelos = (D.modelos||[]).map(function(r){ return '<div class="step"><div class="ico-box">'+svg('grid')+'</div><div><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p></div></div>'; }).join('');
    var def = D.defesa, base = (def.base||[]).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('');
    var estudos = (D.estudos||[]).map(function(e){ return '<div class="study"><h4>'+esc(e[0])+'</h4><p>'+esc(e[1])+'</p><span class="doi">'+esc(e[2])+'</span></div>'; }).join('');
    var refs = (PRO.referencias||[]).map(function(r){ return '<div class="prot"><span class="chip t">'+esc(r[0])+'</span><div style="flex:1"><p style="font-size:13.5px;margin:0">'+esc(r[1])+'</p></div></div>'; }).join('');
    el.innerHTML =
      '<h2 class="h-sec">Diretriz Dosimétrica TEA</h2>'
      + '<p class="lead">'+esc(D.intro)+'</p>'
      + '<div class="panel"><table class="matrix"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table>'
      + '<p style="font-size:12px;color:var(--muted);margin:10px 0 0">Horas semanais de referência por faixa etária × nível DSM-5-TR.</p></div>'
      + '<div class="grid2"><div class="panel mod up"><h3 class="h-min">↑ Modulação para cima</h3><ul class="lawlist">'+sobe+'</ul></div>'
      +   '<div class="panel mod down"><h3 class="h-min">↓ Modulação para baixo</h3><ul class="lawlist">'+desce+'</ul></div></div>'
      + '<h3 class="h-min">Modelos prescritivos</h3><div class="flow">'+modelos+'</div>'
      + '<div class="panel" style="margin-top:14px"><h3 class="h-min" style="margin-top:0">'+esc(def.titulo)+'</h3><p class="lead" style="margin:0 0 6px">'+esc(def.texto)+'</p><ul class="lawlist">'+base+'</ul></div>'
      + '<h3 class="h-min">Estudos-chave</h3><div class="grid">'+estudos+'</div>'
      + '<h3 class="h-min">Referências PubMed</h3><div class="panel" style="padding:6px 18px">'+refs+'</div>'
      + '<div class="notice">Material educacional de apoio. Indicações, doses, faixas e cargas horárias individuais são decisão do médico assistente, conforme bula, diretrizes e a criança avaliada.</div>';
  })();

  /* ---------- Farmacoterapia (protegida por PIN) ---------- */
  function renderFarmacoBody(){
    var F = PRO.farmaco;
    var blocos = (F.blocos||[]).map(function(b){
      var body;
      if (b.drogas){
        body = b.drogas.map(function(d){
          return '<div class="drug"><h4><span class="bn">'+esc(d[0])+'</span><span class="brand">'+esc(d[1])+'</span></h4>'
            + drugRow('Indicações', d[2]) + drugRow('Efeitos', d[3]) + drugRow('Faixa etária', d[4]) + drugRow('Posologia', d[5]) + '</div>';
        }).join('');
      } else { body = '<div class="agents">'+(b.agentes||[]).map(function(a){ return '<span>'+esc(a)+'</span>'; }).join('')+'</div>'; }
      return '<details class="chap"><summary><span class="n">'+b.n+'</span><span class="t">'+esc(b.titulo)+'</span><span class="arw">▸</span></summary>'
        + '<div class="body"><p class="intro">'+esc(b.resumo)+'</p>'+body+'</div></details>';
    }).join('');
    var cals = (F.calendarios||[]).map(function(c){ return '<div class="prot"><span class="chip t">'+esc(c[0])+'</span><div style="flex:1"><p style="font-size:13.5px">'+esc(c[1])+'</p></div></div>'; }).join('');
    return '<h2 class="h-sec">Farmacoterapia · panorama por classe</h2>'
      + '<p class="lead"><strong style="color:var(--wine)">'+esc(F.lema)+'</strong></p>'
      + blocos
      + '<h3 class="h-min">Calendários de monitoração</h3><div class="panel" style="padding:6px 18px">'+cals+'</div>'
      + '<div class="notice">'+esc(F.nota)+'</div>';
  }
  function drugRow(k,v){ return '<p><span class="dk">'+esc(k)+'</span>'+esc(v)+'</p>'; }

  function renderFarmaco(){
    var el = $('sec-farmaco'); if (!el) return;
    if (!unlocked()){
      el.innerHTML =
        '<div class="gate"><div class="lock-ico">'+svg('lock')+'</div><h3>Farmacoterapia · acesso restrito</h3>'
        + '<p>Posologia de medicação por classe é conteúdo prescritivo sensível. Informe o <strong>PIN master</strong> para liberar neste navegador.</p>'
        + '<div class="pinrow"><input id="npm-pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN master" aria-label="PIN master"><button class="btn" id="npm-pin-go" type="button">Liberar</button></div>'
        + '<div class="hint">Acesso ativo apenas neste dispositivo, por tempo limitado. Sem PIN? <a href="./solicitar-neuroped-master.html" style="color:#e7c98b">Solicite ao autor</a>.</div></div>';
      var pin = $('npm-pin'), go = $('npm-pin-go');
      function tryPin(){ if (!window.NeuroPedMasterAccess) return;
        window.NeuroPedMasterAccess.unlockIfPin(pin.value).then(function(ok){ if (ok || unlocked()){ skeleton(el); setTimeout(renderFarmaco, 350); } }).catch(function(){}); }
      if (go) go.addEventListener('click', tryPin);
      if (pin) pin.addEventListener('keydown', function(e){ if (e.key==='Enter') tryPin(); });
      return;
    }
    if (!PRO){ el.innerHTML = '<div class="panel"><p style="margin:0">Conteúdo indisponível.</p></div>'; return; }
    el.innerHTML = renderFarmacoBody();
  }

  function skeleton(el){
    el.innerHTML = '<div class="sk-wrap"><div class="sk sk-line w60"></div><div class="sk sk-line w90"></div><div class="sk sk-line w80"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div>';
  }

  /* ---------- abas + rota por hash ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var valid = tabs.map(function(t){ return t.dataset.tab; });
  function activate(name, push){
    if (valid.indexOf(name) < 0) name = valid[0];
    tabs.forEach(function(t){ var on = t.dataset.tab===name; t.classList.toggle('on', on); t.setAttribute('aria-selected', on?'true':'false'); });
    document.querySelectorAll('.section').forEach(function(sec){ sec.classList.toggle('on', sec.dataset.section===name); });
    if (name==='farmaco') renderFarmaco();
    if (push && location.hash.slice(1)!==name){ try{ history.replaceState(null,'','#'+name); }catch(e){} }
    try{ window.scrollTo({ top:0, behavior:'smooth' }); }catch(e){ window.scrollTo(0,0); }
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ activate(t.dataset.tab, true); }); });
  window.addEventListener('hashchange', function(){ activate(location.hash.slice(1), false); });
  window.addEventListener('storage', function(ev){ if (ev.key==='neuroped_master_access_v1') renderFarmaco(); });

  var tabIco = { sobre:'book', fundamentos:'compass', protocolos:'list', escalas:'layers', diretriz:'grid', farmaco:'pill' };
  tabs.forEach(function(t){ var k = tabIco[t.dataset.tab]; if (k) t.insertAdjacentHTML('afterbegin', svg(k,'tab-ico')); });

  var initial = location.hash.slice(1);
  activate(valid.indexOf(initial)>=0 ? initial : valid[0], false);
})();
