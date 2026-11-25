import { captureOwnerPdfScope, loadOwnerFacsimileDataUrl, ownerFacsimilePrintMarkup, waitForOwnerFacsimileImage } from "./ownerPdfFacsimile";

export function printPlainTextDocument(options: { title: string; text: string; includeOwnerFacsimile?: boolean }): boolean {
  // Abra durante o gesto original; buscar a imagem antes causaria bloqueio do pop-up.
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.opener = null;
  const assertSameScope = captureOwnerPdfScope();

  void (async () => {
    const document = printWindow.document;
    try {
      const image = options.includeOwnerFacsimile === false ? null : await loadOwnerFacsimileDataUrl();
      assertSameScope();
      if (printWindow.closed) return;
      document.open();
      document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
        @page { margin: 1.7cm; size: A4; }
        body { margin: 0; color: #172033; font: 11pt/1.5 Arial, sans-serif; }
        pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
      </style></head><body><pre id="report"></pre>${ownerFacsimilePrintMarkup(image)}</body></html>`);
      document.close();
      document.title = options.title;
      const report = document.getElementById("report");
      if (report) report.textContent = options.text;
      await waitForOwnerFacsimileImage(document);
      assertSameScope();
      if (!printWindow.closed) { printWindow.focus(); printWindow.print(); }
    } catch (error) {
      if (printWindow.closed) return;
      document.open();
      document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Impressão não iniciada</title></head><body><main role="alert"></main></body></html>');
      document.close();
      const main = document.querySelector("main");
      if (main) main.textContent = error instanceof Error ? error.message : "Não foi possível preparar o PDF.";
    }
  })();
  return true;
}

/**
 * Carimbo de data para nomes de arquivo de documentos impressos/exportados
 * (AAAAMMDD-HHMM por padrão; só a data quando `withTime` é false).
 */
export function dateStamp(withTime = true): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return withTime ? `${date}-${pad(d.getHours())}${pad(d.getMinutes())}` : date;
}

/** HTML already generated inside the app (does not modify official external models). */
export function printAppHtmlWithOwnerFacsimile(popup: Window, html: string): void {
  popup.opener = null;
  const assertSameScope = captureOwnerPdfScope();
  void (async () => {
    try {
      const image = await loadOwnerFacsimileDataUrl();
      assertSameScope();
      if (popup.closed) return;
      const doc = popup.document;
      doc.open();
      doc.write(html);
      doc.close();
      if (image) doc.body.insertAdjacentHTML("beforeend", ownerFacsimilePrintMarkup(image));
      await waitForOwnerFacsimileImage(doc);
      const ordinaryImages = Array.from(doc.images).filter(image => !image.closest("[data-owner-facsimile]"));
      await Promise.race([
        Promise.all([doc.fonts?.ready, ...ordinaryImages.map(image => image.complete ? undefined : image.decode().catch(() => undefined))]),
        new Promise(resolve => setTimeout(resolve, 3500)),
      ]);
      assertSameScope();
      if (!popup.closed) { popup.focus(); popup.print(); }
    } catch (e) {
      if (!popup.closed) {
        const doc = popup.document;
        doc.open();
        doc.write('<!doctype html><meta charset="utf-8"><title>Impressão não iniciada</title><main role="alert"></main>');
        doc.close();
        const notice = doc.querySelector("main");
        if (notice) notice.textContent = e instanceof Error ? e.message : "Não foi possível preparar o PDF.";
      }
    }
  })();
}

let printPending = false;
/** Adds a temporary footer to the print layout, not to the interactive screen. */
export async function printCurrentPageWithOwnerFacsimile(selector = "main"): Promise<void> {
  if (printPending) return;
  printPending = true;
  const assertSameScope = captureOwnerPdfScope();
  let remove = () => { printPending = false; };
  try {
    const image = await loadOwnerFacsimileDataUrl();
    assertSameScope();
    if (!image) { window.print(); remove(); return; }
    const target = document.querySelector(selector);
    if (!target) throw new Error("O rodapé com a imagem manuscrita não pôde ser preparado.");
    const footer = document.createElement("div");
    footer.className = "neuroped-owner-print-footer";
    const css = document.createElement("style");
    css.textContent = "@media screen{.neuroped-owner-print-footer{display:none}} @media print{.neuroped-owner-print-footer{display:block!important;break-inside:avoid}}";
    footer.innerHTML = ownerFacsimilePrintMarkup(image);
    target.append(footer);
    document.head.append(css);
    const cleanupTimer = window.setTimeout(() => remove(), 180_000);
    remove = () => {
      window.removeEventListener("afterprint", remove);
      window.removeEventListener("pagehide", remove);
      window.clearTimeout(cleanupTimer);
      footer.remove();
      css.remove();
      printPending = false;
    };
    window.addEventListener("afterprint", remove, { once: true });
    window.addEventListener("pagehide", remove, { once: true });
    const stamp = footer.querySelector("img");
    await stamp?.decode();
    assertSameScope();
    window.print();
  } catch (error) {
    remove();
    window.alert(error instanceof Error ? error.message : "Não foi possível preparar o PDF.");
  }
}
