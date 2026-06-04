/* ============================================================
   NeuroPed SDG — escalas-hero.js · Clinical Intelligence Engine
   ------------------------------------------------------------
   Camada "super-herói infantil premium lúdico" do FILTRO de escalas:
     - SOM AGRADÁVEL (não-moeda) em tudo que for clicável — sino/cintilância
       sintetizado em Web Audio (0 assets, offline). Botões primários e cards
       ganham um acorde de "power-up" mais rico.
     - FAÍSCAS/RELÂMPAGOS no clique (FX cômico premium).
     - TÍTULO herói: letras quebradas em <span> com flutuação + relâmpago.
     - CÉU de raios/estrelas flutuando (movimento sutil na página).
   Tudo idempotente, respeita prefers-reduced-motion, aba oculta e impressão.
   O som honra a preferência global np_sound_v1 (mesmo botão liga/desliga).
   ============================================================ */
(function () {
  'use strict';
  if (window.__escalasHero) return; window.__escalasHero = true;

  var SND_KEY = 'np_sound_v1';
  var enabled = true;
  try { var st = localStorage.getItem(SND_KEY); if (st !== null) enabled = (st === '1'); } catch (e) {}
  function reduce(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } }
  function printing(){ try { return matchMedia('print').matches; } catch(e){ return false; } }

  /* ---------- Web Audio: sino/cintilância agradável (warm) ---------- */
  var ctx = null, bus = null;
  function audio(){
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC();
    bus = ctx.createGain(); bus.gain.value = 0.10;          // discreto (consultório)
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7200; // calor (sem aspereza)
    bus.connect(lp); lp.connect(ctx.destination);
    return ctx;
  }
  // tom suave com envelope sino (ataque rápido, cauda longa) — onda triangular = doce
  function bell(freq, t0, dur, gain, type){
    var c = audio(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function gate(){ return enabled && !document.hidden && !printing(); }
  // tap = díade doce e curta (ré/lá). hero = arpejo ascendente "power-up" + brilho.
  function play(kind){
    if (!gate()) return;
    var c = audio(); if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    var t = c.currentTime;
    if (kind === 'hero'){
      [[659,0],[988,0.06],[1319,0.12]].forEach(function(n){ bell(n[0], t + n[1], 0.5, 0.16); });
      bell(2637, t + 0.12, 0.4, 0.05, 'sine');           // cintilância no topo
    } else {
      bell(880,  t,        0.34, 0.13);                  // lá5
      bell(1318, t + 0.035, 0.30, 0.10);                 // mi6 (díade alegre)
      bell(2349, t + 0.02,  0.18, 0.035, 'sine');        // brilho sutil
    }
  }

  /* ---------- FX: faísca/relâmpago no ponto do clique ---------- */
  var SPARKS = ['⚡','✨','✴','💥'];
  function spark(x, y){
    if (reduce()) return;
    var s = document.createElement('div');
    s.className = 'eh-spark'; s.setAttribute('aria-hidden','true');
    s.textContent = SPARKS[(Math.random()*SPARKS.length)|0];
    s.style.left = x + 'px'; s.style.top = y + 'px';
    document.body.appendChild(s);
    setTimeout(function(){ if (s.parentNode) s.parentNode.removeChild(s); }, 550);
  }

  /* ---------- Wiring de cliques ---------- */
  var CLICKABLE = 'a,button,.chip,.sc-card,[role="button"],summary,label.option,input[type="radio"]';
  var HERO = '.search-go,#applyNow,.sc-card,.chip.resp';
  function onDown(e){
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('#eh-snd-toggle')) return;          // o próprio toggle não dispara
    var el = t.closest(CLICKABLE); if (!el) return;
    play(el.closest(HERO) ? 'hero' : 'tap');
    var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    var y = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);
    if (x != null && y != null) spark(x, y);
  }

  /* ---------- Toggle de som (honra np_sound_v1) ---------- */
  var btn = null;
  function paint(){ if (!btn) return;
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.title = enabled ? 'Som da interface: ligado' : 'Som da interface: desligado';
    btn.setAttribute('aria-label', btn.title);
    btn.textContent = enabled ? '⚡' : '🔇';
  }
  function setEnabled(v){ enabled = !!v; try { localStorage.setItem(SND_KEY, enabled ? '1' : '0'); } catch(e){} paint(); if (enabled) play('hero'); }
  function mountToggle(){
    if (document.getElementById('eh-snd-toggle') || !document.body) return;
    btn = document.createElement('button');
    btn.id = 'eh-snd-toggle'; btn.className = 'eh-snd'; btn.type = 'button';
    btn.addEventListener('click', function(){ setEnabled(!enabled); });
    document.body.appendChild(btn); paint();
  }

  /* ---------- Título herói: quebra em letras + relâmpago ---------- */
  function heroTitle(){
    var h = document.querySelector('.engine-title'); if (!h || h.dataset.eh) return;
    var text = h.textContent; h.dataset.eh = '1';
    h.setAttribute('aria-label', text); // mantém leitura íntegra no leitor de tela
    var words = text.split(/(\s+)/), i = 0, html = '';
    words.forEach(function(w){
      if (/^\s+$/.test(w)) { html += ' '; return; }
      html += '<span class="eh-w">';
      for (var k = 0; k < w.length; k++){
        var zap = (i % 5 === 2) ? ' eh-zap' : '';
        html += '<span class="eh-l' + zap + '" style="--d:' + (i * 0.06).toFixed(2) + 's">' + w[k] + '</span>';
        i++;
      }
      html += '</span>';
    });
    h.innerHTML = '<span class="eh-bolt" aria-hidden="true">⚡</span> ' + html + ' <span class="eh-bolt" aria-hidden="true">⚡</span>';
  }

  /* ---------- Céu de raios/estrelas flutuando ---------- */
  function sky(){
    if (reduce() || document.getElementById('eh-sky')) return;
    var sk = document.createElement('div'); sk.id = 'eh-sky'; sk.className = 'eh-sky'; sk.setAttribute('aria-hidden','true');
    var glyphs = ['⚡','✨','✳','⭐','✴'];
    for (var n = 0; n < 9; n++){
      var s = document.createElement('span'); s.className = 'eh-star';
      s.textContent = glyphs[(Math.random()*glyphs.length)|0];
      s.style.left = (Math.random()*100) + 'vw';
      s.style.bottom = '-24px';
      s.style.fontSize = (11 + Math.random()*14).toFixed(0) + 'px';
      s.style.animationDuration = (13 + Math.random()*12).toFixed(1) + 's';
      s.style.animationDelay = (Math.random()*12).toFixed(1) + 's';
      sk.appendChild(s);
    }
    document.body.appendChild(sk);
  }

  function init(){
    heroTitle(); sky(); mountToggle();
    document.addEventListener('pointerdown', onDown, true);
    // destrava o áudio no 1º gesto (políticas de autoplay)
    window.addEventListener('pointerdown', function once(){ audio(); window.removeEventListener('pointerdown', once); }, { once:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
