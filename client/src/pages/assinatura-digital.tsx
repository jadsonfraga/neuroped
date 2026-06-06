import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSignature, Hash, Copy, Download, ShieldCheck, FileUp, Trash2,
  AlertTriangle, KeyRound, QrCode,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Assinatura Digital (registro local de documentos).
 * Portado de assinatura-digital.js (app legado). Calcula SHA-256 via SubtleCrypto,
 * gera QR de conferência e verifica o hash de um PDF/arquivo.
 *
 * NÃO substitui assinatura ICP-Brasil — é um registro local de conferência.
 */

const LS_KEY = "neuroped:assinatura:registros:v1";
const TIPOS = ["Laudo", "Relatório", "Receita/Prescrição", "Atestado", "Parecer", "Encaminhamento", "Outro"];

interface Registro {
  id: string;
  tipo: string;
  paciente: string;
  createdText: string;
  hash: string;
  chars: number;
  pin?: string;
}

const enc = (s: string) => new TextEncoder().encode(String(s || ""));
function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
async function sha256Text(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc(text)));
}
async function sha256File(file: File): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
}
function loadRegs(): Registro[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function HashBlock({ hash }: { hash: string }) {
  return (
    <code className="block break-all rounded-lg bg-muted px-3 py-2 text-[11px] font-mono leading-relaxed">
      {hash}
    </code>
  );
}

export default function AssinaturaDigitalPage() {
  const { toast } = useToast();
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [paciente, setPaciente] = useState("");
  const [pin, setPin] = useState("");
  const [texto, setTexto] = useState("");
  const [gerado, setGerado] = useState<Registro | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [regs, setRegs] = useState<Registro[]>(() => loadRegs());

  // Verificação de arquivo
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [fileKB, setFileKB] = useState(0);
  const [expected, setExpected] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(regs.slice(0, 80)));
    } catch {}
  }, [regs]);

  // Gera QR sempre que houver um registro gerado
  useEffect(() => {
    if (!gerado) {
      setQrUrl("");
      return;
    }
    const payload = [
      "NEUROPED — Conferência de documento",
      "Tipo: " + gerado.tipo,
      "Paciente/controle: " + gerado.paciente,
      "Data: " + gerado.createdText,
      "SHA-256: " + gerado.hash,
    ].join("\n");
    QRCode.toDataURL(payload, { width: 220, margin: 1, errorCorrectionLevel: "M" })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [gerado]);

  function nowBR() {
    return new Date().toLocaleString("pt-BR");
  }

  async function gerarRegistro() {
    if (!texto.trim()) {
      toast({ title: "Cole ou digite o texto do documento antes de gerar o hash", variant: "destructive" });
      return;
    }
    const pac = paciente.trim() || "sem identificação";
    const base = [
      "NEUROPED — REGISTRO DE DOCUMENTO",
      "Tipo: " + tipo,
      "Paciente/controle: " + pac,
      pin.trim() ? "PIN/código: " + pin.trim() : "",
      "Data/hora: " + nowBR(),
      "",
      "CONTEÚDO",
      "",
      texto,
    ].join("\n");
    const hash = await sha256Text(base);
    const item: Registro = {
      id: "doc_" + Date.now(),
      tipo,
      paciente: pac,
      createdText: nowBR(),
      hash,
      chars: base.length,
      pin: pin.trim() || undefined,
    };
    setGerado(item);
    setRegs((prev) => [item, ...prev].slice(0, 80));
    toast({ title: "Registro gerado" });
  }

  function copiarHash(hash: string) {
    navigator.clipboard.writeText(hash).then(() => toast({ title: "Hash copiado" }));
  }

  function baixarRegistro(r: Registro) {
    const txt = [
      "REGISTRO LOCAL DE DOCUMENTO — NEUROPED",
      "Tipo: " + r.tipo,
      "Paciente/controle: " + r.paciente,
      "Gerado em: " + r.createdText,
      "SHA-256: " + r.hash,
      "Caracteres no registro-base: " + r.chars,
      "",
      "Observação: registro local para conferência. Não substitui assinatura digital ICP-Brasil.",
    ].join("\n");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "registro_hash_" + r.id + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function verificarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const hash = await sha256File(file);
    setFileName(file.name);
    setFileKB(Math.round(file.size / 1024));
    setFileHash(hash);
  }

  const matchState =
    expected.trim() === ""
      ? null
      : expected.trim().toLowerCase() === fileHash.toLowerCase();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
          <FileSignature className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Assinatura Digital</h1>
          <p className="text-xs text-muted-foreground">Registro e conferência local de documentos (SHA-256)</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Este recurso calcula o <strong>hash</strong> do documento para conferência de integridade.
          A validade jurídica da assinatura deve ser conferida no assinador/verificador ICP-Brasil
          ou serviço autorizado. Todo o processamento é local — nada é enviado a servidores.
        </span>
      </div>

      {/* Gerar registro */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" /> Gerar registro de documento
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="docTipo" className="text-xs">Tipo de documento</Label>
              <select
                id="docTipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="docPaciente" className="text-xs">Paciente / controle</Label>
              <Input id="docPaciente" value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="iniciais ou código" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="docPin" className="text-xs flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> PIN / código (opcional)
              </Label>
              <Input id="docPin" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="ex.: 4827" inputMode="text" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="docTexto" className="text-xs">Texto do documento</Label>
            <Textarea
              id="docTexto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole aqui o conteúdo do laudo, relatório ou prescrição…"
              className="min-h-[140px]"
            />
          </div>
          <Button onClick={gerarRegistro}>
            <Hash className="w-4 h-4 mr-1" /> Gerar hash do documento
          </Button>

          {gerado && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> Registro gerado
              </div>
              <div className="text-xs text-muted-foreground">
                {gerado.tipo} · {gerado.paciente} · {gerado.createdText}
              </div>
              <HashBlock hash={gerado.hash} />
              <div className="flex flex-wrap items-start gap-4">
                {qrUrl && (
                  <div className="text-center">
                    <img src={qrUrl} alt="QR code de conferência" className="rounded-lg border border-border bg-white p-1" width={130} height={130} />
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3" /> QR de conferência
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => copiarHash(gerado.hash)}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar hash
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => baixarRegistro(gerado)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Baixar registro
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verificar arquivo */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <FileUp className="w-4 h-4 text-primary" /> Conferir arquivo (PDF/qualquer)
          </h2>
          <p className="text-xs text-muted-foreground">
            Selecione um arquivo para calcular seu SHA-256. Opcionalmente informe o hash esperado
            para comparar com o documento final assinado.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Arquivo</Label>
              <Button variant="outline" className="w-full justify-start" onClick={() => fileRef.current?.click()}>
                <FileUp className="w-4 h-4 mr-2" /> {fileName || "Escolher arquivo…"}
              </Button>
              <input ref={fileRef} type="file" className="hidden" onChange={verificarArquivo} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedHash" className="text-xs">Hash esperado (opcional)</Label>
              <Input id="expectedHash" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="cole o SHA-256 esperado" />
            </div>
          </div>
          {fileHash && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{fileName} · {fileKB} KB</div>
              <HashBlock hash={fileHash} />
              {matchState === true && (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Hash confere com o esperado
                </Badge>
              )}
              {matchState === false && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Hash diferente do esperado
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registros locais */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Registros locais ({regs.length})</h2>
            {regs.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (confirm("Limpar registros locais deste navegador?")) setRegs([]);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
          {regs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro local ainda.</p>
          ) : (
            regs.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-sm">{r.tipo}</strong>
                  <span className="text-[11px] text-muted-foreground">{r.createdText}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">Paciente/controle: {r.paciente}</div>
                <HashBlock hash={r.hash} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copiarHash(r.hash)}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => baixarRegistro(r)}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Baixar
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3">
        Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}
