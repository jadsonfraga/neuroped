/* ===========================================================
   NeuroPed EDJ v5.0 — SPA Controller (modo único + PIN gate)
   Conteúdo público livre · Módulos profissionais protegidos
   =========================================================== */

(function () {
  'use strict';

  const PIN_MASTER = 'FRAGA1108';

  /* ====== Helpers ====== */
  const $  = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  const html = (strings, ...values) => strings.reduce((a, s, i) => a + s + (values[i] != null ? values[i] : ''), '');
  const initials = (n) => n.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  /* ====== Store ====== */
  const Store = {
    THEME_KEY: 'neuroped:theme:v5',
    PRO_KEY:   'neuroped:pro_unlocked',
    getTheme() { return localStorage.getItem(this.THEME_KEY); },
    setTheme(t) { localStorage.setItem(this.THEME_KEY, t); },
    isProUnlocked() { return sessionStorage.getItem(this.PRO_KEY) === '1'; },
    unlockPro() { sessionStorage.setItem(this.PRO_KEY, '1'); },
    lockPro() { sessionStorage.removeItem(this.PRO_KEY); }
  };

  /* ====== Theme ====== */
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    const lbl = $('#themeLabel'); if (lbl) lbl.textContent = t === 'dark' ? 'Escuro' : 'Claro';
  }
  function initTheme() {
    const saved = Store.getTheme() || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
  }
  function toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    Store.setTheme(next); applyTheme(next);
    toast(next === 'dark' ? '🌙 Tema escuro' : '☀️ Tema claro');
  }

  /* ====== Toast ====== */
  function toast(msg, ms = 2400) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* ====== PIN gate ====== */
  function askPin() {
    return new Promise(resolve => {
      const m = $('#pinModal'); const input = $('#pinInput'); const err = $('#pinError');
      input.value = ''; err.style.display = 'none';
      m.hidden = false;
      setTimeout(() => input.focus(), 80);

      function onOk() {
        const v = input.value.trim();
        if (v === PIN_MASTER) {
          Store.unlockPro();
          updateProLockUI();
          close(true);
          toast('✓ Modo profissional desbloqueado');
        } else {
          err.style.display = 'block';
          input.value = ''; input.focus();
        }
      }
      function onCancel() { close(false); }
      function onKey(e) { if (e.key === 'Enter') onOk(); else if (e.key === 'Escape') onCancel(); }
      function close(v) {
        m.hidden = true;
        $('#pinOk').removeEventListener('click', onOk);
        $('#pinCancel').removeEventListener('click', onCancel);
        input.removeEventListener('keydown', onKey);
        resolve(v);
      }
      $('#pinOk').addEventListener('click', onOk);
      $('#pinCancel').addEventListener('click', onCancel);
      input.addEventListener('keydown', onKey);
    });
  }

  function updateProLockUI() {
    const unlocked = Store.isProUnlocked();
    $('#proLockIcon').textContent = unlocked ? '✓' : '🔒';
    $('#proLockLabel').textContent = unlocked ? 'Bloquear modo' : 'Profissional';
    $('#proLockIconTop').textContent = unlocked ? '✓' : '🔒';
    document.documentElement.dataset.pro = unlocked ? '1' : '0';
    renderNav();
  }

  /* ====== Confirm ====== */
  function confirmDialog(title, text) {
    return new Promise(resolve => {
      $('#confirmTitle').textContent = title;
      $('#confirmText').textContent = text;
      const m = $('#confirmModal'); m.hidden = false;
      const onOk = () => close(true);
      const onCancel = () => close(false);
      function close(v) {
        m.hidden = true;
        $('#confirmOk').removeEventListener('click', onOk);
        $('#confirmCancel').removeEventListener('click', onCancel);
        resolve(v);
      }
      $('#confirmOk').addEventListener('click', onOk);
      $('#confirmCancel').addEventListener('click', onCancel);
    });
  }

  /* ====== Bottom sheet ====== */
  function openSheet(node) {
    const card = $('#sheetCard');
    card.innerHTML = '';
    card.appendChild(node);
    $('#sheetModal').hidden = false;
  }
  function closeSheet() { $('#sheetModal').hidden = true; }

  /* ====== Router ====== */
  const routes = {
    'inicio':       { title: 'Início',                  sub: 'Boas-vindas',                       render: viewInicio,       locked: false },
    'sobre':        { title: 'Sobre o Dr. Jadson',      sub: 'Formação, atuação e contato',       render: viewSobre,        locked: false },
    'escalas':      { title: 'Escalas familiares',      sub: 'Triagem livre para famílias',       render: viewEscalas,      locked: false },
    'escala':       { title: 'Aplicar escala',          sub: 'Instrumento livre',                 render: viewEscala,       locked: false, hidden: true },
    'caa':          { title: 'CAA',                     sub: 'Comunicação alternativa',           render: viewCAA,          locked: false },
    'materiais':    { title: 'Materiais educativos',    sub: 'Para famílias, escolas e equipe',   render: viewMateriais,    locked: false },
    'material':     { title: 'Material',                sub: '',                                  render: viewMaterial,     locked: false, hidden: true },
    'marcos':       { title: 'Marcos do desenvolvimento', sub: 'Por faixa etária',                render: viewMarcos,       locked: false },
    'calculadoras': { title: 'Calculadoras',            sub: 'Doses, IMC, percentis',             render: viewCalculadoras, locked: false },
    'contato':      { title: 'Agendar consulta',        sub: 'Contato direto',                    render: viewContato,      locked: false },
    // Locked
    'pacientes':    { title: 'Pacientes',               sub: 'CRM e prontuário',                  render: viewPacientes,    locked: true },
    'paciente':     { title: 'Paciente',                sub: 'Prontuário individual',             render: viewPaciente,     locked: true, hidden: true },
    'consultas':    { title: 'Consultas',               sub: 'Atendimentos',                      render: viewConsultas,    locked: true },
    'laudos':       { title: 'Laudos',                  sub: 'Geração PDF',                       render: viewLaudos,       locked: true },
    'agenda':       { title: 'Agenda clínica',          sub: 'Calendário e lembretes',            render: viewAgenda,       locked: true },
    'financeiro':   { title: 'Financeiro',              sub: 'Receita e cobrança',                render: viewFinanceiro,   locked: true },
    'mensagens':    { title: 'Mensagens',               sub: 'Equipe e família',                  render: viewMensagens,    locked: true },
    'escalas-pro':  { title: 'Escalas clínicas',        sub: 'Instrumentos profissionais',        render: viewEscalasPro,   locked: true },
    'escala-pro':   { title: 'Aplicar escala clínica',  sub: 'Profissional',                      render: viewEscala,       locked: true, hidden: true },
    'config':       { title: 'Configurações',           sub: 'Conta, nuvem, LGPD',                render: viewConfig,       locked: true }
  };

  function parseHash() {
    const raw = location.hash.replace(/^#\//, '') || 'inicio';
    const [route, ...rest] = raw.split('/');
    return { route, params: rest };
  }

  async function navigate() {
    const { route, params } = parseHash();
    let r = routes[route] || routes['inicio'];

    // Gate locked routes
    if (r.locked && !Store.isProUnlocked()) {
      const ok = await askPin();
      if (!ok) { location.hash = '#/inicio'; return; }
    }

    $('#pageTitle').textContent = r.title;
    $('#pageSubtitle').textContent = r.sub;
    $('#backBtn').hidden = (route === 'inicio');

    $$('.nav-item, .bn-item').forEach(el => el.classList.toggle('active', el.dataset.route === route));

    const stack = $('#viewStack');
    stack.innerHTML = '';
    const view = h('div', { class: 'view' });
    stack.appendChild(view);
    try { r.render(view, params); }
    catch (e) { console.error(e); view.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '⚠️'), h('div', {}, 'Erro: ' + e.message))); }
    stack.scrollTop = 0;
  }

  /* ====== Nav render ====== */
  function renderNav() {
    const proUnlocked = Store.isProUnlocked();
    const nav = $('#nav'); nav.innerHTML = '';
    NEUROPED.modules.forEach(m => {
      if (m.locked && !proUnlocked) return; // hide locked modules when not unlocked
      const item = h('a', { class: 'nav-item', href: '#/' + m.id, 'data-route': m.id },
        h('span', { class: 'nav-icon' }, m.icon),
        h('span', {}, m.title),
        m.locked ? h('span', { class: 'pill brand', style: 'margin-left:auto;font-size:9px;padding:2px 6px;' }, 'PRO') : null
      );
      nav.appendChild(item);
    });
    if (!proUnlocked) {
      const hint = h('a', { class: 'nav-item', href: 'javascript:void(0)', onclick: async () => { if (await askPin()) navigate(); } },
        h('span', { class: 'nav-icon' }, '🔒'),
        h('span', {}, 'Modo profissional')
      );
      nav.appendChild(hint);
    }

    // bottom nav (mobile): 5 public items
    const bn = $('#bottomNav'); bn.innerHTML = '';
    const bnIds = ['inicio', 'escalas', 'caa', 'materiais', 'contato'];
    bnIds.forEach((id, i) => {
      const m = NEUROPED.modules.find(x => x.id === id); if (!m) return;
      bn.appendChild(h('a', { class: 'bn-item', href: '#/' + id, 'data-route': id },
        h('span', { class: 'bn-icon' }, m.icon),
        h('span', {}, m.title.split(' ')[0])
      ));
    });
  }

  /* ====== VIEWS PÚBLICAS ====== */

  function viewInicio(root) {
    const d = NEUROPED.doutor;
    root.appendChild(
      h('section', { class: 'card-hero' },
        h('h2', {}, 'Bem-vindo ao NeuroPed EDJ'),
        h('p', {}, d.nome + ' · ' + d.titulo + ' · ' + d.crm + ' · ' + d.rqe + '. Conteúdo educacional aberto para famílias, escolas e equipes terapêuticas em ' + d.cidades.join(' e ') + '.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn solid', href: '#/contato' }, '📞 Agendar consulta'),
          h('a', { class: 'btn', href: '#/escalas' }, '≡ Escalas familiares'),
          h('a', { class: 'btn', href: '#/materiais' }, '📘 Materiais')
        )
      )
    );

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Áreas de atuação')));
    const areas = h('div', { class: 'module-grid' });
    d.areas.forEach(a => {
      areas.appendChild(h('div', { class: 'tile' },
        h('div', { class: 'tile-icon' }, a.e),
        h('div', { class: 'tile-title' }, a.t),
        h('div', { class: 'tile-sub' }, a.sub)
      ));
    });
    root.appendChild(areas);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Comece aqui')));
    const tiles = h('div', { class: 'module-grid' });
    [
      { id: 'escalas',      e: '≡',  t: 'Escalas familiares',     s: 'Triagem livre por idade' },
      { id: 'marcos',       e: '🌱', t: 'Marcos do desenvolvimento', s: 'Veja se está no caminho' },
      { id: 'materiais',    e: '📘', t: 'Materiais educativos',   s: 'Para famílias e escolas' },
      { id: 'caa',          e: '◉',  t: 'CAA · pictogramas',      s: 'Comunicação alternativa' },
      { id: 'calculadoras', e: '🧮', t: 'Calculadoras',           s: 'Doses, IMC, percentis' },
      { id: 'sobre',        e: '★',  t: 'Sobre o Dr. Jadson',     s: 'Quem cuida do seu filho' }
    ].forEach(t => {
      tiles.appendChild(h('a', { class: 'tile', href: '#/' + t.id },
        h('div', { class: 'tile-icon' }, t.e),
        h('div', { class: 'tile-title' }, t.t),
        h('div', { class: 'tile-sub' }, t.s)
      ));
    });
    root.appendChild(tiles);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Por que usar?')));
    root.appendChild(h('div', { class: 'grid cols-3' },
      h('div', { class: 'card' }, h('div', { style: 'font-size:32px;margin-bottom:6px' }, '✓'), h('div', { style: 'font-weight:600' }, 'Gratuito'), h('div', { class: 'tile-sub' }, 'Conteúdo educacional aberto para qualquer família.')),
      h('div', { class: 'card' }, h('div', { style: 'font-size:32px;margin-bottom:6px' }, '🇧🇷'), h('div', { style: 'font-weight:600' }, 'Em português'), h('div', { class: 'tile-sub' }, 'Linguagem clara, voltada para realidade brasileira.')),
      h('div', { class: 'card' }, h('div', { style: 'font-size:32px;margin-bottom:6px' }, '🔒'), h('div', { style: 'font-weight:600' }, 'Privacidade'), h('div', { class: 'tile-sub' }, 'Triagens locais no dispositivo. LGPD respeitada.'))
    ));
  }

  function viewSobre(root) {
    const d = NEUROPED.doutor;
    root.appendChild(h('section', { class: 'card-hero' },
      h('h2', {}, d.nome),
      h('p', {}, d.titulo + ' · ' + d.crm + ' · ' + d.rqe + ' · Atendimento em ' + d.cidades.join(' e ') + '.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn solid', href: 'https://wa.me/' + d.whatsapp, target: '_blank', rel: 'noopener' }, '💬 WhatsApp'),
        h('a', { class: 'btn', href: 'https://instagram.com/' + d.instagram, target: '_blank', rel: 'noopener' }, '📷 Instagram'),
        h('a', { class: 'btn', href: '#/contato' }, '📞 Agendar')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Formação e credenciais')));
    root.appendChild(h('div', { class: 'grid cols-2' },
      h('div', { class: 'card' },
        h('div', { style: 'font-weight:600; margin-bottom: 6px;' }, '🎓 Formação'),
        h('div', { class: 'tile-sub' }, 'Médico formado · Especialização em Pediatria · Sub-especialização em Neuropediatria')
      ),
      h('div', { class: 'card' },
        h('div', { style: 'font-weight:600; margin-bottom: 6px;' }, '📋 Registros'),
        h('div', { class: 'tile-sub' }, d.crm + ' (Pernambuco)'),
        h('div', { class: 'tile-sub' }, d.rqe + ' (Registro de Qualificação de Especialista)')
      ),
      h('div', { class: 'card' },
        h('div', { style: 'font-weight:600; margin-bottom: 6px;' }, '📍 Cidades'),
        h('div', { class: 'tile-sub' }, d.cidades.join(' · '))
      ),
      h('div', { class: 'card' },
        h('div', { style: 'font-weight:600; margin-bottom: 6px;' }, '🩺 Abordagem'),
        h('div', { class: 'tile-sub' }, 'Diagnóstico orientado por dados, consulta humanizada, devolutiva clara, integração com terapias e escola.')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Áreas de atuação')));
    const areasList = h('div', { class: 'list' });
    d.areas.forEach(a => {
      areasList.appendChild(h('div', { class: 'list-item' },
        h('div', { class: 'li-emoji' }, a.e),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, a.t),
          h('div', { class: 'li-sub' }, a.sub)
        )
      ));
    });
    root.appendChild(areasList);
  }

  function viewEscalas(root) {
    root.appendChild(h('div', { class: 'card', style: 'margin-bottom:16px;' },
      h('div', { class: 'row' },
        h('div', {},
          h('div', { style: 'font-weight:700; font-size:18px;' }, NEUROPED.familyScales.length + ' instrumentos familiares'),
          h('div', { class: 'tile-sub' }, 'Triagem aberta por idade, queixa e domínio. Linguagem para famílias.')
        ),
        h('div', { class: 'spacer' }),
        h('span', { class: 'pill success' }, 'Livre · Educacional')
      )
    ));

    const filterBar = h('div', { class: 'filter-bar' });
    let q = '', dom = 'todos', age = 'todas';
    const domains = ['todos', ...new Set(NEUROPED.familyScales.map(s => s.domain))];
    const ages = ['todas', ...new Set(NEUROPED.familyScales.map(s => s.age))];

    const search = h('div', { class: 'input-icon', style: 'flex:1; min-width:200px;' },
      h('span', {}, '⌕'),
      h('input', { class: 'input', placeholder: 'Buscar título, queixa, domínio…', oninput: e => { q = e.target.value.toLowerCase(); refresh(); } })
    );
    filterBar.appendChild(search);
    const selDom = h('select', { class: 'select', style: 'max-width:200px;', onchange: e => { dom = e.target.value; refresh(); } }, ...domains.map(d => h('option', { value: d }, d === 'todos' ? 'Todos domínios' : d)));
    const selAge = h('select', { class: 'select', style: 'max-width:170px;', onchange: e => { age = e.target.value; refresh(); } }, ...ages.map(a => h('option', { value: a }, a === 'todas' ? 'Todas idades' : a)));
    filterBar.appendChild(selDom); filterBar.appendChild(selAge);
    root.appendChild(filterBar);

    const list = h('div', { class: 'list' });
    root.appendChild(list);

    function refresh() {
      const items = NEUROPED.familyScales.filter(s => {
        if (dom !== 'todos' && s.domain !== dom) return false;
        if (age !== 'todas' && s.age !== age) return false;
        if (q && !(s.title + ' ' + s.domain + ' ' + s.age).toLowerCase().includes(q)) return false;
        return true;
      }).sort((a, b) => b.priority - a.priority);
      list.innerHTML = '';
      if (!items.length) { list.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '🔎'), h('div', {}, 'Nada encontrado.'))); return; }
      items.forEach(s => {
        list.appendChild(h('a', { class: 'list-item', href: '#/escala/' + s.id },
          h('div', { class: 'li-emoji' }, s.emoji),
          h('div', { class: 'li-body' },
            h('div', { class: 'li-title' }, s.title),
            h('div', { class: 'li-sub' }, s.age + ' · ' + s.domain),
            h('div', { class: 'li-meta' }, h('span', { class: 'pill brand' }, 'Família'), h('span', { class: 'pill' }, s.questions.length + ' itens'))
          ),
          h('div', { class: 'li-arrow' }, '›')
        ));
      });
    }
    refresh();
  }

  function viewEscalasPro(root) {
    root.appendChild(h('div', { class: 'card', style: 'margin-bottom:16px;' },
      h('div', { class: 'row' },
        h('div', {},
          h('div', { style: 'font-weight:700; font-size:18px;' }, NEUROPED.proScales.length + ' instrumentos clínicos'),
          h('div', { class: 'tile-sub' }, 'Escalas profissionais — uso restrito ao Dr. Jadson Fraga.')
        ),
        h('div', { class: 'spacer' }),
        h('span', { class: 'pill brand' }, 'Profissional')
      )
    ));

    const list = h('div', { class: 'list' });
    NEUROPED.proScales.forEach(s => {
      list.appendChild(h('a', { class: 'list-item', href: '#/escala-pro/' + s.id },
        h('div', { class: 'li-emoji' }, s.emoji),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, s.title),
          h('div', { class: 'li-sub' }, s.age + ' · ' + s.domain),
          h('div', { class: 'li-meta' }, h('span', { class: 'pill accent' }, 'Clínica'), h('span', { class: 'pill' }, s.questions.length + ' itens'))
        ),
        h('div', { class: 'li-arrow' }, '›')
      ));
    });
    root.appendChild(list);
  }

  function viewEscala(root, params) {
    const id = params[0];
    const scale = NEUROPED.scales.find(s => s.id === id);
    if (!scale) { root.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '⚠️'), h('div', {}, 'Escala não encontrada.'))); return; }

    const state = { i: 0, answers: new Array(scale.questions.length).fill(null), done: false };
    const card = h('div', { class: 'q-card' });
    const progress = h('div', { class: 'progress', style: 'margin-bottom:18px;' }, h('div', { style: 'width:0%' }));
    const body = h('div');

    card.appendChild(h('div', { class: 'q-head' },
      h('div', { class: 'avatar', style: 'width:48px;height:48px;border-radius:14px;font-size:22px;' }, scale.emoji),
      h('div', { style: 'flex:1;' },
        h('div', { style: 'font-weight:700;' }, scale.title),
        h('div', { class: 'tile-sub' }, scale.age + ' · ' + scale.domain + ' · ' + (scale.audience === 'familia' ? 'Família' : 'Clínica'))
      )
    ));
    card.appendChild(progress);
    card.appendChild(body);

    function render() {
      body.innerHTML = '';
      if (state.done) {
        const score = state.answers.reduce((a, v) => a + (v ?? 0), 0);
        const max = scale.questions.length * (scale.options.length - 1);
        const pct = Math.round((score / max) * 100);
        const level = pct >= 66 ? 'Alto' : pct >= 33 ? 'Moderado' : 'Baixo';
        const cls = pct >= 66 ? 'brand' : pct >= 33 ? 'warn' : 'success';
        body.appendChild(h('div', { style: 'text-align:center; padding: 14px 0 24px;' },
          h('div', { class: 'tile-sub' }, 'Resultado operacional'),
          h('div', { style: 'font-size:60px; font-weight:700; letter-spacing:-0.02em; margin: 10px 0 4px; color: var(--brand);' }, score + '/' + max),
          h('span', { class: 'pill ' + cls }, 'Sinalização ' + level + ' · ' + pct + '%')
        ));
        body.appendChild(h('div', { style: 'background: var(--surface-2); padding: 14px 16px; border-radius: 12px; font-size: 13px; color: var(--text-soft); margin: 4px 0 20px;' },
          (scale.use || '') + ' Instrumento autoral de triagem. Não substitui avaliação clínica.'
        ));
        body.appendChild(h('div', { class: 'row' },
          h('button', { class: 'btn btn-primary', onclick: salvar }, '☁ Salvar resultado'),
          h('button', { class: 'btn btn-accent', onclick: gerarPDF }, '✎ Gerar relatório'),
          h('button', { class: 'btn btn-ghost', onclick: () => { state.i = 0; state.done = false; state.answers.fill(null); render(); } }, '↻ Refazer')
        ));
        progress.firstElementChild.style.width = '100%';
        return;
      }
      const qst = scale.questions[state.i];
      body.appendChild(h('div', { class: 'q-num' }, 'Pergunta ' + (state.i + 1) + ' de ' + scale.questions.length));
      body.appendChild(h('div', { class: 'q-text' }, qst));
      const opts = h('div', { class: 'q-opts' });
      scale.options.forEach((o, idx) => {
        opts.appendChild(h('button', { class: 'q-opt' + (state.answers[state.i] === idx ? ' selected' : ''), onclick: () => {
          state.answers[state.i] = idx;
          if (state.i < scale.questions.length - 1) state.i++;
          else state.done = true;
          setTimeout(render, 180);
        } }, o));
      });
      body.appendChild(opts);
      body.appendChild(h('div', { class: 'row', style: 'margin-top:22px; justify-content:space-between;' },
        h('button', { class: 'btn btn-ghost', disabled: state.i === 0, onclick: () => { if (state.i > 0) { state.i--; render(); } } }, '← Anterior'),
        h('span', { class: 'tile-sub' }, Math.round(((state.i + 1) / scale.questions.length) * 100) + '%')
      ));
      progress.firstElementChild.style.width = ((state.i / scale.questions.length) * 100) + '%';
    }

    async function salvar() {
      const score = state.answers.reduce((a, v) => a + (v ?? 0), 0);
      const payload = { instrument_id: scale.id, instrument_title: scale.title, answers: Object.fromEntries(state.answers.map((v, i) => [i, v])), raw_score: score, total_items: scale.questions.length };
      NEUROPED_CLOUD.submissions.add(payload);
      const r = await NEUROPED_CLOUD.pushToCloud(payload);
      toast(r.ok ? '✓ Enviado para nuvem' : '✓ Salvo localmente');
    }
    function gerarPDF() {
      const score = state.answers.reduce((a, v) => a + (v ?? 0), 0);
      const max = scale.questions.length * (scale.options.length - 1);
      const pct = Math.round((score / max) * 100);
      const level = pct >= 66 ? 'Alto' : pct >= 33 ? 'Moderado' : 'Baixo';
      PDF.buildLaudo({
        titulo: 'Relatório · ' + scale.title, paciente: 'Anônimo', idade: scale.age, codigo: 'INST-' + scale.id.toUpperCase(),
        escalas: [{ title: scale.title, result: score + '/' + max + ' (' + pct + '%)' }],
        score: score + '/' + max, scoreLevel: level,
        hipotese: 'Instrumento "' + scale.title + '" — sinalização ' + level.toLowerCase() + ' (' + pct + '%).',
        conduta: scale.use || ''
      });
      toast('📄 Relatório aberto');
    }
    root.appendChild(card);
    render();
  }

  function viewCAA(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'CAA · Comunicação Alternativa'),
      h('p', {}, 'Pictogramas e síntese de voz em português. Monte frases tocando nas figuras. Ferramenta livre para famílias, escolas e terapeutas.')
    ));

    const strip = h('div', { class: 'caa-strip', id: 'caaStrip', style: 'margin-top:16px;' });
    root.appendChild(strip);

    const actions = h('div', { class: 'row', style: 'margin-bottom:16px;' },
      h('button', { class: 'btn btn-primary', onclick: speakStrip }, '🔊 Falar frase'),
      h('button', { class: 'btn btn-ghost', onclick: () => { strip.innerHTML = ''; toast('Frase limpa'); } }, '✕ Limpar')
    );
    root.appendChild(actions);

    const tabs = h('div', { class: 'tabs' });
    let activeCat = NEUROPED.caaCategories[0].id;
    NEUROPED.caaCategories.forEach((c, idx) => {
      const t = h('button', { class: 'tab' + (idx === 0 ? ' active' : ''), onclick: () => { $$('.tab', tabs).forEach(x => x.classList.remove('active')); t.classList.add('active'); activeCat = c.id; renderGrid(); } }, c.label);
      tabs.appendChild(t);
    });
    root.appendChild(tabs);

    const grid = h('div', { class: 'caa-grid', id: 'caaGrid' });
    root.appendChild(grid);
    function renderGrid() {
      grid.innerHTML = '';
      const cat = NEUROPED.caaCategories.find(c => c.id === activeCat);
      cat.items.forEach(it => {
        grid.appendChild(h('div', { class: 'caa-card', onclick: () => { strip.appendChild(h('div', { class: 'caa-strip-item', title: it.l }, it.e)); speak(it.l); } },
          h('div', { class: 'caa-emoji' }, it.e),
          h('div', { class: 'caa-label' }, it.l)
        ));
      });
    }
    renderGrid();

    function speak(t) { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(t); u.lang = 'pt-BR'; u.rate = 0.95; speechSynthesis.speak(u); } }
    function speakStrip() {
      const labels = $$('.caa-strip-item', strip).map(e => e.title).filter(Boolean);
      if (!labels.length) return toast('Monte uma frase primeiro');
      speak(labels.join(' '));
    }
  }

  function viewMateriais(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Materiais educativos'),
      h('p', {}, 'Conteúdo prático e em português para famílias, escolas e equipes terapêuticas. Acesso livre.')
    ));
    const grid = h('div', { class: 'grid cols-3', style: 'margin-top:16px;' });
    NEUROPED.materiais.forEach((m, idx) => {
      grid.appendChild(h('a', { class: 'card', href: '#/material/' + idx, style: 'text-decoration:none; cursor:pointer;' },
        h('div', { style: 'font-size:36px; margin-bottom:8px;' }, m.e),
        h('div', { style: 'font-weight:600;' }, m.t),
        h('div', { class: 'tile-sub' }, m.sub),
        h('div', { style: 'margin-top:12px;' }, h('span', { class: 'pill brand' }, m.tag))
      ));
    });
    root.appendChild(grid);
  }
  function viewMaterial(root, params) {
    const m = NEUROPED.materiais[+params[0]];
    if (!m) { root.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '⚠️'), h('div', {}, 'Material não encontrado.'))); return; }
    root.appendChild(h('div', { class: 'card', style: 'max-width:720px; margin: 0 auto;' },
      h('div', { style: 'font-size:64px; text-align:center; margin-bottom:12px;' }, m.e),
      h('h2', { style: 'margin: 0 0 6px; text-align:center;' }, m.t),
      h('div', { style: 'text-align:center; margin-bottom:18px;' }, h('span', { class: 'pill brand' }, m.tag)),
      h('p', { style: 'font-size:15px; line-height:1.7; color: var(--text-soft);' }, m.body),
      h('div', { style: 'margin-top:20px; padding:14px 16px; background:var(--surface-2); border-radius:12px; font-size:13px; color:var(--text-mute);' },
        '💡 Conteúdo educacional, não substitui avaliação médica individualizada. Dúvidas? Agende uma consulta.'
      ),
      h('div', { class: 'row', style: 'margin-top:16px;' },
        h('a', { class: 'btn btn-primary', href: '#/contato' }, '📞 Agendar consulta'),
        h('a', { class: 'btn btn-ghost', href: '#/materiais' }, '← Voltar')
      )
    ));
  }

  function viewMarcos(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Marcos do desenvolvimento'),
      h('p', {}, 'Veja o que esperar em cada faixa etária. Esta é uma referência geral — atrasos isolados não significam diagnóstico, mas merecem atenção.')
    ));
    const grid = h('div', { class: 'grid cols-3', style: 'margin-top:16px;' });
    NEUROPED.marcos.forEach(m => {
      grid.appendChild(h('div', { class: 'card' },
        h('div', { style: 'font-size:36px; margin-bottom:8px;' }, m.emoji),
        h('div', { style: 'font-weight:700; font-size:16px; margin-bottom:8px;' }, m.age),
        h('ul', { style: 'margin:0; padding-left:18px; font-size:14px; color:var(--text-soft); line-height:1.7;' }, ...m.items.map(it => h('li', {}, it)))
      ));
    });
    root.appendChild(grid);

    root.appendChild(h('div', { class: 'card', style: 'margin-top:18px; background: var(--brand-soft); border-color: var(--brand);' },
      h('div', { style: 'font-weight:700; color: var(--brand); margin-bottom:6px;' }, '⚠️ Sinais que merecem avaliação especializada'),
      h('ul', { style: 'margin:0; padding-left:18px; line-height:1.8;' },
        h('li', {}, 'Não sorri socialmente aos 4 meses'),
        h('li', {}, 'Não responde ao nome aos 12 meses'),
        h('li', {}, 'Não fala palavras aos 16 meses'),
        h('li', {}, 'Não combina palavras aos 24 meses'),
        h('li', {}, 'Perda de habilidades adquiridas em qualquer idade')
      )
    ));
  }

  function viewCalculadoras(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Calculadoras pediátricas'),
      h('p', {}, 'Ferramentas simples para apoio prático. Confira sempre com a equipe médica.')
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'IMC infantil')));
    const imcCard = h('div', { class: 'card' });
    const imcResult = h('div', { style: 'margin-top:12px; text-align:center;' });
    imcCard.appendChild(h('div', { class: 'grid cols-2' },
      h('div', { class: 'field' }, h('label', {}, 'Peso (kg)'), h('input', { class: 'input', id: 'imc-p', type: 'number', step: '0.1', placeholder: 'Ex: 18.5' })),
      h('div', { class: 'field' }, h('label', {}, 'Altura (cm)'), h('input', { class: 'input', id: 'imc-h', type: 'number', step: '0.1', placeholder: 'Ex: 110' }))
    ));
    imcCard.appendChild(h('button', { class: 'btn btn-primary', style: 'margin-top:12px;', onclick: () => {
      const p = parseFloat($('#imc-p').value), a = parseFloat($('#imc-h').value);
      if (!p || !a) return toast('Preencha peso e altura');
      const imc = p / Math.pow(a / 100, 2);
      imcResult.innerHTML = '';
      imcResult.appendChild(h('div', { style: 'font-size:48px; font-weight:700; color: var(--brand);' }, imc.toFixed(1)));
      imcResult.appendChild(h('div', { class: 'tile-sub' }, 'kg/m² · Em pediatria, sempre interpretar por percentil/idade'));
    } }, 'Calcular'));
    imcCard.appendChild(imcResult);
    root.appendChild(imcCard);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Dose pediátrica (mg/kg/dia)')));
    const doseCard = h('div', { class: 'card' });
    const doseResult = h('div', { style: 'margin-top:12px; text-align:center;' });
    doseCard.appendChild(h('div', { class: 'grid cols-3' },
      h('div', { class: 'field' }, h('label', {}, 'Peso (kg)'), h('input', { class: 'input', id: 'd-p', type: 'number', step: '0.1', placeholder: '15' })),
      h('div', { class: 'field' }, h('label', {}, 'Dose (mg/kg/dia)'), h('input', { class: 'input', id: 'd-d', type: 'number', step: '0.1', placeholder: '10' })),
      h('div', { class: 'field' }, h('label', {}, 'Doses/dia'), h('input', { class: 'input', id: 'd-n', type: 'number', value: '2' }))
    ));
    doseCard.appendChild(h('button', { class: 'btn btn-primary', style: 'margin-top:12px;', onclick: () => {
      const p = parseFloat($('#d-p').value), d = parseFloat($('#d-d').value), n = parseInt($('#d-n').value, 10) || 1;
      if (!p || !d) return toast('Preencha peso e dose');
      const total = p * d;
      const porDose = total / n;
      doseResult.innerHTML = '';
      doseResult.appendChild(h('div', { style: 'font-size:32px; font-weight:700; color: var(--brand);' }, total.toFixed(1) + ' mg/dia'));
      doseResult.appendChild(h('div', { class: 'tile-sub' }, porDose.toFixed(1) + ' mg em ' + n + 'x ao dia'));
    } }, 'Calcular'));
    doseCard.appendChild(doseResult);
    root.appendChild(doseCard);

    root.appendChild(h('div', { class: 'card', style: 'margin-top:16px; background: var(--brand-soft);' },
      h('div', { style: 'font-weight:700; color: var(--brand);' }, '⚠️ Aviso'),
      h('p', { class: 'tile-sub', style: 'margin: 6px 0 0;' }, 'Estas calculadoras são para conferência rápida. Sempre validar a dose com a prescrição médica. Não automedique seu filho.')
    ));
  }

  function viewContato(root) {
    const d = NEUROPED.doutor;
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Agendar uma consulta'),
      h('p', {}, 'Estou disponível para atendimento em ' + d.cidades.join(' e ') + '. Entre em contato pelos canais abaixo.')
    ));

    const grid = h('div', { class: 'grid cols-2', style: 'margin-top:16px;' });
    grid.appendChild(h('a', { class: 'card', href: 'https://wa.me/' + d.whatsapp, target: '_blank', rel: 'noopener', style: 'text-decoration:none; cursor:pointer;' },
      h('div', { style: 'font-size:48px; margin-bottom:8px;' }, '💬'),
      h('div', { style: 'font-weight:700; font-size:18px;' }, 'WhatsApp'),
      h('div', { class: 'tile-sub' }, 'Resposta rápida durante horário comercial')
    ));
    grid.appendChild(h('a', { class: 'card', href: 'https://instagram.com/' + d.instagram, target: '_blank', rel: 'noopener', style: 'text-decoration:none; cursor:pointer;' },
      h('div', { style: 'font-size:48px; margin-bottom:8px;' }, '📷'),
      h('div', { style: 'font-weight:700; font-size:18px;' }, 'Instagram'),
      h('div', { class: 'tile-sub' }, '@' + d.instagram + ' · conteúdo e novidades')
    ));
    root.appendChild(grid);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Formulário de pré-agendamento')));
    const f = {
      nome: h('input', { class: 'input', placeholder: 'Nome completo do responsável' }),
      crianca: h('input', { class: 'input', placeholder: 'Nome da criança' }),
      idade: h('input', { class: 'input', placeholder: 'Idade da criança' }),
      cidade: h('input', { class: 'input', placeholder: 'Cidade' }),
      queixa: h('textarea', { class: 'textarea', placeholder: 'Descreva brevemente a queixa principal…' })
    };
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'grid cols-2' },
        h('div', { class: 'field' }, h('label', {}, 'Responsável'), f.nome),
        h('div', { class: 'field' }, h('label', {}, 'Criança'), f.crianca),
        h('div', { class: 'field' }, h('label', {}, 'Idade'), f.idade),
        h('div', { class: 'field' }, h('label', {}, 'Cidade'), f.cidade),
        h('div', { class: 'field', style: 'grid-column:1/-1;' }, h('label', {}, 'Queixa'), f.queixa)
      ),
      h('div', { class: 'row', style: 'margin-top:16px;' },
        h('button', { class: 'btn btn-primary', onclick: () => {
          if (!f.nome.value || !f.crianca.value) return toast('Preencha nome e criança');
          const msg = `Olá Dr. Jadson! Gostaria de agendar uma consulta.\n\n` +
            `*Responsável:* ${f.nome.value}\n` +
            `*Criança:* ${f.crianca.value}\n` +
            `*Idade:* ${f.idade.value}\n` +
            `*Cidade:* ${f.cidade.value}\n\n` +
            `*Queixa:* ${f.queixa.value}`;
          window.open('https://wa.me/' + d.whatsapp + '?text=' + encodeURIComponent(msg), '_blank');
        } }, '📤 Enviar via WhatsApp')
      )
    ));
  }

  /* ====== VIEWS PROFISSIONAIS (locked) ====== */
  function eventEmoji(k) {
    return k === 'consulta' ? '🩺' : k === 'retorno' ? '🔁' : k === 'familia' ? '💬' : k === 'tele' ? '📹' : k === 'devolutiva' ? '📋' : '👥';
  }
  function kpi(label, value, trend, icon) {
    return h('div', { class: 'card kpi' },
      icon ? h('div', { class: 'kpi-icon' }, icon) : null,
      h('div', { class: 'kpi-label' }, label),
      h('div', { class: 'kpi-value' }, String(value)),
      h('div', { class: 'kpi-trend' }, trend)
    );
  }
  function statusPill(s) { const map = { ativo: ['success', 'Ativo'], retorno: ['warn', 'Retorno'], alta: ['accent', 'Alta'] }; const [cls, txt] = map[s] || ['', s]; return h('span', { class: 'pill ' + cls }, txt); }

  function viewPacientes(root) {
    root.appendChild(h('div', { class: 'grid cols-4', style: 'margin-bottom:16px;' },
      kpi('Total', NEUROPED.patients.length, 'demo', '☺'),
      kpi('Ativos', NEUROPED.patients.filter(p => p.status === 'ativo').length, 'em acompanhamento', '✓'),
      kpi('Retornos', 0, '—', '🔁'),
      kpi('Alta', 0, '—', '✅')
    ));
    const grid = h('div', { class: 'grid cols-3' });
    NEUROPED.patients.forEach(p => grid.appendChild(h('a', { class: 'patient-card', href: '#/paciente/' + p.code },
      h('div', { class: 'patient-head' },
        h('div', { class: 'avatar', style: 'width:46px;height:46px;border-radius:14px;' }, initials(p.name)),
        h('div', { style: 'flex:1;' }, h('div', { class: 'patient-name' }, p.name), h('div', { class: 'patient-sub' }, p.age + ' · ' + p.domain)),
        statusPill(p.status)
      ),
      h('div', { class: 'row', style: 'font-size:12px; color: var(--text-mute);' },
        h('span', {}, 'Último: ' + p.last),
        h('span', { class: 'spacer' }),
        h('span', { class: 'pill accent' }, 'Score ' + p.score)
      )
    )));
    root.appendChild(grid);
  }
  function viewPaciente(root, params) {
    const p = NEUROPED.patients.find(x => x.code === params[0]);
    if (!p) { root.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '☺'), h('div', {}, 'Paciente não encontrado.'))); return; }
    root.appendChild(h('div', { class: 'card-hero' },
      h('div', { class: 'row' },
        h('div', { class: 'avatar', style: 'width:64px;height:64px;border-radius:18px;font-size:20px;' }, initials(p.name)),
        h('div', { style: 'flex:1;' }, h('h2', { style: 'margin:0' }, p.name), h('p', { style: 'margin:4px 0 0' }, p.code + ' · ' + p.age + ' · ' + p.gender + ' · ' + p.domain))
      )
    ));
    root.appendChild(h('div', { class: 'grid cols-4' },
      kpi('Status', (p.status || '—').toUpperCase(), '—', '✓'),
      kpi('Último contato', p.last, '—', '📅'),
      kpi('Score', p.score, 'última escala', '📊'),
      kpi('Idade', p.age, p.dob || '—', '🎂')
    ));
    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Evolução')));
    const c = h('div', { class: 'card chart-card' });
    c.insertAdjacentHTML('beforeend', Charts.line([5, 7, 6, 8, 11, 9, 12, p.score], { id: 'evo', color: '#6366f1' }));
    root.appendChild(c);
  }

  function viewConsultas(root) {
    root.appendChild(h('div', { class: 'card', style: 'margin-bottom:16px;' },
      h('div', { class: 'row' },
        h('div', { style: 'flex:1;' }, h('div', { style: 'font-weight:700;' }, 'Atendimentos do dia'), h('div', { class: 'tile-sub' }, 'Sincroniza automaticamente quando há nuvem.')),
        h('button', { class: 'btn btn-primary btn-sm' }, '+ Nova consulta')
      )
    ));
    const list = h('div', { class: 'list' });
    NEUROPED.events.filter(e => e.day === 0).forEach(ev => list.appendChild(h('div', { class: 'list-item' },
      h('div', { class: 'li-emoji' }, eventEmoji(ev.kind)),
      h('div', { class: 'li-body' }, h('div', { class: 'li-title' }, ev.title), h('div', { class: 'li-sub' }, ev.time + ' · ' + ev.tag))
    )));
    root.appendChild(list);
  }
  function viewLaudos(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Laudos clínicos'),
      h('p', {}, 'Geração de laudos PDF profissionais com assinatura digital.')
    ));
    const tpl = [
      { e: '🧩', t: 'Triagem TEA' }, { e: '🎯', t: 'Avaliação TDAH' },
      { e: '💬', t: 'Atraso de linguagem' }, { e: '😴', t: 'Distúrbio do sono' },
      { e: '🧠', t: 'Funções executivas' }, { e: '📝', t: 'Em branco' }
    ];
    const grid = h('div', { class: 'grid cols-3', style: 'margin-top:16px;' });
    tpl.forEach(t => grid.appendChild(h('div', { class: 'tile', onclick: () => {
      PDF.buildLaudo({ titulo: 'Laudo — ' + t.t, paciente: 'A preencher', idade: '—', codigo: 'LAUDO-' + Date.now().toString(36).toUpperCase() });
      toast('📄 Modelo aberto para impressão');
    } },
      h('div', { class: 'tile-icon' }, t.e),
      h('div', { class: 'tile-title' }, t.t)
    )));
    root.appendChild(grid);
  }
  function viewAgenda(root) {
    const now = new Date();
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', { style: 'text-transform:capitalize' }, now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })),
      h('p', {}, 'Calendário do consultório.')
    ));
    const cal = h('div', { class: 'card', style: 'margin: 16px 0;' });
    cal.appendChild(h('div', { class: 'cal' }, ...['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => h('div', { class: 'cal-head' }, d))));
    const days = h('div', { class: 'cal', style: 'margin-top:8px;' });
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) days.appendChild(h('div'));
    for (let d = 1; d <= last; d++) {
      const cls = ['cal-day'];
      if (d === now.getDate()) cls.push('today');
      if ([4, 10, 12, 18, 22, 26].includes(d)) cls.push('has-event');
      days.appendChild(h('div', { class: cls.join(' ') }, String(d)));
    }
    cal.appendChild(days);
    root.appendChild(cal);
  }
  function viewFinanceiro(root) {
    root.appendChild(h('div', { class: 'grid cols-4' },
      kpi('Receita do mês', 'R$ 24.800', '+12%', '$'),
      kpi('Recebido', 'R$ 19.300', '78%', '✓'),
      kpi('A receber', 'R$ 5.500', '22%', '⏳'),
      kpi('Ticket médio', 'R$ 380', '+R$ 12', '📊')
    ));
    const c = h('div', { class: 'card chart-card', style: 'margin-top:16px;' });
    c.insertAdjacentHTML('beforeend', Charts.bars(NEUROPED.dashboardSeries.receitaMes.map(v => v * 1000), { id: 'rec' }));
    root.appendChild(c);
  }
  function viewMensagens(root) {
    const list = h('div', { class: 'list' });
    NEUROPED.messages.forEach(m => list.appendChild(h('div', { class: 'list-item' },
      h('div', { class: 'li-emoji' }, m.role === 'familia' ? '♥' : '👥'),
      h('div', { class: 'li-body' }, h('div', { class: 'li-title' }, m.from), h('div', { class: 'li-sub' }, m.body)),
      m.unread ? h('span', { class: 'pill brand' }, 'Novo') : null
    )));
    root.appendChild(list);
  }
  function viewConfig(root) {
    const cfg = NEUROPED_CLOUD.cfg;
    const status = NEUROPED_CLOUD.status();
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' },
        h('span', { class: 'sync-status' + (status.hasCloud ? '' : ' warn') }, h('span', { class: 'dot' }), status.hasCloud ? 'Nuvem · ' + status.mode : 'Modo local')
      ),
      h('div', { class: 'grid cols-2', style: 'margin-top:16px;' },
        h('div', { class: 'field' }, h('label', {}, 'Supabase URL'), h('input', { class: 'input', id: 'cfg-sup', value: cfg.SUPABASE_URL })),
        h('div', { class: 'field' }, h('label', {}, 'Supabase Anon Key'), h('input', { class: 'input', id: 'cfg-key', value: cfg.SUPABASE_ANON })),
        h('div', { class: 'field', style: 'grid-column:1/-1;' }, h('label', {}, 'Cloudflare Pages base'), h('input', { class: 'input', id: 'cfg-cf', value: cfg.CLOUDFLARE_BASE }))
      ),
      h('div', { class: 'row', style: 'margin-top:14px;' },
        h('button', { class: 'btn btn-primary', onclick: () => {
          cfg.SUPABASE_URL = $('#cfg-sup').value.trim();
          cfg.SUPABASE_ANON = $('#cfg-key').value.trim();
          cfg.CLOUDFLARE_BASE = $('#cfg-cf').value.trim();
          localStorage.setItem('neuroped:cfg', JSON.stringify(cfg));
          toast('✓ Configuração salva');
        } }, 'Salvar configuração'),
        h('button', { class: 'btn btn-ghost', onclick: async () => {
          if (await confirmDialog('Bloquear modo profissional', 'Você precisará digitar o PIN MASTER de novo para acessar.')) {
            Store.lockPro();
            updateProLockUI();
            location.hash = '#/inicio';
            toast('🔒 Modo profissional bloqueado');
          }
        } }, '🔒 Bloquear modo profissional')
      )
    ));
  }

  /* ====== Search ====== */
  function openSearch() { $('#searchModal').hidden = false; setTimeout(() => $('#searchInput').focus(), 50); renderSearch(''); }
  function closeSearchModal() { $('#searchModal').hidden = true; }
  function renderSearch(q) {
    const res = $('#searchResults'); res.innerHTML = '';
    if (!q) { res.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '⌕'), h('div', {}, 'Busque conteúdo…'))); return; }
    const ql = q.toLowerCase();
    const matches = [];
    NEUROPED.modules.forEach(m => { if ((m.locked && !Store.isProUnlocked())) return; if ((m.title + ' ' + m.sub).toLowerCase().includes(ql)) matches.push({ type: 'Módulo', emoji: m.icon, title: m.title, sub: m.sub, href: '#/' + m.id }); });
    NEUROPED.familyScales.forEach(s => { if ((s.title + ' ' + s.domain + ' ' + s.age).toLowerCase().includes(ql)) matches.push({ type: 'Escala familiar', emoji: s.emoji, title: s.title, sub: s.age + ' · ' + s.domain, href: '#/escala/' + s.id }); });
    NEUROPED.materiais.forEach((m, i) => { if ((m.t + ' ' + m.sub).toLowerCase().includes(ql)) matches.push({ type: 'Material', emoji: m.e, title: m.t, sub: m.sub, href: '#/material/' + i }); });
    if (!matches.length) { res.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '🤔'), h('div', {}, 'Nada encontrado.'))); return; }
    matches.slice(0, 40).forEach(m => res.appendChild(h('a', { class: 'list-item', href: m.href, onclick: closeSearchModal },
      h('div', { class: 'li-emoji' }, m.emoji),
      h('div', { class: 'li-body' }, h('div', { class: 'li-title' }, m.title), h('div', { class: 'li-sub' }, m.type + ' · ' + m.sub))
    )));
  }

  /* ====== Install ====== */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false; });

  /* ====== Boot ====== */
  function boot() {
    initTheme();
    setTimeout(() => {
      $('#splash').style.display = 'none';
      $('#app').hidden = false;
      try { const saved = JSON.parse(localStorage.getItem('neuroped:cfg') || 'null'); if (saved) Object.assign(window.NEUROPED_CONFIG, saved); } catch {}
      updateProLockUI();
      if (!location.hash) location.hash = '#/inicio';
      navigate();
    }, 1400);

    window.addEventListener('hashchange', navigate);
    document.addEventListener('click', e => { if (e.target.closest('#quickSearch')) openSearch(); });
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#searchBtn').addEventListener('click', openSearch);
    $('#closeSearch').addEventListener('click', closeSearchModal);
    $('#searchInput').addEventListener('input', e => renderSearch(e.target.value));
    $('#searchModal').addEventListener('click', e => { if (e.target.id === 'searchModal') closeSearchModal(); });
    $('#sheetModal').addEventListener('click', e => { if (e.target.id === 'sheetModal') closeSheet(); });
    $('#backBtn').addEventListener('click', () => history.length > 1 ? history.back() : (location.hash = '#/inicio'));
    $('#syncBtn').addEventListener('click', async () => {
      $('#syncBtn').style.animation = 'spin 700ms linear';
      const p = await NEUROPED_CLOUD.ping();
      setTimeout(() => $('#syncBtn').style.animation = '', 720);
      toast(p.ok ? '✓ Nuvem online' : '⚠ Modo offline');
    });
    $('#installBtn').addEventListener('click', async () => {
      if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; toast(outcome === 'accepted' ? '✓ Instalado' : 'Cancelado'); deferredPrompt = null; $('#installBtn').hidden = true; }
      else toast('Use menu do navegador → "Instalar aplicativo"');
    });
    const lockHandler = async () => {
      if (Store.isProUnlocked()) {
        if (await confirmDialog('Bloquear modo profissional', 'Você precisará do PIN MASTER novamente.')) {
          Store.lockPro(); updateProLockUI();
          if ((routes[parseHash().route] || {}).locked) location.hash = '#/inicio';
          else navigate();
          toast('🔒 Modo profissional bloqueado');
        }
      } else {
        if (await askPin()) navigate();
      }
    };
    $('#proLockBtn').addEventListener('click', lockHandler);
    $('#proLockBtnTop').addEventListener('click', lockHandler);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') { closeSearchModal(); $('#sheetModal').hidden = true; $('#confirmModal').hidden = true; $('#pinModal').hidden = true; }
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
