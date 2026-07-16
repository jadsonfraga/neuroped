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
  | "shared-file"
  | "shared-text"
  | "opened-whatsapp"
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
      const file = new File([text], filename, {
        type: "text/plain;charset=utf-8",
      });
      const shareData: ShareData = { title: options.title, files: [file] };
      if (
        navigator.share &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData);
        return "shared";
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      return "cancelled";
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

function shareWasCancelled(error: unknown): boolean {
  return (
    typeof DOMException !== "undefined" &&
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

function openWhatsAppUrl(text: string, phone?: string): boolean {
  const recipient = String(phone || "").replace(/\D/g, "");
  const path = recipient ? `/${recipient}` : "/";
  const url = `https://wa.me${path}?text=${encodeURIComponent(text)}`;

  try {
    const opened = window.open(url, "_blank");
    if (opened) {
      opened.opener = null;
      return true;
    }
  } catch {
    // Navegadores/WebViews podem bloquear a nova janela. A navegação direta
    // abaixo continua vinculada ao toque e preserva o encaminhamento.
  }

  try {
    window.location.assign(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compartilha no WhatsApp sem transformar o CTA em "Copiar + Baixar".
 *
 * Ordem de compatibilidade:
 * 1. arquivo .txt pela Web Share API, quando o navegador confirma suporte;
 * 2. texto integral pela Web Share API (corrige Androids que compartilham texto,
 *    mas retornam false para navigator.canShare({ files }));
 * 3. wa.me com o texto integral, sem truncamento e sem download automático.
 *
 * Quando há um telefone explícito, o wa.me é usado imediatamente para manter o
 * destinatário selecionado pelo usuário. Copiar e baixar permanecem ações
 * independentes nos respectivos botões da interface.
 */
export async function shareWhatsAppDocument(options: {
  title: string;
  text: string;
  filename?: string;
  phone?: string;
}): Promise<WhatsAppShareOutcome> {
  const text = String(options.text || "").trim();
  if (!text) return "failed";

  if (options.phone) {
    return openWhatsAppUrl(text, options.phone) ? "opened-whatsapp" : "failed";
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    if (typeof File !== "undefined" && navigator.canShare) {
      const filename = `${safeTextFilename(options.filename || options.title)}.txt`;
      const file = new File([text], filename, {
        type: "text/plain;charset=utf-8",
      });
      const fileShareData: ShareData = {
        title: options.title,
        files: [file],
      };

      try {
        if (navigator.canShare(fileShareData)) {
          await navigator.share(fileShareData);
          return "shared-file";
        }
      } catch (error) {
        if (shareWasCancelled(error)) return "cancelled";
        // Se o navegador superestimou o suporte a arquivo, tenta texto abaixo.
      }
    }

    try {
      await navigator.share({ title: options.title, text });
      return "shared-text";
    } catch (error) {
      if (shareWasCancelled(error)) return "cancelled";
      // Web Share indisponível/bloqueada: mantém o fluxo no WhatsApp abaixo.
    }
  }

  return openWhatsAppUrl(text) ? "opened-whatsapp" : "failed";
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
  await shareWhatsAppDocument({ title: "Relatório NeuroPed", text: value });
}
