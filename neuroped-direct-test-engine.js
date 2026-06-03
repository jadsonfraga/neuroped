/**
 * NeuroPed Direct Test Engine v1.0
 * --------------------------------
 * Engine para testes diretos aplicados pelo clínico com a criança.
 * UX: fullscreen, cronômetro, observação estruturada, pontuação imediata,
 * exportação de laudo curto.
 *
 * Aceita APENAS instrumentos com belongsToDirectTestEngine(typing)===true.
 * Verificado pelo router antes de chegar aqui.
 */
(function (global) {
  'use strict';

  const O = global.NEUROPED_ONTOLOGY;
  if (!O) { console.error('[DirectTestEngine] ontology.js ausente'); return; }

  const ENGINE_ID = 'direct_test';
  const STORE_KEY = 'neuroped.directTest.sessions.v1';

  // ──────────────────────────────────────────────────────────
  // Persistência local (sem PII; somente IDs e respostas)
  // ──────────────────────────────────────────────────────────
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
    _saveStore(all.slice(-200)); // limita 200 sessões locais
  }

  // ──────────────────────────────────────────────────────────
  // Renderização
  // ──────────────────────────────────────────────────────────

  function _styles() {
    if (document.getElementById('npe-dt-styles')) return;
    const s = document.createElement('style');
    s.id = 'npe-dt-styles';
    s.textContent = `
      .npe-dt-overlay { position:fixed; inset:0; background:#0f172a; z-index:9999;
        color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        display:flex; flex-direction:column; }
      .npe-dt-bar { display:flex; align-items:center; justify-content:space-between;
        padding:12px 18px; background:#1e293b; border-bottom:1px solid #334155; }
      .npe-dt-bar h2 { margin:0; font-size:16px; font-weight:600; }
      .npe-dt-bar .meta { font-size:12px; color:#94a3b8; }
      .npe-dt-chip { display:inline-block; font-size:11px; font-weight:600;
        padding:3px 10px; border-radius:999px; background:#0e7490; color:#ecfeff;
        margin-right:6px; }
      .npe-dt-close { background:none; border:1px solid #475569; color:#f1f5f9;
        padding:6px 14px; border-radius:8px; cursor:pointer; font-size:13px; }
      .npe-dt-close:hover { border-color:#f87171; color:#fecaca; }
      .npe-dt-body { flex:1; overflow:auto; padding:24px; max-width:880px; margin:0 auto;
        width:100%; box-sizing:border-box; }
      .npe-dt-card { background:#1e293b; border:1px solid #334155; border-radius:14px;
        padding:18px 22px; margin-bottom:14px; }
      .npe-dt-task { background:#1e293b; border:1px solid #334155; border-radius:12px;
        padding:14px 18px; margin-bottom:10px; }
      .npe-dt-task h3 { margin:0 0 6px; font-size:15px; color:#67e8f9; }
      .npe-dt-task p { margin:0; font-size:13px; color:#cbd5e1; }
      .npe-dt-task .opts { margin-top:10px; display:flex; gap:6px; flex-wrap:wrap; }
      .npe-dt-task button { background:#334155; color:#f1f5f9; border:1px solid #475569;
        padding:7px 14px; border-radius:8px; cursor:pointer; font-size:13px; }
      .npe-dt-task button:hover { background:#475569; }
      .npe-dt-task button.sel { background:#0e7490; border-color:#06b6d4; }
      .npe-dt-timer { font-variant-numeric: tabular-nums; font-size:18px; color:#fde047; }
      .npe-dt-foot { display:flex; gap:10px; justify-content:flex-end; padding:14px 18px;
        background:#1e293b; border-top:1px solid #334155; }
      .npe-dt-foot button { background:#15803d; color:#fff; border:none; padding:10px 18px;
        border-radius:8px; font-weight:600; cursor:pointer; }
      .npe-dt-foot button.ghost { background:transparent; color:#f1f5f9; border:1px solid #475569; }
    `;
    document.head.appendChild(s);
  }

  function _fmtTime(s) {
    const m = Math.floor(s/60).toString().padStart(2,'0');
    const ss = (s%60).toString().padStart(2,'0');
    return `${m}:${ss}`;
  }

  /**
   * Abre o engine para o instrumento dado.
   * @param {Object} instrument
   * @param {Object} [ctx]
   */
  function open(instrument, ctx) {
    if (!instrument || !instrument.typing
        || !O.belongsToDirectTestEngine(instrument.typing)) {
      console.warn('[DirectTestEngine] instrumento inválido para este engine');
      return;
    }
    _styles();

    const sessionId = 'dt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
    const startedAt = Date.now();
    const responses = {}; // taskIdx → value

    const tasks = Array.isArray(instrument.direct_tasks) && instrument.direct_tasks.length
      ? instrument.direct_tasks
      : (Array.isArray(instrument.plain_questions) ? instrument.plain_questions : []);

    const root = document.createElement('div');
    root.className = 'npe-dt-overlay';
    root.innerHTML = `
      <div class="npe-dt-bar">
        <div>
          <h2>${instrument.title || instrument.id}</h2>
          <div class="meta">
            <span class="npe-dt-chip">Teste direto</span>
            <span>Aplicação presencial · tempo estimado ${instrument.typing.time_to_apply_minutes || '?'} min</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="npe-dt-timer" id="npe-dt-timer">00:00</span>
          <button class="npe-dt-close" id="npe-dt-close">Cancelar</button>
        </div>
      </div>
      <div class="npe-dt-body">
        <div class="npe-dt-card">
          <strong>Instruções clínicas:</strong>
          <p style="margin:6px 0 0; color:#cbd5e1;">${instrument.clinical_use || 'Aplique cada tarefa diretamente com a criança. Registre o desempenho observado.'}</p>
        </div>
        <div id="npe-dt-tasks"></div>
      </div>
      <div class="npe-dt-foot">
        <button class="ghost" id="npe-dt-cancel">Sair sem salvar</button>
        <button id="npe-dt-finish">Finalizar e gerar laudo</button>
      </div>
    `;
    document.body.appendChild(root);

    // Renderiza tarefas
    const tasksEl = root.querySelector('#npe-dt-tasks');
    tasks.forEach((task, i) => {
      const text = typeof task === 'string' ? task : (task.prompt || task.text || JSON.stringify(task));
      const card = document.createElement('div');
      card.className = 'npe-dt-task';
      card.innerHTML = `
        <h3>Tarefa ${i+1}</h3>
        <p>${text}</p>
        <div class="opts" data-idx="${i}">
          <button data-v="0">Não realizou</button>
          <button data-v="1">Parcial</button>
          <button data-v="2">Realizou</button>
          <button data-v="-1">Não aplicável</button>
        </div>
      `;
      tasksEl.appendChild(card);
    });

    // Eventos das opções
    tasksEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-v]');
      if (!btn) return;
      const idx = +btn.parentElement.dataset.idx;
      const val = +btn.dataset.v;
      responses[idx] = val;
      [...btn.parentElement.querySelectorAll('button')].forEach(b => b.classList.toggle('sel', b === btn));
    });

    // Cronômetro
    const timerEl = root.querySelector('#npe-dt-timer');
    const t0 = Date.now();
    const timer = setInterval(() => {
      timerEl.textContent = _fmtTime(Math.floor((Date.now()-t0)/1000));
    }, 1000);

    // Fechar / cancelar
    function close() {
      clearInterval(timer);
      root.remove();
    }
    root.querySelector('#npe-dt-close').onclick = close;
    root.querySelector('#npe-dt-cancel').onclick = close;

    // Finalizar
    root.querySelector('#npe-dt-finish').onclick = () => {
      const validResponses = Object.entries(responses).filter(([k,v]) => v >= 0);
      const total = validResponses.reduce((sum,[,v]) => sum + v, 0);
      const max = validResponses.length * 2;
      const session = {
        sessionId,
        instrumentId: instrument.id,
        instrumentTitle: instrument.title,
        engine: ENGINE_ID,
        startedAt, finishedAt: Date.now(),
        durationSec: Math.floor((Date.now()-t0)/1000),
        responses, total, max,
        percent: max > 0 ? Math.round(total/max*100) : 0
      };
      _saveSession(session);
      _showResult(root, session);
      clearInterval(timer);
    };
  }

  function _showResult(root, session) {
    root.querySelector('.npe-dt-body').innerHTML = `
      <div class="npe-dt-card">
        <h2 style="margin:0 0 10px; color:#67e8f9;">Resultado</h2>
        <p style="font-size:18px; margin:0 0 6px;">
          <strong>${session.total} / ${session.max}</strong>
          (${session.percent}%)
        </p>
        <p style="color:#94a3b8; margin:0 0 14px;">Duração: ${_fmtTime(session.durationSec)}</p>
        <p style="font-size:13px; color:#cbd5e1;">Sessão salva localmente como <code>${session.sessionId}</code>. Use o botão abaixo para gerar laudo PDF.</p>
      </div>
    `;
    root.querySelector('.npe-dt-foot').innerHTML = `
      <button class="ghost" onclick="this.closest('.npe-dt-overlay').remove()">Fechar</button>
      <button onclick="window.print()">Gerar laudo (imprimir/PDF)</button>
    `;
  }

  /** Lista sessões salvas (sem PII). */
  function listSessions() { return _loadStore(); }

  /** Apaga sessões locais. */
  function clearSessions() { _saveStore([]); }

  const NEUROPED_DIRECT_TEST_ENGINE = Object.freeze({
    ENGINE_ID,
    open, listSessions, clearSessions
  });
  global.NEUROPED_DIRECT_TEST_ENGINE = NEUROPED_DIRECT_TEST_ENGINE;

  if (typeof module !== 'undefined' && module.exports) module.exports = NEUROPED_DIRECT_TEST_ENGINE;
})(typeof window !== 'undefined' ? window : globalThis);
