/* ============================================================
   NeuroPed — Decorator de cards de escala (estética J26)
   Roda APÓS o renderList de cada banco. Para cada .scale-card,
   injeta: avatar colorido (cor determinística por categoria) +
   sigla (do id/título) + emoji (heurística por palavra-chave).
   Funciona com qualquer estrutura de renderList (não toca a lógica).
   Carregar via <script src="./escalas-card-premium.js" defer>.
   ============================================================ */
(function () {
  'use strict';
  if (window.__jpCardDecorator) return;
  window.__jpCardDecorator = true;

  var COLORS = ['is-teal', 'is-blue', 'is-orange', 'is-purple', 'is-pink', 'is-amber', 'is-cyan', 'is-rose'];

  function hash(str) {
    var h = 0, s = String(str || '');
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  function jpColor(cat) { return COLORS[hash(cat) % COLORS.length]; }

  function jpEmoji(text) {
    var t = (text || '').toLowerCase();
    if (/\btea\b|autis|espectro/.test(t)) return '🧩';
    if (/tdah|desaten|hiperativ|aten[çc]/.test(t)) return '🎯';
    if (/fala|linguag|comunica|fono/.test(t)) return '💬';
    if (/sono|dorm|ins[oô]nia/.test(t)) return '😴';
    if (/aliment|seletiv|comida|nutri/.test(t)) return '🍽️';
    if (/sensor|sensori/.test(t)) return '🎧';
    if (/escola|aprendiz|pedag|leitura|escrita|acad[êe]m/.test(t)) return '📚';
    if (/humor|ansied|triste|depress|medo|emocion/.test(t)) return '😟';
    if (/motor|motric|marcha|coorden/.test(t)) return '🏃';
    if (/social|intera[çc]|v[íi]nculo|amizade/.test(t)) return '🤝';
    if (/autocuidado|avd|higien|banho|desfralde|fralda/.test(t)) return '🚽';
    if (/cogni|mem[óo]ria|racioc|intelec|funcion[ao] executiv/.test(t)) return '🧠';
    if (/comportam|birra|oposi[çc]|agress|conduta/.test(t)) return '🌪️';
    if (/epilep|crise|convuls/.test(t)) return '⚡';
    if (/dor|cefaleia|enxaqueca/.test(t)) return '🤕';
    if (/risco|autoles|suic/.test(t)) return '🛟';
    return '📋';
  }

  function siglaFrom(card) {
    // 1) tenta do id (onclick="selectScale('xxx')")
    var oc = card.getAttribute('onclick') || '';
    var m = oc.match(/\('([^']+)'\)/);
    var src = m ? m[1] : '';
    if (src) {
      var parts = src.split(/[^a-z0-9]+/i).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    }
    // 2) fallback: iniciais do título
    var h3 = card.querySelector('h3');
    var tt = (h3 && h3.textContent || '').replace(/[^A-Za-zÀ-ÿ ]/g, '').trim();
    var w = tt.split(/\s+/).filter(Boolean);
    if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
    return (tt.slice(0, 2) || '·').toUpperCase();
  }

  function decorate(card) {
    if (card.__jpDone) return;
    card.__jpDone = true;
    var h3 = card.querySelector('h3');
    var title = h3 ? h3.textContent : '';
    // categoria: tenta achar um badge/texto de categoria, senão usa o título
    var catEl = card.querySelector('.badge, p');
    var cat = (catEl && catEl.textContent) || title;

    card.classList.add(jpColor(cat));

    var av = document.createElement('span');
    av.className = 'jp-av';
    av.setAttribute('aria-hidden', 'true');
    av.textContent = siglaFrom(card);
    var em = document.createElement('span');
    em.className = 'jp-emoji';
    em.textContent = jpEmoji(title + ' ' + cat);
    av.appendChild(em);

    // embrulha o conteúdo existente em .jp-body e prefixa o avatar
    var body = document.createElement('div');
    body.className = 'jp-body';
    while (card.firstChild) body.appendChild(card.firstChild);
    card.appendChild(av);
    card.appendChild(body);
  }

  function decorateAll() {
    var cards = document.querySelectorAll('.scale-card');
    for (var i = 0; i < cards.length; i++) decorate(cards[i]);
  }

  // roda após cada render: observa a lista e redecora os novos cards
  function start() {
    var list = document.getElementById('list');
    if (!list) { setTimeout(start, 200); return; }
    decorateAll();
    try {
      var mo = new MutationObserver(function () { decorateAll(); });
      mo.observe(list, { childList: true });
    } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // expõe helpers (úteis p/ testes/futuro)
  window.jpColor = jpColor;
  window.jpEmoji = jpEmoji;
})();
