import { readFileSync, writeFileSync } from "node:fs";

const lines = (...items) => items.join("\n");

function read(path) {
  return readFileSync(path, "utf8");
}

function write(path, source) {
  writeFileSync(path, source);
  console.log(`patched ${path}`);
}

function replaceExact(path, from, to, label) {
  const source = read(path);
  if (!source.includes(from)) {
    throw new Error(`${path}: trecho não encontrado para ${label}`);
  }
  write(path, source.replace(from, to));
}

function replaceRange(path, startMarker, endMarker, replacement, label) {
  const source = read(path);
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`${path}: faixa não encontrada para ${label}`);
  }
  write(path, source.slice(0, start) + replacement + source.slice(end));
}

// 1) Filtro clínico: restaura contexto ao voltar da escala, somente na sessão da aba.
replaceExact(
  "client/src/pages/filtro-engine.tsx",
  lines(
    "import {",
    "  loadFilterPreferences,",
    "  saveFilterPreferences,",
    "} from \"@/lib/filterPreferences\";",
  ),
  lines(
    "import {",
    "  loadFilterPreferences,",
    "  saveFilterPreferences,",
    "} from \"@/lib/filterPreferences\";",
    "import {",
    "  clearFilterSessionState,",
    "  loadFilterSessionState,",
    "  saveFilterSessionState,",
    "} from \"@/lib/filterSessionState\";",
  ),
  "import do estado de sessão",
);

replaceRange(
  "client/src/pages/filtro-engine.tsx",
  "  const [preferences] = useState(loadFilterPreferences);",
  "  const [availabilityMode, setAvailabilityMode]",
  lines(
    "  const [preferences] = useState(loadFilterPreferences);",
    "  const [navigationPrefill] = useState(readFilterNavigationPrefill);",
    "  const [sessionFilters] = useState(() =>",
    "    flashMode ? null : loadFilterSessionState(),",
    "  );",
    "  const useNavigationPrefill = !flashMode && navigationPrefill.present;",
    "  const validQueixaIds = new Set(queixas.map((item) => item.id));",
    "  const sessionAge =",
    "    sessionFilters?.selectedAge &&",
    "    faixasEtarias.some((item) => item.id === sessionFilters.selectedAge)",
    "      ? sessionFilters.selectedAge",
    "      : null;",
    "  const sessionQueixas = (sessionFilters?.selectedQueixas ?? []).filter((id) =>",
    "    validQueixaIds.has(id),",
    "  );",
    "  const validSessionSignalIds = new Set(",
    "    sessionQueixas.flatMap((queixaId) =>",
    "      getAllSignalsForQueixa(queixaId).map((signal) => signal.id),",
    "    ),",
    "  );",
    "  const sessionSignalIds = (sessionFilters?.selectedSignalIds ?? []).filter(",
    "    (id) => validSessionSignalIds.has(id),",
    "  );",
    "  const [search, setSearch] = useState<string>(",
    "    flashMode || useNavigationPrefill ? \"\" : (sessionFilters?.search ?? \"\"),",
    "  );",
    "  const [selectedQueixas, setSelectedQueixas] = useState<string[]>(",
    "    flashMode",
    "      ? []",
    "      : useNavigationPrefill",
    "        ? navigationPrefill.queixas",
    "        : sessionQueixas,",
    "  );",
    "  const [selectedAge, setSelectedAge] = useState<string | null>(",
    "    flashMode",
    "      ? null",
    "      : useNavigationPrefill",
    "        ? navigationPrefill.age",
    "        : sessionAge,",
    "  );",
    "  const [selectedRespondente, setSelectedRespondente] = useState<",
    "    ScaleEntry[\"respondente\"][number] | null",
    "  >(",
    "    flashMode || useNavigationPrefill",
    "      ? null",
    "      : (sessionFilters?.selectedRespondente ?? null),",
    "  );",
    "  const [selectedCommunication, setSelectedCommunication] = useState<",
    "    \"verbal\" | \"nonverbal\" | null",
    "  >(",
    "    flashMode || useNavigationPrefill",
    "      ? null",
    "      : (sessionFilters?.selectedCommunication ?? null),",
    "  );",
    "  const [selectedLiteracy, setSelectedLiteracy] = useState<",
    "    \"literate\" | \"preliterate\" | null",
    "  >(",
    "    flashMode || useNavigationPrefill",
    "      ? null",
    "      : (sessionFilters?.selectedLiteracy ?? null),",
    "  );",
    "  const [selectedAssessmentType, setSelectedAssessmentType] = useState<",
    "    \"diagnostic\" | \"monitoring\" | null",
    "  >(",
    "    flashMode || useNavigationPrefill",
    "      ? null",
    "      : (sessionFilters?.selectedAssessmentType ?? null),",
    "  );",
    "  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>(",
    "    flashMode || useNavigationPrefill ? [] : sessionSignalIds,",
    "  );",
    "",
  ),
  "restauração dos filtros",
);

replaceExact(
  "client/src/pages/filtro-engine.tsx",
  lines(
    "  // Persiste somente a preferência não clínica de disponibilidade. Busca,",
    "  // idade, queixas e contexto assistencial permanecem apenas em memória.",
    "  useEffect(() => {",
    "    if (flashMode) return;",
    "    saveFilterPreferences(availabilityMode);",
    "  }, [flashMode, availabilityMode]);",
    "",
    "  useEffect(() => {",
    "    let alive = true;",
  ),
  lines(
    "  // A disponibilidade segue como preferência não clínica persistente.",
    "  useEffect(() => {",
    "    if (flashMode) return;",
    "    saveFilterPreferences(availabilityMode);",
    "  }, [flashMode, availabilityMode]);",
    "",
    "  // O contexto clínico vive SOMENTE na sessão da aba: sobrevive ao abrir uma",
    "  // escala e voltar ao filtro, mas não é gravado em localStorage permanente.",
    "  useEffect(() => {",
    "    if (flashMode) return;",
    "    saveFilterSessionState({",
    "      search,",
    "      selectedAge,",
    "      selectedQueixas,",
    "      selectedRespondente,",
    "      selectedCommunication,",
    "      selectedLiteracy,",
    "      selectedAssessmentType,",
    "      selectedSignalIds,",
    "    });",
    "  }, [",
    "    flashMode,",
    "    search,",
    "    selectedAge,",
    "    selectedQueixas,",
    "    selectedRespondente,",
    "    selectedCommunication,",
    "    selectedLiteracy,",
    "    selectedAssessmentType,",
    "    selectedSignalIds,",
    "  ]);",
    "",
    "  useEffect(() => {",
    "    let alive = true;",
  ),
  "persistência de sessão",
);

replaceExact(
  "client/src/pages/filtro-engine.tsx",
  lines(
    "  const clearAll = () => {",
    "    softTap();",
    "    haptic.tap();",
    "    setSearch(\"\");",
  ),
  lines(
    "  const clearAll = () => {",
    "    softTap();",
    "    haptic.tap();",
    "    clearFilterSessionState();",
    "    setSearch(\"\");",
  ),
  "limpeza explícita da sessão",
);

// 2) Registro integral: resposta literal + timezone canônico America/Bahia.
replaceExact(
  "client/src/lib/scaleResponseReport.ts",
  'import { escapeHtml } from "./htmlEscape";',
  lines(
    'import { escapeHtml } from "./htmlEscape";',
    'import { formatClinicalLongDate } from "./clinicalDate";',
  ),
  "import de data clínica",
);

replaceRange(
  "client/src/lib/scaleResponseReport.ts",
  "/**\n * Remove apenas a codificação usada para cálculo",
  "\n\nexport function responseItemsFromLegacySections",
  lines(
    "/**",
    " * O registro integral é uma transcrição literal da alternativa selecionada.",
    " * Não removemos prefixos, sufixos, códigos ou números do rótulo: qualquer",
    " * transformação aqui faria a tela/PDF divergir do que a família marcou.",
    " */",
    "export function formatScaleResponseAnswer(value: unknown): string {",
    '  return clean(value, "Não respondida");',
    "}",
  ),
  "fidelidade literal das respostas",
);

replaceExact(
  "client/src/lib/scaleResponseReport.ts",
  lines(
    "export function formatScaleResponseDate(date = new Date()): string {",
    '  return date.toLocaleDateString("pt-BR", {',
    '    day: "2-digit",',
    '    month: "long",',
    '    year: "numeric",',
    '    timeZone: "America/Recife",',
    "  });",
    "}",
  ),
  lines(
    "export function formatScaleResponseDate(date = new Date()): string {",
    "  return formatClinicalLongDate(date);",
    "}",
  ),
  "timezone Bahia",
);

// 3) PDF/compartilhamento: um único snapshot de data da aplicação.
replaceExact(
  "client/src/components/ClinicalReport.tsx",
  lines(
    '} from "@/lib/scaleResponseReport";',
    'import { printPlainTextDocument } from "@/lib/printDocument";',
  ),
  lines(
    '} from "@/lib/scaleResponseReport";',
    'import {',
    '  formatClinicalDate,',
    '  formatClinicalDateTime,',
    '} from "@/lib/clinicalDate";',
    'import { printPlainTextDocument } from "@/lib/printDocument";',
  ),
  "import de data clínica no relatório",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  lines(
    "async function sendEmail(",
    "  scaleName: string,",
    "  reportText: string,",
    "  setSent: (v: boolean) => void,",
    "  toast: (opts: any) => void,",
    ") {",
  ),
  lines(
    "async function sendEmail(",
    "  scaleName: string,",
    "  reportText: string,",
    "  applicationDate: Date,",
    "  setSent: (v: boolean) => void,",
    "  toast: (opts: any) => void,",
    ") {",
  ),
  "assinatura do email",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  '  const subject = `[NeuroPed] ${scaleName} — ${new Date().toLocaleDateString("pt-BR")}`;',
  '  const subject = `[NeuroPed] ${scaleName} — ${formatClinicalDate(applicationDate)}`;',
  "data do assunto",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  lines(
    "function generateReportText(props: NormalizedReport): string {",
    '  return `${buildScaleResponseText(props)}\\n---\\n${PROFESSIONAL_SIGNATURE.name} — ${PROFESSIONAL_SIGNATURE.specialty}\\n${PROFESSIONAL_SIGNATURE.registry}\\n${PROFESSIONAL_SIGNATURE.service}\\n`;',
    "}",
  ),
  lines(
    "function generateReportText(",
    "  props: NormalizedReport,",
    "  applicationDate: Date,",
    "): string {",
    '  return `${buildScaleResponseText(props, applicationDate)}\\n---\\n${PROFESSIONAL_SIGNATURE.name} — ${PROFESSIONAL_SIGNATURE.specialty}\\n${PROFESSIONAL_SIGNATURE.registry}\\n${PROFESSIONAL_SIGNATURE.service}\\n`;',
    "}",
  ),
  "texto com snapshot",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  lines(
    "export function ClinicalReport(rawProps: ClinicalReportProps) {",
    "  const props = normalizeReportProps(rawProps);",
    "  const [sending, setSending] = useState(false);",
  ),
  lines(
    "export function ClinicalReport(rawProps: ClinicalReportProps) {",
    "  const props = normalizeReportProps(rawProps);",
    "  const [applicationDate] = useState(() => new Date());",
    "  const [sending, setSending] = useState(false);",
  ),
  "snapshot da aplicação",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  "  const reportText = generateReportText(props);",
  "  const reportText = generateReportText(props, applicationDate);",
  "texto com data estável",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  '              `Data de emissão: ${new Date().toLocaleString("pt-BR")}`,',
  '              `Data da aplicação: ${formatClinicalDateTime(applicationDate)}`,',
  "data do PDF",
);

replaceExact(
  "client/src/components/ClinicalReport.tsx",
  "    await sendEmail(props.scaleName, reportText, setSent, toast);",
  lines(
    "    await sendEmail(",
    "      props.scaleName,",
    "      reportText,",
    "      applicationDate,",
    "      setSent,",
    "      toast,",
    "    );",
  ),
  "email com data estável",
);

// 4) PDF arquivado no paciente usa o mesmo conceito de snapshot local.
replaceExact(
  "client/src/components/SaveToPatient.tsx",
  'import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";',
  lines(
    'import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";',
    'import { formatClinicalDateTime } from "@/lib/clinicalDate";',
  ),
  "import de data clínica no arquivo",
);

replaceExact(
  "client/src/components/SaveToPatient.tsx",
  lines(
    "  const selectId = useId();",
    "  const newPatientId = useId();",
    '  const [selectedPatientId, setSelectedPatientId] = useState("");',
  ),
  lines(
    "  const selectId = useId();",
    "  const newPatientId = useId();",
    "  const [applicationDate] = useState(() => new Date());",
    '  const [selectedPatientId, setSelectedPatientId] = useState("");',
  ),
  "snapshot do PDF arquivado",
);

replaceExact(
  "client/src/components/SaveToPatient.tsx",
  '                `Data de emissão: ${new Date().toLocaleString("pt-BR")}`,',
  '                `Data da aplicação: ${formatClinicalDateTime(applicationDate)}`,',
  "data do PDF arquivado",
);

replaceExact(
  "client/src/components/SaveToPatient.tsx",
  "            answerCount: responses.length,",
  lines(
    "            answerCount: responses.length,",
    "            appliedAt: applicationDate.toISOString(),",
  ),
  "timestamp do snapshot",
);

// 5) Contratos de regressão: literalidade e fronteira de data UTC/Bahia.
replaceExact(
  "tests/clinical/test-scale-response-delivery.mjs",
  lines(
    '  "Resposta: Às vezes",',
    '  "Conclui as tarefas propostas?",',
    '  "Resposta: Frequentemente",',
  ),
  lines(
    '  "Resposta: Às vezes (1)",',
    '  "Conclui as tarefas propostas?",',
    '  "Resposta: 2 — Frequentemente",',
  ),
  "expectativa literal do relatório",
);

replaceExact(
  "tests/clinical/test-scale-response-delivery.mjs",
  lines(
    'assert.equal(formatScaleResponseAnswer("Nunca (0)"), "Nunca");',
    'assert.equal(formatScaleResponseAnswer("2 — Sempre"), "Sempre");',
  ),
  lines(
    'assert.equal(formatScaleResponseAnswer("Nunca (0)"), "Nunca (0)");',
    'assert.equal(formatScaleResponseAnswer("2 — Sempre"), "2 — Sempre");',
  ),
  "expectativa literal do formatador",
);

const frequencyAssertion = lines(
  "assert.equal(",
  '  formatScaleResponseAnswer("Raramente (0-1x/sem)"),',
  '  "Raramente (0-1x/sem)",',
  '  "frequência que faz parte da resposta deve ser preservada",',
  ");",
);
replaceExact(
  "tests/clinical/test-scale-response-delivery.mjs",
  frequencyAssertion,
  lines(
    frequencyAssertion,
    "assert.ok(",
    '  buildScaleResponseText(report, new Date("2026-08-22T01:30:00.000Z")).includes(',
    '    "21 de agosto de 2026",',
    "  ),",
    '  "data da aplicação deve respeitar America/Bahia perto da meia-noite UTC",',
    ");",
  ),
  "regressão de timezone",
);

console.log("hotfix aplicado com sucesso");
