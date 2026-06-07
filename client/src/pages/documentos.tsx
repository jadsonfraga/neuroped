import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const documentTypes = [
  "PANT completo",
  "Laudo EXPRESS",
  "Relatório médico",
  "Declaração",
  "Encaminhamento",
  "Solicitação de terapias",
  "Plano terapêutico",
  "PEI escolar",
];

export default function DocumentosPage() {
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("Dr. Jadson Fraga Araújo Júnior");
  const [crm, setCrm] = useState("CRM-PE 25.227");
  const [validationAttempted, setValidationAttempted] = useState(false);

  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (!patientName.trim()) missing.push("paciente.nome");
    if (!documentType.trim()) missing.push("documento.tipo");
    if (!doctorName.trim()) missing.push("medico.nome");
    if (!crm.trim()) missing.push("medico.crm");
    return missing;
  }, [crm, doctorName, documentType, patientName]);

  const canPreview = missingFields.length === 0;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Documentos</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">Central de Documentos NeuroPed</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Camada operacional para preparar documentos clínicos com validação mínima antes da prévia. Estado atual: parcial, aguardando integração plena dos templates oficiais no fluxo de renderização.
        </p>
      </section>

      <Card className="border-border/70 bg-card/80">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Dados mínimos</h2>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-foreground">Tipo de documento</span>
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {documentTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-semibold text-foreground">Paciente</span>
            <input
              value={patientName}
              onChange={(event) => setPatientName(event.target.value)}
              placeholder="Nome completo do paciente"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-foreground">Médico</span>
              <input
                value={doctorName}
                onChange={(event) => setDoctorName(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-semibold text-foreground">CRM</span>
              <input
                value={crm}
                onChange={(event) => setCrm(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
          </div>

          {validationAttempted && missingFields.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Campos obrigatórios ausentes: {missingFields.join(", ")}.</p>
              </div>
            </div>
          )}

          {validationAttempted && canPreview && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>Campos mínimos validados. Documento pode seguir como rascunho ou prévia.</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setValidationAttempted(true)} className="gap-2"><CheckCircle2 className="h-4 w-4" />Validar campos</Button>
            <Button variant="outline" disabled={!canPreview} className="gap-2"><Save className="h-4 w-4" />Salvar rascunho</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
