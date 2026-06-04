/* =====================================================================
   NeuroPed SDG · CLINICAL PDF EXPORT V3.1
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Três geradores de PDF, um por engine:
     · exportDirectTestPDF(test, result)
     · exportScalePDF(scale, answers, scoring)
     · exportDiaryPDF(diary, entries, summary)

   Stack: jsPDF carregado on-demand via CDN. Layout dark editorial
   convertido para impressão (fundo claro, tipografia serif).

   Quando geramos PDF de LAUDO médico (Dr. flag): respeita regra do
   CLAUDE.md — salvar local + subir Drive "Laudos NeuroPed".
   ===================================================================== */
(function (global) {
  "use strict";

  const JSPDF_CDN = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

  let _jsPDFPromise = null;
  function ensureJsPDF() {
    if (_jsPDFPromise) return _jsPDFPromise;
    _jsPDFPromise = new Promise((resolve, reject) => {
      if (global.jspdf && global.jspdf.jsPDF) return resolve(global.jspdf.jsPDF);
      const s = document.createElement("script");
      s.src = JSPDF_CDN;
      s.onload = () => resolve(global.jspdf.jsPDF);
      s.onerror = () => reject(new Error("falha ao carregar jsPDF"));
      document.head.appendChild(s);
    });
    return _jsPDFPromise;
  }

  /* ------------------------------------------------------------------
   *  HEADER / FOOTER COMUNS
   * ------------------------------------------------------------------ */
  function drawHeader(doc, title, subtitle) {
    doc.setFillColor(10, 10, 22);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
    doc.setTextColor(231, 201, 139);
    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.text("Dr. Jadson Fraga", 15, 17);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(168, 164, 216);
    doc.text("NEUROPEDIATRIA · CRM-PE 25227 · RQE 17756", 15, 23);

    // título
    doc.setTextColor(34, 28, 82);
    doc.setFont("times", "bold");
    doc.setFontSize(18);
    doc.text(title, 15, 42);
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 120);
      doc.text(subtitle, 15, 49);
    }
    doc.setDrawColor(231, 201, 139);
    doc.setLineWidth(0.6);
    doc.line(15, 52, doc.internal.pageSize.getWidth() - 15, 52);
  }

  function drawFooter(doc) {
    const H = doc.internal.pageSize.getHeight();
    const W = doc.internal.pageSize.getWidth();
    doc.setDrawColor(231, 201, 139);
    doc.setLineWidth(0.3);
    doc.line(15, H - 15, W - 15, H - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    const ts = new Date().toLocaleString("pt-BR");
    doc.text(`Emitido em ${ts}  ·  Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756`, 15, H - 8);
    const page = doc.internal.getCurrentPageInfo().pageNumber;
    doc.text(`Página ${page}`, W - 25, H - 8);
  }

  function newDoc() {
    return ensureJsPDF().then((jsPDF) => new jsPDF({ unit: "mm", format: "a4" }));
  }

  function downloadDoc(doc, filename) {
    doc.save(filename);
    return { ok: true, filename, bytes: doc.output("blob").size };
  }

  /* ------------------------------------------------------------------
   *  1. TESTE DIRETO — resultado individual
   * ------------------------------------------------------------------ */
  async function exportDirectTestPDF({ test, patient, result }) {
    const doc = await newDoc();
    drawHeader(doc, test.name || test.label || "Teste direto",
               `Aplicação clínica presencial · subtype: ${test.subtype} · tempo: ${test.estimated_minutes} min`);

    let y = 62;
    if (patient) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(34, 28, 82);
      doc.text("Paciente:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${patient.name || "—"} · ${patient.dob || "—"} · ${patient.sex || ""}`, 35, y);
      y += 7;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(34, 28, 82);
    doc.text("Resultado do teste", 15, y); y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 80);
    Object.entries(result || {}).forEach(([k, v]) => {
      const line = `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`;
      doc.text(line, 17, y);
      y += 5.5;
      if (y > 270) { drawFooter(doc); doc.addPage(); drawHeader(doc, test.name); y = 62; }
    });

    drawFooter(doc);
    const file = `laudo-teste-${test.id}-${new Date().toISOString().slice(0,10)}.pdf`;
    return downloadDoc(doc, file);
  }

  /* ------------------------------------------------------------------
   *  2. ESCALA PREENCHIDA — para pré-consulta e laudo
   * ------------------------------------------------------------------ */
  async function exportScalePDF({ scale, patient, answers, scoring }) {
    const doc = await newDoc();
    drawHeader(doc, scale.name || scale.label || "Escala",
               `Pré-consulta · subtype: ${scale.subtype} · respondente: ${scale.respondent}`);

    let y = 62;
    if (patient) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(34, 28, 82);
      doc.text("Paciente:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${patient.name || "—"} · ${patient.dob || "—"} · ${patient.sex || ""}`, 35, y);
      y += 7;
    }

    if (scoring) {
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(34, 28, 82);
      doc.text("Pontuação", 15, y); y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      Object.entries(scoring).forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, 17, y); y += 5.5;
      });
      y += 3;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(34, 28, 82);
    doc.text("Respostas", 15, y); y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    Object.entries(answers || {}).forEach(([item, ans]) => {
      const line = `${item}: ${typeof ans === "object" ? JSON.stringify(ans) : ans}`;
      const wrapped = doc.splitTextToSize(line, 180);
      doc.text(wrapped, 17, y);
      y += wrapped.length * 4.5 + 1;
      if (y > 270) { drawFooter(doc); doc.addPage(); drawHeader(doc, scale.name); y = 62; }
    });

    drawFooter(doc);
    const file = `escala-${scale.id}-${new Date().toISOString().slice(0,10)}.pdf`;
    return downloadDoc(doc, file);
  }

  /* ------------------------------------------------------------------
   *  3. DIÁRIO — timeline evolutiva
   * ------------------------------------------------------------------ */
  async function exportDiaryPDF({ diary, patient, entries, summary, trend }) {
    const doc = await newDoc();
    drawHeader(doc, diary.name || diary.label || "Diário clínico",
               `Acompanhamento longitudinal · subtype: ${diary.subtype} · registros: ${(entries || []).length}`);

    let y = 62;
    if (patient) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(34, 28, 82);
      doc.text("Paciente:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${patient.name || "—"} · ${patient.dob || "—"}`, 35, y);
      y += 7;
    }

    if (summary) {
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(34, 28, 82);
      doc.text("Resumo agregado", 15, y); y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 80);
      Object.entries(summary).forEach(([k, v]) => {
        doc.text(`${k}: ${typeof v === "number" ? v.toFixed(2) : v}`, 17, y); y += 5;
      });
      y += 4;
    }

    if (trend && trend.direction) {
      doc.setFillColor(255, 247, 220);
      doc.rect(15, y - 4, doc.internal.pageSize.getWidth() - 30, 12, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(34, 28, 82);
      const ico = trend.direction === "melhorando" ? "▼" : trend.direction === "piorando" ? "▲" : "→";
      doc.text(`Tendência ${trend.direction.toUpperCase()} ${ico}   (delta ${trend.delta.toFixed(2)})`, 17, y + 3);
      y += 14;
    }

    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(34, 28, 82);
    doc.text("Linha do tempo", 15, y); y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Data", 17, y);
    doc.text("Registro", 50, y);
    y += 4;
    doc.setDrawColor(231, 201, 139);
    doc.line(15, y, doc.internal.pageSize.getWidth() - 15, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    (entries || []).forEach((e) => {
      const date = e.date || new Date(e.ts).toLocaleDateString("pt-BR");
      const rest = Object.entries(e)
        .filter(([k]) => k !== "ts" && k !== "date")
        .map(([k, v]) => `${k}: ${v}`)
        .join("  ·  ");
      const wrapped = doc.splitTextToSize(rest, 140);
      doc.text(date, 17, y);
      doc.text(wrapped, 50, y);
      y += Math.max(5, wrapped.length * 4.5);
      if (y > 270) { drawFooter(doc); doc.addPage(); drawHeader(doc, diary.name); y = 62; }
    });

    drawFooter(doc);
    const file = `diario-${diary.id}-${new Date().toISOString().slice(0,10)}.pdf`;
    return downloadDoc(doc, file);
  }

  /* ------------------------------------------------------------------
   *  HOOK PARA UPLOAD AO DRIVE (regra do CLAUDE.md)
   *  Quando isLaudo=true, dispara evento que outra camada (MCP Drive)
   *  pode escutar para subir o blob ao Google Drive da pasta Laudos.
   * ------------------------------------------------------------------ */
  function dispatchLaudoEvent(payload) {
    const ev = new CustomEvent("neuroped:laudo-generated", { detail: payload });
    global.dispatchEvent(ev);
  }

  global.NeuroPedPDFExport = {
    exportDirectTestPDF,
    exportScalePDF,
    exportDiaryPDF,
    dispatchLaudoEvent,
    version: "3.1.0"
  };
  if (typeof module !== "undefined" && module.exports) module.exports = global.NeuroPedPDFExport;
})(typeof window !== "undefined" ? window : globalThis);
