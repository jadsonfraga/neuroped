import { readFileSync, writeFileSync } from "node:fs";

function patchFile(path, replacements) {
  let source = readFileSync(path, "utf8");
  for (const [from, to, label] of replacements) {
    if (!source.includes(from)) {
      throw new Error(`${path}: trecho não encontrado para ${label}`);
    }
    source = source.replace(from, to);
  }
  writeFileSync(path, source);
  console.log(`patched ${path}`);
}

patchFile("client/src/pages/filtro-engine.tsx", [
  [
`import {
  loadFilterPreferences,
  saveFilterPreferences,
} from "@/lib/filterPreferences";`,
`import {
  loadFilterPreferences,
  saveFilterPreferences,
} from "@/lib/filterPreferences";
import {
  clearFilterSessionState,
  loadFilterSessionState,
  saveFilterSessionState,
} from "@/lib/filterSessionState";`,
    "import do estado de sessão",
  ],
  [
`  const [preferences] = useState(loadFilterPreferences);
  const [navigationPrefill] = useState(readFilterNavigationPrefill);
  const [search, setSearch] = useState<string>("");
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>(
    flashMode ? [] : navigationPrefill.queixas,
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    flashMode ? null : navigationPrefill.age,
  );
  const [selectedRespondente, setSelectedRespondente] = useState<
    ScaleEntry["respondente"][number] | null
  >(null);
  const [selectedCommunication, setSelectedCommunication] = useState<
    "verbal" | "nonverbal" | null
  >(null);
  const [selectedLiteracy, setSelectedLiteracy] = useState<
    "literate" | "preliterate" | null
  >(null);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<
    "diagnostic" | "monitoring" | null
  >(null);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);`,
`  const [preferences] = useState(loadFilterPreferences);
  const [navigationPrefill] = useState(readFilterNavigationPrefill);
  const [sessionFilters] = useState(() =>
    flashMode ? null : loadFilterSessionState(),
  );
  const useNavigationPrefill = !flashMode && navigationPrefill.present;
  const validQueixaIds = new Set(queixas.map((item) => item.id));
  const sessionAge =
    sessionFilters?.selectedAge &&
    faixasEtarias.some((item) => item.id === sessionFilters.selectedAge)
      ? sessionFilters.selectedAge
      : null;
  const sessionQueixas = (sessionFilters?.selectedQueixas ?? []).filter((id) =>
    validQueixaIds.has(id),
  );
  const validSessionSignalIds = new Set(
    sessionQueixas.flatMap((queixaId) =>
      getAllSignalsForQueixa(queixaId).map((signal) => signal.id),
    ),
  );
  const sessionSignalIds = (sessionFilters?.selectedSignalIds ?? []).filter(
    (id) => validSessionSignalIds.has(id),
  );
  const [search, setSearch] = useState<string>(
    flashMode || useNavigationPrefill ? "" : (sessionFilters?.search ?? ""),
  );
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>(
    flashMode
      ? []
      : useNavigationPrefill
        ? navigationPrefill.queixas
        : sessionQueixas,
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    flashMode
      ? null
      : useNavigationPrefill
        ? navigationPrefill.age
        : sessionAge,
  );
  const [selectedRespondente, setSelectedRespondente] = useState<
    ScaleEntry["respondente"][number] | null
  >(
    flashMode || useNavigationPrefill
      ? null
      : (sessionFilters?.selectedRespondente ?? null),
  );
  const [selectedCommunication, setSelectedCommunication] = useState<
    "verbal" | "nonverbal" | null
  >(
    flashMode || useNavigationPrefill
      ? null
      : (sessionFilters?.selectedCommunication ?? null),
  );
  const [selectedLiteracy, setSelectedLiteracy] = useState<
    "literate" | "preliterate" | null
  >(
    flashMode || useNavigationPrefill
      ? null
      : (sessionFilters?.selectedLiteracy ?? null),
  );
  const [selectedAssessmentType, setSelectedAssessmentType] = useState<
    "diagnostic" | "monitoring" | null
  >(
    flashMode || useNavigationPrefill
      ? null
      : (sessionFilters?.selectedAssessmentType ?? null),
  );
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>(
    flashMode || useNavigationPrefill ? [] : sessionSignalIds,
  );`,
    "restauração dos filtros",
  ],
  [
`  // Persiste somente a preferência não clínica de disponibilidade. Busca,
  // idade, queixas e contexto assistencial permanecem apenas em memória.
  useEffect(() => {
    if (flashMode) return;
    saveFilterPreferences(availabilityMode);
  }, [flashMode, availabilityMode]);

  useEffect(() => {`,
`  // A disponibilidade segue como preferência não clínica persistente.
  useEffect(() => {
    if (flashMode) return;
    saveFilterPreferences(availabilityMode);
  }, [flashMode, availabilityMode]);

  // O contexto clínico vive SOMENTE na sessão da aba: sobrevive ao abrir uma
  // escala e voltar ao filtro, mas não é gravado em localStorage permanente.
  useEffect(() => {
    if (flashMode) return;
    saveFilterSessionState({
      search,
      selectedAge,
      selectedQueixas,
      selectedRespondente,
      selectedCommunication,
      selectedLiteracy,
      selectedAssessmentType,
      selectedSignalIds,
    });
  }, [
    flashMode,
    search,
    selectedAge,
    selectedQueixas,
    selectedRespondente,
    selectedCommunication,
    selectedLiteracy,
    selectedAssessmentType,
    selectedSignalIds,
  ]);

  useEffect(() => {`,
    "persistência de sessão",
  ],
  [
`  const clearAll = () => {
    softTap();
    haptic.tap();
    setSearch("");`,
`  const clearAll = () => {
    softTap();
    haptic.tap();
    clearFilterSessionState();
    setSearch("");`,
    "limpeza explícita da sessão",
  ],
]);

patchFile("client/src/lib/scaleResponseReport.ts", [
  [
`import { escapeHtml } from "./htmlEscape";`,
`import { escapeHtml } from "./htmlEscape";
import { formatClinicalLongDate } from "./clinicalDate";`,
    "import do fuso clínico",
  ],
  [
`/**
 * Remove apenas a codificação usada para cálculo quando ela vem anexada a uma
 * resposta descritiva ("Nunca (0)", "2 — Sempre"). Números que fazem parte da
 * resposta — frequência, medida, idade ou texto livre — permanecem intactos.
 *
 * O separador do prefixo é restrito a travessão (— / –), NUNCA hífen simples.
 * Todo rótulo Likert real do catálogo usa travessão ("0 — Ausente...",
 * "2 — Sempre" — ver cdi2Labels, interactiveScaleItemsDrive2026Base.ts etc.);
 * nenhum usa hífen. Um hífen depois de número quase sempre é conteúdo real da
 * resposta ("2 - vezes por semana", "3 - meses de idade"), não um código de
 * Likert. Antes o traço aceitava as duas formas — [—–-] — e cortava também
 * essas respostas descritivas legítimas, corrompendo silenciosamente o
 * "REGISTRO INTEGRAL DE RESPOSTAS", que existe justamente para ser fiel ao
 * que foi respondido.
 */
export function formatScaleResponseAnswer(value: unknown): string {
  const answer = clean(value, "Não respondida");
  const withoutLeadingCode = answer.replace(
    /^[-+−]?\\d+(?:[.,]\\d+)?\\s*[—–]\\s*(?=\\p{L})/u,
    "",
  );
  return withoutLeadingCode.replace(
    /\\s*\\(\\s*[-+−]?\\d+(?:[.,]\\d+)?\\s*(?:pontos?|pts?)?\\s*\\)\\s*$/iu,
    "",
  );
}`,
`/**
 * O registro integral é uma transcrição literal da alternativa selecionada.
 * Não removemos prefixos, sufixos, códigos ou números do rótulo: qualquer
 * transformação aqui faria a tela/PDF divergir do que a família marcou.
 */
export function formatScaleResponseAnswer(value: unknown): string {
  return clean(value, "Não respondida");
}`,
    "fidelidade literal das respostas",
  ],
  [
`export function formatScaleResponseDate(date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Recife",
  });
}`,
`export function formatScaleResponseDate(date = new Date()): string {
  return formatClinicalLongDate(date);
}`,
    "timezone Bahia",
  ],
]);

patchFile("client/src/components/ClinicalReport.tsx", [
  [
`} from "@/lib/scaleResponseReport";
import { printPlainTextDocument } from "@/lib/printDocument";`,
`} from "@/lib/scaleResponseReport";
import {
  formatClinicalDate,
  formatClinicalDateTime,
} from "@/lib/clinicalDate";
import { printPlainTextDocument } from "@/lib/printDocument";`,
    "import de data clínica",
  ],
  [
`async function sendEmail(
  scaleName: string,
  reportText: string,
  setSent: (v: boolean) => void,
  toast: (opts: any) => void,
) {
  const subject = `[NeuroPed] ${scaleName} — ${new Date().toLocaleDateString("pt-BR")}`;`,
`async function sendEmail(
  scaleName: string,
  reportText: string,
  applicationDate: Date,
  setSent: (v: boolean) => void,
  toast: (opts: any) => void,
) {
  const subject = `[NeuroPed] ${scaleName} — ${formatClinicalDate(applicationDate)}`;`,
    "assunto com data estável",
  ],
  [
`function generateReportText(props: NormalizedReport): string {
  return `${buildScaleResponseText(props)}\\n---\\n${PROFESSIONAL_SIGNATURE.name} — ${PROFESSIONAL_SIGNATURE.specialty}\\n${PROFESSIONAL_SIGNATURE.registry}\\n${PROFESSIONAL_SIGNATURE.service}\\n`;
}

export function ClinicalReport(rawProps: ClinicalReportProps) {
  const props = normalizeReportProps(rawProps);
  const [sending, setSending] = useState(false);`,
`function generateReportText(
  props: NormalizedReport,
  applicationDate: Date,
): string {
  return `${buildScaleResponseText(props, applicationDate)}\\n---\\n${PROFESSIONAL_SIGNATURE.name} — ${PROFESSIONAL_SIGNATURE.specialty}\\n${PROFESSIONAL_SIGNATURE.registry}\\n${PROFESSIONAL_SIGNATURE.service}\\n`;
}

export function ClinicalReport(rawProps: ClinicalReportProps) {
  const props = normalizeReportProps(rawProps);
  const [applicationDate] = useState(() => new Date());
  const [sending, setSending] = useState(false);`,
    "snapshot temporal da aplicação",
  ],
  [
`  const { toast } = useToast();
  const reportText = generateReportText(props);`,
`  const { toast } = useToast();
  const reportText = generateReportText(props, applicationDate);`,
    "texto com snapshot",
  ],
  [
`              ` + "`Data de emissão: ${new Date().toLocaleString(\"pt-BR\")}`" + `,`,
`              ` + "`Data da aplicação: ${formatClinicalDateTime(applicationDate)}`" + `,`,
    "data do PDF",
  ],
  [
`    await sendEmail(props.scaleName, reportText, setSent, toast);`,
`    await sendEmail(
      props.scaleName,
      reportText,
      applicationDate,
      setSent,
      toast,
    );`,
    "email com snapshot",
  ],
]);

patchFile("client/src/components/SaveToPatient.tsx", [
  [
`import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";`,
`import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";
import { formatClinicalDateTime } from "@/lib/clinicalDate";`,
    "import de data clínica no arquivo",
  ],
  [
`  const selectId = useId();
  const newPatientId = useId();
  const [selectedPatientId, setSelectedPatientId] = useState("");`,
`  const selectId = useId();
  const newPatientId = useId();
  const [applicationDate] = useState(() => new Date());
  const [selectedPatientId, setSelectedPatientId] = useState("");`,
    "snapshot de data no salvamento",
  ],
  [
`                ` + "`Data de emissão: ${new Date().toLocaleString(\"pt-BR\")}`" + `,`,
`                ` + "`Data da aplicação: ${formatClinicalDateTime(applicationDate)}`" + `,`,
    "data do PDF arquivado",
  ],
  [
`            answerCount: responses.length,`,
`            answerCount: responses.length,
            appliedAt: applicationDate.toISOString(),`,
    "timestamp do snapshot nos metadados",
  ],
]);

patchFile("tests/clinical/test-scale-response-delivery.mjs", [
  [
`  "Resposta: Às vezes",
  "Conclui as tarefas propostas?",
  "Resposta: Frequentemente",`,
`  "Resposta: Às vezes (1)",
  "Conclui as tarefas propostas?",
  "Resposta: 2 — Frequentemente",`,
    "expectativa literal do relatório",
  ],
  [
`assert.equal(formatScaleResponseAnswer("Nunca (0)"), "Nunca");
assert.equal(formatScaleResponseAnswer("2 — Sempre"), "Sempre");`,
`assert.equal(formatScaleResponseAnswer("Nunca (0)"), "Nunca (0)");
assert.equal(formatScaleResponseAnswer("2 — Sempre"), "2 — Sempre");`,
    "expectativa literal do formatador",
  ],
  [
`assert.equal(
  formatScaleResponseAnswer("Raramente (0-1x/sem)"),
  "Raramente (0-1x/sem)",
  "frequência que faz parte da resposta deve ser preservada",
);`,
`assert.equal(
  formatScaleResponseAnswer("Raramente (0-1x/sem)"),
  "Raramente (0-1x/sem)",
  "frequência que faz parte da resposta deve ser preservada",
);
assert.ok(
  buildScaleResponseText(report, new Date("2026-08-22T01:30:00.000Z")).includes(
    "21 de agosto de 2026",
  ),
  "data da aplicação deve respeitar America/Bahia perto da meia-noite UTC",
);`,
    "regressão de timezone",
  ],
]);

console.log("hotfix aplicado com sucesso");
