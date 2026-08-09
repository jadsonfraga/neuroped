import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = process.env.NEUROPED_DAILY_OUTPUT_DIR ? path.resolve(process.env.NEUROPED_DAILY_OUTPUT_DIR) : path.join(ROOT, "client/src/data/daily-authorial");
const MODEL = process.env.NEUROPED_DAILY_INVENTORY_MODEL || "gpt-5.6";
const EFFORT = process.env.NEUROPED_DAILY_REASONING_EFFORT === "max" ? "max" : "high";
const FORCE = process.env.NEUROPED_DAILY_FORCE === "true";

type Risk = "baixo" | "moderado" | "alto";
type Topic = { id: string; title: string; category: string; subcategory: string; ageMinMonths: number; ageMaxMonths: number; respondent: string; contexts: string[]; assessmentUse: string; riskClass: Risk; focus: string; exclusions: string };
type RawTopic = [string, string, string, string, number, number, string, string, string, Risk, string, string];
const t = (v: RawTopic): Topic => ({ id: v[0], title: v[1], category: v[2], subcategory: v[3], ageMinMonths: v[4], ageMaxMonths: v[5], respondent: v[6], contexts: v[7].split(","), assessmentUse: v[8], riskClass: v[9], focus: v[10], exclusions: v[11] });

const TOPICS: Record<number, Topic[]> = {
  0: [
    ["familia_sobrecarga","Sobrecarga e necessidades do cuidador","Família e cuidado","Sobrecarga familiar",0,215,"pais_cuidadores","casa,multicontexto","monitoramento","moderado","carga, apoio, sono e impacto funcional","culpabilização ou diagnóstico do cuidador"],
    ["familia_adesao","Adesão familiar ao plano terapêutico","Família e cuidado","Adesão e barreiras",0,215,"pais_cuidadores","casa,clinica,multicontexto","monitoramento","baixo","barreiras, compreensão e continuidade","julgamento moral ou recomendação automática"],
    ["familia_rotina","Organização de rotina e previsibilidade familiar","Família e cuidado","Rotina",12,215,"pais_cuidadores","casa","monitoramento","baixo","transições, antecipação e autonomia","rigidez normativa"],
    ["familia_qualidade_vida","Qualidade de vida familiar no neurodesenvolvimento","Família e cuidado","Qualidade de vida",0,215,"pais_cuidadores","casa,multicontexto","monitoramento","moderado","participação, relações, saúde e acesso","normas ou pontos de corte inventados"],
    ["familia_transicao_cuidado","Transição do cuidado para a adolescência","Família e cuidado","Transição",120,251,"multiplo","casa,clinica,multicontexto","observacao_clinica","moderado","autonomia, comunicação e rede","decisões legais ou capacidade civil"]
  ].map(t),
  1: [
    ["tea_atencao_conjunta","Atenção conjunta em situações naturais","Neurodesenvolvimento","Comunicação social",9,72,"multiplo","casa,escola,clinica,multicontexto","observacao_clinica","baixo","iniciar, responder e sustentar interesse compartilhado","copiar itens protegidos ou concluir TEA"],
    ["tea_pragmatica","Comunicação pragmática funcional","Neurodesenvolvimento","Linguagem pragmática",36,215,"multiplo","casa,escola,clinica,multicontexto","triagem_estruturada","baixo","reciprocidade, inferência e reparo comunicativo","diagnóstico isolado"],
    ["tea_flexibilidade","Flexibilidade e resposta a mudanças","Neurodesenvolvimento","Flexibilidade comportamental",24,215,"multiplo","casa,escola,multicontexto","monitoramento","moderado","transições, imprevistos e estratégias","patologizar preferências"],
    ["tea_brincar","Brincadeira funcional, simbólica e compartilhada","Neurodesenvolvimento","Brincar",12,96,"multiplo","casa,escola,clinica","observacao_clinica","baixo","variedade, simbolização, imitação e turnos","padrão cultural único"],
    ["tea_mascaramento","Custo funcional do mascaramento social","Saúde mental infantil","Mascaramento e exaustão",96,251,"crianca_adolescente","escola,clinica,multicontexto","triagem_estruturada","moderado","esforço, exaustão, scripts e recuperação","inferir TEA ou autenticidade"]
  ].map(t),
  2: [
    ["tdah_iniciacao","Iniciação e conclusão de tarefas","Funções executivas","Ativação",72,215,"multiplo","casa,escola,multicontexto","monitoramento","baixo","começar, manter, concluir e estimar tempo","diagnóstico isolado"],
    ["tdah_memoria_trabalho","Memória de trabalho no cotidiano","Funções executivas","Memória de trabalho",60,215,"multiplo","casa,escola,multicontexto","triagem_estruturada","baixo","reter instruções e seguir etapas","substituir avaliação cognitiva"],
    ["tdah_impulsividade","Impulsividade e antecipação de consequências","Funções executivas","Controle inibitório",48,215,"multiplo","casa,escola,multicontexto","monitoramento","moderado","espera, interrupções, risco e reparação","atribuir intenção moral"],
    ["tdah_tempo","Percepção e manejo do tempo","Funções executivas","Organização temporal",84,251,"multiplo","casa,escola,multicontexto","monitoramento","baixo","estimativa, prazos, transições e ferramentas","pontos de corte"],
    ["tdah_regulacao_emocional","Regulação emocional associada a demandas executivas","Funções executivas","Regulação emocional",48,215,"multiplo","casa,escola,multicontexto","monitoramento","moderado","gatilhos, recuperação e estratégias","diagnosticar humor ou TOD"]
  ].map(t),
  3: [
    ["ansiedade_separacao","Ansiedade de separação e impacto funcional","Saúde mental infantil","Ansiedade",36,180,"multiplo","casa,escola,multicontexto","triagem_estruturada","moderado","antecipação, evitação, sintomas físicos e prejuízo","diagnóstico isolado"],
    ["ansiedade_social","Ansiedade social em situações escolares","Saúde mental infantil","Ansiedade social",72,215,"multiplo","escola,clinica,multicontexto","triagem_estruturada","moderado","medo de avaliação, evitação e participação","confundir introversão"],
    ["humor_anedonia","Perda de interesse e funcionamento diário","Saúde mental infantil","Humor",96,251,"crianca_adolescente","casa,escola,clinica,multicontexto","triagem_estruturada","alto","mudança basal, interesse, energia e segurança","somar ideação ao escore"],
    ["somatizacao","Sintomas físicos associados a estresse","Saúde mental infantil","Somatização",72,215,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","moderado","padrão, contexto, prejuízo e avaliação médica","atribuir sintoma automaticamente à ansiedade"],
    ["trauma_seguranca","Reações pós-evento e necessidades de segurança","Saúde mental infantil","Trauma",48,251,"multiplo","casa,escola,clinica,multicontexto","triagem_estruturada","alto","intrusões, evitação, alerta e proteção","investigação forense ou perguntas sugestivas"]
  ].map(t),
  4: [
    ["irritabilidade_gatilhos","Gatilhos e recuperação da irritabilidade","Comportamento","Irritabilidade",36,215,"multiplo","casa,escola,multicontexto","monitoramento","moderado","antecedentes, intensidade, duração e recuperação","inferir manipulação"],
    ["agressividade_funcional","Análise funcional de episódios agressivos","Comportamento","Agressividade",24,215,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","alto","antecedentes, dano, comunicação e segurança","escore de periculosidade"],
    ["autoagressao_contexto","Contexto e segurança na autoagressão","Comportamento","Autoagressão",24,251,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","alto","forma, lesão, função, meios e proteção","detalhar métodos ou usar pontuação total"],
    ["oposicao_demanda","Resposta a demandas e possíveis confundidores","Comportamento","Oposição",48,215,"multiplo","casa,escola,multicontexto","triagem_estruturada","moderado","compreensão, ansiedade, flexibilidade e fadiga","rotular caráter"],
    ["uso_telas_regulacao","Uso de telas e autorregulação","Comportamento","Tecnologia e rotina",24,215,"pais_cuidadores","casa","monitoramento","baixo","função, transições, sono e alternativas","chamar de vício sem critérios"]
  ].map(t),
  5: [
    ["aprendizagem_leitura","Perfil funcional de leitura","Aprendizagem e linguagem","Leitura",72,215,"multiplo","escola,clinica,multicontexto","triagem_estruturada","baixo","decodificação, fluência, compreensão e esforço","diagnosticar dislexia"],
    ["aprendizagem_escrita","Perfil funcional de escrita","Aprendizagem e linguagem","Escrita",72,215,"multiplo","escola,clinica,multicontexto","triagem_estruturada","baixo","ortografia, composição, grafomotricidade e fadiga","usar caligrafia como diagnóstico"],
    ["aprendizagem_matematica","Perfil funcional de matemática","Aprendizagem e linguagem","Matemática",72,215,"multiplo","escola,clinica,multicontexto","triagem_estruturada","baixo","senso numérico, procedimentos e problemas","diagnosticar discalculia"],
    ["fala_inteligibilidade","Inteligibilidade e impacto dos sons da fala","Aprendizagem e linguagem","Sons da fala",24,144,"multiplo","casa,escola,clinica,multicontexto","monitoramento","baixo","compreensão, consistência, esforço e participação","substituir avaliação fonoaudiológica"],
    ["altas_habilidades","Indicadores funcionais de altas habilidades","Aprendizagem e linguagem","Altas habilidades",60,215,"multiplo","casa,escola,clinica,multicontexto","triagem_estruturada","baixo","aprendizagem, criatividade, motivação e necessidade educacional","presumir QI ou confirmar isoladamente"]
  ].map(t),
  6: [
    ["neurologia_eventos_paroxisticos","Semiologia e segurança em eventos paroxísticos pediátricos","Neurologia infantil","Epilepsia e eventos paroxísticos",0,215,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","alto","início, responsividade, motor, duração e segurança","classificar isoladamente ou omitir emergência"],
    ["neurologia_cefaleia","Diário funcional de cefaleia pediátrica","Neurologia infantil","Cefaleia",60,251,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","alto","frequência, incapacidade, associados e red flags","diagnosticar migrânea ou indicar medicamento"],
    ["neurologia_sono","Eventos motores e comportamentais do sono","Neurologia infantil","Sono",12,215,"pais_cuidadores","casa","registro_clinico","moderado","horário, responsividade, memória, duração e vídeo","distinguir epilepsia de parassonia"],
    ["neurologia_movimentos","Caracterização de movimentos involuntários","Neurologia infantil","Distúrbios do movimento",12,215,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","moderado","distribuição, ritmo, supressibilidade e impacto","nomear síndrome ou indicar fármaco"],
    ["neurologia_regressao","Registro estruturado de perda de habilidades","Neurologia infantil","Regressão do desenvolvimento",0,215,"multiplo","casa,escola,clinica,multicontexto","registro_clinico","alto","habilidade prévia, temporalidade, domínios e sinais neurológicos","espera passiva ou etiologia presumida"]
  ].map(t)
};

const object = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({ type: "object", additionalProperties: false, properties, required });
const stringArray = { type: "array", minItems: 2, items: { type: "string" } };
const SCHEMA = object({
  title: { type: "string" }, shortTitle: { type: "string" }, rationale: { type: "string" }, purpose: { type: "string" }, timeframe: { type: "string" }, durationMinutes: { type: "integer", minimum: 3, maximum: 40 }, instructions: { type: "string" },
  responseOptions: { type: "array", minItems: 2, maxItems: 8, items: object({ code: { type: "string" }, label: { type: "string" }, value: { anyOf: [{ type: "number" }, { type: "null" }] } }) },
  domains: { type: "array", minItems: 3, maxItems: 8, items: object({ id: { type: "string" }, label: { type: "string" }, description: { type: "string" } }) },
  items: { type: "array", minItems: 12, maxItems: 30, items: object({ id: { type: "string" }, domainId: { type: "string" }, text: { type: "string" }, responseMode: { type: "string", enum: ["frequencia_0_3","sim_nao","presente_ausente","descritivo"] }, redFlag: { type: "boolean" }, clinicalNote: { type: "string" } }) },
  scoring: object({ mode: { type: "string", enum: ["perfil_qualitativo_sem_total"] }, totalScoreEnabled: { type: "boolean", enum: [false] }, instructions: { type: "string" }, domainInterpretation: { type: "string" }, redFlagRule: { type: "string" } }),
  redFlags: { type: "array", items: object({ itemId: { type: "string" }, action: { type: "string" } }) }, differentialConsiderations: stringArray, clinicalIntegration: stringArray, limitations: { ...stringArray, minItems: 3 }, safetyNote: { type: "string" }, tags: { ...stringArray, minItems: 4 }
});

const normalize = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const slugify = (v: string) => normalize(v).replace(/ /g, "-").slice(0, 80);
const dateNow = () => process.env.NEUROPED_GENERATION_DATE || new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay();

export function isValidCalendarDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function positiveModulo(value: number, divisor: number): number {
  if (!Number.isInteger(divisor) || divisor <= 0) throw new Error("Divisor deve ser inteiro positivo.");
  return ((value % divisor) + divisor) % divisor;
}

async function catalog(): Promise<any[]> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const files = (await readdir(OUTPUT_DIR)).filter((v) => v.endsWith(".json"));
  return Promise.all(files.map(async (v) => JSON.parse(await readFile(path.join(OUTPUT_DIR, v), "utf8"))));
}

export function selectTopic(date: string, records: any[]): Topic {
  const requested = process.env.NEUROPED_DAILY_TOPIC_ID;
  const all = Object.values(TOPICS).flat();
  if (requested) {
    const found = all.find((v) => v.id === requested);
    if (!found) throw new Error(`Tema inexistente: ${requested}`);
    return found;
  }
  const pool = TOPICS[weekday(date)];
  const weeks = Math.floor((Date.parse(`${date}T12:00:00Z`) - Date.parse("2026-08-02T12:00:00Z")) / 604800000);
  for (let offset = 0; offset < pool.length; offset++) {
    const candidate = pool[positiveModulo(weeks + offset, pool.length)];
    const recent = records.some((v) => v.topicId === candidate.id && Math.abs(Date.parse(`${date}T12:00:00Z`) - Date.parse(`${v.generatedOn}T12:00:00Z`)) < 30 * 86400000);
    if (!recent || FORCE) return candidate;
  }
  throw new Error("Todos os temas do dia estão no bloqueio de 30 dias.");
}

function outputText(response: any): string {
  const result: string[] = [];
  for (const output of response?.output ?? []) for (const content of output?.content ?? []) {
    if (content?.type === "output_text" && typeof content.text === "string") result.push(content.text);
    if (content?.type === "refusal") throw new Error(`Geração recusada: ${content.refusal ?? "sem detalhe"}`);
  }
  if (!result.length) throw new Error("A API não retornou JSON utilizável.");
  return result.join("");
}

function validate(v: any): string[] {
  const e: string[] = [];
  if (!v || typeof v !== "object") return ["registro não é objeto"];
  if (v.schemaVersion !== "1.0.0" || v.sourceType !== "autoral_diario") e.push("origem inválida");
  if (v.validationStatus !== "nao_validado_psicometricamente" || !["rascunho_revisao","revisado_clinicamente","arquivado"].includes(v.status)) e.push("status inválido");
  if (!Number.isInteger(v.ageMinMonths) || !Number.isInteger(v.ageMaxMonths) || v.ageMinMonths < 0 || v.ageMaxMonths > 251 || v.ageMinMonths > v.ageMaxMonths) e.push("faixa etária inválida");
  if (!Array.isArray(v.domains) || v.domains.length < 3 || v.domains.length > 8) e.push("domínios inválidos");
  if (!Array.isArray(v.items) || v.items.length < 12 || v.items.length > 30) e.push("itens inválidos");
  const domains = new Set((v.domains ?? []).map((x: any) => x.id)); const ids = new Set<string>(); const texts = new Set<string>(); const critical = new Set<string>();
  for (const item of v.items ?? []) {
    if (!item.id || ids.has(item.id)) e.push(`item duplicado: ${item.id}`); else ids.add(item.id);
    if (!domains.has(item.domainId)) e.push(`domínio inexistente: ${item.id}`);
    const text = normalize(String(item.text ?? "")); if (!text || texts.has(text)) e.push(`texto duplicado: ${item.id}`); else texts.add(text);
    if (item.redFlag) critical.add(item.id);
  }
  if (v.scoring?.mode !== "perfil_qualitativo_sem_total" || v.scoring?.totalScoreEnabled !== false) e.push("pontuação total proibida");
  const mapped = new Set((v.redFlags ?? []).map((x: any) => x.itemId)); for (const id of critical) if (!mapped.has(id)) e.push(`red flag sem ação: ${id}`);
  if (v.riskClass === "alto" && !critical.size) e.push("tema de alto risco sem red flags");
  const text = normalize(JSON.stringify(v));
  for (const term of ["confirma o diagnostico","fecha diagnostico","ponto de corte","sensibilidade de","especificidade de","prescrever","dose de "]) if (text.includes(term)) e.push(`linguagem proibida: ${term}`);
  if (!text.includes("nao substitui")) e.push("falta aviso de não substituição clínica");
  if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(JSON.stringify(v))) e.push("possível CPF");
  return e;
}

async function validateOnly() {
  const records = await catalog(); const ids = new Set<string>(); const dates = new Set<string>(); const errors: string[] = [];
  for (const v of records) {
    errors.push(...validate(v).map((x) => `${v.slug ?? "sem-slug"}: ${x}`));
    if (!isValidCalendarDate(String(v.generatedOn ?? ""))) errors.push(`${v.slug ?? "sem-slug"}: data de geração inválida`);
    if (ids.has(v.id)) errors.push(`id duplicado: ${v.id}`); else ids.add(v.id);
    if (dates.has(v.generatedOn)) errors.push(`mais de um registro em ${v.generatedOn}`); else dates.add(v.generatedOn);
  }
  if (errors.length) throw new Error(`Catálogo inválido:\n- ${errors.join("\n- ")}`);
  console.log(`Catálogo autoral diário válido: ${records.length} registro(s).`);
}

async function recordFilenamesForDate(date: string, outputDir: string): Promise<string[]> {
  const files = (await readdir(outputDir)).filter((value) => value.endsWith(".json"));
  const matches: string[] = [];
  for (const filename of files) {
    const record = JSON.parse(await readFile(path.join(outputDir, filename), "utf8"));
    if (record.generatedOn === date) matches.push(filename);
  }
  return matches.sort();
}

const DATE_LOCK_TIMEOUT_MS = 30_000;

async function acquireDateLock(date: string, outputDir: string): Promise<string> {
  const lockDirectory = path.join(outputDir, `.replace-${date}.lock`);
  const deadline = Date.now() + DATE_LOCK_TIMEOUT_MS;
  while (true) {
    try {
      await mkdir(lockDirectory);
      return lockDirectory;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (Date.now() >= deadline) throw new Error(`Tempo esgotado aguardando bloqueio de substituição para ${date}.`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

export async function replaceDatedRecord(
  date: string,
  filename: string,
  content: string,
  outputDir = OUTPUT_DIR,
): Promise<void> {
  if (!isValidCalendarDate(date)) throw new Error("Data deve usar AAAA-MM-DD e existir no calendário.");
  await mkdir(outputDir, { recursive: true });
  const lockDirectory = await acquireDateLock(date, outputDir);
  const destination = path.join(outputDir, filename);
  const temporary = path.join(outputDir, `.${filename}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, content, "utf8");
    await rename(temporary, destination);

    const staleFiles = (await recordFilenamesForDate(date, outputDir)).filter(
      (existing) => existing !== filename,
    );
    await Promise.all(staleFiles.map((existing) => unlink(path.join(outputDir, existing))));
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  } finally {
    await unlink(temporary).catch(() => undefined);
    await rmdir(lockDirectory);
  }
}

function serialFromRecord(record: any): string | null {
  const match = String(record?.id ?? "").match(/-(\d+)$/);
  return match?.[1] ?? null;
}

export function selectInventorySerial(date: string, records: any[]): string {
  const preserved = records
    .filter((record) => record.generatedOn === date)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map(serialFromRecord)
    .find((serial): serial is string => serial !== null);
  if (preserved) return preserved;

  const greatest = records.reduce((current, record) => {
    const serial = Number(serialFromRecord(record));
    return Number.isSafeInteger(serial) ? Math.max(current, serial) : current;
  }, 0);
  return String(greatest + 1).padStart(3, "0");
}

async function generate() {
  const date = dateNow(); if (!isValidCalendarDate(date)) throw new Error("Data deve usar AAAA-MM-DD e existir no calendário.");
  const records = await catalog();
  const datedRecords = records.filter((record) => record.generatedOn === date);
  if (datedRecords.length > 1) throw new Error(`Mais de um inventário encontrado para ${date}.`);
  const promotableContingency = datedRecords.some((record) => record.status === "rascunho_revisao" && (record.contingency === true || String(record.generation?.model ?? "").startsWith("fallback-")));
  if (datedRecords.length && !FORCE && !promotableContingency) return console.log(`Já existe inventário para ${date}.`);
  if (FORCE) {
    const protectedRecord = datedRecords.find((record) => ["revisado_clinicamente", "arquivado"].includes(record.status));
    if (protectedRecord) throw new Error(`Substituição bloqueada: o inventário ${protectedRecord.id ?? date} possui status ${protectedRecord.status}.`);
  }
  const existingFilenames = datedRecords.length ? await recordFilenamesForDate(date, OUTPUT_DIR) : [];
  const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");
  const topic = selectTopic(date, records);
  const prompt = `Tema: ${topic.title}. Categoria: ${topic.category}/${topic.subcategory}. Faixa: ${topic.ageMinMonths}-${topic.ageMaxMonths} meses. Respondente: ${topic.respondent}. Contextos: ${topic.contexts.join(", ")}. Uso: ${topic.assessmentUse}. Risco: ${topic.riskClass}. Priorize ${topic.focus}. Exclua ${topic.exclusions}. Gere 12-24 itens em 3-6 domínios, com linguagem observável, diferenciais, integração e limitações. Declare que não substitui avaliação clínica. Temas de alto risco exigem red flags com ações claras e sem detalhar métodos.`;
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` }, body: JSON.stringify({
    model: MODEL, store: false, safety_identifier: createHash("sha256").update("neuroped-daily-authorial-v1").digest("hex"), reasoning: { mode: "pro", effort: EFFORT }, max_output_tokens: 20000,
    input: [{ role: "system", content: [{ type: "input_text", text: "Crie instrumento autoral original em português brasileiro. Não copie escalas protegidas. Não invente normas, pontos de corte, sensibilidade ou especificidade. Não diagnostique nem prescreva. Red flags ficam fora de soma. Responda apenas o JSON solicitado." }] }, { role: "user", content: [{ type: "input_text", text: prompt }] }],
    text: { format: { type: "json_schema", name: "neuroped_daily_inventory", strict: true, schema: SCHEMA } }
  }) });
  if (!response.ok) throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
  const draft = JSON.parse(outputText(await response.json())); const slug = slugify(draft.shortTitle || topic.title);
  const serial = selectInventorySerial(date, records);
  const record = { schemaVersion: "1.0.0", id: `NEUROPED-DIARIO-${date.replaceAll("-", "")}-${serial}`, slug, version: "1.0.0", generatedOn: date, generatedAt: new Date().toISOString(), author: "NeuroPed SDG — Dr. Jadson Fraga", sourceType: "autoral_diario", validationStatus: "nao_validado_psicometricamente", status: "rascunho_revisao", topicId: topic.id, topic: topic.title, category: topic.category, subcategory: topic.subcategory, ageMinMonths: topic.ageMinMonths, ageMaxMonths: topic.ageMaxMonths, respondent: topic.respondent, contexts: topic.contexts, assessmentUse: topic.assessmentUse, riskClass: topic.riskClass, ...draft, duplicateCooldownDays: 30, generation: { model: MODEL, reasoningMode: "pro", reasoningEffort: EFFORT, pipelineVersion: "1.0.0" } };
  const errors = validate(record); if (errors.length) throw new Error(`Geração bloqueada:\n- ${errors.join("\n- ")}`);
  const generatedFilename = `${date}-${slug}.json`;
  const filename = FORCE && existingFilenames.length ? existingFilenames[0] : generatedFilename;
  const content = `${JSON.stringify(record, null, 2)}\n`;
  if (FORCE || promotableContingency) await replaceDatedRecord(date, filename, content); else await writeFile(path.join(OUTPUT_DIR, filename), content, "utf8");
  console.log(`Inventário criado: ${filename}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--validate-only")) await validateOnly(); else await generate();
}
