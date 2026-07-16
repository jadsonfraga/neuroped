export function printPlainTextDocument(options: { title: string; text: string }): boolean {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.opener = null;

  const document = printWindow.document;
  document.open();
  document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
    @page { margin: 1.7cm; size: A4; }
    body { margin: 0; color: #172033; font: 11pt/1.5 Arial, sans-serif; }
    pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
  </style></head><body><pre id="report"></pre></body></html>`);
  document.close();
  document.title = options.title;
  const report = document.getElementById("report");
  if (report) report.textContent = options.text;
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 50);
  return true;
}
