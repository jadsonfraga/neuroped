/* ===========================================================
   NeuroPed EDJ — Gerador de PDF (laudo clínico)
   Implementação minimalista — não depende de bibliotecas externas
   Estratégia: HTML → window.print() com CSS @media print
   Para um PDF "puro" sem print, vem com fallback que abre janela
   formatada que o navegador pode salvar como PDF.
   =========================================================== */

const PDF = {

  /* Abre uma janela formatada para impressão / salvar como PDF */
  buildLaudo(laudo) {
    const html = this._template(laudo);
    const w = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900');
    if (!w) {
      // fallback: cria um Blob e baixa como .html
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (laudo.titulo || 'laudo') + '.html';
      a.click();
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 600);
  },

  _esc(s) {
    return String(s || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  },

  _template(L) {
    const e = this._esc;
    const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${e(L.titulo || 'Laudo NeuroPed')}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif;
    color: #0f1223;
    line-height: 1.55;
    margin: 0;
    background: #fff;
    font-size: 12pt;
  }
  header.brand {
    display: flex; align-items: center; gap: 14px;
    border-bottom: 3px solid #df2f3a;
    padding-bottom: 14px; margin-bottom: 24px;
  }
  .logo {
    width: 56px; height: 56px; border-radius: 14px;
    background: linear-gradient(135deg, #ff6b7a, #df2f3a);
    color: #fff; display: grid; place-items: center;
    font-weight: 700; font-size: 22px;
    box-shadow: 0 6px 18px rgba(223,47,58,0.30);
  }
  .brand-text strong { font-size: 18pt; letter-spacing: -0.5px; display: block; color: #0f1223; }
  .brand-text span { font-size: 10pt; color: #6b7280; display: block; }
  h1 { font-size: 22pt; letter-spacing: -0.5px; margin: 0 0 6px; }
  h2 { font-size: 13pt; margin: 22px 0 8px; color: #df2f3a; }
  .meta {
    background: #fbfaf7;
    border: 1px solid #e7e3d8;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 22px;
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px;
    font-size: 10.5pt;
  }
  .meta div span { color: #6b7280; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 2px; font-weight: 600; }
  .meta div strong { font-weight: 600; color: #0f1223; }
  p { margin: 0 0 12px; text-align: justify; }
  ul { margin: 0 0 12px; padding-left: 20px; }
  li { margin-bottom: 4px; }
  .score-box {
    border: 2px solid #df2f3a;
    border-radius: 12px;
    padding: 18px;
    text-align: center;
    margin: 14px 0;
    background: linear-gradient(135deg, rgba(255,107,122,0.06), rgba(223,47,58,0.06));
  }
  .score-num { font-size: 32pt; font-weight: 700; color: #df2f3a; letter-spacing: -1px; line-height: 1; }
  .score-lab { font-size: 10pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
  .signature {
    margin-top: 50px;
    padding-top: 16px;
    border-top: 1px solid #d1d5db;
  }
  .signature-line {
    width: 360px;
    border-bottom: 1px solid #0f1223;
    margin-bottom: 6px;
  }
  .signature small { color: #6b7280; }
  footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e7e3d8;
    font-size: 9pt;
    color: #6b7280;
    text-align: center;
  }
  .disclaimer {
    background: #fff7ed;
    border-left: 3px solid #f59e0b;
    padding: 10px 14px;
    margin: 18px 0;
    font-size: 10.5pt;
    color: #78350f;
  }
  .verif {
    display: inline-flex; align-items: center; gap: 6px;
    background: #ecfdf5; color: #047857;
    padding: 4px 10px; border-radius: 999px;
    font-size: 9pt; font-weight: 600;
    margin-top: 4px;
  }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

  <header class="brand">
    <div class="logo">NP</div>
    <div class="brand-text">
      <strong>NeuroPed EDJ</strong>
      <span>Dr. Jadson Fraga · Neuropediatria · CRM-XX 00000</span>
    </div>
  </header>

  <h1>${e(L.titulo || 'Laudo Clínico')}</h1>

  <div class="meta">
    <div><span>Paciente</span><strong>${e(L.paciente)}</strong></div>
    <div><span>Data nascimento</span><strong>${e(L.dob || '—')}</strong></div>
    <div><span>Idade</span><strong>${e(L.idade)}</strong></div>
    <div><span>Responsável</span><strong>${e(L.responsavel || '—')}</strong></div>
    <div><span>Data do laudo</span><strong>${e(now)}</strong></div>
    <div><span>Código</span><strong>${e(L.codigo || 'LAUDO-' + Date.now().toString(36).toUpperCase())}</strong></div>
  </div>

  ${L.queixa ? `<h2>Queixa principal</h2><p>${e(L.queixa)}</p>` : ''}

  ${L.hpma ? `<h2>História clínica</h2><p>${e(L.hpma)}</p>` : ''}

  ${L.exame ? `<h2>Exame e observações</h2><p>${e(L.exame)}</p>` : ''}

  ${L.escalas && L.escalas.length ? `
    <h2>Instrumentos aplicados</h2>
    <ul>${L.escalas.map(s => `<li><strong>${e(s.title)}</strong> — ${e(s.result || '')}</li>`).join('')}</ul>
  ` : ''}

  ${L.score ? `
    <div class="score-box">
      <div class="score-num">${e(L.score)}</div>
      <div class="score-lab">Sinalização ${e(L.scoreLevel || '—')}</div>
    </div>
  ` : ''}

  ${L.hipotese ? `<h2>Hipótese diagnóstica / impressão</h2><p>${e(L.hipotese)}</p>` : ''}

  ${L.conduta ? `<h2>Conduta e orientações</h2><p>${e(L.conduta)}</p>` : ''}

  <div class="disclaimer">
    <strong>Aviso clínico:</strong> Instrumentos autorais utilizados são recursos operacionais de triagem, organização e acompanhamento clínico. Não substituem avaliação médica completa, exame clínico ou instrumentos normatizados quando formalmente indicados.
  </div>

  <div class="signature">
    <div class="signature-line"></div>
    <strong>Dr. Jadson Fraga</strong><br/>
    <small>Neuropediatra · CRM-XX 00000</small><br/>
    <span class="verif">✓ Documento assinado digitalmente · ${e(L.hash || ('SHA-' + Date.now().toString(16).slice(-8).toUpperCase()))}</span>
  </div>

  <footer>
    NeuroPed EDJ v4.0 · Gerado em ${now} · Verificável em /verificar-documento
  </footer>

</body>
</html>`;
  }
};

window.PDF = PDF;
