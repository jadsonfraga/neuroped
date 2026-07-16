export function formatForWhatsApp(title: string, body: string): string {
  const safeTitle = String(title || "Resumo").trim();
  const safeBody = String(body || "").trim();
  return `*${safeTitle}*\n\n${safeBody}`.trim();
}

export type ShareTextOutcome =
  | "shared"
  | "copied-and-downloaded"
  | "downloaded"
  | "cancelled"
  | "failed";
export type EmailDraftOutcome =
  | "inline"
  | "copied-and-downloaded"
  | "downloaded";
export type WhatsAppShareOutcome =
  | "shared"
  | "opened"
  | "navigated"
  | "cancelled"
  | "failed";

export function safeTextFilename(
  value: string,
  fallback = "neuroped-relatorio",
): string {
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

/** Compartilha o relatório como arquivo ou texto nativo, sem truncar conteúdo. */
export async function shareTextDocument(options: {
  title: string;
  text: string;
  filename?: string;
}): Promise<ShareTextOutcome> {
  const text = String(options.text || "").trim();
  if (!text) return "failed";

  try {
    if (navigator.share) {
      // O compartilhamento de arquivo não é uniforme entre Safari, PWA e
      // navegadores desktop. Só usa `files` quando o navegador confirma essa
      // capacidade; caso contrário, abre a folha nativa com o texto integral.
      if (typeof File !== "undefined") {
        const filename = `${safeTextFilename(options.filename || options.title)}.txt`;
        const file = new File([text], filename, { type: "text/plain" });
        const shareData: ShareData = { title: options.title, files: [file] };
        if (navigator.canShare?.(shareData) === true) {
          await navigator.share(shareData);
          return "shared";
        }
      }

      await navigator.share({ title: options.title, text });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      return "cancelled";
    // Compartilhamento nativo indisponível: usa fallback local abaixo.
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

export function buildWhatsAppShareUrl(
  text: string,
  phone?: string,
): string | null {
  const value = String(text || "").trim();
  if (!value) return null;
  const digits = String(phone || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(value)}`;
}

/**
 * Abre o WhatsApp diretamente, sem clipboard e sem o antigo corte de 1.800
 * caracteres. Se a nova aba for bloqueada, navega a aba atual — isso preserva
 * o gesto do usuário em Safari/iOS/PWA e evita o falso estado de envio.
 */
export function openWhatsAppShare(
  text: string,
  phone?: string,
): Exclude<WhatsAppShareOutcome, "shared" | "cancelled"> {
  const url = buildWhatsAppShareUrl(text, phone);
  if (!url) return "failed";

  try {
    const opened = window.open(url, "_blank");
    if (opened) {
      opened.opener = null;
      return "opened";
    }
  } catch {
    // Alguns WebViews bloqueiam `window.open`; navegação direta abaixo.
  }

  try {
    window.location.assign(url);
    return "navigated";
  } catch {
    return "failed";
  }
}

/**
 * Fluxo específico para escalas: nunca transforma silenciosamente o botão de
 * WhatsApp em "copiar". Com telefone, abre a conversa diretamente. Sem
 * telefone, prefere o compartilhamento nativo de arquivo/texto e deixa o
 * usuário escolher WhatsApp e destinatário; sem Web Share, abre `wa.me`.
 */
export async function shareScaleViaWhatsApp(options: {
  title: string;
  text: string;
  filename?: string;
  phone?: string;
}): Promise<WhatsAppShareOutcome> {
  const text = String(options.text || "").trim();
  if (!text) return "failed";

  // Executa antes de qualquer `await`, mantendo a ativação transitória do
  // clique para Safari/PWA e preservando o número informado.
  if (options.phone) return openWhatsAppShare(text, options.phone);

  try {
    if (navigator.share) {
      if (typeof File !== "undefined") {
        const filename = `${safeTextFilename(options.filename || options.title)}.txt`;
        const file = new File([text], filename, { type: "text/plain" });
        const fileShare: ShareData = { title: options.title, files: [file] };
        if (navigator.canShare?.(fileShare) === true) {
          await navigator.share(fileShare);
          return "shared";
        }
      }

      await navigator.share({ title: options.title, text });
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return "cancelled";
    }
    // Uma falha de Web Share ainda pode navegar diretamente para o WhatsApp.
  }

  return openWhatsAppShare(text);
}
