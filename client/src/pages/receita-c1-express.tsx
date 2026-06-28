import { useState, useEffect } from "react";
import {
  Pill,
  FileSignature,
  Printer,
  Download,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* ──────────────────────────────────────────────────────────────
   Receita C1 Express — Receita de Controle Especial
   Certificado acoplado: preencha a receita + insira apenas a senha
──────────────────────────────────────────────────────────────── */

// ── IndexedDB: cache do certificado (bytes) sem senha ───────────
const DB_NAME = "neuroped-icp";
const DB_STORE = "cert";
const DB_KEY = "saved";

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadCachedP12(): Promise<ArrayBuffer | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const req = tx.objectStore(DB_STORE).get(DB_KEY);
      req.onsuccess = () => resolve(req.result?.p12 ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

async function saveP12ToCache(p12: ArrayBuffer): Promise<void> {
  try {
    const db = await openDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readwrite");
      const getReq = tx.objectStore(DB_STORE).get(DB_KEY);
      getReq.onsuccess = () => {
        tx.objectStore(DB_STORE).put({ p12, senha: getReq.result?.senha ?? "" }, DB_KEY);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* best-effort */ }
}

// ── Helpers ──────────────────────────────────────────────────────
function todayBr(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function dateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function escHtml(v: string) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── PDF assinável (texto estruturado) ────────────────────────────
async function buildC1PdfBytes(f: FormFields): Promise<Uint8Array> {
  const { buildDocumentPdf } = await import("@/lib/documentPdf");
  const data = todayBr();
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");

  return buildDocumentPdf({
    title: "RECEITA DE CONTROLE ESPECIAL — C1",
    subtitle: "Via para farmácia · Validade: 30 dias",
    credentials: [
      "Dr. Jadson Fraga Araújo Júnior  CRM-PE 25.227  RQE 17.756",
      "Neurologista Infantil / Neuropediatra",
      "Av. Cardoso de Sá, 445 — Petrolina/PE  CEP 56304-100  (87) 99999-0000",
    ],
    sections: [
      {
        heading: "Dados do Paciente",
        body: [
          `Nome: ${f.paciente || "—"}`,
          `Data de nascimento: ${f.dataNasc || "—"}`,
          `Endereço: ${f.endereco || "—"}`,
          `Município/UF: ${f.municipio || "—"}  CEP: ${f.cep || "—"}`,
        ].join("\n"),
      },
      {
        heading: "Prescrição",
        body: [
          `Rp./ ${f.medicamento || "—"}`,
          f.concentracao ? `Concentração: ${f.concentracao}` : "",
          f.forma ? `Forma farmacêutica: ${f.forma}` : "",
          `Quantidade: ${f.quantidade || "—"}${f.quantidadeExtenso ? ` (${f.quantidadeExtenso})` : ""}`,
          `\nPosologia / Instrução de uso:\n${f.instrucoes || "—"}`,
        ].filter(Boolean).join("\n"),
      },
      {
        heading: "Validade e Assinatura",
        body: [
          `Petrolina/PE, ${data}`,
          `Validade da receita: ${valBr}`,
          f.cid ? `CID-10: ${f.cid}` : "",
          "\n_________________________________",
          "Dr. Jadson Fraga Araújo Júnior",
          "CRM-PE 25.227 | RQE 17.756",
          "Assinatura digital ICP-Brasil PAdES-BES",
        ].filter(Boolean).join("\n"),
      },
    ],
    footer:
      "Receita de Controle Especial (C1) — 1ª Via. " +
      "Assinatura digital ICP-Brasil em padrão PAdES-BES, verificável em iti.br/repositorio. " +
      `Emitida em ${data}. Validade: 30 dias.`,
  });
}

// ── HTML de impressão (2 vias em A5) ─────────────────────────────
function buildC1PrintHtml(f: FormFields): string {
  const hoje = todayBr();
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");

  const via = (numero: "1ª" | "2ª", destino: string) => `
<div class="via">
  <div class="head">
    <div class="bk">
      <div class="logo-nm">NeuroPed EDJ</div>
      <div class="logo-sub">Neuropediatria · Neurodesenvolvimento</div>
    </div>
    <div class="rt">
      <div class="via-tag">${numero} VIA — ${destino}</div>
      <div class="c1-tag">RECEITA DE CONTROLE ESPECIAL</div>
    </div>
  </div>

  <div class="medico-box">
    <strong>Dr. Jadson Fraga Araújo Júnior</strong> — CRM-PE 25.227 | RQE 17.756<br>
    Neurologista Infantil / Neuropediatra<br>
    Av. Cardoso de Sá, 445 — Centro, Petrolina/PE — CEP 56304-100 — (87) 99999-0000
  </div>

  <table class="dados">
    <tr>
      <td class="lbl">Paciente</td>
      <td class="val">${escHtml(f.paciente)}</td>
      <td class="lbl" style="width:26%">Data nasc.</td>
      <td class="val" style="width:18%">${escHtml(f.dataNasc)}</td>
    </tr>
    <tr>
      <td class="lbl">Endereço</td>
      <td class="val" colspan="3">${escHtml(f.endereco)}</td>
    </tr>
    <tr>
      <td class="lbl">Município/UF</td>
      <td class="val">${escHtml(f.municipio)}</td>
      <td class="lbl">CEP</td>
      <td class="val">${escHtml(f.cep)}</td>
    </tr>
  </table>

  <div class="rx-area">
    <div class="rx-sym">℞</div>
    <div class="rx-body">
      <div class="med-nm">${escHtml(f.medicamento)}${f.concentracao ? ` — ${escHtml(f.concentracao)}` : ""}</div>
      ${f.forma ? `<div class="med-sub">${escHtml(f.forma)}</div>` : ""}
      <div class="med-qtd">Quantidade: <strong>${escHtml(f.quantidade)}</strong>${f.quantidadeExtenso ? ` (${escHtml(f.quantidadeExtenso)})` : ""}</div>
      <div class="med-uso"><em>Instruções:</em> ${escHtml(f.instrucoes)}</div>
    </div>
  </div>

  <div class="footer-row">
    <div>Petrolina/PE, ${hoje} &nbsp;·&nbsp; Validade: <strong>${valBr}</strong>${f.cid ? ` &nbsp;·&nbsp; CID-10: ${escHtml(f.cid)}` : ""}</div>
    <div class="sig-area">
      <div class="sig-line"></div>
      <div class="sig-nm">Dr. Jadson Fraga Araújo Júnior</div>
      <div class="sig-info">CRM-PE 25.227 · RQE 17.756</div>
      <div class="sig-digital">Assinatura digital ICP-Brasil PAdES-BES</div>
    </div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Receita C1 — Dr. Jadson — ${dateStamp()}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
@page{size:A5 portrait;margin:8mm 10mm 10mm 10mm}
:root{--navy:#1E2A4A;--navyd:#101A2D;--bordo:#7A1F2B;--gold:#C9A961;--teal:#2E7163;
  --ivory:#FBF8F0;--ink:#5B5B6B;--graf:#2C2C3E;--line:#D9D2C2}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;font-family:'Carlito',Arial,sans-serif;font-size:9pt;color:var(--graf)}

.via{page-break-after:always;min-height:97vh;display:flex;flex-direction:column;gap:3mm}
.via:last-child{page-break-after:auto}

.head{padding:3mm 4mm;background:linear-gradient(135deg,#101A2D 0%,#1E2A4A 50%,#7A1F2B 100%);
  color:#fff;display:flex;align-items:center;justify-content:space-between;
  border-radius:1.5mm;box-shadow:inset 0 -0.8mm 0 rgba(201,169,97,.5)}
.logo-nm{font-family:'Cormorant Garamond',Georgia,serif;font-size:13pt;font-weight:700;letter-spacing:.05em}
.logo-sub{font-size:6pt;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-top:.5mm}
.rt{text-align:right}
.via-tag{font-size:6pt;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.c1-tag{font-family:'Cormorant Garamond',Georgia,serif;font-size:10pt;font-weight:700;letter-spacing:.04em}

.medico-box{background:#f7f5ef;border-left:2mm solid var(--gold);padding:1.5mm 3mm;
  font-size:7.5pt;line-height:1.5;color:var(--graf)}

table.dados{width:100%;border-collapse:collapse;font-size:8pt}
.dados td{border:0.35pt solid #bbb;padding:1.2mm 2mm;vertical-align:top}
.dados .lbl{background:#f4f2ec;font-size:6.5pt;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ink);white-space:nowrap;width:16%}
.dados .val{font-weight:600}

.rx-area{display:flex;gap:3mm;flex:1;border:0.5pt solid #c8c0b0;border-radius:1mm;padding:2.5mm 3mm}
.rx-sym{font-size:32pt;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;
  color:var(--navyd);line-height:1;padding-top:1mm;flex-shrink:0}
.rx-body{flex:1;display:flex;flex-direction:column;gap:1.5mm}
.med-nm{font-size:11pt;font-weight:700;font-family:'Cormorant Garamond',Georgia,serif;color:var(--navyd)}
.med-sub{font-size:8pt;color:var(--ink)}
.med-qtd{font-size:9pt;border-top:.35pt dashed var(--line);padding-top:1.5mm;margin-top:1mm}
.med-uso{font-size:8.5pt;color:var(--graf);white-space:pre-wrap;line-height:1.55}

.footer-row{display:flex;align-items:flex-end;justify-content:space-between;
  border-top:.5pt solid var(--line);padding-top:2mm;font-size:7.5pt;color:var(--ink);flex-wrap:wrap;gap:2mm}
.sig-area{text-align:center}
.sig-line{width:48mm;border-top:.6pt solid #333;margin:0 auto 1mm}
.sig-nm{font-size:8pt;font-weight:700;font-family:'Cormorant Garamond',Georgia,serif}
.sig-info{font-size:6.5pt;color:var(--ink)}
.sig-digital{font-size:6pt;color:#888;font-style:italic}

@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .via{min-height:auto}}
</style>
</head>
<body>
${via("1ª", "FARMÁCIA")}
${via("2ª", "PACIENTE")}
</body>
</html>`;
}

// ── Tipos ─────────────────────────────────────────────────────────
interface FormFields {
  paciente: string;
  dataNasc: string;
  endereco: string;
  municipio: string;
  cep: string;
  medicamento: string;
  concentracao: string;
  forma: string;
  quantidade: string;
  quantidadeExtenso: string;
  instrucoes: string;
  cid: string;
}

const EMPTY_FORM: FormFields = {
  paciente: "", dataNasc: "", endereco: "", municipio: "", cep: "",
  medicamento: "", concentracao: "", forma: "", quantidade: "", quantidadeExtenso: "",
  instrucoes: "", cid: "",
};

type CertStatus = "loading" | "ready" | "missing";

// ── Componente principal ──────────────────────────────────────────
export default function ReceitaC1ExpressPage() {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const [certStatus, setCertStatus] = useState<CertStatus>("loading");
  const [certInfo, setCertInfo] = useState<{ commonName: string; notAfter: Date } | null>(null);
  const [p12, setP12] = useState<ArrayBuffer | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const [busy, setBusy] = useState<"" | "sign" | "plain" | "verify">("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ── Carrega certificado automaticamente ───────────────────────
  useEffect(() => {
    (async () => {
      // 1. IndexedDB
      const cached = await loadCachedP12();
      if (cached) {
        setP12(cached);
        setCertStatus("ready");
        return;
      }
      // 2. Backend /api/cert
      try {
        const { authFetch } = await import("@/lib/authClient");
        const r = await authFetch("/api/cert");
        if (!r.ok) { setCertStatus("missing"); return; }
        const { cert: b64 } = await r.json();
        if (!b64) { setCertStatus("missing"); return; }
        const bin = atob(b64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const ab = buf.buffer;
        await saveP12ToCache(ab);
        setP12(ab);
        setCertStatus("ready");
      } catch {
        setCertStatus("missing");
      }
    })();
  }, []);

  // ── Verifica info do certificado quando p12 + senha disponíveis ─
  async function verificarCert() {
    if (!p12 || !senha) return;
    setBusy("verify");
    setError(""); setOk("");
    try {
      const { readP12Info } = await import("@/lib/icpSign");
      const info = readP12Info(p12, senha);
      setCertInfo({ commonName: info.commonName, notAfter: info.notAfter });
      setOk(`Certificado válido até ${info.notAfter.toLocaleDateString("pt-BR")}.`);
    } catch {
      setError("Senha incorreta ou certificado inválido.");
      setCertInfo(null);
    } finally { setBusy(""); }
  }

  // ── Upload manual do .p12 (fallback) ─────────────────────────
  async function onUploadP12(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ab = await f.arrayBuffer();
    await saveP12ToCache(ab);
    setP12(ab);
    setCertStatus("ready");
    setShowUpload(false);
    setOk("Certificado carregado e salvo neste dispositivo.");
  }

  // ── Gerar PDF + assinar ───────────────────────────────────────
  async function gerarEAssinar() {
    if (!p12) { setError("Certificado não disponível."); return; }
    if (!senha) { setError("Informe a senha do certificado."); return; }
    if (!form.paciente || !form.medicamento || !form.instrucoes) {
      setError("Preencha pelo menos: paciente, medicamento e instruções de uso.");
      return;
    }
    setError(""); setOk(""); setBusy("sign");
    try {
      const pdfBytes = await buildC1PdfBytes(form);
      const { signPdfWithP12, downloadBytes } = await import("@/lib/icpSign");
      const signed = await signPdfWithP12(pdfBytes, p12, senha, {
        reason: "Receita de Controle Especial C1",
        name: "Dr. Jadson Fraga Araujo Junior",
        location: "Petrolina-PE",
      });
      downloadBytes(signed, `receita-c1-${dateStamp()}-assinada.pdf`);
      setOk("Receita assinada e baixada com sucesso.");
    } catch {
      setError("Senha incorreta ou falha na assinatura. Verifique a senha e tente novamente.");
    } finally { setBusy(""); }
  }

  // ── Imprimir 2 vias ───────────────────────────────────────────
  function imprimirDuasVias() {
    if (!form.paciente || !form.medicamento) {
      setError("Preencha pelo menos o nome do paciente e o medicamento antes de imprimir.");
      return;
    }
    setError("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildC1PrintHtml(form));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  // ── Baixar PDF sem assinatura ─────────────────────────────────
  async function baixarSemAssinar() {
    if (!form.paciente || !form.medicamento) {
      setError("Preencha pelo menos o nome do paciente e o medicamento.");
      return;
    }
    setError(""); setOk(""); setBusy("plain");
    try {
      const bytes = await buildC1PdfBytes(form);
      const { downloadBytes } = await import("@/lib/icpSign");
      downloadBytes(bytes, `receita-c1-${dateStamp()}.pdf`);
      setOk("PDF gerado (sem assinatura digital).");
    } catch {
      setError("Falha ao gerar o PDF.");
    } finally { setBusy(""); }
  }

  const set = (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-5 pb-10 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit gap-1.5">
          <Pill className="h-3 w-3" /> Receita C1
        </Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Emissão Rápida — Receita C1
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Preencha os dados da prescrição e informe a senha do certificado digital.
          O certificado ICP-Brasil é carregado automaticamente — nenhum arquivo precisa ser selecionado.
        </p>
      </section>

      {/* ── Certificado + Senha ─────────────────────────────────── */}
      <section
        className="rounded-3xl border-2 p-5 sm:p-6"
        style={{
          borderColor: certStatus === "ready" ? "hsl(var(--chart-2) / 0.5)" : "hsl(var(--chart-4) / 0.4)",
          background: certStatus === "ready"
            ? "linear-gradient(135deg, hsl(var(--chart-2) / 0.06), hsl(var(--chart-1) / 0.04))"
            : "linear-gradient(135deg, hsl(var(--chart-4) / 0.07), hsl(var(--chart-5) / 0.04))",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5" style={{ color: certStatus === "ready" ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))" }} />
          <h2 className="text-base font-bold" style={{ color: certStatus === "ready" ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))" }}>
            Certificado Digital ICP-Brasil
          </h2>
        </div>

        {/* Status do certificado */}
        {certStatus === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando certificado…
          </div>
        )}
        {certStatus === "ready" && (
          <div className="mb-4 rounded-xl border border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/30 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>
                Certificado carregado automaticamente
                {certInfo && ` · válido até ${certInfo.notAfter.toLocaleDateString("pt-BR")}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0"
            >
              Trocar
            </button>
          </div>
        )}
        {certStatus === "missing" && (
          <div className="mb-4 rounded-xl border border-amber-300/70 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Certificado não configurado no servidor. Selecione o arquivo .p12 manualmente.
            </div>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="text-xs font-semibold underline flex-shrink-0"
            >
              Selecionar
            </button>
          </div>
        )}

        {/* Upload manual (fallback) */}
        {(showUpload || certStatus === "missing") && (
          <div className="mb-4 rounded-xl border border-border bg-background/50 p-3 space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Selecionar certificado .p12 / .pfx
            </Label>
            <Input
              type="file"
              accept=".p12,.pfx"
              onChange={onUploadP12}
              className="text-xs"
            />
          </div>
        )}

        {/* Senha */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="senha-cert" className="text-xs font-semibold text-muted-foreground">
              Senha do certificado *
            </Label>
            <div className="relative mt-1">
              <Input
                id="senha-cert"
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha do .pfx"
                className="pr-9"
                onKeyDown={(e) => e.key === "Enter" && verificarCert()}
              />
              <button
                type="button"
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={verificarCert}
              disabled={!!busy || !p12 || !senha}
              className="gap-1.5 w-full sm:w-auto"
            >
              {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verificar
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}
        {ok && (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> {ok}
          </p>
        )}
      </section>

      {/* ── Dados do Paciente ────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Dados do Paciente</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Nome completo *</Label>
            <Input
              value={form.paciente}
              onChange={set("paciente")}
              placeholder="Nome do paciente"
              className="mt-1"
              data-testid="input-paciente"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Data de nascimento</Label>
            <Input
              type="date"
              value={form.dataNasc}
              onChange={set("dataNasc")}
              className="mt-1 w-full sm:w-40"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground">Endereço</Label>
          <Input
            value={form.endereco}
            onChange={set("endereco")}
            placeholder="Rua, número, bairro"
            className="mt-1"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Município / UF</Label>
            <Input
              value={form.municipio}
              onChange={set("municipio")}
              placeholder="Petrolina / PE"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">CEP</Label>
            <Input
              value={form.cep}
              onChange={set("cep")}
              placeholder="00000-000"
              className="mt-1 w-full sm:w-32"
              maxLength={9}
            />
          </div>
        </div>
      </section>

      {/* ── Prescrição ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Prescrição</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground">Medicamento *</Label>
            <Input
              value={form.medicamento}
              onChange={set("medicamento")}
              placeholder="Nome do medicamento"
              className="mt-1"
              data-testid="input-medicamento"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Concentração</Label>
            <Input
              value={form.concentracao}
              onChange={set("concentracao")}
              placeholder="ex.: 10 mg/mL"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Forma farmacêutica</Label>
            <Input
              value={form.forma}
              onChange={set("forma")}
              placeholder="ex.: solução oral"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Quantidade</Label>
            <Input
              value={form.quantidade}
              onChange={set("quantidade")}
              placeholder="ex.: 2 frascos"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Quantidade (por extenso)</Label>
            <Input
              value={form.quantidadeExtenso}
              onChange={set("quantidadeExtenso")}
              placeholder="ex.: dois frascos"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground">
            Instruções de uso / Posologia *
          </Label>
          <Textarea
            value={form.instrucoes}
            onChange={set("instrucoes")}
            placeholder="ex.: Tomar 5 mL (5 mg) à noite, por via oral. Usar sem interrupção."
            className="mt-1 min-h-[90px] text-sm"
            data-testid="textarea-instrucoes"
          />
        </div>

        <div className="w-40">
          <Label className="text-xs font-semibold text-muted-foreground">CID-10 (opcional)</Label>
          <Input
            value={form.cid}
            onChange={set("cid")}
            placeholder="ex.: F90.0"
            className="mt-1"
            maxLength={10}
          />
        </div>
      </section>

      {/* ── Ações ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4">
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={gerarEAssinar}
            disabled={!!busy || !p12 || !senha}
            size="default"
            className="gap-2 font-semibold"
          >
            {busy === "sign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            Assinar e baixar C1
          </Button>
          <Button
            onClick={imprimirDuasVias}
            variant="outline"
            size="default"
            className="gap-2"
          >
            <Printer className="h-4 w-4" /> Imprimir 2 vias
          </Button>
          <Button
            onClick={baixarSemAssinar}
            disabled={!!busy}
            variant="ghost"
            size="default"
            className="gap-2"
          >
            {busy === "plain" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF sem assinatura
          </Button>
          <Button
            onClick={() => setShowPreview((v) => !v)}
            variant="ghost"
            size="default"
            className="gap-2"
          >
            <Eye className="h-4 w-4" /> {showPreview ? "Fechar prévia" : "Prévia visual"}
          </Button>
          <Button
            onClick={() => { setForm(EMPTY_FORM); setError(""); setOk(""); }}
            variant="ghost"
            size="default"
            className="gap-2 ml-auto"
          >
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          A chave privada do certificado opera exclusivamente neste dispositivo — nenhum dado é enviado ao servidor.
          Assinatura no padrão PAdES-BES com certificado A1 ICP-Brasil. Validade da receita: <strong>30 dias</strong>.
        </p>
      </section>

      {/* ── Prévia ───────────────────────────────────────────────── */}
      {showPreview && (
        <section className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização (1ª via)</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            srcDoc={buildC1PrintHtml(form)}
            className="w-full"
            style={{ height: 640, border: "none" }}
            title="Prévia Receita C1"
          />
        </section>
      )}
    </div>
  );
}
