/* NeuroPed Master — Biblioteca: render do catálogo público + área reservada por PIN.
   Catálogo: window.NEUROPED_MASTER_LIB · Reservado: window.NEUROPED_MASTER_PRO.
   PIN: window.NeuroPedMasterAccess (isUnlocked / unlockIfPin). */
(function () {
  "use strict";
  var LIB = window.NEUROPED_MASTER_LIB;
  var PRO = window.NEUROPED_MASTER_PRO;
  if (!LIB) return;

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function $(id){ return document.getElementById(id); }
  function unlocked(){ try{ return !!(window.NeuroPedMasterAccess && window.NeuroPedMasterAccess.isUnlocked()); }catch(e){ return false; } }

  /* ---------- estatísticas ---------- */
  var s = LIB.stats || {};
  var statsEl = $('npm-stats');
  if (statsEl) statsEl.innerHTML =
      stat(s.protocolos, 'Protocolos J26')
    + stat(s.escalas, 'Escalas passivas')
    + stat(s.capitulos, 'Capítulos clínicos')
    + stat(s.faixasTEA, 'Faixas TEA')
    + stat(s.classes, 'Classes farmacológicas');
  function stat(b,l){ return '<div class="stat"><b>'+esc(b)+'</b><span>'+esc(l)+'</span></div>'; }

  /* ---------- Sobre a obra ---------- */
  (function(){
    var el = $('sec-sobre'); if (!el) return;
    el.innerHTML =
      '<div class="panel">'
      + '<h2 class="h-sec">A obra</h2>'
      + '<p class="lead">O <strong>NeuroPed Master</strong> reúne, em linguagem clínica autoral, três frentes de trabalho do consultório de neuropediatria: a <strong>leitura passiva</strong> da criança em situação natural, a <strong>organização do raciocínio terapêutico</strong> e a <strong>calibração da carga de intervenção</strong> no TEA. '+esc(LIB.edition)+'.</p>'
      + '<div class="grid" style="margin-top:6px">'
      +   aboutCard('📖','Catálogo aberto','Fundamentos da avaliação e os '+esc(s.protocolos)+' protocolos J26, organizados em '+esc(s.capitulos)+' capítulos clínicos — código, título, tempo e descrição.')
      +   aboutCard('🔒','Área reservada','As '+esc(s.escalas)+' escalas passivas item a item, a farmacoterapia por classe e a diretriz dosimétrica TEA, liberadas por PIN.')
      +   aboutCard('🧭','Cinco macrodomínios','As escalas se organizam em cinco lentes funcionais — da comunicação social à regulação emocional e prognóstico.')
      +   aboutCard('🧩','Diretriz TEA','Matriz de carga horária por faixa etária e nível de suporte DSM-5-TR, com modelos prescritivos e defesa técnica.')
      + '</div>'
      + '<div class="notice"><strong>Direitos reservados.</strong> Esta biblioteca não distribui o PDF integral. O acesso à área reservada é controle de interface por PIN; o material completo depende de autorização do autor.</div>'
      + '<div class="actions">'
      +   '<a class="btn gold" href="./solicitar-neuroped-master.html">✉️ Solicitar e-book</a>'
      +   '<a class="btn ghost" href="./neuroped-master-vitrine.html">Ver a vitrine</a>'
      +   '<a class="btn ghost" href="./central-atalhos.html">← Voltar ao app</a>'
      + '</div>'
      + '</div>';
  })();
  function aboutCard(ic,t,p){ return '<article class="card"><div style="font-size:24px">'+ic+'</div><h3>'+esc(t)+'</h3><p>'+esc(p)+'</p></article>'; }

  /* ---------- Fundamentos ---------- */
  (function(){
    var el = $('sec-fundamentos'); if (!el) return;
    var icons = ['⏳','📈','🧭','👁️','🧩','🤝'];
    el.innerHTML =
      '<h2 class="h-sec">Fundamentos da avaliação</h2>'
      + '<p class="lead">A base conceitual da obra: como observar, o que pesar e quando agir. Leitura aberta.</p>'
      + '<div class="flow">'
      + (LIB.fundamentos||[]).map(function(r,i){
          return '<div class="step"><div class="ico">'+(icons[i]||'•')+'</div><div><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p></div></div>';
        }).join('')
      + '</div>';
  })();

  /* ---------- Protocolos J26 (busca + acordeão) ---------- */
  (function(){
    var el = $('sec-protocolos'); if (!el) return;
    var caps = LIB.capitulos || [];
    el.innerHTML =
      '<h2 class="h-sec">Protocolos J26</h2>'
      + '<p class="lead">'+esc(s.protocolos)+' protocolos autorais em '+esc(s.capitulos)+' capítulos. Busque por código, título ou tema; toque no capítulo para abrir.</p>'
      + '<div class="search"><input id="npm-q" type="search" placeholder="Buscar protocolo (ex.: autismo, J26-028, sono…)" aria-label="Buscar protocolo"><span class="count" id="npm-count"></span></div>'
      + '<div id="npm-chaps"></div>';

    var chapsEl = $('npm-chaps'), q = $('npm-q'), countEl = $('npm-count');
    function render(term){
      term = (term||'').trim().toLowerCase();
      var total = 0;
      chapsEl.innerHTML = caps.map(function(c){
        var hits = (c.protocolos||[]).filter(function(p){
          if (!term) return true;
          return (p[0]+' '+p[1]+' '+p[3]+' '+c.titulo).toLowerCase().indexOf(term) >= 0;
        });
        if (!hits.length) return '';
        total += hits.length;
        var open = term ? ' open' : '';
        return '<details class="chap"'+open+'><summary><span class="n">'+esc(c.n)+'</span>'
          + '<span class="t">'+esc(c.titulo)+'</span>'
          + '<span class="c">'+hits.length+'</span><span class="arw">▸</span></summary>'
          + '<div class="body"><p class="intro">'+esc(c.intro)+'</p>'
          + hits.map(function(p){
              return '<div class="prot"><span class="code">'+esc(p[0])+'</span>'
                + '<div style="flex:1"><h4>'+esc(p[1])+'</h4><p>'+esc(p[3])+'</p></div>'
                + '<span class="time">⏱ '+esc(p[2])+'</span></div>';
            }).join('')
          + '</div></details>';
      }).join('');
      countEl.textContent = term ? (total + ' resultado' + (total===1?'':'s')) : (s.protocolos + ' protocolos');
      if (term && !total) chapsEl.innerHTML = '<div class="panel"><p style="margin:0;color:var(--muted)">Nenhum protocolo encontrado para “'+esc(term)+'”.</p></div>';
    }
    q.addEventListener('input', function(){ render(q.value); });
    render('');
  })();

  /* ---------- Escalas (overview público dos macrodomínios) ---------- */
  (function(){
    var el = $('sec-escalas'); if (!el) return;
    el.innerHTML =
      '<h2 class="h-sec">Escalas passivas · macrodomínios</h2>'
      + '<p class="lead">As '+esc(s.escalas)+' escalas se organizam em cinco lentes de observação funcional. Esta é a visão pública dos blocos; os itens individuais e as matrizes 0–4 ficam na área reservada.</p>'
      + '<div class="panel" style="padding:6px 18px">'
      + (LIB.macrodominios||[]).map(function(r){
          return '<div class="prot" style="align-items:center"><span class="chip g">'+esc(r[0])+'</span>'
            + '<div style="flex:1"><h4 style="font-size:16.5px">'+esc(r[1])+'</h4><p>'+esc(r[2])+'</p></div></div>';
        }).join('')
      + '</div>'
      + '<div class="notice">As escalas item a item — com matriz de respostas 0–4 e frase possível de laudo — estão na aba <strong>Reservada</strong>, liberada por PIN.</div>';
  })();

  /* ---------- Reservada (PIN) ---------- */
  function renderReservada(){
    var el = $('sec-reservada'); if (!el) return;
    if (!unlocked()){
      el.innerHTML =
        '<div class="gate">'
        + '<div class="lock-ico">🔒</div>'
        + '<h3>Área reservada</h3>'
        + '<p>Escalas item a item (matriz 0–4 e laudo), farmacoterapia por classe e diretriz dosimétrica TEA. Informe o <strong>PIN master</strong> para liberar neste navegador.</p>'
        + '<div class="pinrow"><input id="npm-pin" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN master" aria-label="PIN master"><button class="btn" id="npm-pin-go" type="button">Liberar</button></div>'
        + '<div class="hint">O acesso fica ativo apenas neste dispositivo, por tempo limitado. Sem PIN? <a href="./solicitar-neuroped-master.html" style="color:#e7c98b">Solicite ao autor</a>.</div>'
        + '</div>';
      var pin = $('npm-pin'), go = $('npm-pin-go');
      function tryPin(){
        if (!window.NeuroPedMasterAccess){ return; }
        window.NeuroPedMasterAccess.unlockIfPin(pin.value).then(function(ok){
          if (ok || unlocked()) renderReservada();
        }).catch(function(){});
      }
      if (go) go.addEventListener('click', tryPin);
      if (pin) pin.addEventListener('keydown', function(e){ if (e.key === 'Enter') tryPin(); });
      return;
    }
    // desbloqueado
    if (!PRO){ el.innerHTML = '<div class="panel"><p style="margin:0">Conteúdo reservado indisponível.</p></div>'; return; }
    el.innerHTML = reservadaEscalas() + reservadaFarmaco() + reservadaDosimetria();
  }

  function reservadaEscalas(){
    var E = PRO.escalas || {};
    var tipos = (E.tipos||[]).map(function(t){
      return '<div class="panel"><h3 style="font:700 18px Georgia,serif;color:var(--wine);margin:0 0 4px">'+esc(t[0])+'</h3>'
        + '<p class="lead" style="margin:0 0 10px">'+esc(t[1])+'</p>'
        + '<div class="levels">'
        + (t[2]||[]).map(function(l){
            var alert = /alerta/i.test(t[0]) ? ' alert' : '';
            return '<div class="lvl'+alert+'"><div class="b">'+esc(l[0])+'</div><div><b>'+esc(l[1])+'</b><small>'+esc(l[2])+'</small></div></div>';
          }).join('')
        + '</div></div>';
    }).join('');
    var leitura = (E.leitura||[]).map(function(r){
      return '<div class="step"><div class="ico" style="background:linear-gradient(180deg,var(--wine),#6f2531)">✦</div><div><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p></div></div>';
    }).join('');
    var macros = (E.macrodominios||[]).map(function(r){
      return '<div class="prot" style="align-items:center"><span class="chip g">'+esc(r[0])+'</span><div style="flex:1"><h4 style="font-size:16px">'+esc(r[1])+'</h4><p>'+esc(r[2])+'</p></div></div>';
    }).join('');
    return '<h2 class="h-sec">100 Escalas Passivas · sistema 0–4</h2>'
      + '<p class="lead">'+esc(E.principio)+'</p>'
      + tipos
      + '<div class="flow" style="margin-bottom:14px">'+leitura+'</div>'
      + '<div class="panel" style="padding:6px 18px">'+macros+'</div>';
  }

  function reservadaFarmaco(){
    var F = PRO.farmaco || {};
    var blocos = (F.blocos||[]).map(function(b){
      return '<div class="drug"><h4><span class="bn">Bloco '+esc(b.n)+'</span>'+esc(b.titulo)+'</h4>'
        + '<p>'+esc(b.resumo)+'</p>'
        + '<div class="agents">'+(b.agentes||[]).map(function(a){ return '<span>'+esc(a)+'</span>'; }).join('')+'</div></div>';
    }).join('');
    var cals = (F.calendarios||[]).map(function(c){
      return '<div class="prot"><span class="chip t">'+esc(c[0])+'</span><div style="flex:1"><p style="font-size:13.5px">'+esc(c[1])+'</p></div></div>';
    }).join('');
    return '<h2 class="h-sec" style="margin-top:26px">Farmacoterapia · panorama por classe</h2>'
      + '<p class="lead"><strong style="color:var(--wine)">'+esc(F.lema)+'</strong></p>'
      + '<div class="panel">'+blocos+'</div>'
      + '<h3 style="font:700 18px Georgia,serif;color:var(--wine);margin:18px 0 8px">Calendários de monitoração</h3>'
      + '<div class="panel" style="padding:6px 18px">'+cals+'</div>'
      + '<div class="notice">'+esc(F.nota)+'</div>';
  }

  function reservadaDosimetria(){
    var D = PRO.dosimetria || {};
    var m = D.matriz || {};
    var thead = '<tr>'+(m.colunas||[]).map(function(c,i){ return '<th>'+esc(c)+'</th>'; }).join('')+'</tr>';
    var tbody = (m.linhas||[]).map(function(r){
      return '<tr>'+r.map(function(c,i){ return i===0 ? '<td>'+esc(c)+'</td>' : '<td><b>'+esc(c)+'</b></td>'; }).join('')+'</tr>';
    }).join('');
    var modelos = (D.modelos||[]).map(function(r){
      return '<div class="step"><div class="ico">🧩</div><div><h3>'+esc(r[0])+'</h3><p>'+esc(r[1])+'</p></div></div>';
    }).join('');
    var def = D.defesa || {};
    var base = (def.base||[]).map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('');
    return '<h2 class="h-sec" style="margin-top:26px">Diretriz Dosimétrica TEA · Volume II</h2>'
      + '<p class="lead">'+esc(D.intro)+'</p>'
      + '<div class="panel"><table class="matrix"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table>'
      + '<p style="font-size:12px;color:var(--muted);margin:10px 0 0">Horas semanais de referência por faixa etária × nível de suporte DSM-5-TR. Ponto de partida — calibrado por resposta, metas (GAS) e contexto.</p></div>'
      + '<h3 style="font:700 18px Georgia,serif;color:var(--wine);margin:18px 0 8px">Modelos prescritivos</h3>'
      + '<div class="flow">'+modelos+'</div>'
      + '<div class="panel" style="margin-top:14px"><h3 style="font:700 18px Georgia,serif;color:var(--wine);margin:0 0 4px">'+esc(def.titulo)+'</h3>'
      + '<p class="lead" style="margin:0 0 6px">'+esc(def.texto)+'</p><ul class="lawlist">'+base+'</ul></div>'
      + '<div class="notice">Material educacional de apoio. Indicações, doses, faixas e cargas horárias individuais são decisão do médico assistente, conforme bula, diretrizes e a criança avaliada.</div>';
  }

  /* ---------- abas + rota por hash ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var valid = tabs.map(function(t){ return t.dataset.tab; });
  function activate(name, push){
    if (valid.indexOf(name) < 0) name = valid[0];
    tabs.forEach(function(t){
      var on = t.dataset.tab === name;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    document.querySelectorAll('.section').forEach(function(sec){
      sec.classList.toggle('on', sec.dataset.section === name);
    });
    if (name === 'reservada') renderReservada();
    if (push && location.hash.slice(1) !== name){ try{ history.replaceState(null,'','#'+name); }catch(e){} }
    try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(e){ window.scrollTo(0,0); }
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ activate(t.dataset.tab, true); }); });
  window.addEventListener('hashchange', function(){ activate(location.hash.slice(1), false); });

  // re-render reservada quando o PIN é digitado em qualquer lugar (master-access-policy observa inputs)
  window.addEventListener('storage', function(ev){ if (ev.key === 'neuroped_master_access_v1') renderReservada(); });

  var initial = location.hash.slice(1);
  activate(valid.indexOf(initial) >= 0 ? initial : valid[0], false);
})();
