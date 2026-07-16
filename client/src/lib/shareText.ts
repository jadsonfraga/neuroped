export function formatForWhatsApp(title: string, body: string): string {
  const safeTitle = String(title || "Resumo").trim();
  const safeBody = String(body || "").trim();
  return `*${safeTitle}*\n\n${safeBody}`.trim();
}

export type ShareTextOutcome = "shared" | "copied-and-downloaded" | "downloaded" | "cancelled" | "failed";
export type EmailDraftOutcome = "inline" | "copied-and-downloaded" | "downloaded";

export function safeTextFilename(value: string, fallback = "neuroped-relatorio"): string {
  const normalized = String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || fallback;
}

export function downloadTextDocument(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

/** Compartilha o relatório como arquivo, sem colocar conteúdo clínico na URL. */
export async function shareTextDocument(options: {
  title: string;
  text: string;
  filename?: string;
}): Promise<ShareTextOutcome> {
  const text = String(options.text || "").trim();
  if (!text) return "failed";

  try {
    if (typeof File !== "undefined") {
      const filename = `${safeTextFilename(options.filename || options.title)}.txt`;
      const file = new File([text], filename, { type: "text/plain;charset=utf-8" });
      const shareData: ShareData = { title: options.title, files: [file] };
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        return "shared";
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    // Compartilhamento de arquivo indisponível: usa fallback local abaixo.
  }

  const filename = `${safeTextFilename(options.filename || options.title)}.txt`;
  const copied = await copyText(text);
  try {
    downloadTextDocument(text, filename);
    return copied ? "copied-and-downloaded" : "downloaded";
  } catch {
    return copied ? "copied-and-downloaded" : "failed";
  }
}

export async function copyText(text: string): Promise<boolean> {
  const value = String(text || "").trim();
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fallback abaixo
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Abre o cliente de email sem depender de um endpoint de envio. Conteúdo longo
 * nunca é truncado: fica em um .txt local e, quando possível, no clipboard.
 * "Preparado" não significa "enviado" — o usuário ainda confirma no cliente.
 */
export async function openEmailDraft(options: {
  to: string;
  subject: string;
  body: string;
  filename?: string;
}): Promise<EmailDraftOutcome> {
  const body = String(options.body || "").trim();
  const encodedBody = encodeURIComponent(body);
  let emailBody = body;
  let outcome: EmailDraftOutcome = "inline";

  if (encodedBody.length > 1_800) {
    const copied = await copyText(body);
    downloadTextDocument(
      body,
      `${safeTextFilename(options.filename || options.subject)}.txt`,
    );
    emailBody = copied
      ? "O conteúdo integral foi copiado e baixado como arquivo .txt. Anexe o arquivo ou cole o conteúdo neste email."
      : "O conteúdo integral foi baixado como arquivo .txt. Anexe o arquivo neste email.";
    outcome = copied ? "copied-and-downloaded" : "downloaded";
  }

  window.location.href =
    `mailto:${options.to}?subject=${encodeURIComponent(options.subject)}` +
    `&body=${encodeURIComponent(emailBody)}`;
  return outcome;
}

export async function openWhatsAppShare(text: string): Promise<void> {
  const value = String(text || "").trim();
  if (!value) return;
  // Relatórios longos em wa.me podem ser truncados pelo navegador/app. Nesses
  // casos compartilha um arquivo íntegro e deixa o usuário escolher WhatsApp.
  if (encodeURIComponent(value).length > 1_800) {
    await shareTextDocument({ title: "Relatório NeuroPed", text: value });
    return;
  }
  const url = `https://wa.me/?text=${encodeURIComponent(value)}`;
  const opened = window.open(url, "_blank");
  if (opened) opened.opener = null;
}
