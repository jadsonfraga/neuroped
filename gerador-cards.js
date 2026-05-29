/* NeuroPed Master — Gerador de cards com marca.
   Transforma protocolos J26, escalas, fundamentos, macrodomínios e a diretriz
   TEA em um card visual (PNG) ou PDF (impressão), com a marca do Dr. Jadson
   Fraga. 100% client-side, sem dependências. Conteúdo educacional apenas
   (farmacoterapia não entra no gerador). */
(function () {
  "use strict";
  var LIB = window.NEUROPED_MASTER_LIB || {};
  var PRO = window.NEUROPED_MASTER_PRO || {};

  function $(id){ return document.getElementById(id); }
  function low(s){ s = String(s||''); return s.charAt(0).toLowerCase() + s.slice(1); }

  /* ---------- extração de conteúdo (só educacional) ---------- */
  function protocolos(){
    var out = [];
    (LIB.capitulos||[]).forEach(function(c){
      (c.protocolos||[]).forEach(function(p){
        out.push({ kind:'protocolo', eyebrow:'PROTOCOLO J26', title:p[1],
          meta:p[0] + '  ·  ' + p[2] + '  ·  Cap. ' + c.n + ' ' + c.titulo,
          body:p[3], key:p[0] + ' ' + p[1] });
      });
    });
    return out;
  }
  function escalas(){
    var E = PRO.escalas; if (!E) return [];
    return (E.itens||[]).map(function(it){
      var md = E.macrodominios[it[2]], tipo = E.tipos[it[3]==='a'?'alerta':'competencia'];
      var nome = it[1];
      var laudo = tipo.laudo.replace(/\{N\}/g, nome).replace(/\{n\}/g, low(nome)).replace(/\{imp\}/g, md.impacto);
      var rotulos = tipo.rotulos.map(function(r,i){ return i + ' ' + r; });
      return { kind:'escala', eyebrow:'ESCALA PASSIVA · ' + (it[3]==='a'?'ALERTA':'COMPETÊNCIA'),
        title:nome, meta:it[0] + '/100  ·  ' + md.titulo,
        body:laudo, bullets:rotulos, bulletsTitle:'Matriz 0–4', key:it[0] + ' ' + nome + ' ' + md.titulo };
    });
  }
  function fundamentos(){
    return (LIB.fundamentos||[]).map(function(r){ return { kind:'fundamento', eyebrow:'FUNDAMENTO', title:r[0], meta:'NeuroPed Master · Parte I', body:r[1], key:r[0] }; });
  }
  function macrodominios(){
    return (LIB.macrodominios||[]).map(function(r){ return { kind:'macro', eyebrow:'MACRODOMÍNIO', title:r[1], meta:'Escalas ' + r[0], body:r[2], key:r[1] }; });
  }
  function diretriz(){
    var D = PRO.dosimetria; if (!D) return [];
    return [{ kind:'diretriz', eyebrow:'DIRETRIZ DOSIMÉTRICA TEA', title:'Carga horária semanal',
      meta:'por faixa etária × nível DSM-5-TR', table:D.matriz,
      body:'Horas semanais de referência (soma das modalidades nucleares). Ponto de partida, calibrado por resposta, metas e contexto.', key:'diretriz dosimétrica tea matriz' }];
  }

  var TYPES = {
    protocolo: { label:'Protocolo J26', get:protocolos },
    escala:    { label:'Escala passiva', get:escalas },
    diretriz:  { label:'Diretriz TEA',  get:diretriz },
    fundamento:{ label:'Fundamento',    get:fundamentos },
    macro:     { label:'Macrodomínio',  get:macrodominios }
  };

  /* ---------- canvas helpers ---------- */
  var W = 1080, H = 1350, S = 2;
  function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function wrap(ctx, text, x, y, maxW, lh, maxLines){
    var words = String(text||'').split(/\s+/), line = '', n = 0;
    for (var i=0;i<words.length;i++){
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line){
        n++;
        if (maxLines && n >= maxLines){ // ellipsis
          while (ctx.measureText(line + '…').width > maxW && line.length) line = line.slice(0,-1);
          ctx.fillText(line + '…', x, y); return y + lh;
        }
        ctx.fillText(line, x, y); y += lh; line = words[i];
      } else line = test;
    }
    if (line){ ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  function render(spec){
    var cv = $('npc-canvas'); if (!cv || !spec) return;
    cv.width = W*S; cv.height = H*S;
    var ctx = cv.getContext('2d'); ctx.setTransform(S,0,0,S,0,0);
    ctx.textBaseline = 'alphabetic';

    /* fundo índigo + aurora */
    var bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#0a0a16'); bg.addColorStop(.6,'#14132e'); bg.addColorStop(1,'#0a0a16');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
    var a1 = ctx.createRadialGradient(120,-40,0,120,-40,720); a1.addColorStop(0,'rgba(109,106,245,.36)'); a1.addColorStop(1,'rgba(109,106,245,0)');
    ctx.fillStyle = a1; ctx.fillRect(0,0,W,H);
    var a2 = ctx.createRadialGradient(W+60,120,0,W+60,120,640); a2.addColorStop(0,'rgba(168,85,247,.26)'); a2.addColorStop(1,'rgba(168,85,247,0)');
    ctx.fillStyle = a2; ctx.fillRect(0,0,W,H);

    /* moldura dourada */
    ctx.strokeStyle = 'rgba(184,150,62,.55)'; ctx.lineWidth = 2; rr(ctx,34,34,W-68,H-68,26); ctx.stroke();

    var M = 84, x = M, maxW = W - M*2;

    /* selo NP */
    ctx.strokeStyle = 'rgba(231,201,139,.9)'; ctx.lineWidth = 3; rr(ctx,x,96,92,92,22); ctx.stroke();
    ctx.fillStyle = '#f2dca6'; ctx.font = '700 46px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('NP', x+46, 158);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f2dca6'; ctx.font = '700 26px Georgia, serif';
    ctx.fillText('NeuroPed Master', x+112, 132);
    ctx.fillStyle = '#bcb9e6'; ctx.font = '600 17px system-ui, sans-serif';
    ctx.fillText('Dr. Jadson Fraga · Neuropediatria', x+112, 162);

    /* eyebrow chip */
    var ey = spec.eyebrow || '';
    ctx.font = '800 16px system-ui, sans-serif';
    var ew = ctx.measureText(ey).width + 28;
    ctx.fillStyle = 'rgba(231,201,139,.95)'; rr(ctx,x,232,ew,34,8); ctx.fill();
    ctx.fillStyle = '#15143a'; ctx.fillText(ey, x+14, 255);

    /* título */
    ctx.fillStyle = '#fbf6ea'; ctx.font = '700 58px Georgia, serif';
    var y = wrap(ctx, spec.title, x, 330, maxW, 66, 3);

    /* meta */
    if (spec.meta){ ctx.fillStyle = '#a9a4ff'; ctx.font = 'italic 22px Georgia, serif'; y = wrap(ctx, spec.meta, x, y+8, maxW, 30, 2); }

    y += 28;
    /* corpo */
    if (spec.table){ y = drawTable(ctx, spec.table, x, y, maxW); }
    if (spec.bullets){
      ctx.fillStyle = '#e7c98b'; ctx.font = '800 15px system-ui, sans-serif';
      ctx.fillText((spec.bulletsTitle||'').toUpperCase(), x, y); y += 26;
      ctx.font = '600 21px system-ui, sans-serif'; ctx.fillStyle = '#cfccf2';
      spec.bullets.forEach(function(b){ y = wrap(ctx, '•  ' + b, x, y, maxW, 30, 1); });
      y += 14;
    }
    if (spec.body){
      if (spec.kind === 'escala'){ // destaca a frase de laudo
        ctx.fillStyle = '#e7c98b'; ctx.font = '800 15px system-ui, sans-serif'; ctx.fillText('FRASE POSSÍVEL DE LAUDO', x, y); y += 28;
        ctx.fillStyle = '#ECEAFF'; ctx.font = 'italic 25px Georgia, serif'; y = wrap(ctx, '“' + spec.body + '”', x, y, maxW, 36, 8);
      } else {
        ctx.fillStyle = '#d3d0f0'; ctx.font = '400 25px Georgia, serif'; y = wrap(ctx, spec.body, x, y, maxW, 37, 12);
      }
    }

    /* rodapé */
    var fy = H - 150;
    ctx.strokeStyle = 'rgba(184,150,62,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(W-M, fy); ctx.stroke();
    ctx.fillStyle = '#f2dca6'; ctx.font = '700 19px Georgia, serif';
    ctx.fillText('Dr. Jadson Fraga Araújo Júnior · Neuropediatria', x, fy+30);
    ctx.fillStyle = '#9d99cf'; ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText('CRM-PE 25227 · RQE 17756 · sistema PANT · série J26', x, fy+56);
    ctx.fillStyle = '#7f7bb0'; ctx.font = '400 14px system-ui, sans-serif';
    ctx.fillText('Material educacional de apoio — não substitui avaliação profissional.', x, fy+82);
  }

  function drawTable(ctx, m, x, y, maxW){
    var cols = m.colunas||[], rows = m.linhas||[];
    var col0 = maxW*0.46, others = (maxW-col0)/3, rh = 46;
    // header
    ctx.fillStyle = '#6d6af5'; rr(ctx,x,y,maxW,rh,10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 17px system-ui, sans-serif';
    ctx.fillText(cols[0]||'', x+14, y+30);
    ctx.textAlign = 'center';
    for (var c=1;c<cols.length;c++){ ctx.fillText(cols[c]||'', x+col0+others*(c-1)+others/2, y+30); }
    ctx.textAlign = 'left'; y += rh;
    // rows
    rows.forEach(function(r,i){
      if (i%2) { ctx.fillStyle = 'rgba(169,164,255,.08)'; ctx.fillRect(x,y,maxW,rh); }
      ctx.fillStyle = '#ECEAFF'; ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText(r[0], x+14, y+29);
      ctx.textAlign = 'center'; ctx.fillStyle = '#f2dca6'; ctx.font = '800 18px system-ui, sans-serif';
      for (var c=1;c<r.length;c++){ ctx.fillText(r[c], x+col0+others*(c-1)+others/2, y+29); }
      ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(169,164,255,.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x,y+rh); ctx.lineTo(x+maxW,y+rh); ctx.stroke();
      y += rh;
    });
    return y + 24;
  }

  /* ---------- exportar ---------- */
  function filename(spec){ return 'neuroped-' + (spec.kind||'card') + '-' + String(spec.title||'').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '.png'; }
  function toBlob(cb){ var cv = $('npc-canvas'); if (cv.toBlob) cv.toBlob(cb,'image/png'); else { var d = cv.toDataURL('image/png'); var b = atob(d.split(',')[1]); var u = new Uint8Array(b.length); for (var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); cb(new Blob([u],{type:'image/png'})); } }
  function download(){
    if (!CUR) return;
    toBlob(function(blob){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename(CUR); document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500); window.npToast && npToast('Card PNG baixado.'); });
  }
  function share(){
    if (!CUR) return;
    toBlob(function(blob){
      var file = new File([blob], filename(CUR), { type:'image/png' });
      if (navigator.canShare && navigator.canShare({ files:[file] })){
        navigator.share({ files:[file], title:'NeuroPed Master', text:CUR.title + ' — Dr. Jadson Fraga · Neuropediatria' }).catch(function(){});
      } else { download(); }
    });
  }
  function printPDF(){
    if (!CUR) return;
    var data = $('npc-canvas').toDataURL('image/png');
    var w = window.open('', '_blank'); if (!w) { window.npToast && npToast('Permita pop-ups para gerar o PDF.'); return; }
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+filename(CUR)+'</title>'
      + '<style>@page{margin:12mm}body{margin:0;display:grid;place-items:center}img{max-width:100%;height:auto}@media print{img{max-width:170mm}}</style>'
      + '</head><body><img src="'+data+'" onload="setTimeout(function(){window.print()},250)"></body></html>');
    w.document.close();
  }

  /* ---------- UI ---------- */
  var CUR = null, LIST = [];
  function loadType(t){
    var def = TYPES[t]; LIST = def ? def.get() : [];
    renderList('');
  }
  function renderList(term){
    var box = $('npc-list'); if (!box) return;
    term = (term||'').trim().toLowerCase();
    var items = LIST.filter(function(it){ return !term || (it.key||it.title).toLowerCase().indexOf(term) >= 0; });
    box.innerHTML = items.slice(0,200).map(function(it,i){
      var idx = LIST.indexOf(it);
      return '<button class="npc-item" data-i="'+idx+'"><b>'+escape2(it.title)+'</b><span>'+escape2(it.meta||'')+'</span></button>';
    }).join('') || '<p class="npc-empty">Nada encontrado.</p>';
    Array.prototype.forEach.call(box.querySelectorAll('.npc-item'), function(b){
      b.addEventListener('click', function(){
        Array.prototype.forEach.call(box.querySelectorAll('.npc-item'), function(x){ x.classList.remove('on'); });
        b.classList.add('on');
        CUR = LIST[+b.dataset.i]; render(CUR);
      });
    });
  }
  function escape2(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }

  function boot(){
    var sel = $('npc-type'), q = $('npc-q');
    Object.keys(TYPES).forEach(function(k){ var o = document.createElement('option'); o.value=k; o.textContent=TYPES[k].label; sel.appendChild(o); });
    sel.addEventListener('change', function(){ q.value=''; loadType(sel.value); });
    q.addEventListener('input', function(){ renderList(q.value); });
    $('npc-dl').addEventListener('click', download);
    $('npc-share').addEventListener('click', share);
    $('npc-pdf').addEventListener('click', printPDF);
    loadType(sel.value || 'protocolo');
    // mostra o web-share só se suportado
    if (!(navigator.canShare)) { var sh = $('npc-share'); if (sh) sh.style.display='none'; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
