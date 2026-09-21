import { useState } from "react";
import { Copy, Download, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCommercialTemplate } from "@shared/commercialTemplates";
import type { CommercialFeatureCode } from "@shared/commercial";
import type { CommercialExportChannel } from "@/lib/commercialExport";

export interface CommercialMaterialViewProps {
  feature: CommercialFeatureCode;
  busy: boolean;
  runExport: (channel: CommercialExportChannel, action: () => void | Promise<void>) => Promise<boolean>;
}

/**
 * Superfície comercial deliberadamente separada de prontuários/diários locais.
 * Não recebe campos de paciente nem acessa storage. Os quatro botões chamam a
 * mesma autorização persistida antes de transmitir o modelo em branco.
 */
export function CommercialMaterialView({ feature, busy, runExport }: CommercialMaterialViewProps) {
  const template = buildCommercialTemplate(feature);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function perform(channel: CommercialExportChannel) {
    setFeedback(null);
    // Reservar a janela na interação do usuário, mas nunca escrever o material
    // antes da confirmação do servidor. Recusa/erro fecha a janela vazia.
    const printWindow = channel === "print" ? window.open("", "_blank") : null;
    if (channel === "print" && !printWindow) {
      setFeedback("Permita a abertura da janela de impressão e tente novamente.");
      return;
    }
    if (printWindow) printWindow.opener = null;
    const ok = await runExport(channel, async () => {
      switch (channel) {
        case "print": {
          if (!printWindow || printWindow.closed) throw new Error("A janela de impressão foi fechada.");
          printWindow.document.write(template.html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          break;
        }
        case "download": {
          const url = URL.createObjectURL(new Blob([template.html], { type: "text/html;charset=utf-8" }));
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = template.filename;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2_000);
          break;
        }
        case "copy": {
          if (!navigator.clipboard?.writeText) throw new Error("A cópia não está disponível neste navegador. Use Baixar modelo.");
          await navigator.clipboard.writeText(template.text);
          break;
        }
        case "email": {
          // Apenas um modelo curto e em branco; não há destinatário automático,
          // anexos clínicos ou envio realizado pelo aplicativo.
          const anchor = document.createElement("a");
          anchor.href = `mailto:?subject=${encodeURIComponent(template.title)}&body=${encodeURIComponent(template.text)}`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          break;
        }
      }
    });
    if (!ok) {
      printWindow?.close();
      setFeedback("A ação foi interrompida. Nenhuma exportação foi confirmada nesta tela.");
      return;
    }
    setFeedback(channel === "copy" ? "Modelo copiado." : channel === "email"
      ? "Rascunho solicitado ao aplicativo de e-mail. Revise o conteúdo e confirme o envio nele."
      : channel === "print" ? "Diálogo de impressão solicitado. A impressão depende da sua confirmação."
      : "Download solicitado ao navegador. Confira o arquivo salvo.");
  }

  return <main className="mx-auto max-w-3xl space-y-4 px-4 py-6" data-testid="commercial-material-workspace">
    <Card>
      <CardHeader><CardTitle>{template.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{template.purpose}</p>
        <p className="rounded-lg border p-3 text-sm" data-testid="commercial-template-boundary">
          {template.boundary} Esta licença disponibiliza modelos em branco; não destrava persistência clínica local nem prontuário.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={busy} onClick={() => void perform("print")} data-testid="commercial-export-print"><Printer className="mr-2 h-4 w-4" />Imprimir modelo</Button>
          <Button disabled={busy} variant="outline" onClick={() => void perform("download")} data-testid="commercial-export-download"><Download className="mr-2 h-4 w-4" />Baixar modelo</Button>
          <Button disabled={busy} variant="outline" onClick={() => void perform("copy")} data-testid="commercial-export-copy"><Copy className="mr-2 h-4 w-4" />Copiar modelo</Button>
          <Button disabled={busy} variant="outline" onClick={() => void perform("email")} data-testid="commercial-export-email"><Mail className="mr-2 h-4 w-4" />Preparar e-mail</Button>
        </div>
        <div className="space-y-5" aria-label="Modelo em branco">{template.fields.map((field) => <section key={field}>
          <h2 className="text-sm font-medium">{field}</h2><div className="mt-2 h-8 border-b" aria-hidden="true" />
        </section>)}</div>
        {feedback && <p className="text-sm" role="status">{feedback}</p>}
      </CardContent>
    </Card>
  </main>;
}
