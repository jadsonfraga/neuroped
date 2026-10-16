// Portal da família — página estática isolada da SPA (CSP própria, sem framework).
// O token vem do fragmento da URL, é removido da barra de endereço e vive só em memória.
// Todo texto é inserido com textContent (nunca HTML interpolado).
const $ = (id) => document.getElementById(id);
const CONSENT_VERSION_FALLBACK = "";
let token = "";
let meta = null;
let reminders = [];

const hide = (el) => el && el.classList.add("hidden");
const show = (el) => el && el.classList.remove("hidden");

function readTokenFromFragment() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return params.get("token")?.trim() || "";
}
function removeTokenFromAddressBar() {
  try { window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`); }
  catch { window.location.hash = ""; }
}
function fatal(title, message) {
  hide($("loading")); hide($("consent-card")); hide($("content"));
  $("error-title").textContent = title;
  $("error-message").textContent = message;
  show($("error"));
}
async function api(method, body) {
  const response = await fetch("/api/public-family-portal", {
    method,
    headers: { Authorization: `Portal ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}
function fmtDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value || "");
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  return new Intl.DateTimeFormat("pt-BR", dateOnly
    ? { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }
    : { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).format(d);
}
function item(parent, title, text, extra) {
  const box = document.createElement("article");
  box.className = "portal-item";
  const h = document.createElement("h3"); h.textContent = title; box.appendChild(h);
  if (text) { const p = document.createElement("p"); p.className = "portal-text"; p.style.whiteSpace = "pre-wrap"; p.textContent = text; box.appendChild(p); }
  if (extra) box.appendChild(extra);
  parent.appendChild(box);
  return box;
}
function small(text) { const p = document.createElement("p"); p.className = "muted"; p.textContent = text; return p; }

function icsEscape(s) { return String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"); }
function icsStamp(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"); }
export function buildIcs(list) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NeuroPed SDG//Portal da familia//PT-BR", "CALSCALE:GREGORIAN"];
  list.forEach((r, i) => {
    if (!r.quando) return;
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(r.quando);
    const start = new Date(dateOnly ? `${r.quando}T00:00:00Z` : r.quando);
    if (Number.isNaN(start.getTime())) return;
    lines.push("BEGIN:VEVENT", `UID:portal-${i}-${start.getTime()}@neuroped`, `DTSTAMP:${icsStamp(new Date())}`);
    if (dateOnly) {
      const next = new Date(start.getTime() + 86400000);
      lines.push(`DTSTART;VALUE=DATE:${r.quando.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`);
    } else {
      lines.push(`DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(new Date(start.getTime() + 3600000))}`);
    }
    lines.push(`SUMMARY:${icsEscape(r.titulo)}`);
    if (r.texto) lines.push(`DESCRIPTION:${icsEscape(r.texto)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function render(data) {
  const c = data.content;
  $("content-clinic").textContent = data.clinicName || "";
  $("content-notice").textContent = data.supportNotice || "";
  $("content-views").textContent = `Aberturas restantes deste link: ${data.remainingViews}. Válido até ${fmtDateTime(data.expiresAt)} (Brasília). Este conteúdo não fica salvo neste aparelho.`;

  if (c.orientacoes?.length) { show($("sec-orientacoes")); c.orientacoes.forEach((o) => item($("list-orientacoes"), o.titulo, o.texto)); }
  if (c.questionarios?.length) {
    show($("sec-questionarios"));
    c.questionarios.forEach((q) => {
      const a = document.createElement("a");
      a.className = "primary-button"; a.textContent = "Responder agora"; a.rel = "noopener noreferrer";
      a.href = `/intake.html#token=${encodeURIComponent(q.token)}`;
      item($("list-questionarios"), q.titulo, "Abre o formulário seguro de pré-consulta. As respostas vão para a equipe do seu médico.", a);
    });
  }
  if (c.avaliacoesProprias?.length) {
    show($("sec-avaliacoes"));
    c.avaliacoesProprias.forEach((t) => {
      const box = item($("list-avaliacoes"), `${t.nome} · ${fmtDateTime(t.data)}`, t.comoFoiFeita);
      if (t.comoRespondeu) { const h = document.createElement("p"); h.className = "portal-text"; h.style.whiteSpace = "pre-wrap"; h.textContent = `Como a criança respondeu (descrição do médico): ${t.comoRespondeu}`; box.appendChild(h); }
    });
  }
  if (c.lembretes?.length) {
    show($("sec-lembretes"));
    reminders = c.lembretes;
    c.lembretes.forEach((r) => item($("list-lembretes"), r.titulo, r.texto, r.quando ? small(`Quando: ${fmtDateTime(r.quando)}`) : null));
    if (c.lembretes.some((r) => r.quando)) show($("ics-button"));
  }
  if (c.documentos?.length) {
    show($("sec-documentos"));
    c.documentos.forEach((d) => item($("list-documentos"), d.titulo, d.texto, small(`Emitido em ${fmtDateTime(d.emitidoEm)} · documento liberado pelo médico`)));
  }
  hide($("consent-card"));
  show($("content"));
}

async function init() {
  token = readTokenFromFragment();
  removeTokenFromAddressBar();
  if (!token) return fatal("Link incompleto.", "Abra o link exatamente como foi enviado pela clínica.");
  let res;
  try { res = await api("GET"); } catch { return fatal("Sem conexão.", "Verifique a internet e abra o link novamente."); }
  if (!res.ok) return fatal("Link indisponível.", res.payload?.error || "Peça um novo link à clínica.");
  meta = res.payload;
  hide($("loading"));
  $("clinic-name").textContent = meta.clinicName || "";
  $("support-notice").textContent = meta.supportNotice || "";
  $("consent-notice").textContent = meta.consent?.notice || "";
  $("views-info").textContent = `Este link pode ser aberto mais ${meta.remainingViews} vez(es) e vale até ${fmtDateTime(meta.expiresAt)} (Brasília). Cada abertura conta.`;
  show($("consent-card"));
}

$("open-button").addEventListener("click", async () => {
  const err = $("consent-error");
  hide(err);
  if (!$("consent").checked) { err.textContent = "Marque a autorização para abrir o conteúdo."; show(err); return; }
  $("open-button").disabled = true;
  try {
    const res = await api("POST", { consentAccepted: true, consentVersion: meta?.consent?.version || CONSENT_VERSION_FALLBACK });
    if (!res.ok) { fatal("Não foi possível abrir.", res.payload?.error || "Tente novamente ou peça um novo link."); return; }
    render(res.payload);
  } catch { err.textContent = "Sem conexão. Tente novamente."; show(err); }
  finally { $("open-button").disabled = false; }
});

$("ics-button").addEventListener("click", () => {
  const blob = new Blob([buildIcs(reminders)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "lembretes-consulta.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

void init();
