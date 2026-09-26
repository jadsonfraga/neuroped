import { useCallback, useEffect, useState } from "react";
import { Download, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/authClient";

interface LiveDocument {
  id: string;
  documentType: string;
  status: string;
  currentVersion: number;
  updatedAt: string;
  version?: {
    issuedAt?: string;
    encryptionVersion?: string;
    content?: {
      schema?: string;
      title?: string;
      filename?: string;
      mimeType?: string;
      sizeBytes?: number;
      sha256?: string;
      pdfBase64?: string;
      signature?: { status?: string; signerName?: string | null };
    };
  };
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function label(type: string): string {
  if (type === "prescription") return "Receita";
  if (type === "report") return "Laudo/relatório";
  if (type === "scale") return "Escala";
  if (type === "clinical_note") return "Nota clínica";
  return "Documento";
}

export function LiveDocumentsPanel({ clinicId, patientId }: { clinicId: string; patientId: string }) {
  const [documents, setDocuments] = useState<LiveDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authFetch(
        `/api/live/documents?clinicId=${encodeURIComponent(clinicId)}&patientId=${encodeURIComponent(patientId)}`,
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Falha ao carregar documentos LIVE.");
      setDocuments(Array.isArray(payload?.data) ? payload.data : []);
    } catch (cause) {
      setDocuments([]);
      setError(cause instanceof Error ? cause.message : "Falha ao carregar documentos LIVE.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, patientId]);

  useEffect(() => { void load(); }, [load]);

  const download = (document: LiveDocument) => {
    const content = document.version?.content;
    if (content?.schema !== "neuroped.live-pdf.v1" || !content.pdfBase64) return;
    const bytes = base64ToBytes(content.pdfBase64);
    const blob = new Blob([bytes.buffer], { type: content.mimeType || "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = content.filename || `documento-${document.id}.pdf`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
  };

  return (
    <div className="space-y-4" data-testid="live-documents-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold">Documentos clínicos arquivados</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PDFs compactos ficam cifrados, versionados e auditados no Clinical Core LIVE.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>}
      {!loading && !error && documents.length === 0 && (
        <Card className="border-dashed"><CardContent className="p-7 text-center text-sm text-muted-foreground">Nenhum documento clínico LIVE arquivado para este paciente.</CardContent></Card>
      )}
      <div className="space-y-2">
        {documents.map((document) => {
          const content = document.version?.content;
          const isPdf = content?.schema === "neuroped.live-pdf.v1" && Boolean(content.pdfBase64);
          const signed = content?.signature?.status === "signed" || content?.signature?.status === "verified";
          return (
            <Card key={document.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <strong className="truncate text-sm">{content?.title || label(document.documentType)}</strong>
                    <Badge variant="outline">{label(document.documentType)}</Badge>
                    {signed && <Badge className="gap-1"><ShieldCheck className="h-3 w-3" />Assinado</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(document.version?.issuedAt || document.updatedAt).toLocaleString("pt-BR")} · v{document.currentVersion}
                    {content?.sha256 ? ` · SHA-256 ${content.sha256.slice(0, 12)}…` : ""}
                  </p>
                  {content?.filename && <p className="mt-1 truncate text-[11px] text-muted-foreground">{content.filename}</p>}
                </div>
                {isPdf && (
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => download(document)}>
                    <Download className="h-4 w-4" /> Baixar PDF
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
