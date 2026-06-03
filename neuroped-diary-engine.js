/**
 * NeuroPed Diary Engine v1.0
 * --------------------------
 * Engine para diários clínicos longitudinais. NÃO pontua: registra episódios
 * e produz timeline + padrões.
 *
 * Estrutura persistente:
 *   neuroped.diary.<instrumentId> = {
 *     instrumentId, instrumentTitle, schema: 'v1', episodes: [Episode]
 *   }
 *
 * Aceita instrumentos com belongsToDiaryEngine(typing)===true.
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  if (!O) { console.error('[DiaryEngine] ontology.js ausente'); return; }

  const ENGINE_ID = 'diary';
  const STORE_PREFIX = 'neuroped.diary.';

  // ──────────────────────────────────────────────────────────
  // Schemas de episódio por instrumento (extensível)
  // ──────────────────────────────────────────────────────────
  const EPISODE_SCHEMAS = {
    // ABC comportamento
    'abc-comportamento-diario': [
      { key: 'datetime',   label: 'Data e hora',                    type: 'datetime-local', required: true },
      { key: 'place',      label: 'Local',                          type: 'text',           placeholder: 'casa, escola, transporte…' },
      { key: 'people',     label: 'Pessoas presentes',              type: 'text',           placeholder: 'mãe, irmão, professor…' },
      { key: 'antecedent', label: 'Antecedente (o que veio antes)', type: 'textarea',       required: true },
      { key: 'behavior',   label: 'Comportamento observado',        type: 'textarea',       required: true },
      { key: 'duration',   label: 'Duração (minutos)',              type: 'number',         min: 0, max: 240 },
      { key: 'intensity',  label: 'Intensidade (1–5)',              type: 'number',         min: 1, max: 5 },
      { key: 'consequence',label: 'Consequência (o que adultos fizeram)', type: 'textarea' },
      { key: 'function',   label: 'Função aparente',                type: 'select',
        options: ['fuga/esquiva','atenção','acesso tangível','sensorial','alívio de desconforto','indeterminada'] }
    ],
    // Diário de crises epilépticas
    'diario-crises-epilepticas': [
      { key: 'datetime',     label: 'Data e hora da crise',         type: 'datetime-local', required: true },
      { key: 'type',         label: 'Tipo de crise',                type: 'select',
        options: ['tônico-clônica','ausência','focal motora','focal sensorial','mioclônica','atônica','desconhecida'] },
      { key: 'duration_sec', label: 'Duração (segundos)',           type: 'number', min: 0, max: 3600 },
      { key: 'context',      label: 'O que estava fazendo',         type: 'text' },
      { key: 'trigger',      label: 'Possível gatilho',             type: 'text',
        placeholder: 'sono ruim, febre, flash, esquecer remédio…' },
      { key: 'postictal',    label: 'Pós-ictal (minutos)',          type: 'number', min: 0, max: 180 },
      { key: 'medication',   label: 'Medicação no horário?',        type: 'select', options: ['sim','não','atrasou','esqueceu'] },
      { key: 'notes',        label: 'Observações',                  type: 'textarea' }
    ],
    // Diário de cefaleia
    'diario-cefaleia-30d': [
      { key: 'date',         label: 'Data',                         type: 'date',           required: true },
      { key: 'present',      label: 'Houve dor de cabeça?',         type: 'select', options: ['sim','não'], required: true },
      { key: 'pain',         label: 'Intensidade (0–10)',           type: 'number', min: 0, max: 10 },
      { key: 'duration_h',   label: 'Duração (horas)',              type: 'number', min: 0, max: 72 },
      { key: 'location',     label: 'Localização',                  type: 'select',
        options: ['frontal','temporal','occipital','difusa','unilateral direita','unilateral esquerda'] },
      { key: 'triggers',     label: 'Gatilhos',                     type: 'text' },
      { key: 'medication',   label: 'Tomou remédio?',               type: 'text' }
    ],
    // Diário de sono 7d
    'diario-sono-7d': [
      { key: 'date',         label: 'Data',                         type: 'date',           required: true },
      { key: 'bedtime',      label: 'Hora de deitar',               type: 'time' },
      { key: 'sleep_onset_min', label: 'Tempo para pegar no sono (min)', type: 'number', min: 0, max: 180 },
      { key: 'wakeups',      label: 'Quantas vezes acordou',        type: 'number', min: 0, max: 20 },
      { key: 'wake_time',    label: 'Hora de acordar',              type: 'time' },
      { key: 'quality',      label: 'Qualidade do sono (1–5)',      type: 'number', min: 1, max: 5 },
      { key: 'notes',        label: 'Observações',                  type: 'textarea' }
    ]
  };

  /** Schema genérico para diários sem schema específico. */
  const DEFAULT_SCHEMA = [
    { key: 'datetime', label: 'Data e hora', type: 'datetime-local', required: true },
    { key: 'event',    label: 'O que aconteceu', type: 'textarea',     required: true },
    { key: 'intensity',label: 'Intensidade (1–5)', type: 'number', min: 1, max: 5 },
    { key: 'notes',    label: 'Observações',     type: 'textarea' }
  ];

  // ──────────────────────────────────────────────────────────
  // Persistência
  // ──────────────────────────────────────────────────────────
  function _key(instrumentId) { return STORE_PREFIX + instrumentId; }
  function _load(instrumentId) {
    try { return JSON.parse(localStorage.getItem(_key(instrumentId)) || 'null'); }
    catch (e) { return null; }
  }
  function _save(instrumentId, data) {
    try { localStorage.setItem(_key(instrumentId), JSON.stringify(data)); } catch (e) {}
  }
  function _ensureBook(instrument) {
    let book = _load(instrument.id);
    if (!book) {
      book = {
        instrumentId: instrument.id,
        instrumentTitle: instrument.title || instrument.id,
        schema: 'v1',
        createdAt: Date.now(),
        episodes: []
      };
      _save(instrument.id, book);
    }
    return book;
  }

  // ──────────────────────────────────────────────────────────
  // Styles
  // ──────────────────────────────────────────────────────────
  function _styles() {
    if (document.getElementById('npe-di-styles')) return;
    const s = document.createElement('style');
    s.id = 'npe-di-styles';
    s.textContent = `
      .npe-di-overlay { position:fixed; inset:0; background:#fafaf9; z-index:9999;
        color:#0f172a; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        display:flex; flex-direction:column; }
      .npe-di-bar { display:flex; align-items:center; justify-content:space-between;
        padding:14px 20px; background:#fff; border-bottom:1px solid #e7e5e4;
        box-shadow:0 1px 2px rgba(0,0,0,.04); }
      .npe-di-bar h2 { margin:0; font-size:17px; font-weight:600; color:#7c3aed; }
      .npe-di-chip { display:inline-block; font-size:11px; font-weight:600;
        padding:3px 10px; border-radius:999px; background:#f3e8ff; color:#7c3aed;
        border:1px solid #e9d5ff; margin-right:6px; }
      .npe-di-close { background:none; border:1px solid #d6d3d1; color:#57534e;
        padding:7px 14px; border-radius:8px; cursor:pointer; font-size:13px; }
      .npe-di-body { flex:1; overflow:auto; padding:20px; max-width:920px;
        margin:0 auto; width:100%; box-sizing:border-box; }
      .npe-di-tabs { display:flex; gap:6px; margin-bottom:14px; }
      .npe-di-tabs button { background:#fff; border:1px solid #e7e5e4; color:#57534e;
        padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; }
      .npe-di-tabs button.active { background:#7c3aed; color:#fff; border-color:#7c3aed; }
      .npe-di-card { background:#fff; border:1px solid #e7e5e4; border-radius:14px;
        padding:18px 22px; margin-bottom:12px; box-shadow:0 1px 2px rgba(0,0,0,.03); }
      .npe-di-field { display:flex; flex-direction:column; margin-bottom:10px; }
      .npe-di-field label { font-size:13px; font-weight:600; color:#44403c;
        margin-bottom:4px; }
      .npe-di-field input, .npe-di-field select, .npe-di-field textarea {
        padding:9px 12px; border:1px solid #d6d3d1; border-radius:8px; font-size:14px;
        font-family:inherit; }
      .npe-di-field textarea { min-height:60px; resize:vertical; }
      .npe-di-add { background:#7c3aed; color:#fff; border:none; padding:10px 18px;
        border-radius:8px; font-weight:600; cursor:pointer; }
      .npe-di-add:hover { background:#6d28d9; }
      .npe-di-ep { background:#fff; border:1px solid #e7e5e4; border-radius:12px;
        padding:12px 16px; margin-bottom:8px; }
      .npe-di-ep header { display:flex; justify-content:space-between; align-items:center;
        margin-bottom:6px; }
      .npe-di-ep header strong { font-size:13px; color:#7c3aed; }
      .npe-di-ep header small { font-size:11px; color:#a8a29e; }
      .npe-di-ep dl { margin:0; display:grid; grid-template-columns:auto 1fr;
        gap:4px 10px; font-size:13px; color:#44403c; }
      .npe-di-ep dt { font-weight:600; }
      .npe-di-empty { text-align:center; padding:40px 20px; color:#a8a29e; }
      .npe-di-sum { display:grid; grid-template-columns:repeat(3,1fr); gap:10px;
        margin-bottom:14px; }
      @media (max-width:560px){ .npe-di-sum { grid-template-columns:1fr; } }
      .npe-di-stat { background:#fff; border:1px solid #e7e5e4; border-radius:12px;
        padding:14px 16px; }
      .npe-di-stat .l { font-size:12px; color:#78716c; }
      .npe-di-stat .v { font-size:22px; font-weight:700; color:#7c3aed; }
    `;
    document.head.appendChild(s);
  }

  // ──────────────────────────────────────────────────────────
  // Helpers de render
  // ──────────────────────────────────────────────────────────
  function _renderField(f) {
    const req = f.required ? ' required' : '';
    if (f.type === 'select') {
      const opts = (f.options || []).map(o => `<option value="${o}">${o}</option>`).join('');
      return `<div class="npe-di-field">
        <label>${f.label}${f.required?' *':''}</label>
        <select name="${f.key}"${req}><option value="">—</option>${opts}</select>
      </div>`;
    }
    if (f.type === 'textarea') {
      return `<div class="npe-di-field">
        <label>${f.label}${f.required?' *':''}</label>
        <textarea name="${f.key}" placeholder="${f.placeholder||''}"${req}></textarea>
      </div>`;
    }
    const min = (f.min !== undefined) ? ` min="${f.min}"` : '';
    const max = (f.max !== undefined) ? ` max="${f.max}"` : '';
    return `<div class="npe-di-field">
      <label>${f.label}${f.required?' *':''}</label>
      <input type="${f.type}" name="${f.key}" placeholder="${f.placeholder||''}"${min}${max}${req}>
    </div>`;
  }

  function _fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
    catch (e) { return iso; }
  }

  // ──────────────────────────────────────────────────────────
  // Main: open()
  // ──────────────────────────────────────────────────────────
  function open(instrument, ctx) {
    if (!instrument || !instrument.typing
        || !O.belongsToDiaryEngine(instrument.typing)) {
      console.warn('[DiaryEngine] instrumento inválido para este engine');
      return;
    }
    _styles();

    const schema = EPISODE_SCHEMAS[instrument.id] || DEFAULT_SCHEMA;
    const book = _ensureBook(instrument);

    const root = document.createElement('div');
    root.className = 'npe-di-overlay';
    root.innerHTML = `
      <div class="npe-di-bar">
        <div>
          <h2>${instrument.title || instrument.id}</h2>
          <div style="font-size:12px; color:#78716c; margin-top:3px;">
            <span class="npe-di-chip">Diário longitudinal</span>
            <span>${book.episodes.length} registro(s) · acompanhamento contínuo</span>
          </div>
        </div>
        <button class="npe-di-close" id="npe-di-close">Fechar</button>
      </div>
      <div class="npe-di-body">
        <div class="npe-di-tabs">
          <button class="active" data-tab="add">+ Novo registro</button>
          <button data-tab="history">Histórico</button>
          <button data-tab="summary">Padrões</button>
          <button data-tab="export">Exportar</button>
        </div>
        <div id="npe-di-panel"></div>
      </div>
    `;
    document.body.appendChild(root);

    const panel = root.querySelector('#npe-di-panel');
    const tabs  = root.querySelectorAll('.npe-di-tabs button');

    function setTab(name) {
      tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
      if (name === 'add')      renderAdd();
      else if (name === 'history') renderHistory();
      else if (name === 'summary') renderSummary();
      else if (name === 'export')  renderExport();
    }
    tabs.forEach(b => b.onclick = () => setTab(b.dataset.tab));

    function renderAdd() {
      const fields = schema.map(_renderField).join('');
      panel.innerHTML = `
        <div class="npe-di-card">
          <form id="npe-di-form">
            ${fields}
            <button type="submit" class="npe-di-add">Salvar registro</button>
          </form>
        </div>
      `;
      panel.querySelector('#npe-di-form').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const ep = { id: 'ep-' + Date.now().toString(36), createdAt: Date.now() };
        for (const [k,v] of fd.entries()) ep[k] = v;
        book.episodes.push(ep);
        _save(instrument.id, book);
        e.target.reset();
        setTab('history');
      };
    }

    function renderHistory() {
      if (!book.episodes.length) {
        panel.innerHTML = `<div class="npe-di-empty">Nenhum registro ainda. Clique em "+ Novo registro".</div>`;
        return;
      }
      const sorted = [...book.episodes].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));
      const html = sorted.map(ep => {
        const dt = ep.datetime || ep.date || _fmtDate(ep.createdAt);
        const main = Object.entries(ep)
          .filter(([k]) => !['id','createdAt'].includes(k))
          .map(([k,v]) => `<dt>${k}</dt><dd>${v||'—'}</dd>`)
          .join('');
        return `<div class="npe-di-ep">
          <header><strong>${_fmtDate(dt)}</strong>
            <small><a href="#" data-del="${ep.id}" style="color:#dc2626;">apagar</a></small>
          </header>
          <dl>${main}</dl>
        </div>`;
      }).join('');
      panel.innerHTML = html;
      panel.querySelectorAll('a[data-del]').forEach(a => a.onclick = (e) => {
        e.preventDefault();
        const id = a.dataset.del;
        if (!confirm('Apagar este registro?')) return;
        book.episodes = book.episodes.filter(ep => ep.id !== id);
        _save(instrument.id, book);
        renderHistory();
      });
    }

    function renderSummary() {
      const n = book.episodes.length;
      const last7 = book.episodes.filter(ep => (ep.createdAt||0) > Date.now() - 7*86400e3).length;
      const last30 = book.episodes.filter(ep => (ep.createdAt||0) > Date.now() - 30*86400e3).length;

      // Padrão simples: contagem por valor de campo enum quando existir
      const enumField = schema.find(f => f.type === 'select');
      let patternHtml = '';
      if (enumField && n > 0) {
        const counts = {};
        for (const ep of book.episodes) {
          const v = ep[enumField.key] || '—';
          counts[v] = (counts[v]||0) + 1;
        }
        const rows = Object.entries(counts)
          .sort((a,b) => b[1]-a[1])
          .map(([k,c]) => `<tr><td style="padding:6px 10px;">${k}</td><td style="padding:6px 10px; text-align:right;"><strong>${c}</strong></td></tr>`)
          .join('');
        patternHtml = `<div class="npe-di-card">
          <strong>Distribuição por ${enumField.label}:</strong>
          <table style="width:100%; margin-top:8px; border-collapse:collapse; font-size:13px;">
            ${rows}
          </table>
        </div>`;
      }

      panel.innerHTML = `
        <div class="npe-di-sum">
          <div class="npe-di-stat"><div class="l">Total</div><div class="v">${n}</div></div>
          <div class="npe-di-stat"><div class="l">Últimos 7 dias</div><div class="v">${last7}</div></div>
          <div class="npe-di-stat"><div class="l">Últimos 30 dias</div><div class="v">${last30}</div></div>
        </div>
        ${patternHtml}
        <div class="npe-di-card" style="font-size:13px; color:#57534e;">
          Padrões longitudinais são insumo para o médico. Leve o histórico
          completo (aba "Exportar") à consulta.
        </div>
      `;
    }

    function renderExport() {
      panel.innerHTML = `
        <div class="npe-di-card">
          <strong>Exportar para o médico:</strong>
          <p style="margin:6px 0 12px; font-size:13px; color:#57534e;">
            Você pode imprimir o histórico (gerar PDF) ou baixar como JSON
            para anexar no prontuário.
          </p>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="npe-di-add" id="npe-di-print">🖨️ Imprimir / PDF</button>
            <button class="npe-di-add" id="npe-di-json" style="background:#0e7490;">⬇ Baixar JSON</button>
            <button class="npe-di-add" id="npe-di-clear" style="background:#dc2626;">🗑 Apagar tudo</button>
          </div>
        </div>
      `;
      panel.querySelector('#npe-di-print').onclick = () => {
        const w = window.open('', '_blank');
        const rows = book.episodes.map(ep => {
          const fields = Object.entries(ep)
            .filter(([k]) => !['id','createdAt'].includes(k))
            .map(([k,v]) => `<tr><th>${k}</th><td>${v||'—'}</td></tr>`).join('');
          return `<table>${fields}</table><hr>`;
        }).join('');
        w.document.write(`<title>${book.instrumentTitle}</title>
          <style>body{font-family:sans-serif;padding:20px;}table{border-collapse:collapse;margin:8px 0;}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left;font-size:13px;}th{background:#f5f5f4;}</style>
          <h1>${book.instrumentTitle}</h1>
          <p>Total: ${book.episodes.length} registros</p>
          ${rows}`);
        w.print();
      };
      panel.querySelector('#npe-di-json').onclick = () => {
        const blob = new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${instrument.id}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
      panel.querySelector('#npe-di-clear').onclick = () => {
        if (!confirm(`Apagar todos os ${book.episodes.length} registros deste diário?`)) return;
        book.episodes = [];
        _save(instrument.id, book);
        setTab('history');
      };
    }

    root.querySelector('#npe-di-close').onclick = () => root.remove();
    setTab('add');
  }

  function listBooks() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORE_PREFIX)) {
        try { out.push(JSON.parse(localStorage.getItem(k))); } catch (e) {}
      }
    }
    return out;
  }

  function clearBook(instrumentId) {
    try { localStorage.removeItem(_key(instrumentId)); } catch (e) {}
  }

  const NEUROPED_DIARY_ENGINE = Object.freeze({
    ENGINE_ID, open, listBooks, clearBook, EPISODE_SCHEMAS
  });
  global.NEUROPED_DIARY_ENGINE = NEUROPED_DIARY_ENGINE;

  if (typeof module !== 'undefined' && module.exports) module.exports = NEUROPED_DIARY_ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
