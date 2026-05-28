/* ===========================================================
   NeuroPed EDJ v4.0 — SPA Controller (comercial)
   Auth + Store + Router + Views + Interactions
   =========================================================== */

(function () {
  'use strict';

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

  /* ====== Store (auth + state) ====== */
  const Store = {
    USER_KEY: 'neuroped:user:v4',
    THEME_KEY: 'neuroped:theme',
    ONB_KEY: 'neuroped:onb:done',

    getUser() { try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); } catch { return null; } },
    setUser(u) { localStorage.setItem(this.USER_KEY, JSON.stringify(u)); },
    clearUser() { localStorage.removeItem(this.USER_KEY); },

    isOnboarded() { return localStorage.getItem(this.ONB_KEY) === '1'; },
    setOnboarded() { localStorage.setItem(this.ONB_KEY, '1'); },

    getTheme() { return localStorage.getItem(this.THEME_KEY); },
    setTheme(t) { localStorage.setItem(this.THEME_KEY, t); }
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
    Store.setTheme(next);
    applyTheme(next);
    toast(next === 'dark' ? '🌙 Tema escuro ativado' : '☀️ Tema claro ativado');
  }

  /* ====== Toast ====== */
  function toast(msg, ms = 2400) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.hidden = true; }, ms);
  }

  /* ====== Confirm ====== */
  function confirmDialog(title, text) {
    return new Promise(resolve => {
      $('#confirmTitle').textContent = title;
      $('#confirmText').textContent = text;
      const m = $('#confirmModal'); m.hidden = false;
      const onOk = () => { close(true); };
      const onCancel = () => { close(false); };
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

  /* ====== Onboarding ====== */
  function showOnboarding() {
    const onb = $('#onboarding'); onb.hidden = false;
    let step = 1;
    function go(n) {
      step = n;
      $$('.onb-slide').forEach(s => s.hidden = +s.dataset.step !== step);
      $$('.onb-progress > span').forEach(s => s.classList.toggle('active', +s.dataset.step <= step));
    }
    $('#onbNext').onclick = () => {
      if (step < 3) go(step + 1);
      else finishOnb();
    };
    $('#onbSkip').onclick = finishOnb;
    function finishOnb() {
      Store.setOnboarded();
      onb.hidden = true;
      showAuth();
    }
  }

  /* ====== Auth ====== */
  function showAuth() {
    const a = $('#auth'); a.hidden = false;

    let mode = 'login', role = 'medico';
    function refresh() {
      $$('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
      $$('.role-pill').forEach(t => t.classList.toggle('active', t.dataset.role === role));
      $$('[data-signup-only]').forEach(f => f.hidden = mode === 'login');
      $$('[data-role-family]').forEach(f => f.hidden = role !== 'familia');
      $('#authSubmit').textContent = mode === 'login' ? 'Entrar →' : 'Criar conta →';
    }
    refresh();

    $$('.auth-tab').forEach(t => t.onclick = () => { mode = t.dataset.mode; refresh(); });
    $$('.role-pill').forEach(t => t.onclick = () => { role = t.dataset.role; refresh(); });

    $('#authForm').onsubmit = e => {
      e.preventDefault();
      const email = $('#authEmail').value.trim();
      const pass  = $('#authPass').value.trim();
      const name  = $('#authName').value.trim();
      if (!email || !pass) return toast('Preencha e-mail e senha');
      if (mode === 'signup' && !name) return toast('Informe seu nome');

      const display = name || (role === 'medico' ? 'Dr. Jadson Fraga' : role === 'secretaria' ? 'Secretaria' : 'Família');
      Store.setUser({ email, name: display, role, plan: role === 'medico' ? 'pro' : 'free', signedAt: Date.now() });
      a.hidden = true;
      toast('✓ Bem-vindo, ' + display.split(' ')[0]);
      bootApp();
    };

    $('#authDemo').onclick = () => {
      Store.setUser({ email: 'demo@neuroped.com', name: 'Dr. Jadson Fraga', role: 'medico', plan: 'pro', signedAt: Date.now(), demo: true });
      a.hidden = true;
      toast('✓ Modo demo · Dr. Jadson');
      bootApp();
    };
  }

  /* ====== Router ====== */
  const routes = {
    'inicio':     { title: 'Início',          sub: 'Painel clínico',                  render: viewInicio,     icon: '⌂' },
    'pacientes':  { title: 'Pacientes',       sub: 'CRM e prontuário digital',        render: viewPacientes,  icon: '☺' },
    'paciente':   { title: 'Paciente',        sub: 'Prontuário individual',           render: viewPaciente,   icon: '☺', hidden: true },
    'consultas':  { title: 'Consultas',       sub: 'Atendimentos e telemedicina',     render: viewConsultas,  icon: '+' },
    'escalas':    { title: 'Escalas',         sub: '507 instrumentos · família e clínica', render: viewEscalas, icon: '≡' },
    'escala':     { title: 'Aplicar escala',  sub: 'Instrumento clínico',             render: viewEscala,     icon: '≡', hidden: true },
    'laudos':     { title: 'Laudos',          sub: 'Geração, histórico e assinatura', render: viewLaudos,     icon: '✎' },
    'agenda':     { title: 'Agenda',          sub: 'Calendário e lembretes',          render: viewAgenda,     icon: '▦' },
    'financeiro': { title: 'Financeiro',      sub: 'Receita e cobrança',              render: viewFinanceiro, icon: '$' },
    'mensagens':  { title: 'Mensagens',       sub: 'Equipe e família',                render: viewMensagens,  icon: '✉' },
    'caa':        { title: 'CAA',             sub: 'Comunicação alternativa',         render: viewCAA,        icon: '◉' },
    'familia':    { title: 'Portal Família',  sub: 'Passes e materiais',              render: viewFamilia,    icon: '♥' },
    'planos':     { title: 'Planos',          sub: 'Sua assinatura NeuroPed',         render: viewPlanos,     icon: '★' },
    'config':     { title: 'Configurações',   sub: 'Conta, nuvem e LGPD',             render: viewConfig,     icon: '⚙' }
  };

  function parseHash() {
    const raw = location.hash.replace(/^#\//, '') || 'inicio';
    const [route, ...rest] = raw.split('/');
    return { route, params: rest };
  }

  function navigate() {
    const u = Store.getUser(); if (!u) { showAuth(); return; }
    const { route, params } = parseHash();
    const r = routes[route] || routes['inicio'];

    $('#pageTitle').textContent = r.title;
    $('#pageSubtitle').textContent = r.sub;
    $('#backBtn').hidden = (route === 'inicio');

    $$('.nav-item, .bn-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });

    const stack = $('#viewStack');
    stack.innerHTML = '';
    const view = h('div', { class: 'view' });
    stack.appendChild(view);
    try { r.render(view, params); } catch (e) { console.error(e); view.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '⚠️'), h('div', {}, 'Erro ao renderizar: ' + e.message))); }
    stack.scrollTop = 0;
  }

  /* ====== Navigation render ====== */
  function renderNav() {
    const u = Store.getUser();
    const nav = $('#nav');
    nav.innerHTML = '';
    const visible = NEUROPED.modules.filter(m => !u.role || m.roles.includes(u.role));
    visible.forEach(m => {
      const item = h('a', { class: 'nav-item', href: '#/' + m.id, 'data-route': m.id },
        h('span', { class: 'nav-icon' }, m.icon),
        h('span', {}, m.title),
        m.id === 'mensagens' ? h('span', { class: 'nav-badge' }, '2') : null
      );
      nav.appendChild(item);
    });

    // bottom nav (5 fixed)
    const bn = $('#bottomNav');
    bn.innerHTML = '';
    const bnIds = ['inicio', 'escalas', 'consultas', 'agenda', 'mensagens'];
    bnIds.forEach((id, i) => {
      const m = NEUROPED.modules.find(x => x.id === id);
      if (!m) return;
      if (i === 2) {
        bn.appendChild(h('a', { class: 'bn-item fab', href: '#/' + id, 'data-route': id, 'aria-label': m.title },
          h('span', { class: 'bn-icon' }, '+')
        ));
      } else {
        bn.appendChild(h('a', { class: 'bn-item', href: '#/' + id, 'data-route': id },
          h('span', { class: 'bn-icon' }, m.icon),
          h('span', {}, m.title)
        ));
      }
    });
  }

  /* ====== Views ====== */
  function viewInicio(root) {
    const u = Store.getUser();
    const t = NEUROPED.totals;

    root.appendChild(
      h('section', { class: 'card-hero' },
        h('h2', {}, 'Olá, ' + (u.name.split(' ')[0]) + ' 👋'),
        h('p', {}, 'Você tem 5 atendimentos hoje, 2 mensagens novas e 1 escala pendente de devolutiva. Vamos começar?'),
        h('div', { class: 'row' },
          h('a', { class: 'btn solid', href: '#/consultas' }, '+ Nova consulta'),
          h('a', { class: 'btn', href: '#/pacientes' }, '☺ Pacientes'),
          h('a', { class: 'btn', href: '#/agenda' }, '▦ Agenda do dia')
        )
      )
    );

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Visão geral')));
    root.appendChild(h('div', { class: 'grid cols-4' },
      kpi('Pacientes ativos', t.patients, '+8 este mês', '☺'),
      kpi('Consultas (mês)', t.consultasMes, '+4 esta semana', '🩺'),
      kpi('Receita prevista', t.receitaMes, '+12% MoM', '$'),
      kpi('Nuvem', 'OK', 'Sincronizado', '☁')
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Tendências')));
    const trendGrid = h('div', { class: 'grid cols-2' });
    const lineCard = h('div', { class: 'card chart-card' },
      h('div', { class: 'row', style: 'margin-bottom:8px' },
        h('div', {}, h('div', { class: 'tile-sub' }, 'Consultas por mês'), h('div', { style: 'font-size:24px; font-weight:700; letter-spacing:-0.02em;' }, NEUROPED.dashboardSeries.consultasMes.reduce((a,b)=>a+b,0))),
        h('div', { class: 'spacer' }),
        h('span', { class: 'pill success' }, '+18% YoY')
      )
    );
    lineCard.insertAdjacentHTML('beforeend', Charts.line(NEUROPED.dashboardSeries.consultasMes, { id: 'cmes', color: '#df2f3a' }));
    trendGrid.appendChild(lineCard);

    const barCard = h('div', { class: 'card chart-card' },
      h('div', { class: 'row', style: 'margin-bottom:8px' },
        h('div', {}, h('div', { class: 'tile-sub' }, 'Pacientes ativos (12 meses)'), h('div', { style: 'font-size:24px; font-weight:700; letter-spacing:-0.02em;' }, t.patients)),
        h('div', { class: 'spacer' }),
        h('span', { class: 'pill accent' }, 'Cresc. 82%')
      )
    );
    barCard.insertAdjacentHTML('beforeend', Charts.bars(NEUROPED.dashboardSeries.pacientesAtivos, { id: 'pac', gradient: true }));
    trendGrid.appendChild(barCard);
    root.appendChild(trendGrid);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Distribuição por domínio')));
    const donutCard = h('div', { class: 'card chart-card', style: 'display:flex; gap:20px; align-items:center; flex-wrap:wrap;' });
    const donutWrap = h('div', { style: 'flex:0 0 200px;' });
    donutWrap.innerHTML = Charts.donut(NEUROPED.dashboardSeries.domainDist, { size: 200 });
    donutCard.appendChild(donutWrap);
    const donutLeg = h('div', { style: 'flex:1; min-width:220px;' });
    donutLeg.innerHTML = Charts.legend(NEUROPED.dashboardSeries.domainDist);
    donutCard.appendChild(donutLeg);
    root.appendChild(donutCard);

    root.appendChild(h('div', { class: 'section-title' },
      h('h3', {}, 'Hoje na agenda'),
      h('a', { href: '#/agenda' }, 'Abrir agenda →')
    ));
    const events = h('div', { class: 'list' });
    NEUROPED.events.filter(e => e.day === 0).forEach(ev => {
      events.appendChild(h('a', { class: 'list-item', href: ev.patient ? '#/paciente/' + ev.patient : '#/agenda' },
        h('div', { class: 'li-emoji' }, eventEmoji(ev.kind)),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, ev.title),
          h('div', { class: 'li-sub' }, ev.time + ' · ' + ev.tag),
          h('div', { class: 'li-meta' }, h('span', { class: 'pill brand' }, ev.kind.toUpperCase()))
        ),
        h('div', { class: 'li-arrow' }, '›')
      ));
    });
    root.appendChild(events);

    root.appendChild(h('div', { class: 'section-title' },
      h('h3', {}, 'Pacientes recentes'),
      h('a', { href: '#/pacientes' }, 'Ver todos →')
    ));
    const patients = h('div', { class: 'grid cols-3' });
    NEUROPED.patients.slice(0, 6).forEach(p => patients.appendChild(patientCard(p)));
    root.appendChild(patients);
  }

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

  function patientCard(p) {
    return h('a', { class: 'patient-card', href: '#/paciente/' + p.code },
      h('div', { class: 'patient-head' },
        h('div', { class: 'avatar', style: 'width:46px;height:46px;border-radius:14px;' }, initials(p.name)),
        h('div', { style: 'flex:1; min-width:0' },
          h('div', { class: 'patient-name' }, p.name),
          h('div', { class: 'patient-sub' }, p.age + ' · ' + p.domain)
        ),
        statusPill(p.status)
      ),
      h('div', { class: 'row', style: 'font-size:12px; color: var(--text-mute);' },
        h('span', {}, 'Último: ' + p.last),
        h('span', { class: 'spacer' }),
        h('span', { class: 'pill accent' }, 'Score ' + p.score)
      )
    );
  }
  function statusPill(s) {
    const map = { ativo: ['success', 'Ativo'], retorno: ['warn', 'Retorno'], alta: ['accent', 'Alta'] };
    const [cls, txt] = map[s] || ['', s];
    return h('span', { class: 'pill ' + cls }, txt);
  }

  /* ----- Pacientes ----- */
  let pacFilter = { q: '', status: 'todos', domain: 'todos' };
  function viewPacientes(root) {
    const domains = ['todos', ...new Set(NEUROPED.patients.map(p => p.domain))];
    const statuses = ['todos', 'ativo', 'retorno', 'alta'];

    const headerRow = h('div', { class: 'row', style: 'margin-bottom:16px;' },
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn btn-primary btn-sm', onclick: () => openNewPatient() }, '+ Novo paciente')
    );
    root.appendChild(headerRow);

    const filters = h('div', { class: 'filter-bar' });
    const search = h('div', { class: 'input-icon', style: 'flex:1; min-width:200px' },
      h('span', {}, '⌕'),
      h('input', { class: 'input', placeholder: 'Buscar nome, código ou domínio…', value: pacFilter.q, oninput: e => { pacFilter.q = e.target.value; refresh(); } })
    );
    filters.appendChild(search);
    statuses.forEach(s => {
      const c = h('button', { class: 'chip' + (pacFilter.status === s ? ' active' : ''), onclick: () => { pacFilter.status = s; refresh(); } }, s === 'todos' ? 'Todos' : (s[0].toUpperCase() + s.slice(1)));
      filters.appendChild(c);
    });
    const selDom = h('select', { class: 'select', style: 'max-width: 200px;', onchange: e => { pacFilter.domain = e.target.value; refresh(); } },
      ...domains.map(d => h('option', { value: d, selected: d === pacFilter.domain }, d === 'todos' ? 'Todos os domínios' : d))
    );
    filters.appendChild(selDom);
    root.appendChild(filters);

    const totalsRow = h('div', { class: 'grid cols-4', style: 'margin-bottom:16px;' });
    totalsRow.appendChild(kpi('Total', NEUROPED.patients.length, 'cadastrados', '☺'));
    totalsRow.appendChild(kpi('Ativos', NEUROPED.patients.filter(p=>p.status==='ativo').length, 'em acompanhamento', '✓'));
    totalsRow.appendChild(kpi('Para retorno', NEUROPED.patients.filter(p=>p.status==='retorno').length, 'agendar', '🔁'));
    totalsRow.appendChild(kpi('Alta', NEUROPED.patients.filter(p=>p.status==='alta').length, 'finalizados', '✅'));
    root.appendChild(totalsRow);

    const wrap = h('div', { id: 'pacGrid' });
    root.appendChild(wrap);

    function refresh() {
      const filtered = NEUROPED.patients.filter(p => {
        if (pacFilter.status !== 'todos' && p.status !== pacFilter.status) return false;
        if (pacFilter.domain !== 'todos' && p.domain !== pacFilter.domain) return false;
        if (pacFilter.q && !(p.name + ' ' + p.code + ' ' + p.domain).toLowerCase().includes(pacFilter.q.toLowerCase())) return false;
        return true;
      });
      wrap.innerHTML = '';
      if (!filtered.length) {
        wrap.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '☺'), h('div', {}, 'Nenhum paciente encontrado.')));
        return;
      }
      const grid = h('div', { class: 'grid cols-3' });
      filtered.forEach(p => grid.appendChild(patientCard(p)));
      wrap.appendChild(grid);
    }
    refresh();
  }

  function openNewPatient() {
    const node = h('div', {},
      h('h3', { style: 'margin:0 0 14px; font-size:18px; letter-spacing:-0.01em;' }, '+ Novo paciente'),
      h('div', { class: 'grid cols-2' },
        formField('Nome completo', h('input', { class: 'input', id: 'np-name', placeholder: 'Ex: Maria Silva' })),
        formField('Data nascimento', h('input', { class: 'input', id: 'np-dob', type: 'date' })),
        formField('Responsável', h('input', { class: 'input', id: 'np-resp', placeholder: 'Nome do responsável' })),
        formField('Telefone', h('input', { class: 'input', id: 'np-tel', placeholder: '(00) 9 0000-0000' })),
        h('div', { style: 'grid-column: 1/-1;' },
          formField('Queixa inicial', h('textarea', { class: 'textarea', id: 'np-q', placeholder: 'Breve descrição da queixa…' })))
      ),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-ghost', onclick: closeSheet }, 'Cancelar'),
        h('button', { class: 'btn btn-primary', onclick: () => {
          const n = $('#np-name').value.trim();
          if (!n) return toast('Informe o nome');
          NEUROPED.patients.unshift({ code: 'PAC-' + (100 + NEUROPED.patients.length), name: n, age: '—', gender: '—', domain: 'Geral', last: 'hoje', score: 0, status: 'ativo', dob: $('#np-dob').value, responsible: $('#np-resp').value, phone: $('#np-tel').value, email: '' });
          NEUROPED_CLOUD.pacientes.add({ name: n });
          closeSheet();
          toast('✓ Paciente cadastrado');
          navigate();
        } }, 'Salvar')
      )
    );
    openSheet(node);
  }

  function viewPaciente(root, params) {
    const code = params[0];
    const p = NEUROPED.patients.find(x => x.code === code);
    if (!p) { root.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '☺'), h('div', {}, 'Paciente não encontrado.'))); return; }

    root.appendChild(h('div', { class: 'card-hero' },
      h('div', { class: 'row' },
        h('div', { class: 'avatar', style: 'width:64px;height:64px;border-radius:18px;font-size:20px;' }, initials(p.name)),
        h('div', { style: 'flex:1' },
          h('h2', { style: 'margin:0' }, p.name),
          h('p', { style: 'margin:4px 0 0' }, p.code + ' · ' + p.age + ' · ' + p.gender + ' · ' + p.domain)
        ),
        h('div', { class: 'row' },
          h('button', { class: 'btn solid', onclick: () => openNewLaudo(p) }, '✎ Novo laudo'),
          h('button', { class: 'btn', onclick: () => location.hash = '#/escalas' }, '≡ Aplicar escala')
        )
      )
    ));

    root.appendChild(h('div', { class: 'grid cols-4' },
      kpi('Status', (p.status || '—').toUpperCase(), 'acompanhamento', '✓'),
      kpi('Última consulta', p.last, '—', '📅'),
      kpi('Score atual', p.score, 'última escala', '📊'),
      kpi('Idade', p.age, p.dob || '—', '🎂')
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Contato')));
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'grid cols-3' },
        infoCell('Responsável', p.responsible || '—'),
        infoCell('Telefone', p.phone || '—'),
        infoCell('E-mail', p.email || '—')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Evolução clínica')));
    const evol = h('div', { class: 'card chart-card' });
    evol.insertAdjacentHTML('beforeend', Charts.line([5, 7, 6, 8, 11, 9, 12, p.score], { id: 'evo', color: '#6366f1' }));
    root.appendChild(evol);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Linha do tempo')));
    const tl = h('div', { class: 'card timeline' });
    [
      { t: 'Hoje, 09:00', title: 'Triagem TEA', text: 'Aplicação da escala "Primeiros Sinais TEA" — score 12/15.' },
      { t: 'Há 2 semanas', title: 'Consulta inicial', text: 'Queixa: dificuldade em interação social. Encaminhado para terapias.' },
      { t: 'Há 1 mês', title: 'Cadastro', text: 'Paciente cadastrado no sistema NeuroPed EDJ.' }
    ].forEach(e => {
      tl.appendChild(h('div', { class: 'tl-item' },
        h('div', { class: 'tl-time' }, e.t),
        h('div', { class: 'tl-title' }, e.title),
        h('div', { class: 'tl-text' }, e.text)
      ));
    });
    root.appendChild(tl);
  }

  function infoCell(label, value) {
    return h('div', {},
      h('div', { style: 'font-size:11px; color:var(--text-mute); text-transform:uppercase; letter-spacing:0.08em; font-weight:600;' }, label),
      h('div', { style: 'font-size:15px; margin-top:4px; font-weight:500;' }, value)
    );
  }
  function formField(label, input) {
    return h('div', { class: 'field' }, h('label', {}, label), input);
  }

  /* ----- Consultas ----- */
  function viewConsultas(root) {
    const tabs = h('div', { class: 'tabs' },
      tab('nova', 'Nova consulta', true),
      tab('hoje', 'Hoje (' + NEUROPED.events.filter(e=>e.day===0&&e.kind!=='reuniao').length + ')'),
      tab('hist', 'Histórico')
    );
    root.appendChild(tabs);
    const pane = h('div'); root.appendChild(pane);

    function tab(id, txt, active) {
      const el = h('button', { class: 'tab' + (active ? ' active' : ''), 'data-tab': id, onclick: () => { $$('.tab', tabs).forEach(t=>t.classList.remove('active')); el.classList.add('active'); render(id); } }, txt);
      return el;
    }

    function render(id) {
      pane.innerHTML = '';
      if (id === 'nova') renderNova();
      else if (id === 'hoje') renderHoje();
      else renderHist();
    }

    function renderNova() {
      const form = h('div', { class: 'grid cols-2' },
        formField('Paciente', h('select', { class: 'select', id: 'cs-p' }, h('option', { value: '' }, '— escolher —'), ...NEUROPED.patients.map(p => h('option', { value: p.code }, p.name + ' (' + p.code + ')')))),
        formField('Tipo', h('select', { class: 'select', id: 'cs-t' }, h('option', {}, 'Primeira consulta'), h('option', {}, 'Retorno'), h('option', {}, 'Devolutiva'), h('option', {}, 'Telemedicina'))),
        formField('Queixa principal', h('input', { class: 'input', id: 'cs-q', placeholder: 'Ex: dificuldade em comunicação...' })),
        formField('Responsável presente', h('input', { class: 'input', id: 'cs-r', placeholder: 'Mãe / Pai / outros' })),
        h('div', { style: 'grid-column:1/-1;' }, formField('HPMA', h('textarea', { class: 'textarea', id: 'cs-h', placeholder: 'História da queixa atual…' }))),
        h('div', { style: 'grid-column:1/-1;' }, formField('Conduta', h('textarea', { class: 'textarea', id: 'cs-c', placeholder: 'Conduta e orientações…' })))
      );
      pane.appendChild(form);

      pane.appendChild(h('div', { class: 'row', style: 'margin-top:18px;' },
        h('button', { class: 'btn btn-primary', onclick: salvar }, '☁ Salvar consulta'),
        h('button', { class: 'btn btn-accent', onclick: salvarELaudo }, '✎ Salvar e gerar laudo'),
        h('button', { class: 'btn btn-ghost', onclick: () => location.hash = '#/inicio' }, 'Cancelar')
      ));

      async function salvar(){
        const data = {
          paciente: $('#cs-p').value,
          tipo: $('#cs-t').value,
          queixa: $('#cs-q').value,
          responsavel: $('#cs-r').value,
          hpma: $('#cs-h').value,
          conduta: $('#cs-c').value
        };
        if (!data.paciente) return toast('Selecione um paciente');
        NEUROPED_CLOUD.consultas.add(data);
        toast('Consulta salva · sincronizando…');
        const r = await NEUROPED_CLOUD.pushToCloud({ kind:'consulta', ...data });
        toast(r.ok ? '✓ Sincronizado' : '⚠ Salvo localmente');
      }
      async function salvarELaudo() {
        await salvar();
        const pcode = $('#cs-p').value;
        const p = NEUROPED.patients.find(x=>x.code===pcode);
        if (p) openNewLaudo(p, { queixa: $('#cs-q').value, hpma: $('#cs-h').value, conduta: $('#cs-c').value });
      }
    }

    function renderHoje() {
      const list = h('div', { class: 'list' });
      NEUROPED.events.filter(e => e.day === 0 && e.kind !== 'reuniao').forEach(ev => {
        list.appendChild(h('a', { class: 'list-item', href: ev.patient ? '#/paciente/' + ev.patient : '#' },
          h('div', { class: 'li-emoji' }, eventEmoji(ev.kind)),
          h('div', { class: 'li-body' },
            h('div', { class: 'li-title' }, ev.title),
            h('div', { class: 'li-sub' }, ev.time + ' · ' + ev.tag)
          ),
          h('span', { class: 'pill brand' }, ev.kind.toUpperCase()),
          h('div', { class: 'li-arrow' }, '›')
        ));
      });
      pane.appendChild(list);
    }
    function renderHist() {
      const items = NEUROPED_CLOUD.consultas.list();
      if (!items.length) { pane.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '📋'), h('div', {}, 'Nenhuma consulta registrada ainda.'))); return; }
      const list = h('div', { class: 'list' });
      items.forEach(c => {
        const p = NEUROPED.patients.find(x => x.code === c.paciente);
        list.appendChild(h('div', { class: 'list-item' },
          h('div', { class: 'li-emoji' }, '🩺'),
          h('div', { class: 'li-body' },
            h('div', { class: 'li-title' }, p ? p.name : c.paciente),
            h('div', { class: 'li-sub' }, (c.tipo || 'Consulta') + ' · ' + new Date(c._at).toLocaleString('pt-BR'))
          ),
          h('span', { class: 'pill' }, c.queixa ? (c.queixa.slice(0, 30) + '…') : 'sem queixa')
        ));
      });
      pane.appendChild(list);
    }

    render('nova');
  }

  /* ----- Escalas ----- */
  let escFilter = { audience: 'todas', domain: 'todos', age: 'todas', q: '' };
  function viewEscalas(root) {
    const audiences = ['todas', 'familia', 'profissional'];
    const domains = ['todos', ...new Set(NEUROPED.scales.map(s => s.domain))];
    const ages = ['todas', ...new Set(NEUROPED.scales.map(s => s.age))];

    root.appendChild(h('div', { class: 'card', style: 'margin-bottom:16px; display:flex; gap:16px; align-items:center; flex-wrap:wrap;' },
      h('div', {},
        h('div', { style: 'font-weight:700; font-size:18px; letter-spacing:-0.01em;' }, NEUROPED.scales.length + ' instrumentos disponíveis'),
        h('div', { class: 'tile-sub' }, 'Triagem, organização e acompanhamento — família e clínica')
      ),
      h('div', { class: 'spacer' }),
      h('span', { class: 'pill brand' }, 'Família ' + NEUROPED.scales.filter(s=>s.audience==='familia').length),
      h('span', { class: 'pill accent' }, 'Clínica ' + NEUROPED.scales.filter(s=>s.audience==='profissional').length),
      h('span', { class: 'pill success' }, 'PT-BR · autorais')
    ));

    const filters = h('div', { class: 'filter-bar' });
    audiences.forEach(a => {
      const p = h('button', { class: 'chip' + (escFilter.audience===a?' active':''), onclick: () => { escFilter.audience = a; refresh(); } }, a==='todas'?'Todas audiências':(a==='familia'?'Família':'Clínica'));
      filters.appendChild(p);
    });
    const selDom = h('select', { class: 'select', style: 'max-width:200px;', onchange: e => { escFilter.domain = e.target.value; refresh(); } }, ...domains.map(d => h('option', { value: d, selected: d===escFilter.domain }, d==='todos'?'Todos domínios':d)));
    filters.appendChild(selDom);
    const selAge = h('select', { class: 'select', style: 'max-width:170px;', onchange: e => { escFilter.age = e.target.value; refresh(); } }, ...ages.map(a => h('option', { value: a, selected: a===escFilter.age }, a==='todas'?'Todas idades':a)));
    filters.appendChild(selAge);
    const search = h('div', { class: 'input-icon', style: 'flex:1; min-width:200px;' },
      h('span', {}, '⌕'),
      h('input', { class: 'input', placeholder: 'Buscar título, queixa, idade…', value: escFilter.q, oninput: e => { escFilter.q = e.target.value; refresh(); } })
    );
    filters.appendChild(search);
    root.appendChild(filters);

    const listEl = h('div', { class: 'list' });
    root.appendChild(listEl);

    function refresh() {
      const filtered = NEUROPED.scales.filter(s => {
        if (escFilter.audience !== 'todas' && s.audience !== escFilter.audience) return false;
        if (escFilter.domain !== 'todos' && s.domain !== escFilter.domain) return false;
        if (escFilter.age !== 'todas' && s.age !== escFilter.age) return false;
        if (escFilter.q && !(s.title + ' ' + s.domain + ' ' + s.age).toLowerCase().includes(escFilter.q.toLowerCase())) return false;
        return true;
      }).sort((a,b) => b.priority - a.priority);

      listEl.innerHTML = '';
      const top = h('div', { class: 'row', style: 'margin-bottom: 12px; font-size: 13px; color: var(--text-mute);' },
        h('span', {}, filtered.length + ' resultado' + (filtered.length === 1 ? '' : 's'))
      );
      listEl.appendChild(top);
      if (!filtered.length) {
        listEl.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '🔎'), h('div', {}, 'Nenhum instrumento com esses filtros.')));
        return;
      }
      filtered.slice(0, 100).forEach(s => {
        listEl.appendChild(h('a', { class: 'list-item', href: '#/escala/' + s.id },
          h('div', { class: 'li-emoji' }, s.emoji),
          h('div', { class: 'li-body' },
            h('div', { class: 'li-title' }, s.title),
            h('div', { class: 'li-sub' }, s.age + ' · ' + s.domain + ' · ' + (s.audience==='familia'?'Família':'Clínica')),
            h('div', { class: 'li-meta' },
              h('span', { class: 'pill ' + (s.audience==='familia'?'brand':'accent') }, s.audience==='familia'?'Família':'Clínica'),
              h('span', { class: 'pill' }, s.questions.length + ' itens'),
              s.priority >= 95 ? h('span', { class: 'pill success' }, 'Prioridade alta') : null,
              s.synthetic ? h('span', { class: 'pill warn' }, 'Catálogo') : null
            )
          ),
          h('div', { class: 'li-arrow' }, '›')
        ));
      });
      if (filtered.length > 100) {
        listEl.appendChild(h('div', { class: 'tile-sub', style: 'text-align:center; padding:14px;' }, 'Mostrando 100 de ' + filtered.length + ' — use os filtros para refinar.'));
      }
    }
    refresh();
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
      h('div', { class: 'avatar', style: 'width:48px;height:48px;border-radius:14px; font-size:22px;' }, scale.emoji),
      h('div', { style: 'flex:1; min-width:0' },
        h('div', { style: 'font-weight:700; letter-spacing:-0.01em; line-height:1.25;' }, scale.title),
        h('div', { class: 'tile-sub' }, scale.age + ' · ' + scale.domain + ' · ' + (scale.audience==='familia'?'Família':'Clínica'))
      )
    ));
    card.appendChild(progress);
    card.appendChild(body);

    function render() {
      body.innerHTML = '';
      if (state.done) {
        const score = state.answers.reduce((a,v) => a + (v ?? 0), 0);
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
          scale.use ? scale.use + ' ' : '',
          'Não substitui escala normatizada quando indicada.'
        ));
        body.appendChild(h('div', { class: 'row' },
          h('button', { class: 'btn btn-primary', onclick: salvar }, '☁ Salvar na nuvem'),
          h('button', { class: 'btn btn-accent', onclick: gerarPDF }, '✎ Gerar relatório PDF'),
          h('button', { class: 'btn btn-ghost', onclick: () => { state.i=0; state.done=false; state.answers.fill(null); render(); } }, '↻ Refazer'),
          h('a', { class: 'btn btn-ghost', href: '#/escalas' }, '← Voltar')
        ));
        progress.firstElementChild.style.width = '100%';
        return;
      }

      const q = scale.questions[state.i];
      body.appendChild(h('div', { class: 'q-num' }, 'Pergunta ' + (state.i+1) + ' de ' + scale.questions.length));
      body.appendChild(h('div', { class: 'q-text' }, q));
      const opts = h('div', { class: 'q-opts' });
      scale.options.forEach((o, idx) => {
        const btn = h('button', { class: 'q-opt' + (state.answers[state.i]===idx?' selected':''), onclick: () => {
          state.answers[state.i] = idx;
          if (state.i < scale.questions.length - 1) state.i++;
          else state.done = true;
          setTimeout(render, 180);
        } }, o);
        opts.appendChild(btn);
      });
      body.appendChild(opts);
      body.appendChild(h('div', { class: 'row', style: 'margin-top:22px; justify-content:space-between;' },
        h('button', { class: 'btn btn-ghost', disabled: state.i === 0, onclick: () => { if (state.i > 0) { state.i--; render(); } } }, '← Anterior'),
        h('span', { class: 'tile-sub' }, Math.round(((state.i+1)/scale.questions.length)*100) + '% concluído'),
        h('button', { class: 'btn btn-ghost', onclick: () => { if (state.answers[state.i]!=null && state.i<scale.questions.length-1){state.i++;render();} } }, 'Pular →')
      ));
      progress.firstElementChild.style.width = ((state.i / scale.questions.length) * 100) + '%';
    }

    async function salvar() {
      const score = state.answers.reduce((a,v) => a + (v ?? 0), 0);
      const max = scale.questions.length * (scale.options.length - 1);
      const payload = {
        case_code: 'CASO-' + Date.now().toString(36),
        instrument_id: scale.id, instrument_title: scale.title,
        answers: Object.fromEntries(state.answers.map((v,i) => [i, v])),
        raw_score: score, total_items: scale.questions.length, max_score: max
      };
      NEUROPED_CLOUD.submissions.add(payload);
      toast('Salvo · enviando para nuvem…');
      const r = await NEUROPED_CLOUD.pushToCloud(payload);
      toast(r.ok ? ('✓ Enviado via ' + r.via) : '⚠ Salvo localmente');
    }

    function gerarPDF() {
      const score = state.answers.reduce((a,v) => a + (v ?? 0), 0);
      const max = scale.questions.length * (scale.options.length - 1);
      const pct = Math.round((score / max) * 100);
      const level = pct >= 66 ? 'Alto' : pct >= 33 ? 'Moderado' : 'Baixo';
      PDF.buildLaudo({
        titulo: 'Relatório de instrumento aplicado',
        paciente: 'Anônimo',
        idade: scale.age,
        codigo: 'INST-' + scale.id.toUpperCase(),
        escalas: [{ title: scale.title, result: score + '/' + max + ' (' + pct + '%)' }],
        score: score + '/' + max,
        scoreLevel: level,
        hipotese: 'Análise quantitativa do instrumento "' + scale.title + '" indicou sinalização ' + level.toLowerCase() + ' (' + pct + '%).',
        conduta: 'Recomenda-se acompanhamento clínico e correlação com avaliação presencial. ' + (scale.use || '')
      });
      toast('📄 Relatório aberto para impressão / PDF');
    }

    root.appendChild(card);
    render();
  }

  /* ----- Laudos ----- */
  function viewLaudos(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Laudos clínicos'),
      h('p', {}, 'Gere laudos profissionais em PDF a partir das consultas e escalas. Assinatura digital e arquivamento automático na nuvem.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn solid', onclick: () => openNewLaudo() }, '+ Novo laudo'),
        h('a', { class: 'btn', href: '#/pacientes' }, '☺ Escolher paciente')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Modelos disponíveis')));
    const templates = [
      { e: '🧩', t: 'Triagem TEA', sub: 'Para crianças 12m – 5a' },
      { e: '🎯', t: 'Avaliação TDAH', sub: 'Para 6 – 14 anos' },
      { e: '💬', t: 'Atraso de linguagem', sub: 'Para pré-escolares' },
      { e: '😴', t: 'Distúrbio do sono', sub: 'Qualquer idade' },
      { e: '🧠', t: 'Funções executivas', sub: 'Escolares' },
      { e: '📝', t: 'Em branco', sub: 'Modelo livre' }
    ];
    const grid = h('div', { class: 'grid cols-3' });
    templates.forEach(t => {
      grid.appendChild(h('div', { class: 'tile', onclick: () => openNewLaudo(null, { titulo: 'Laudo — ' + t.t }) },
        h('div', { class: 'tile-icon' }, t.e),
        h('div', { class: 'tile-title' }, t.t),
        h('div', { class: 'tile-sub' }, t.sub)
      ));
    });
    root.appendChild(grid);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Histórico')));
    const list = h('div', { class: 'list' });
    NEUROPED_CLOUD.consultas.list().slice(0, 8).forEach(c => {
      const p = NEUROPED.patients.find(x => x.code === c.paciente);
      list.appendChild(h('div', { class: 'list-item' },
        h('div', { class: 'li-emoji' }, '✎'),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, 'Laudo — ' + (p ? p.name : c.paciente)),
          h('div', { class: 'li-sub' }, new Date(c._at).toLocaleString('pt-BR'))
        ),
        h('button', { class: 'btn btn-ghost btn-sm', onclick: e => { e.preventDefault(); e.stopPropagation(); if (p) openNewLaudo(p, c); } }, 'Reabrir')
      ));
    });
    if (!list.children.length) list.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '✎'), h('div', {}, 'Sem laudos ainda. Crie o primeiro acima.')));
    root.appendChild(list);
  }

  function openNewLaudo(patient, prefill = {}) {
    const node = h('div', {},
      h('h3', { style: 'margin:0 0 14px; font-size:18px;' }, '✎ Gerar laudo'),
      h('div', { class: 'grid cols-2' },
        formField('Título', h('input', { class: 'input', id: 'l-titulo', value: prefill.titulo || 'Laudo clínico — Neuropediatria' })),
        formField('Paciente', h('select', { class: 'select', id: 'l-pac' }, h('option', { value: '' }, '— selecionar —'), ...NEUROPED.patients.map(p => h('option', { value: p.code, selected: patient && p.code === patient.code }, p.name)))),
        h('div', { style: 'grid-column:1/-1;' }, formField('Queixa', h('input', { class: 'input', id: 'l-queixa', value: prefill.queixa || '' }))),
        h('div', { style: 'grid-column:1/-1;' }, formField('História (HPMA)', h('textarea', { class: 'textarea', id: 'l-hpma', html: prefill.hpma || '' }))),
        h('div', { style: 'grid-column:1/-1;' }, formField('Exame e observações', h('textarea', { class: 'textarea', id: 'l-exame', html: prefill.exame || '' }))),
        h('div', { style: 'grid-column:1/-1;' }, formField('Hipótese / Impressão', h('textarea', { class: 'textarea', id: 'l-hip', html: prefill.hipotese || '' }))),
        h('div', { style: 'grid-column:1/-1;' }, formField('Conduta', h('textarea', { class: 'textarea', id: 'l-cond', html: prefill.conduta || '' })))
      ),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-ghost', onclick: closeSheet }, 'Cancelar'),
        h('button', { class: 'btn btn-primary', onclick: () => {
          const pcode = $('#l-pac').value;
          const p = NEUROPED.patients.find(x => x.code === pcode);
          PDF.buildLaudo({
            titulo: $('#l-titulo').value,
            paciente: p ? p.name : 'Não informado',
            dob: p ? p.dob : '',
            idade: p ? p.age : '',
            responsavel: p ? p.responsible : '',
            codigo: 'LAUDO-' + Date.now().toString(36).toUpperCase(),
            queixa: $('#l-queixa').value,
            hpma: $('#l-hpma').value,
            exame: $('#l-exame').value,
            hipotese: $('#l-hip').value,
            conduta: $('#l-cond').value
          });
          closeSheet();
          toast('📄 Laudo gerado · escolha "Salvar como PDF" na impressão');
        } }, '📄 Gerar PDF')
      )
    );
    openSheet(node);
  }

  /* ----- Agenda ----- */
  function viewAgenda(root) {
    const now = new Date();
    const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', { style: 'text-transform:capitalize' }, monthName),
      h('p', {}, 'Calendário, lembretes, telemedicina e financeiro do consultório.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn solid', onclick: () => openNewEvent() }, '+ Novo evento'),
        h('a', { class: 'btn', href: '#/financeiro' }, '$ Financeiro')
      )
    ));

    const cal = h('div', { class: 'card', style: 'margin: 16px 0;' });
    cal.appendChild(h('div', { class: 'cal' }, ...['D','S','T','Q','Q','S','S'].map(d => h('div', { class: 'cal-head' }, d))));
    const days = h('div', { class: 'cal', style: 'margin-top:8px;' });
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) days.appendChild(h('div'));
    for (let d = 1; d <= last; d++) {
      const cls = ['cal-day'];
      if (d === now.getDate()) cls.push('today');
      if ([4, 10, 12, 18, 22, 26].includes(d)) cls.push('has-event');
      days.appendChild(h('div', { class: cls.join(' ') }, String(d)));
    }
    cal.appendChild(days);
    root.appendChild(cal);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Próximos eventos')));
    const list = h('div', { class: 'list' });
    NEUROPED.events.forEach(ev => {
      list.appendChild(h('a', { class: 'list-item', href: ev.patient ? '#/paciente/' + ev.patient : '#' },
        h('div', { class: 'li-emoji' }, eventEmoji(ev.kind)),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, ev.title),
          h('div', { class: 'li-sub' }, ev.date + ' · ' + ev.time + ' · ' + ev.tag)
        ),
        h('span', { class: 'pill ' + (ev.kind === 'tele' ? 'accent' : 'brand') }, ev.kind.toUpperCase())
      ));
    });
    root.appendChild(list);
  }

  function openNewEvent() {
    const node = h('div', {},
      h('h3', { style: 'margin:0 0 14px; font-size:18px;' }, '+ Novo evento'),
      h('div', { class: 'grid cols-2' },
        formField('Título', h('input', { class: 'input', id: 'ev-t', placeholder: 'Ex: Triagem TEA — Lucas' })),
        formField('Data', h('input', { class: 'input', id: 'ev-d', type: 'date' })),
        formField('Horário', h('input', { class: 'input', id: 'ev-h', type: 'time' })),
        formField('Tipo', h('select', { class: 'select', id: 'ev-k' }, h('option', { value: 'consulta' }, 'Consulta'), h('option', { value: 'retorno' }, 'Retorno'), h('option', { value: 'tele' }, 'Telemedicina'), h('option', { value: 'familia' }, 'Família'), h('option', { value: 'reuniao' }, 'Reunião')))
      ),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-ghost', onclick: closeSheet }, 'Cancelar'),
        h('button', { class: 'btn btn-primary', onclick: () => {
          const t = $('#ev-t').value; if (!t) return toast('Informe o título');
          NEUROPED_CLOUD.agenda.add({ title: t, date: $('#ev-d').value, time: $('#ev-h').value, kind: $('#ev-k').value });
          closeSheet(); toast('✓ Evento criado');
        } }, 'Salvar')
      )
    );
    openSheet(node);
  }

  /* ----- Financeiro ----- */
  function viewFinanceiro(root) {
    root.appendChild(h('div', { class: 'grid cols-4' },
      kpi('Receita do mês', 'R$ 24.800', '+12% MoM', '$'),
      kpi('Recebido', 'R$ 19.300', '78% do total', '✓'),
      kpi('A receber', 'R$ 5.500', '22% pendentes', '⏳'),
      kpi('Ticket médio', 'R$ 380', '+R$ 12', '📊')
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Evolução semanal')));
    const c = h('div', { class: 'card chart-card' });
    c.insertAdjacentHTML('beforeend', Charts.bars(NEUROPED.dashboardSeries.receitaMes.map(v => v * 1000), { id: 'rec', gradient: true }));
    root.appendChild(c);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Cobrança em aberto')));
    const wrap = h('div', { class: 'table-wrap' });
    wrap.innerHTML = html`
      <table class="table">
        <thead><tr><th>Paciente</th><th>Tipo</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Lucas Mendes</td><td>Consulta</td><td>30/05</td><td>R$ 450</td><td><span class="pill warn">Em aberto</span></td></tr>
          <tr><td>Mariana Santos</td><td>Retorno</td><td>02/06</td><td>R$ 350</td><td><span class="pill warn">Em aberto</span></td></tr>
          <tr><td>Pedro Oliveira</td><td>Devolutiva</td><td>05/06</td><td>R$ 500</td><td><span class="pill warn">Em aberto</span></td></tr>
          <tr><td>Helena Barbosa</td><td>Telemedicina</td><td>27/05</td><td>R$ 320</td><td><span class="pill danger">Atrasado</span></td></tr>
        </tbody>
      </table>
    `;
    root.appendChild(wrap);

    root.appendChild(h('div', { class: 'row', style: 'margin-top:16px;' },
      h('button', { class: 'btn btn-primary', onclick: () => toast('💳 Cobrança via PIX enviada') }, '💳 Enviar cobrança PIX'),
      h('button', { class: 'btn btn-ghost', onclick: () => toast('📄 Relatório exportado') }, '📄 Exportar relatório')
    ));
  }

  /* ----- Mensagens ----- */
  function viewMensagens(root) {
    const sel = h('div', { class: 'list', style: 'max-width:380px;' });
    NEUROPED.messages.forEach(m => {
      sel.appendChild(h('div', { class: 'list-item', onclick: () => renderConv(m) },
        h('div', { class: 'li-emoji' }, m.role === 'familia' ? '♥' : '👥'),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, m.from),
          h('div', { class: 'li-sub' }, m.body.slice(0, 50) + '…')
        ),
        h('div', {},
          h('div', { class: 'li-time' }, m.at),
          m.unread ? h('span', { class: 'pill brand', style: 'margin-top:4px;' }, 'Novo') : null
        )
      ));
    });

    const cont = h('div', { class: 'card', style: 'min-height:300px; display:flex; flex-direction:column;' },
      h('div', { class: 'empty', style: 'flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;' },
        h('div', { class: 'empty-icon' }, '✉'),
        h('div', {}, 'Selecione uma conversa para abrir')
      )
    );

    const wrap = h('div', { class: 'grid', style: 'grid-template-columns: 380px 1fr; gap:16px;' }, sel, cont);
    if (innerWidth < 900) wrap.style.gridTemplateColumns = '1fr';
    root.appendChild(wrap);

    function renderConv(m) {
      cont.innerHTML = '';
      cont.appendChild(h('div', { class: 'row', style: 'padding:8px 0 16px; border-bottom:1px solid var(--border); margin-bottom:16px;' },
        h('div', { class: 'avatar' }, initials(m.from)),
        h('div', { style: 'flex:1' },
          h('div', { style: 'font-weight:600' }, m.from),
          h('div', { style: 'font-size:12px; color: var(--text-mute);' }, h('span', { class: 'status-dot online' }), m.role === 'familia' ? 'Família' : 'Equipe')
        ),
        h('button', { class: 'btn btn-ghost btn-sm', onclick: () => toast('📹 Chamada de vídeo iniciada') }, '📹 Vídeo')
      ));
      cont.appendChild(h('div', { style: 'background:var(--surface-2); padding:14px 16px; border-radius:14px; max-width:520px; margin-bottom:14px;' },
        h('div', { style: 'font-size:14px;' }, m.body),
        h('div', { style: 'font-size:11px; color: var(--text-mute); margin-top:6px;' }, m.at)
      ));
      cont.appendChild(h('div', { class: 'row' },
        h('input', { class: 'input', placeholder: 'Mensagem para ' + m.from + '…', id: 'msg-in' }),
        h('button', { class: 'btn btn-primary', onclick: () => {
          const v = $('#msg-in').value.trim(); if (!v) return;
          $('#msg-in').value = '';
          toast('✓ Mensagem enviada');
          cont.insertBefore(h('div', { style: 'background:var(--brand-soft); color: var(--brand); padding:14px 16px; border-radius:14px; max-width:520px; margin-left:auto; margin-bottom:14px;' },
            h('div', { style: 'font-size:14px;' }, v),
            h('div', { style: 'font-size:11px; opacity:0.7; margin-top:6px;' }, 'agora')
          ), cont.lastElementChild);
        } }, 'Enviar')
      ));
    }
  }

  /* ----- CAA ----- */
  function viewCAA(root) {
    const strip = h('div', { class: 'caa-strip', id: 'caaStrip' });
    root.appendChild(strip);

    const actions = h('div', { class: 'row', style: 'margin-bottom:16px;' });
    actions.appendChild(h('button', { class: 'btn btn-primary', onclick: speakStrip }, '🔊 Falar frase'));
    actions.appendChild(h('button', { class: 'btn btn-ghost', onclick: () => { strip.innerHTML = ''; toast('Frase limpa'); } }, '✕ Limpar'));
    actions.appendChild(h('div', { class: 'spacer' }));
    actions.appendChild(h('button', { class: 'btn btn-ghost btn-sm', onclick: () => toast('🎨 Personalizar pictogramas (em breve)') }, '🎨 Personalizar'));
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
        const card = h('div', { class: 'caa-card', onclick: () => { strip.appendChild(h('div', { class: 'caa-strip-item', title: it.l }, it.e)); speak(it.l); } },
          h('div', { class: 'caa-emoji' }, it.e),
          h('div', { class: 'caa-label' }, it.l)
        );
        grid.appendChild(card);
      });
    }
    renderGrid();

    function speak(text) {
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'pt-BR'; u.rate = 0.95;
        speechSynthesis.speak(u);
      }
    }
    function speakStrip() {
      const labels = $$('.caa-strip-item', strip).map(el => el.title).filter(Boolean);
      if (!labels.length) return toast('Monte uma frase primeiro');
      speak(labels.join(' '));
    }
  }

  /* ----- Família ----- */
  function viewFamilia(root) {
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Portal Família'),
      h('p', {}, 'Acesso protegido para pais e cuidadores. Escalas familiares, materiais educativos, agenda do filho e comunicação direta com o consultório.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn solid', onclick: () => openNewPass() }, '+ Gerar passe familiar'),
        h('a', { class: 'btn', href: '#/escalas' }, '≡ Escalas familiares')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Passes ativos')));
    const list = h('div', { class: 'list' });
    NEUROPED.familyPasses.forEach(p => {
      list.appendChild(h('div', { class: 'list-item' },
        h('div', { class: 'li-emoji' }, '♥'),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, p.family + ' · ' + p.code),
          h('div', { class: 'li-sub' }, 'Criado em ' + p.created + ' · ' + p.usage + ' usos · expira ' + p.expires),
          h('div', { class: 'li-meta' }, h('span', { class: 'pill ' + (p.status==='ativo'?'success':'warn') }, p.status.toUpperCase()))
        ),
        h('button', { class: 'btn btn-ghost btn-sm', onclick: e => { e.preventDefault(); toast('🔗 Link copiado'); navigator.clipboard?.writeText('https://neuroped.app/familia/' + p.code); } }, 'Copiar link')
      ));
    });
    root.appendChild(list);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Materiais para família')));
    const mats = h('div', { class: 'grid cols-3' });
    [
      { e: '📘', t: 'Manual do desfralde', sub: 'Guia rápido em 8 passos' },
      { e: '🎧', t: 'Sensorial em casa', sub: 'Dicas práticas por ambiente' },
      { e: '😴', t: 'Higiene do sono', sub: 'Rotina visual para crianças' },
      { e: '🍽️', t: 'Seletividade alimentar', sub: 'Estratégias gentis' },
      { e: '🧠', t: 'TDAH em casa', sub: 'Organização e foco' },
      { e: '💬', t: 'Comunicação alternativa', sub: 'Quando e como começar' }
    ].forEach(m => {
      mats.appendChild(h('div', { class: 'card' },
        h('div', { style: 'font-size:36px; margin-bottom:8px;' }, m.e),
        h('div', { style: 'font-weight:600' }, m.t),
        h('div', { class: 'tile-sub' }, m.sub),
        h('button', { class: 'btn btn-ghost btn-sm', style: 'margin-top:12px;', onclick: () => toast('📖 Abrindo material…') }, 'Abrir →')
      ));
    });
    root.appendChild(mats);
  }

  function openNewPass() {
    const code = 'FAM-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const node = h('div', {},
      h('h3', { style: 'margin:0 0 14px;' }, '+ Gerar passe familiar'),
      h('div', { class: 'grid cols-2' },
        formField('Nome da família', h('input', { class: 'input', id: 'fp-n', placeholder: 'Família Silva' })),
        formField('E-mail / WhatsApp', h('input', { class: 'input', id: 'fp-c', placeholder: 'contato' })),
        h('div', { style: 'grid-column:1/-1; padding:12px; background:var(--brand-soft); border-radius:12px; text-align:center;' },
          h('div', { style: 'font-size:11px; color:var(--brand); text-transform:uppercase; letter-spacing:0.1em;' }, 'Código gerado'),
          h('div', { style: 'font-size:28px; font-weight:700; font-family: var(--font-mono); letter-spacing:2px; color:var(--brand);' }, code)
        )
      ),
      h('div', { class: 'modal-actions' },
        h('button', { class: 'btn btn-ghost', onclick: closeSheet }, 'Cancelar'),
        h('button', { class: 'btn btn-primary', onclick: () => {
          const n = $('#fp-n').value || 'Família';
          NEUROPED.familyPasses.unshift({ code, family: n, created: new Date().toLocaleDateString('pt-BR'), usage: 0, status: 'ativo', expires: '1 ano' });
          closeSheet(); toast('✓ Passe ' + code + ' criado e enviado'); navigate();
        } }, 'Gerar e enviar')
      )
    );
    openSheet(node);
  }

  /* ----- Planos ----- */
  function viewPlanos(root) {
    const u = Store.getUser();
    root.appendChild(h('div', { class: 'card-hero' },
      h('h2', {}, 'Plano atual: ' + (u.plan === 'pro' ? 'Pro Clínico ★' : 'Starter')),
      h('p', {}, u.plan === 'pro' ? 'Você tem acesso completo a todos os recursos. Próxima renovação em 30 dias.' : 'Faça upgrade para desbloquear escalas clínicas, laudos PDF, telemedicina e nuvem.'),
      h('div', { class: 'row' },
        u.plan !== 'pro' ? h('button', { class: 'btn solid', onclick: () => toast('💳 Redirecionando para checkout…') }, '★ Fazer upgrade') : h('button', { class: 'btn solid', onclick: () => toast('📄 Faturas abertas') }, '📄 Ver faturas')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Escolha seu plano')));
    const grid = h('div', { class: 'grid cols-3' });
    NEUROPED.plans.forEach(p => {
      const card = h('div', { class: 'plan-card' + (p.featured ? ' featured' : '') },
        p.featured ? h('div', { class: 'plan-badge' }, 'Mais popular') : null,
        h('div', { class: 'plan-name' }, p.name),
        h('div', { class: 'plan-price' }, p.price > 0 ? 'R$ ' + p.price : 'Grátis', h('small', {}, ' · ' + p.period)),
        h('ul', { class: 'plan-feat' }, ...p.features.map(f => h('li', {}, f))),
        h('button', { class: 'btn ' + (p.featured ? 'btn-primary' : 'btn-ghost') + ' btn-block', onclick: () => toast('💳 Plano ' + p.name + ' selecionado · checkout') }, p.cta)
      );
      grid.appendChild(card);
    });
    root.appendChild(grid);

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Histórico de pagamentos')));
    root.appendChild(h('div', { class: 'table-wrap' })).insertAdjacentHTML('beforeend', `
      <table class="table">
        <thead><tr><th>Data</th><th>Plano</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>28/04/2026</td><td>Pro Clínico</td><td>R$ 197,00</td><td><span class="pill success">Pago</span></td></tr>
          <tr><td>28/03/2026</td><td>Pro Clínico</td><td>R$ 197,00</td><td><span class="pill success">Pago</span></td></tr>
          <tr><td>28/02/2026</td><td>Pro Clínico</td><td>R$ 197,00</td><td><span class="pill success">Pago</span></td></tr>
        </tbody>
      </table>
    `);
  }

  /* ----- Config ----- */
  function viewConfig(root) {
    const u = Store.getUser();

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Conta')));
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' },
        h('div', { class: 'avatar', style: 'width:60px;height:60px;border-radius:18px;font-size:18px;' }, initials(u.name)),
        h('div', { style: 'flex:1' },
          h('div', { style: 'font-weight:700; font-size:16px;' }, u.name),
          h('div', { class: 'tile-sub' }, u.email + ' · ' + (u.role === 'medico' ? 'Médico' : u.role === 'secretaria' ? 'Secretária' : 'Família')),
          h('span', { class: 'badge-pro', style: 'margin-top:6px;' }, (u.plan || 'free').toUpperCase())
        ),
        h('button', { class: 'btn btn-ghost', onclick: async () => {
          if (await confirmDialog('Sair da conta', 'Tem certeza que deseja desconectar?')) {
            Store.clearUser();
            location.hash = '';
            location.reload();
          }
        } }, 'Sair')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Nuvem e sincronização')));
    const cfg = NEUROPED_CLOUD.cfg;
    const status = NEUROPED_CLOUD.status();
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' },
        h('span', { class: 'sync-status' + (status.hasCloud ? '' : ' warn') },
          h('span', { class: 'dot' }),
          status.hasCloud ? 'Conectado · ' + status.mode : 'Modo local'
        ),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn btn-ghost btn-sm', onclick: async () => {
          toast('Sincronizando…');
          const all = [...NEUROPED_CLOUD.submissions.list(), ...NEUROPED_CLOUD.consultas.list(), ...NEUROPED_CLOUD.diario.list()];
          let ok = 0; for (const i of all) { const r = await NEUROPED_CLOUD.pushToCloud(i); if (r.ok) ok++; }
          toast('✓ ' + ok + ' itens enviados');
        } }, '↻ Sincronizar agora')
      ),
      h('div', { class: 'grid cols-2', style: 'margin-top:16px;' },
        formField('Supabase URL', h('input', { class: 'input', id: 'cfg-sup', value: cfg.SUPABASE_URL, placeholder: 'https://xxxx.supabase.co' })),
        formField('Supabase Anon Key', h('input', { class: 'input', id: 'cfg-key', value: cfg.SUPABASE_ANON, placeholder: 'eyJhbGciOi...' })),
        h('div', { style: 'grid-column:1/-1;' }, formField('Cloudflare Pages base', h('input', { class: 'input', id: 'cfg-cf', value: cfg.CLOUDFLARE_BASE, placeholder: 'https://neuroped.pages.dev' })))
      ),
      h('div', { class: 'row', style: 'margin-top:14px;' },
        h('button', { class: 'btn btn-primary', onclick: async () => {
          cfg.SUPABASE_URL = $('#cfg-sup').value.trim();
          cfg.SUPABASE_ANON = $('#cfg-key').value.trim();
          cfg.CLOUDFLARE_BASE = $('#cfg-cf').value.trim();
          localStorage.setItem('neuroped:cfg', JSON.stringify(cfg));
          toast('✓ Configuração salva');
          const p = await NEUROPED_CLOUD.ping();
          toast(p.ok ? '✓ Cloudflare respondeu' : '⚠ Sem resposta');
        } }, 'Salvar'),
        h('button', { class: 'btn btn-ghost', onclick: () => {
          const data = { submissions: NEUROPED_CLOUD.submissions.list(), consultas: NEUROPED_CLOUD.consultas.list(), diario: NEUROPED_CLOUD.diario.list() };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: 'neuroped-backup-' + Date.now() + '.json' });
          a.click(); toast('💾 Backup baixado');
        } }, '⤓ Exportar backup')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Privacidade e LGPD')));
    root.appendChild(h('div', { class: 'card' },
      h('p', { style: 'margin:0 0 12px; color: var(--text-soft);' }, 'O NeuroPed armazena apenas códigos operacionais e respostas estruturadas. Dados pessoais (nome completo, CPF) só são salvos quando você explicitamente preenche. Tudo criptografado em trânsito (HTTPS).'),
      h('div', { class: 'row' },
        h('button', { class: 'btn btn-ghost', onclick: () => toast('📄 Política aberta') }, '📄 Política de Privacidade'),
        h('button', { class: 'btn btn-ghost', onclick: () => toast('📄 Termos abertos') }, '📄 Termos de uso'),
        h('button', { class: 'btn btn-ghost', onclick: async () => {
          if (await confirmDialog('Limpar dados locais', 'Isso apagará todos os registros salvos no dispositivo. Continuar?')) {
            localStorage.removeItem('neuroped:v3');
            toast('🗑 Dados locais limpos');
          }
        } }, '🗑 Limpar dados locais')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Aparência')));
    root.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' },
        h('div', {},
          h('div', { style: 'font-weight:600' }, 'Tema'),
          h('div', { class: 'tile-sub' }, 'Claro, escuro ou automático')
        ),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn btn-ghost', onclick: toggleTheme }, '🎨 Alternar tema')
      )
    ));

    root.appendChild(h('div', { class: 'section-title' }, h('h3', {}, 'Sobre')));
    root.appendChild(h('div', { class: 'card', style: 'text-align:center;' },
      h('div', { class: 'tile-sub' }, 'NeuroPed EDJ · v4.0 · Edição Comercial'),
      h('div', { class: 'tile-sub' }, 'Dr. Jadson Fraga · Neuropediatria'),
      h('div', { class: 'tile-sub', style: 'margin-top:6px;' }, '© 2026 NeuroPed. Todos os direitos reservados.')
    ));
  }

  /* ====== Search ====== */
  function openSearch() {
    $('#searchModal').hidden = false;
    setTimeout(() => $('#searchInput').focus(), 50);
    renderSearch('');
  }
  function closeSearchModal() { $('#searchModal').hidden = true; }
  function renderSearch(q) {
    const res = $('#searchResults');
    res.innerHTML = '';
    if (!q) {
      res.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '⌕'), h('div', {}, 'Busque escalas, pacientes, módulos…')));
      return;
    }
    const ql = q.toLowerCase();
    const matches = [];
    NEUROPED.modules.forEach(m => { if ((m.title + ' ' + m.sub).toLowerCase().includes(ql)) matches.push({ type: 'Módulo', emoji: m.icon, title: m.title, sub: m.sub, href: '#/' + m.id }); });
    NEUROPED.patients.forEach(p => { if ((p.name + ' ' + p.code + ' ' + p.domain).toLowerCase().includes(ql)) matches.push({ type: 'Paciente', emoji: '☺', title: p.name, sub: p.code + ' · ' + p.age + ' · ' + p.domain, href: '#/paciente/' + p.code }); });
    NEUROPED.scales.forEach(s => { if ((s.title + ' ' + s.domain + ' ' + s.age).toLowerCase().includes(ql)) matches.push({ type: 'Escala', emoji: s.emoji, title: s.title, sub: s.age + ' · ' + s.domain, href: '#/escala/' + s.id }); });

    if (!matches.length) { res.appendChild(h('div', { class: 'empty' }, h('div', { class: 'empty-icon' }, '🤔'), h('div', {}, 'Nada encontrado para "' + q + '"'))); return; }
    matches.slice(0, 40).forEach(m => {
      res.appendChild(h('a', { class: 'list-item', href: m.href, onclick: closeSearchModal },
        h('div', { class: 'li-emoji' }, m.emoji),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, m.title),
          h('div', { class: 'li-sub' }, m.type + ' · ' + m.sub)
        ),
        h('div', { class: 'li-arrow' }, '›')
      ));
    });
  }

  /* ====== Notifications ====== */
  function openNotif() {
    $('#notifModal').hidden = false;
    const list = $('#notifList');
    list.innerHTML = '';
    NEUROPED.notifications.forEach(n => {
      list.appendChild(h('div', { class: 'list-item' },
        h('div', { class: 'li-emoji' }, n.icon),
        h('div', { class: 'li-body' },
          h('div', { class: 'li-title' }, n.title),
          h('div', { class: 'li-sub' }, n.body),
          h('div', { class: 'li-time' }, n.at)
        ),
        n.unread ? h('span', { class: 'pill brand' }, 'Novo') : null
      ));
    });
  }

  /* ====== PWA install ====== */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    const ib = $('#installBtn'); if (ib) ib.hidden = false;
  });

  /* ====== Boot app ====== */
  function bootApp() {
    const u = Store.getUser();
    $('#userName').textContent = u.name;
    $('#userRole').textContent = (u.role === 'medico' ? 'Médico' : u.role === 'secretaria' ? 'Secretária' : 'Família') + ' · ' + (u.plan === 'pro' ? 'Pro' : 'Free');
    $('#userAvatar').textContent = initials(u.name);
    $('#userAvatarSm').textContent = initials(u.name);
    if (NEUROPED.notifications.some(n => n.unread)) $('#notifDot').hidden = false;

    renderNav();
    $('#app').hidden = false;
    if (!location.hash) location.hash = '#/inicio';
    navigate();
  }

  /* ====== Init ====== */
  function init() {
    initTheme();

    // Hide splash
    setTimeout(() => {
      $('#splash').style.display = 'none';
      const u = Store.getUser();
      if (!Store.isOnboarded()) showOnboarding();
      else if (!u) showAuth();
      else bootApp();
    }, 1400);

    // Load saved cloud config
    try {
      const saved = JSON.parse(localStorage.getItem('neuroped:cfg') || 'null');
      if (saved) Object.assign(window.NEUROPED_CONFIG, saved);
    } catch {}

    // Listeners
    window.addEventListener('hashchange', navigate);
    document.addEventListener('click', e => {
      const cs = e.target.closest('#quickSearch'); if (cs) { openSearch(); return; }
    });
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#searchBtn').addEventListener('click', openSearch);
    $('#closeSearch').addEventListener('click', closeSearchModal);
    $('#searchInput').addEventListener('input', e => renderSearch(e.target.value));
    $('#searchModal').addEventListener('click', e => { if (e.target.id === 'searchModal') closeSearchModal(); });
    $('#notifBtn').addEventListener('click', openNotif);
    $('#closeNotif').addEventListener('click', () => $('#notifModal').hidden = true);
    $('#notifModal').addEventListener('click', e => { if (e.target.id === 'notifModal') $('#notifModal').hidden = true; });
    $('#sheetModal').addEventListener('click', e => { if (e.target.id === 'sheetModal') closeSheet(); });
    $('#backBtn').addEventListener('click', () => history.length > 1 ? history.back() : (location.hash = '#/inicio'));
    $('#syncBtn').addEventListener('click', async () => {
      $('#syncBtn').style.animation = 'spin 700ms linear';
      const p = await NEUROPED_CLOUD.ping();
      setTimeout(() => $('#syncBtn').style.animation = '', 720);
      toast(p.ok ? '✓ Nuvem online' : '⚠ Modo offline (local)');
    });
    $('#installBtn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        toast(outcome === 'accepted' ? '✓ Aplicativo instalado' : 'Instalação cancelada');
        deferredPrompt = null;
        $('#installBtn').hidden = true;
      } else toast('Use o menu do navegador → "Instalar aplicativo"');
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') { closeSearchModal(); $('#notifModal').hidden = true; closeSheet(); $('#confirmModal').hidden = true; }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
