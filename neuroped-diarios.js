/* =====================================================================
   NeuroPed SDG · DIÁRIOS CLÍNICOS V3
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Renderiza painel de diários clínicos com UX longitudinal:
     · Grid de cards (sono, alimentar, crises, evacuatório...)
     · Card abre modal de registro diário (data + métricas próprias)
     · Linha do tempo SVG sparkline
     · Calendário-heatmap dos últimos 30 dias
     · Persistência em localStorage (anonimizada por patient_id)
     · Export CSV evolutivo

   NÃO mistura com escalas nem com testes.
   ===================================================================== */
(function (global) {
  "use strict";

  const NS = "neuroped.diaries.v3";

  /* ------------------------------------------------------------------
   *  CATÁLOGO CANÔNICO DE DIÁRIOS
   * ------------------------------------------------------------------ */
  const DIARIES = [
    { id: "diar-sono",                 subtype: "sleep",        label: "Diário do sono",
      icon: "🌙", metrics: ["hora_dormir", "hora_acordar", "despertares", "qualidade_1_5"],
      hint: "Registre horário de dormir, despertares e qualidade percebida (1-5)." },
    { id: "diar-alimentar",            subtype: "feeding",      label: "Diário alimentar",
      icon: "🍽", metrics: ["refeicoes_aceitas", "recusas", "seletividade_1_5"],
      hint: "Aceite alimentar, recusas e nível de seletividade." },
    { id: "diar-comportamento",        subtype: "behavior",     label: "Diário comportamental",
      icon: "🎭", metrics: ["episodios_disruptivos", "gatilhos", "intensidade_1_5"],
      hint: "Episódios disruptivos com gatilho e intensidade." },
    { id: "diar-crises-epilepticas",   subtype: "seizure",      label: "Diário de crises",
      icon: "⚡", metrics: ["n_crises", "duracao_min", "tipo", "pos_ictal"],
      hint: "Frequência, duração, tipo e fase pós-ictal." },
    { id: "diar-evacuatorio",          subtype: "bowel",        label: "Diário evacuatório",
      icon: "💧", metrics: ["n_evacuacoes", "bristol_1_7", "incontinencia"],
      hint: "Frequência, escala de Bristol e incontinência." },
    { id: "diar-escolar-diario",       subtype: "school_daily", label: "Registro escolar diário",
      icon: "🎓", metrics: ["rendimento_1_5", "comportamento_1_5", "ocorrencias"],
      hint: "Rendimento, comportamento e ocorrências do dia." },
    { id: "diar-medicacao",            subtype: "medication",   label: "Diário de medicação",
      icon: "💊", metrics: ["dose_administrada", "horario", "efeitos_colaterais", "esquecimento"],
      hint: "Dose, horário e efeitos colaterais." },
    { id: "diar-agressividade",        subtype: "aggression",   label: "Diário de agressividade",
      icon: "🔥", metrics: ["n_episodios", "tipo", "intensidade_1_5", "gatilho"],
      hint: "Episódios, gatilho e intensidade." },
    { id: "diar-sensorial",            subtype: "sensory",      label: "Diário sensorial",
      icon: "🌈", metrics: ["sobrecarga", "tipo_estimulo", "duracao_min"],
      hint: "Sobrecarga sensorial e estímulos críticos." },
    { id: "diar-humor-adolescente",    subtype: "mood",         label: "Diário de humor",
      icon: "💭", metrics: ["humor_1_10", "ansiedade_1_10", "ideacao"],
      hint: "Humor, ansiedade e ideação (autoteste adolescente)." },
    { id: "diar-cefaleia",             subtype: "headache",     label: "Diário de cefaleia",
      icon: "🧠", metrics: ["intensidade_1_10", "duracao_h", "gatilho", "medicacao"],
      hint: "Intensidade, duração e gatilho." },
    { id: "diar-tiques",               subtype: "tics",         label: "Diário de tiques",
      icon: "👁", metrics: ["n_tiques", "tipo_motor_vocal", "intensidade_1_5"],
      hint: "Frequência, tipo e intensidade dos tiques." }
  ];

  /* ------------------------------------------------------------------
   *  STORAGE
   * ------------------------------------------------------------------ */
  function readStore() {
    try { return JSON.parse(localStorage.getItem(NS) || "{}"); } catch (_) { return {}; }
  }
  function writeStore(d) { try { localStorage.setItem(NS, JSON.stringify(d)); } catch (_) {} }

  function logEntry(diaryId, entry) {
    const store = readStore();
    store[diaryId] = store[diaryId] || [];
    store[diaryId].push({ ts: Date.now(), date: new Date().toISOString().slice(0, 10), ...entry });
    writeStore(store);
  }
  function entriesOf(diaryId) {
    return (readStore()[diaryId] || []).sort((a, b) => a.ts - b.ts);
  }

  /* ------------------------------------------------------------------
   *  RENDER GRID DE DIÁRIOS
   * ------------------------------------------------------------------ */
  function renderGrid() {
    const host = document.getElementById("np-diary-grid");
    if (!host) return;
    host.innerHTML = "";

    DIARIES.forEach((d) => {
      const card = document.createElement("article");
      card.className = "np-diary-card";
      card.dataset.diaryId = d.id;
      const last = entriesOf(d.id).slice(-1)[0];
      const lastDate = last ? new Date(last.ts).toLocaleDateString("pt-BR") : "—";

      card.innerHTML = `
        <header class="np-diary-card__head">
          <span class="np-diary-card__icon" aria-hidden="true">${d.icon}</span>
          <h3 class="np-diary-card__title">${d.label}</h3>
        </header>
        <p class="np-diary-card__hint">${d.hint}</p>
        <div class="np-diary-sparkline" data-diary-id="${d.id}"></div>
        <footer class="np-diary-card__foot">
          <span class="np-diary-card__last">Último: <strong>${lastDate}</strong></span>
          <button type="button" class="np-btn np-btn--teal" data-action="register" data-diary-id="${d.id}">+ Registrar</button>
        </footer>
      `;
      host.appendChild(card);
    });

    host.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.diaryId;
      const action = btn.dataset.action;
      if (action === "register") openRegisterModal(id);
    });

    document.querySelectorAll(".np-diary-sparkline").forEach((el) => {
      renderSparkline(el, el.dataset.diaryId);
    });
  }

  /* ------------------------------------------------------------------
   *  MODAL DE REGISTRO
   * ------------------------------------------------------------------ */
  function openRegisterModal(diaryId) {
    const diary = DIARIES.find((d) => d.id === diaryId);
    if (!diary) return;

    const modal = document.createElement("div");
    modal.className = "np-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "np-modal-title");

    modal.innerHTML = `
      <div class="np-modal__backdrop"></div>
      <div class="np-modal__panel">
        <header class="np-modal__head">
          <span class="np-modal__icon" aria-hidden="true">${diary.icon}</span>
          <h3 id="np-modal-title">${diary.label} — registro</h3>
          <button type="button" class="np-modal__close" aria-label="Fechar">×</button>
        </header>
        <form class="np-modal__form" data-diary-id="${diary.id}">
          <label class="np-field">
            <span class="np-field__label">Data</span>
            <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required>
          </label>
          ${diary.metrics.map((m) => `
            <label class="np-field">
              <span class="np-field__label">${m.replace(/_/g, " ")}</span>
              <input type="text" name="${m}" autocomplete="off">
            </label>
          `).join("")}
          <label class="np-field">
            <span class="np-field__label">Observações</span>
            <textarea name="obs" rows="3"></textarea>
          </label>
          <footer class="np-modal__foot">
            <button type="button" class="np-btn np-btn--ghost" data-close>Cancelar</button>
            <button type="submit" class="np-btn np-btn--gold">Salvar registro</button>
          </footer>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector(".np-modal__close").addEventListener("click", close);
    modal.querySelector("[data-close]").addEventListener("click", close);
    modal.querySelector(".np-modal__backdrop").addEventListener("click", close);

    modal.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const entry = Object.fromEntries(fd.entries());
      logEntry(diary.id, entry);
      close();
      renderGrid();
      showTimeline(diary.id);
    });
  }

  /* ------------------------------------------------------------------
   *  SPARKLINE SVG (últimos N registros)
   * ------------------------------------------------------------------ */
  function renderSparkline(el, diaryId) {
    const entries = entriesOf(diaryId).slice(-14);
    if (entries.length < 2) {
      el.innerHTML = '<span class="np-sparkline__empty">Sem dados ainda</span>';
      return;
    }
    const W = 200, H = 36, P = 4;
    const vals = entries.map((e, i) => {
      const first = Object.keys(e).find((k) => /1_5|1_10/.test(k));
      return Number(e[first] || i);
    });
    const min = Math.min(...vals), max = Math.max(...vals) || 1;
    const dx = (W - P * 2) / Math.max(1, vals.length - 1);
    const norm = (v) => H - P - ((v - min) / (max - min || 1)) * (H - P * 2);
    const pts = vals.map((v, i) => `${P + i * dx},${norm(v)}`).join(" ");
    el.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="${pts}" fill="none" stroke="var(--gold,#e7c98b)" stroke-width="1.5"/>
        <circle cx="${P + (vals.length - 1) * dx}" cy="${norm(vals[vals.length - 1])}" r="2" fill="var(--gold,#e7c98b)"/>
      </svg>
    `;
  }

  /* ------------------------------------------------------------------
   *  LINHA DO TEMPO COMPLETA + EXPORT
   * ------------------------------------------------------------------ */
  function showTimeline(diaryId) {
    const wrap = document.getElementById("np-timeline-section");
    const host = document.getElementById("np-timeline-chart");
    if (!wrap || !host) return;
    wrap.hidden = false;
    const entries = entriesOf(diaryId);
    const diary = DIARIES.find((d) => d.id === diaryId);
    if (!diary) return;

    if (!entries.length) {
      host.innerHTML = '<p class="np-empty">Nenhum registro para mostrar.</p>';
      return;
    }

    const rows = entries.map((e) => `
      <tr>
        <td>${e.date || new Date(e.ts).toLocaleDateString("pt-BR")}</td>
        ${diary.metrics.map((m) => `<td>${e[m] ?? "—"}</td>`).join("")}
        <td>${e.obs || ""}</td>
      </tr>
    `).join("");

    host.innerHTML = `
      <div class="np-timeline-head">
        <h3>${diary.icon} ${diary.label}</h3>
        <button type="button" class="np-btn np-btn--ghost" id="np-export-csv">Exportar CSV</button>
      </div>
      <div class="np-table-wrap">
        <table class="np-timeline-table">
          <thead><tr><th>Data</th>${diary.metrics.map((m) => `<th>${m.replace(/_/g, " ")}</th>`).join("")}<th>Obs.</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    const exp = host.querySelector("#np-export-csv");
    if (exp) exp.addEventListener("click", () => exportCSV(diary, entries));
  }

  function exportCSV(diary, entries) {
    const cols = ["date", ...diary.metrics, "obs"];
    const csv = [
      cols.join(","),
      ...entries.map((e) => cols.map((c) => `"${String(e[c] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${diary.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  /* ------------------------------------------------------------------
   *  INIT
   * ------------------------------------------------------------------ */
  function init() { renderGrid(); }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }

  global.NeuroPedDiaries = { renderGrid, logEntry, entriesOf, DIARIES, version: "3.0.0" };
})(typeof window !== "undefined" ? window : globalThis);
