import { useState } from "react";
import { ClipboardList, Printer, Mail, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const EMAIL_TO = "jadsonfraga@hotmail.com";

// ── Data definitions ────────────────────────────────────────────────────────

interface ScaleDomainDef {
  domain: string;
  description: string;
}

const SCALES: Record<
  string,
  {
    label: string;
    domains: ScaleDomainDef[];
    note: string;
    normInfo: string;
  }
> = {
  bayley: {
    label: "Bayley-III",
    normInfo: "M=100 DP=15 (subtestes M=10 DP=3)",
    note: "Bayley Scales of Infant and Toddler Development, 3ª edição. Faixa: 1 a 42 meses.",
    domains: [
      { domain: "Cognitivo", description: "Habilidades cognitivas, exploratórias e de jogo" },
      { domain: "Linguagem Receptiva", description: "Compreensão de linguagem, vocabulário receptivo" },
      { domain: "Linguagem Expressiva", description: "Comunicação pré-verbal e verbal expressiva" },
      { domain: "Motor Fino", description: "Destreza manual, preensão, manipulação de objetos" },
      { domain: "Motor Grosseiro", description: "Controle postural, locomoção, equilíbrio" },
      { domain: "Socioemocional", description: "Regulação emocional, engajamento social" },
      { domain: "Comportamento Adaptativo", description: "Habilidades de vida diária adaptativas" },
    ],
  },
  wisc5: {
    label: "WISC-V",
    normInfo: "M=100 DP=15 (índices); M=10 DP=3 (subtestes)",
    note: "Wechsler Intelligence Scale for Children, 5ª edição. Faixa: 6 a 16 anos e 11 meses.",
    domains: [
      { domain: "Compreensão Verbal (ICV)", description: "Vocabulário, semelhanças, compreensão verbal" },
      { domain: "Visoespacial (IVE)", description: "Cubos, quebra-cabeças visuais" },
      { domain: "Raciocínio Fluido (IRF)", description: "Matrizes, balanças" },
      { domain: "Memória de Trabalho (IMT)", description: "Dígitos, sequência de números e letras" },
      { domain: "Velocidade de Processamento (IVP)", description: "Código, procurar símbolos, cancelamento" },
      { domain: "QI Total (QIT)", description: "Índice composto global de inteligência" },
    ],
  },
  hine: {
    label: "HINE",
    normInfo: "Escore global máx. 78. ≤56 aos 3 meses = alto risco para PC",
    note: "Hammersmith Infant Neurological Examination. Faixa: 2 a 24 meses. Escala de uso livre para fins clínicos.",
    domains: [
      { domain: "Nervos Cranianos", description: "Motilidade ocular, face, sucção, deglutição" },
      { domain: "Postura", description: "Posição em repouso, postura cabeça/tronco/membros" },
      { domain: "Movimentos", description: "Quantidade, qualidade e padrão de movimentos" },
      { domain: "Tônus", description: "Tônus passivo de membros superiores, inferiores e eixo" },
      { domain: "Reflexos", description: "Reflexos tendinosos e reflexos primitivos" },
      { domain: "Marcos Motores", description: "Controle cervical, sentar, ficar em pé, andar" },
      { domain: "Escore Global (0–78)", description: "Pontuação total HINE" },
    ],
  },
  gmfm88: {
    label: "GMFM-88",
    normInfo: "Porcentagem por dimensão (0–100%). Escore GMFM-66 padronizado.",
    note: "Gross Motor Function Measure, versão 88 itens. Instrumento de domínio público para avaliação motora em PC.",
    domains: [
      { domain: "A — Deitar/Rolar", description: "Habilidades em decúbito dorsal e ventral, rolamentos" },
      { domain: "B — Sentar", description: "Sentado com e sem apoio, transições sentado" },
      { domain: "C — Engatinhar/Ajoelhar", description: "Engatinhar, ajoelhar, transições no solo" },
      { domain: "D — Em Pé", description: "Ortostatismo com e sem apoio" },
      { domain: "E — Andar/Correr/Pular", description: "Marcha, corrida, escadas, saltos" },
      { domain: "% Total GMFM-88", description: "Escore percentual total das 5 dimensões" },
      { domain: "Escore GMFM-66", description: "Escore padronizado GMFM-66 (calculado via software)" },
    ],
  },
  ados2: {
    label: "ADOS-2",
    normInfo: "Classificação por gravidade: 1–10 (Escala de Comparação de Gravidade — ECS)",
    note: "Autism Diagnostic Observation Schedule, 2ª edição. Instrumento de uso controlado — requer treinamento certificado.",
    domains: [
      { domain: "Módulo Utilizado", description: "Módulo 1, 2, 3, 4 ou T (Toddler)" },
      { domain: "Comunicação", description: "Pontuação domínio Comunicação" },
      { domain: "Interação Social Recíproca", description: "Pontuação domínio Interação Social" },
      { domain: "Total Comunicação + Social", description: "Pontuação combinada C+S (diagnóstico)" },
      { domain: "Comportamentos Restritos/Repetitivos", description: "Pontuação domínio RRB (Módulo 3 e 4)" },
      { domain: "Comparação por Gravidade (ECS)", description: "Escore 1–10 de gravidade comparativa" },
    ],
  },
  griffiths3: {
    label: "Griffiths-III",
    normInfo: "M=100 DP=15 para subescalas e QG",
    note: "Griffiths Scales of Child Development, 3ª edição. Faixa: 0 a 6 anos.",
    domains: [
      { domain: "Fundamentos da Aprendizagem", description: "Atenção, concentração, aspectos sensoriais" },
      { domain: "Linguagem e Comunicação", description: "Linguagem receptiva e expressiva" },
      { domain: "Coordenação Olho-Mão", description: "Motricidade fina, integração visomotora" },
      { domain: "Pessoal-Social-Emocional", description: "Interação social, autonomia, autoconceito" },
      { domain: "Motricidade Grosseira", description: "Locomoção, equilíbrio, coordenação global" },
      { domain: "QG (Quociente Geral)", description: "Quociente de desenvolvimento global" },
    ],
  },
};

// ── Patient header ──────────────────────────────────────────────────────────

interface PatientHeader {
  nome: string;
  nascimento: string;
  data: string;
  examinador: string;
}

function PatientHeaderForm({
  value,
  onChange,
}: {
  value: PatientHeader;
  onChange: (v: PatientHeader) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="space-y-1">
        <Label className="text-xs">Nome do Paciente</Label>
        <Input
          className="h-8 text-xs"
          value={value.nome}
          onChange={(e) => onChange({ ...value, nome: e.target.value })}
          placeholder="Nome completo"
          data-testid="input-patient-name"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Data de Nascimento</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={value.nascimento}
          onChange={(e) => onChange({ ...value, nascimento: e.target.value })}
          data-testid="input-patient-dob"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Data da Avaliação</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={value.data}
          onChange={(e) => onChange({ ...value, data: e.target.value })}
          data-testid="input-eval-date"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Examinador(a)</Label>
        <Input
          className="h-8 text-xs"
          value={value.examinador}
          onChange={(e) => onChange({ ...value, examinador: e.target.value })}
          placeholder="Nome do profissional"
          data-testid="input-examiner"
        />
      </div>
    </div>
  );
}

// ── Score table ─────────────────────────────────────────────────────────────

interface ScoreRow {
  bruto: string;
  padronizado: string;
}

function ScoreTable({
  scaleKey,
  scores,
  onChange,
}: {
  scaleKey: string;
  scores: Record<string, ScoreRow>;
  onChange: (s: Record<string, ScoreRow>) => void;
}) {
  const scale = SCALES[scaleKey];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/60">
            <th className="text-left p-2 border border-border font-semibold w-[35%]">Domínio</th>
            <th className="text-left p-2 border border-border font-semibold w-[30%]">Descrição</th>
            <th className="text-center p-2 border border-border font-semibold w-[15%]">Bruto</th>
            <th className="text-center p-2 border border-border font-semibold w-[20%]">Padronizado</th>
          </tr>
        </thead>
        <tbody>
          {scale.domains.map((d) => {
            const row = scores[d.domain] ?? { bruto: "", padronizado: "" };
            return (
              <tr key={d.domain} className="hover:bg-muted/20">
                <td className="p-2 border border-border font-medium">{d.domain}</td>
                <td className="p-2 border border-border text-muted-foreground">{d.description}</td>
                <td className="p-1 border border-border text-center">
                  <Input
                    className="h-7 text-xs text-center"
                    value={row.bruto}
                    onChange={(e) =>
                      onChange({ ...scores, [d.domain]: { ...row, bruto: e.target.value } })
                    }
                    placeholder="—"
                    data-testid={`input-bruto-${d.domain}`}
                  />
                </td>
                <td className="p-1 border border-border text-center">
                  <Input
                    className="h-7 text-xs text-center"
                    value={row.padronizado}
                    onChange={(e) =>
                      onChange({ ...scores, [d.domain]: { ...row, padronizado: e.target.value } })
                    }
                    placeholder="—"
                    data-testid={`input-pad-${d.domain}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Print / Email helpers ────────────────────────────────────────────────────

function buildHtml(
  scaleKey: string,
  patient: PatientHeader,
  scores: Record<string, ScoreRow>
): string {
  const scale = SCALES[scaleKey];
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const rowsHtml = scale.domains
    .map((d) => {
      const row = scores[d.domain] ?? { bruto: "—", padronizado: "—" };
      return `<tr>
        <td>${d.domain}</td>
        <td style="color:#555">${d.description}</td>
        <td style="text-align:center">${row.bruto || "—"}</td>
        <td style="text-align:center">${row.padronizado || "—"}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ficha ${scale.label} — ${patient.nome || "Paciente"}</title>
  <style>
    @page { margin: 2cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; }
    .header { border-bottom: 3px solid #6d28d9; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 15pt; color: #6d28d9; }
    .header .sub { font-size: 10pt; color: #555; margin-top: 4px; }
    .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 16px; font-size: 10pt; }
    .patient-grid .field { background: #f8f7ff; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 10px; }
    .patient-grid .field .lbl { font-size: 8pt; color: #888; }
    .patient-grid .field .val { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 10px; }
    th { background: #6d28d9; color: white; padding: 6px 10px; text-align: left; }
    td { padding: 5px 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) { background: #faf9ff; }
    .norm { background: #f3f0ff; border-left: 4px solid #6d28d9; padding: 8px 12px; margin: 12px 0; font-size: 9pt; }
    .note { font-size: 9pt; color: #555; margin-top: 8px; font-style: italic; }
    .footer { margin-top: 24px; border-top: 2px solid #6d28d9; padding-top: 10px; font-size: 9pt; color: #555; text-align: center; }
    .footer .doc { font-size: 10pt; font-weight: bold; color: #1a1a1a; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 NeuroPed — Ficha de Registro Comercial</h1>
    <div class="sub">Escala: ${scale.label} | Data: ${dateStr}</div>
  </div>
  <div class="patient-grid">
    <div class="field"><div class="lbl">Paciente</div><div class="val">${patient.nome || "—"}</div></div>
    <div class="field"><div class="lbl">Nascimento</div><div class="val">${patient.nascimento ? new Date(patient.nascimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div></div>
    <div class="field"><div class="lbl">Data da Avaliação</div><div class="val">${patient.data ? new Date(patient.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div></div>
    <div class="field"><div class="lbl">Examinador(a)</div><div class="val">${patient.examinador || "—"}</div></div>
  </div>
  <div class="norm"><strong>Normatização:</strong> ${scale.normInfo}</div>
  <table>
    <thead><tr><th>Domínio</th><th>Descrição</th><th>Bruto</th><th>Padronizado</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <p class="note">${scale.note}</p>
  <div class="footer">
    <div class="doc">Dr. Jadson Fraga Araújo Júnior</div>
    CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119<br>
    NeuroPed — Escalas de Neuropediatria
  </div>
</body>
</html>`;
}

function buildText(
  scaleKey: string,
  patient: PatientHeader,
  scores: Record<string, ScoreRow>
): string {
  const scale = SCALES[scaleKey];
  const dateStr = new Date().toLocaleDateString("pt-BR");
  let txt = `FICHA DE REGISTRO — ${scale.label}\n`;
  txt += `Paciente: ${patient.nome || "—"} | Nasc: ${patient.nascimento || "—"} | Data: ${patient.data || dateStr} | Examinador: ${patient.examinador || "—"}\n\n`;
  scale.domains.forEach((d) => {
    const row = scores[d.domain] ?? { bruto: "—", padronizado: "—" };
    txt += `${d.domain}: Bruto=${row.bruto || "—"} / Padronizado=${row.padronizado || "—"}\n`;
  });
  txt += `\n${scale.note}\n`;
  txt += `---\nDr. Jadson Fraga — Neuropediatra | NeuroPed\n`;
  return txt;
}

// ── Per-scale tab content ────────────────────────────────────────────────────

function ScaleTab({ scaleKey }: { scaleKey: string }) {
  const [patient, setPatient] = useState<PatientHeader>({
    nome: "",
    nascimento: "",
    data: new Date().toISOString().slice(0, 10),
    examinador: "",
  });
  const [scores, setScores] = useState<Record<string, ScoreRow>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const scale = SCALES[scaleKey];

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) {
      toast({ title: "Erro", description: "Pop-up bloqueado. Permita pop-ups para imprimir.", variant: "destructive" });
      return;
    }
    win.document.write(buildHtml(scaleKey, patient, scores));
    win.document.close();
    win.onload = () => win.print();
    toast({ title: "Impressão", description: "Janela de impressão aberta." });
  }

  async function handleEmail() {
    setSending(true);
    const subject = `[NeuroPed] Ficha ${scale.label} — ${patient.nome || "Paciente"} — ${new Date().toLocaleDateString("pt-BR")}`;
    const body = buildText(scaleKey, patient, scores);
    try {
      const res = await apiRequest("POST", "/api/send-report", { subject, body });
      if (res.ok) {
        setSent(true);
        toast({ title: "Enviado", description: `Ficha enviada para ${EMAIL_TO}` });
        setSending(false);
        return;
      }
    } catch { /* intentional */ }
    const truncated = body.length > 1800 ? body.slice(0, 1800) + "\n[truncado]" : body;
    window.open(`mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`, "_blank");
    setSent(true);
    toast({ title: "Email aberto", description: "Seu app de email foi aberto com a ficha." });
    setSending(false);
  }

  return (
    <div className="space-y-4">
      <PatientHeaderForm value={patient} onChange={setPatient} />

      <div className="rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 px-4 py-2">
        <p className="text-xs text-violet-800 dark:text-violet-300">
          <strong>Normatização:</strong> {scale.normInfo}
        </p>
      </div>

      <ScoreTable scaleKey={scaleKey} scores={scores} onChange={setScores} />

      <p className="text-xs text-muted-foreground italic">{scale.note}</p>

      <div className="flex gap-2">
        <Button onClick={handlePrint} className="flex-1 gap-2 h-9" data-testid={`button-print-${scaleKey}`}>
          <Printer className="w-4 h-4" />
          Imprimir / PDF
        </Button>
        <Button
          variant="outline"
          onClick={handleEmail}
          disabled={sending || sent}
          className="flex-1 gap-2 h-9"
          data-testid={`button-email-${scaleKey}`}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {sent ? "Enviado" : sending ? "Enviando..." : "Enviar Email"}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function FichasRegistroPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Fichas de Registro — Escalas Comerciais</h1>
          <p className="text-xs text-muted-foreground">
            Registro de pontuações de instrumentos padronizados (Bayley-III, WISC-V, HINE, GMFM-88, ADOS-2, Griffiths-III)
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Atenção:</strong> Esta ficha registra apenas as pontuações obtidas na avaliação. Os instrumentos listados
          são escalas comerciais que requerem treinamento específico e materiais proprietários para aplicação.
          O uso adequado é de responsabilidade do profissional habilitado.
        </p>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-4">
          <Tabs defaultValue="bayley">
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {Object.entries(SCALES).map(([key, s]) => (
                <TabsTrigger key={key} value={key} className="text-xs" data-testid={`tab-${key}`}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.keys(SCALES).map((key) => (
              <TabsContent key={key} value={key}>
                <ScaleTab scaleKey={key} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
