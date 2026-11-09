import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Download, FileText, RefreshCw, ShieldCheck, ShieldAlert, Upload } from "lucide-react";

const API = "http://127.0.0.1:8768";
const CONSENT = "REVISEI E APROVO O TEXTO INTEGRAL";
type Mode = "preview" | "final";

function filenameSafe(value: string) {
  return value.split(/[\\/]/).pop()?.replace(/[^\p{L}\p{N}._ -]+/gu, "_").slice(0, 80) || "laudo.md";
}
function downloadPdf(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function RenderizadorPage() {
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [session, setSession] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [filename, setFilename] = useState("laudo.md");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sha, setSha] = useState("");
  const [approved, setApproved] = useState(false);

  const connect = useCallback(async () => {
    setStatus("connecting");
    try {
      const health = await fetch(API + "/health", { cache: "no-store" });
      if (!health.ok) throw new Error("offline");
      const h = await health.json() as { engine_available?: boolean };
      if (!h.engine_available) throw new Error("motor indisponível");
      const response = await fetch(API + "/session", { cache: "no-store" });
      if (!response.ok) throw new Error("sem sessão");
      const data = await response.json() as { session?: string };
      if (!data.session) throw new Error("sem sessão");
      setSession(data.session);
      setStatus("online");
      setNotice("");
      return data.session;
    } catch {
      setSession("");
      setStatus("offline");
      setNotice("Ponte local desconectada. Confira o serviço NeuroPed no Windows e tente reconectar.");
      return "";
    }
  }, []);

  useEffect(() => { void connect(); }, [connect]);

  const post = useCallback(async (route: string, payload: object) => {
    if (!session) throw new Error("Sem sessão com o Windows.");
    const response = await fetch(API + route, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-NeuroPed-Session": session },
      body: JSON.stringify(payload), cache: "no-store",
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({})) as { error?: string; detail?: string };
      throw new Error(json.error || json.detail || ("Erro HTTP " + response.status));
    }
    return response;
  }, [session]);

  const render = useCallback(async (content: string, name: string, mode: Mode) => {
    if (!content.trim()) { setNotice("Selecione ou cole um Markdown."); return; }
    if (new Blob([content]).size > 1000000) { setNotice("Markdown superior a 1 MB."); return; }
    setBusy(true);
    setNotice("Renderizando pelo motor PANT e verificando a integridade...");
    try {
      const response = await post("/render", { markdown: content, filename: name, mode });
      if (!(response.headers.get("Content-Type") || "").includes("application/pdf")) {
        throw new Error("Resposta não é um PDF.");
      }
      const pdf = await response.blob();
      if (pdf.size < 5000) throw new Error("PDF incompleto.");
      const s = response.headers.get("X-NeuroPed-Source-SHA256") || "";
      setSha(s);
      const disposition = response.headers.get("Content-Disposition") || "";
      const download = disposition.match(/filename="([^"]+)"/)?.[1] ||
        (name.replace(/\.md$/i, "") + (mode === "final" ? "_APROVADO.pdf" : "_REVISAO.pdf"));
      downloadPdf(pdf, download);
      setNotice(mode === "final"
        ? "PDF sem rascunho gerado após aceite do texto, sem assinatura automática."
        : "PDF de revisão baixado. Todas as páginas têm marca de rascunho.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no renderizador.");
    } finally {
      setBusy(false);
    }
  }, [post]);

  const importFile = useCallback(async (file: File) => {
    if (!/\.md$/i.test(file.name)) { setNotice("Selecione um arquivo .md."); return; }
    if (file.size > 1000000) { setNotice("Arquivo superior a 1 MB."); return; }
    const content = await file.text();
    setMarkdown(content);
    setFilename(filenameSafe(file.name));
    setApproved(false);
    setSha("");
    if (status === "online") await render(content, filenameSafe(file.name), "preview");
    else setNotice("Arquivo carregado. Reconecte o Windows para renderizar.");
  }, [render, status]);

  const pasteAndRender = useCallback(async () => {
    try {
      const content = await navigator.clipboard.readText();
      if (!content.trim()) throw new Error("Área de transferência vazia.");
      setMarkdown(content);
      setFilename("laudo_chatgpt.md");
      setApproved(false);
      setSha("");
      await render(content, "laudo_chatgpt.md", "preview");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha ao colar Markdown.");
    }
  }, [render]);

  const approveAndRender = useCallback(async () => {
    if (!approved || !markdown.trim()) return;
    if (!window.confirm("Confirma a revisão integral do texto clínico e autoriza o PDF sem assinatura?")) return;
    setBusy(true);
    setNotice("Registrando o aceite médico vinculado ao conteúdo...");
    try {
      const response = await post("/approve", { markdown, confirmation: CONSENT });
      const result = await response.json() as { sha256?: string };
      if (!result.sha256) throw new Error("Aceite não registrado.");
      setSha(result.sha256);
      setBusy(false);
      await render(markdown, filename, "final");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Falha no aceite.");
      setBusy(false);
    }
  }, [approved, markdown, filename, post, render]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8" data-testid="renderizador-pant">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Renderizador de Laudos</h1>
        <p className="text-muted-foreground">
          Markdown do ChatGPT → motor PANT no Windows → PDF verificado. O texto clínico
          não é enviado à nuvem por este renderizador.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span className={status === "online" ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-amber-700"}>
            {status === "online" ? "Windows conectado" : status === "connecting" ? "Conectando..." : "Ponte desconectada"}
          </span>
          <Button variant="outline" size="sm" onClick={() => { void connect(); }} disabled={busy}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reconectar
          </Button>
        </div>
      </div>

      <Card><CardContent className="space-y-4 pt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Upload className="h-5 w-5" /> Importar Markdown</h2>
        <div className="rounded-xl border-2 border-dashed p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void importFile(f); }}>
          <Input type="file" accept=".md,text/markdown" className="mx-auto max-w-sm"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void importFile(f); e.target.value = ""; }} />
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione ou arraste um .md: o PDF de revisão é gerado e baixado automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { void pasteAndRender(); }}
            disabled={busy || status !== "online"}>
            <FileText className="mr-2 h-4 w-4" /> Colar do ChatGPT e renderizar
          </Button>
          <Button onClick={() => { void render(markdown, filename, "preview"); }}
            disabled={busy || status !== "online" || !markdown.trim()}>
            <Download className="mr-2 h-4 w-4" /> Gerar PDF de revisão
          </Button>
        </div>
        <label htmlFor="renderizador-filename" className="text-sm font-medium">Arquivo de origem</label>
        <Input id="renderizador-filename" value={filename} onChange={(e) => setFilename(filenameSafe(e.target.value))} />
        <label htmlFor="renderizador-markdown" className="text-sm font-medium">Laudo Markdown</label>
        <Textarea id="renderizador-markdown" rows={15} spellCheck={false} value={markdown}
          data-testid="renderizador-texto"
          onChange={(e) => { setMarkdown(e.target.value); setApproved(false); setSha(""); }} />
        <p className="text-xs text-muted-foreground">O Markdown fica apenas na memória da página, não no armazenamento do navegador.</p>
      </CardContent></Card>

      <Card><CardContent className="space-y-4 pt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldCheck className="h-5 w-5" /> PDF definitivo</h2>
        <p className="text-sm text-muted-foreground">
          Sem marca de rascunho somente após revisão e aceite explícitos do texto integral.
          O aceite é vinculado ao SHA-256; qualquer alteração invalida a autorização.
          Nenhuma assinatura é inserida automaticamente.
        </p>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-4 w-4" checked={approved}
            onChange={(e) => setApproved(e.target.checked)} />
          Confirmo que revisei o texto integral e autorizo a emissão sem assinatura.
        </label>
        <Button onClick={() => { void approveAndRender(); }}
          disabled={busy || !approved || !markdown.trim() || status !== "online"}>
          <ShieldCheck className="mr-2 h-4 w-4" /> Registrar aceite e gerar PDF
        </Button>
        {sha && <p className="break-all font-mono text-xs text-muted-foreground">SHA-256: {sha}</p>}
      </CardContent></Card>

      {notice && <div role="status" className="flex gap-2 rounded-lg border p-4 text-sm">
        <ShieldAlert className="h-5 w-5 shrink-0" /><span>{notice}</span></div>}
      <p className="text-xs text-muted-foreground">
        O retorno direto como anexo na conversa do ChatGPT depende de uma integração conectada
        capaz de transferir arquivos. O aplicativo não intercepta todas as conversas do ChatGPT.
      </p>
    </div>
  );
}
