/**
 * NeuroPed Scale Engine v1.0
 * --------------------------
 * Engine para escalas, questionários e inventários (pré-consulta).
 * UX: barra de progresso, linguagem familiar, opcional Likert/binária,
 * exportação PDF, link compartilhável.
 *
 * Aceita instrumentos com belongsToScaleEngine(typing)===true.
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  if (!O) { console.error('[ScaleEngine] ontology.js ausente'); return; }

  const ENGINE_ID = 'scale';
  const STORE_KEY = 'neuroped.scale.sessions.v1';

  function _loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function _saveStore(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function _saveSession(session) {
    const all = _loadStore();
    all.push(session);
    _saveStore(all.slice(-200));
  }

  function _styles() {
    if (document.getElementById('npe-sc-styles')) return;
    const s = document.createElement('style');
    s.id = 'npe-sc-styles';
    s.textContent = `
      .npe-sc-overlay { position:fixed; inset:0; background:#f7f9fb; z-index:9999;
        color:#0f172a; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        display:flex; flex-direction:column; }
      .npe-sc-bar { display:flex; align-items:center; justify-content:space-between;
        padding:14px 20px; background:#fff; border-bottom:1px solid #e2e8f0;
        box-shadow:0 1px 2px rgba(0,0,0,.04); }
      .npe-sc-bar h2 { margin:0; font-size:17px; font-weight:600; color:#0e7490; }
      .npe-sc-meta { font-size:12px; color:#64748b; margin-top:3px; }
      .npe-sc-chip { display:inline-block; font-size:11px; font-weight:600;
        padding:3px 10px; border-radius:999px; background:#ecfeff; color:#0e7490;
        border:1px solid #cffafe; margin-right:6px; }
      .npe-sc-close { background:none; border:1px solid #cbd5e1; color:#475569;
        padding:7px 14px; border-radius:8px; cursor:pointer; font-size:13px; }
      .npe-sc-close:hover { border-color:#0e7490; color:#0e7490; }
      .npe-sc-progress { height:6px; background:#e2e8f0; }
      .npe-sc-progress > i { display:block; height:100%; background:#0e7490;
        transition:width .25s ease; }
      .npe-sc-body { flex:1; overflow:auto; padding:24px 20px; max-width:760px;
        margin:0 auto; width:100%; box-sizing:border-box; }
      .npe-sc-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px;
        padding:18px 22px; margin-bottom:14px; box-shadow:0 1px 2px rgba(0,0,0,.03); }
      .npe-sc-q { background:#fff; border:1px solid #e2e8f0; border-radius:14px;
        padding:18px 22px; margin-bottom:12px; box-shadow:0 1px 2px rgba(0,0,0,.03); }
      .npe-sc-q h3 { margin:0 0 4px; font-size:14px; color:#0e7490; font-weight:600; }
      .npe-sc-q p  { margin:0 0 12px; font-size:15px; color:#0f172a; line-height:1.5; }
      .npe-sc-opts { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
      @media (max-width:560px){ .npe-sc-opts { grid-template-columns:repeat(2,1fr); } }
      .npe-sc-opts label { display:flex; align-items:center; justify-content:center;
        gap:6px; border:1px solid #e2e8f0; background:#fff; border-radius:10px;
        padding:10px 8px; font-size:13px; cursor:pointer; transition:.15s;
        text-align:center; }
      .npe-sc-opts label:hover { border-color:#0e7490; background:#ecfeff; }
      .npe-sc-opts input { accent-color:#0e7490; }
      .npe-sc-opts label:has(input:checked) { border-color:#0e7490; background:#ecfeff;
        font-weight:600; color:#0e7490; }
      .npe-sc-foot { display:flex; gap:10px; justify-content:space-between;
        align-items:center; padding:14px 20px; background:#fff;
        border-top:1px solid #e2e8f0; }
      .npe-sc-counter { font-size:13px; color:#64748b; }
      .npe-sc-foot .actions { display:flex; gap:10px; }
      .npe-sc-foot button { background:#0e7490; color:#fff; border:none;
        padding:10px 18px; border-radius:8px; font-weight:600; cursor:pointer; }
      .npe-sc-foot button.ghost { background:transparent; color:#0e7490;
        border:1px solid #0e7490; }
      .npe-sc-foot button:disabled { opacity:.5; cursor:not-allowed; }
    `;
    document.head.appendChild(s);
  }

  /** Opções padrão Likert 0-3. Outros formatos podem ser declarados no instrumento.options. */
  const DEFAULT_LIKERT = [
    { v: 0, label: 'Não / nunca' },
    { v: 1, label: 'Às vezes' },
    { v: 2, label: 'Frequente' },
    { v: 3, label: 'Quase sempre' }
  ];

  function open(instrument, ctx) {
    if (!instrument || !instrument.typing
        || !O.belongsToScaleEngine(instrument.typing)) {
      console.warn('[ScaleEngine] instrumento inválido para este engine');
      return;
    }
    _styles();

    const sessionId = 'sc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
    const startedAt = Date.now();
    const responses = {};

    const questions = Array.isArray(instrument.plain_questions) && instrument.plain_questions.length
      ? instrument.plain_questions
      : (Array.isArray(instrument.items) ? instrument.items : []);
    const options = Array.isArray(instrument.options) && instrument.options.length
      ? instrument.options
      : DEFAULT_LIKERT;

    const audLabel = (instrument.typing.respondent_required === 'family')   ? 'Família responde'
                   : (instrument.typing.respondent_required === 'teacher')  ? 'Escola responde'
                   : (instrument.typing.respondent_required === 'self_report') ? 'Auto-resposta'
                   : (instrument.typing.respondent_required === 'multi_informant') ? 'Pais + escola'
                   : 'Pré-consulta';

    const root = document.createElement('div');
    root.className = 'npe-sc-overlay';
    root.innerHTML = `
      <div class="npe-sc-bar">
        <div>
          <h2>${instrument.title || instrument.id}</h2>
          <div class="npe-sc-meta">
            <span class="npe-sc-chip">${audLabel}</span>
            <span>~${instrument.typing.time_to_apply_minutes || '?'} min · pré-consulta</span>
          </div>
        </div>
        <button class="npe-sc-close" id="npe-sc-close">Fechar</button>
      </div>
      <div class="npe-sc-progress"><i id="npe-sc-progressbar" style="width:0%"></i></div>
      <div class="npe-sc-body">
        <div class="npe-sc-card">
          <strong>Como responder:</strong>
          <p style="margin:6px 0 0; color:#475569; font-size:14px;">
            Pense no comportamento da criança nas últimas 4 semanas. Não há resposta certa ou errada — escolha o que mais se aproxima do dia a dia.
          </p>
        </div>
        <div id="npe-sc-questions"></div>
      </div>
      <div class="npe-sc-foot">
        <span class="npe-sc-counter" id="npe-sc-counter">0 de ${questions.length} respondidas</span>
        <div class="actions">
          <button class="ghost" id="npe-sc-cancel">Sair sem salvar</button>
          <button id="npe-sc-finish" disabled>Finalizar e ver resultado</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const qContainer = root.querySelector('#npe-sc-questions');
    questions.forEach((q, i) => {
      const text = typeof q === 'string' ? q : (q.text || q.prompt || JSON.stringify(q));
      const card = document.createElement('div');
      card.className = 'npe-sc-q';
      const opts = options.map(o => `
        <label><input type="radio" name="q${i}" value="${o.v}"><span>${o.label}</span></label>
      `).join('');
      card.innerHTML = `
        <h3>Pergunta ${i+1}</h3>
        <p>${text}</p>
        <div class="npe-sc-opts">${opts}</div>
      `;
      qContainer.appendChild(card);
    });

    function update() {
      const answered = Object.keys(responses).length;
      root.querySelector('#npe-sc-counter').textContent = `${answered} de ${questions.length} respondidas`;
      root.querySelector('#npe-sc-progressbar').style.width = (answered/questions.length*100)+'%';
      root.querySelector('#npe-sc-finish').disabled = answered === 0;
    }

    qContainer.addEventListener('change', (e) => {
      const m = e.target.name && e.target.name.match(/^q(\d+)$/);
      if (!m) return;
      responses[+m[1]] = +e.target.value;
      update();
    });

    function close() { root.remove(); }
    root.querySelector('#npe-sc-close').onclick = close;
    root.querySelector('#npe-sc-cancel').onclick = close;

    root.querySelector('#npe-sc-finish').onclick = () => {
      const answered = Object.keys(responses);
      const total = answered.reduce((s,k) => s + responses[k], 0);
      const max = answered.length * (Math.max.apply(null, options.map(o => o.v)));
      let band = 'baixa', bandColor = '#15803d';
      const pct = max > 0 ? total/max : 0;
      if (pct >= 0.66) { band = 'alta'; bandColor = '#b91c1c'; }
      else if (pct >= 0.33) { band = 'moderada'; bandColor = '#b45309'; }

      // Verifica sentinela (item de risco autolesivo, por ex.)
      let sentinelAlert = null;
      if (instrument.typing.sentinel && instrument.typing.sentinel.enabled) {
        const trig = instrument.typing.sentinel.trigger_items || [];
        const thr  = instrument.typing.sentinel.trigger_threshold || 1;
        for (const idx of trig) {
          if ((responses[idx] || 0) >= thr) {
            sentinelAlert = 'Atenção: resposta sinaliza necessidade de avaliação clínica urgente.';
            break;
          }
        }
      }

      const session = {
        sessionId,
        instrumentId: instrument.id,
        instrumentTitle: instrument.title,
        engine: ENGINE_ID,
        startedAt, finishedAt: Date.now(),
        responses, total, max, band, percent: Math.round(pct*100),
        sentinelAlert
      };
      _saveSession(session);
      _showResult(root, session, bandColor);
    };

    update();
  }

  function _showResult(root, session, bandColor) {
    const alertHtml = session.sentinelAlert
      ? `<div class="npe-sc-card" style="border-left:4px solid #b91c1c; background:#fef2f2;">
           <strong style="color:#b91c1c;">⚠ ${session.sentinelAlert}</strong>
           <p style="margin:6px 0 0; font-size:13px;">Procure o profissional responsável ou ligue 188 (CVV).</p>
         </div>`
      : '';
    root.querySelector('.npe-sc-body').innerHTML = `
      ${alertHtml}
      <div class="npe-sc-card">
        <h2 style="margin:0 0 10px; color:#0e7490;">Resultado da escala</h2>
        <p style="font-size:24px; margin:0;">
          <strong>${session.total} / ${session.max}</strong>
          <span style="font-size:14px; color:${bandColor}; margin-left:8px;
                  padding:3px 12px; border-radius:999px; background:${bandColor}1a;
                  font-weight:600;">faixa ${session.band}</span>
        </p>
        <p style="color:#64748b; margin:8px 0 0; font-size:14px;">${session.percent}% da pontuação máxima</p>
      </div>
      <div class="npe-sc-card">
        <strong>Próximo passo:</strong>
        <p style="margin:6px 0 0; color:#475569; font-size:14px;">
          Leve este resultado à consulta. O médico irá interpretá-lo no contexto clínico
          completo da criança.
        </p>
      </div>
    `;
    root.querySelector('.npe-sc-foot').innerHTML = `
      <span class="npe-sc-counter">Sessão ${session.sessionId} salva localmente.</span>
      <div class="actions">
        <button class="ghost" onclick="this.closest('.npe-sc-overlay').remove()">Fechar</button>
        <button onclick="window.print()">Gerar PDF</button>
      </div>
    `;
  }

  function listSessions() { return _loadStore(); }
  function clearSessions() { _saveStore([]); }

  const NEUROPED_SCALE_ENGINE = Object.freeze({
    ENGINE_ID, open, listSessions, clearSessions
  });
  global.NEUROPED_SCALE_ENGINE = NEUROPED_SCALE_ENGINE;

  if (typeof module !== 'undefined' && module.exports) module.exports = NEUROPED_SCALE_ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
