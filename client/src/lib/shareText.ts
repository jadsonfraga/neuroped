export function formatForWhatsApp(title: string, body: string): string {
  const safeTitle = String(title || "Resumo").trim();
  const safeBody = String(body || "").trim();
  return `*${safeTitle}*\n\n${safeBody}`.trim();
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

export function openWhatsAppShare(text: string): void {
  const value = String(text || "").trim();
  if (!value) return;
  const url = `https://wa.me/?text=${encodeURIComponent(value)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
