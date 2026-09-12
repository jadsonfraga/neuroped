import type { ScaleEntry } from "./scaleFilter";

/** Transcrição do PDF fornecido pelo autor; apenas quebras de linha normalizadas. */
export const REGULA20_ID = "regula-20-sdg";
export const REGULA20_ROUTE = "/filtro?autoral=regula-20-sdg";
export const REGULA20_VERSION = "1.0-pdf-20260912";
export const REGULA20_SOURCE = {
  filename: "REGULA_20_SDG_v1_0_12-09-2026.pdf",
  integrity: "sha256:035f93b584f7b2580de5567e1fd8b8eeaf0a32a88d042dca442d9bbc3151777a",
  date: "2026-09-12",
  author: "Dr. Jadson Fraga",
  brand: "NeuroPed SDG",
} as const;
export const REGULA20_WARNING = "Instrumento clínico autoral de monitorização. Não é teste diagnóstico validado. Não possui pontos de corte diagnósticos, percentis ou limiar validado de mudança clinicamente significativa. A interpretação depende da avaliação clínica.";

export const REGULA20_DOMAINS = [
  "A. Frustração, transições e vulnerabilidade contextual",
  "B. Escalada comportamental",
  "C. Recuperação e co-regulação",
  "D. Repercussão funcional",
] as const;

export const REGULA20_ITEMS = [
  "Ao ouvir um “não” ou precisar interromper algo desejado, demora a conseguir iniciar a atividade seguinte.",
  "Pequenas mudanças na ordem do dia ou no combinado desencadeiam choro, oposição ou aumento progressivo do tom de voz.",
  "Esperar a vez, aguardar uma resposta ou adiar algo desejado leva a agitação difícil de reorganizar.",
  "Erros, perdas em jogos ou tarefas difíceis provocam reação que interrompe o que estava sendo feito.",
  "Cansaço, fome, barulho, calor, ambiente cheio ou outro desconforto percebido contribuem para perder a regulação.",
  "Durante a desregulação, o volume da voz, o choro ou os gritos aumentam e ficam difíceis de redirecionar.",
  "Repete pedidos, perguntas ou reclamações em sequência, mesmo depois de receber uma resposta clara.",
  "Empurra, joga ou bate em objetos, portas ou móveis quando está muito irritado(a).",
  "Dirige xingamentos, frases hostis, ameaças verbais ou gestos agressivos a outras pessoas durante o episódio.",
  "Sai bruscamente do local, se esconde ou abandona a atividade para escapar da situação que gerou a desregulação.",
  "Mesmo depois de o gatilho terminar ou ser resolvido, permanece irritado(a) e demora mais de cerca de 10 minutos para retomar a rotina.",
  "Tem dificuldade de aceitar ajuda de calma ou co-regulação que costuma funcionar em outros momentos.",
  "Volta ao mesmo assunto, conflito ou exigência pouco depois de parecer recuperado(a), reiniciando a desregulação.",
  "Precisa reduzir estímulos - menos pessoas, menos fala ou um local mais tranquilo - para conseguir se reorganizar.",
  "Depois do episódio, apresenta cansaço, sonolência ou retraimento suficiente para atrasar a retomada das atividades.",
  "Os episódios atrasam ou interrompem refeições, higiene, vestir-se ou a rotina de dormir.",
  "Os episódios dificultam entrar, permanecer ou participar de escola, terapia, esporte, igreja ou outra atividade habitual.",
  "Passeios, compromissos ou visitas são encurtados, adiados ou cancelados por causa da desregulação ou da expectativa de que ela ocorra.",
  "Irmãos, cuidadores ou outras pessoas precisam mudar a própria rotina para prevenir ou manejar os episódios.",
  "Em dias de maior irritabilidade, a participação em brincadeiras, estudo, conversa ou convivência fica claramente reduzida.",
] as const;

export const REGULA20_OPTIONS = [
  { label: "0 · Não ocorreu", description: "O comportamento/situação não foi observado na janela." },
  { label: "1 · Leve repercussão", description: "Ocorreu, mas a rotina seguiu sem necessidade de intervenção relevante." },
  { label: "2 · Necessitou ajuda breve", description: "Exigiu orientação, pausa ou ajuste curto e a atividade foi retomada em até cerca de 10 minutos." },
  { label: "3 · Interrupção importante", description: "Exigiu apoio prolongado, mudança do ambiente ou interrupção/adiamento da atividade." },
  { label: "4 · Repercussão muito intensa", description: "A rotina precisou ser suspensa, houve retirada do ambiente ou necessidade de ajuda intensiva para reorganização." },
  { label: "N/O · Não observável", description: "Não houve oportunidade suficiente para julgar o item. Não entra no cálculo." },
] as const;

export const REGULA20_RED_FLAGS = [
  "Fala sobre morrer, querer se machucar ou apresenta autoagressão com possibilidade de lesão.",
  "Agressão causa ferimento em outra pessoa ou envolve acesso/uso de objetos potencialmente perigosos.",
  "Fuga ou corrida coloca a criança/adolescente em risco de trânsito, água, altura, perda de supervisão ou outro perigo imediato.",
  "Mudança comportamental súbita associada a febre, dor importante, vômitos repetidos, dificuldade para respirar, intoxicação suspeita ou alteração do nível de consciência.",
  "Episódios incluem parada de resposta, queda, movimentos anormais, olhar fixo incomum ou confusão pós-evento, levantando possibilidade de evento neurológico.",
  "Há redução acentuada do sono por vários dias acompanhada de agitação muito fora do padrão, fala acelerada, comportamento desorganizado ou risco incomum.",
  "O cuidador relata que não consegue manter a segurança física da criança/adolescente ou das pessoas ao redor.",
] as const;

/** Fica no catálogo, mas só o filtro autoral explícito pode iniciar esta aplicação. */
export const regula20CatalogEntry: ScaleEntry = {
  id: REGULA20_ID,
  name: "REGULA-20 SDG",
  fullName: "Monitor Autoral de Irritabilidade, Desregulação e Recuperação Funcional · v1.0",
  ageMin: 36,
  ageMax: 215,
  queixas: ["comportamento"],
  respondente: ["pais", "professor", "clinico"],
  prioridade: "monitorizacao",
  assessmentUse: "monitorizacao",
  tempo: "20 itens · tempo não aferido",
  appRoute: REGULA20_ROUTE,
  implementationStatus: "complete",
  description: "Registro basal ou seguimento da repercussão funcional de irritabilidade/desregulação nos últimos 14 dias. Aplicação dedicada com escolha explícita de finalidade, idade exata e observador. Casa, escola e terapia preenchem separadamente. " + REGULA20_WARNING,
  fonte: `${REGULA20_SOURCE.author} · ${REGULA20_SOURCE.brand} · ${REGULA20_SOURCE.filename} · ${REGULA20_SOURCE.integrity}`,
  tipo: "Autoral de monitorização funcional; seleção explícita",
  licencaUso: "autoral",
  validacaoBrasil: "Sem validação psicométrica; não é teste diagnóstico validado.",
  scoringCutoff: "Médias 0–4; global apenas com 16/20 itens observáveis. N/O excluído. Soma bruta 0–80 somente com 20/20 observáveis; sem classificação de gravidade.",
  pendente_validacao_clinica: true,
  pendencia: "Revisão médica dos resultados necessária; integração técnica não equivale a validação clínica ou psicométrica.",
  verbalRequirement: "indiferente",
  literacyRequirement: "indiferente",
  suicideRiskInstrument: false,
  psychosisRiskInstrument: false,
  signalTags: ["irritabilidade", "desregulacao", "recuperacao", "impacto funcional", "co-regulacao"],
  exemploPais: "Quando seu filho se desorganiza, o que deixa de conseguir fazer e como volta à rotina?",
};

export type Regula20Purpose = "basal-funcional" | "seguimento-funcional";
export type Regula20Respondent = "pais" | "professor" | "clinico";
export type Regula20Context = "casa" | "escola" | "terapia" | "outro";

export function regula20Eligibility(input: { ageMonths: number; respondent: string; purpose: string; focus: string }) {
  if (!Number.isInteger(input.ageMonths) || input.ageMonths < 36 || input.ageMonths > 215) return { eligible: false, reason: "Informe idade exata entre 3 anos e 17 anos e 11 meses." };
  if (!["pais", "professor", "clinico"].includes(input.respondent)) return { eligible: false, reason: "O formulário é respondido por um adulto que observou a criança; não é autorrelato nem teste direto." };
  if (!["basal-funcional", "seguimento-funcional"].includes(input.purpose)) return { eligible: false, reason: "Escolha registro basal funcional ou seguimento. Este instrumento não tem finalidade diagnóstica." };
  if (input.focus !== "irritabilidade-funcional") return { eligible: false, reason: "Selecione explicitamente irritabilidade, desregulação e recuperação funcional." };
  return { eligible: true, reason: "Compatível com idade, observador e finalidade funcional. Uma aplicação por respondente e contexto; não empilhar monitores semelhantes nesta mesma coleta." };
}

/** 5 representa N/O no contrato da interface; nunca vale cinco pontos nem zero. */
export function calculateRegula20(answers: readonly unknown[]) {
  const valid = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5;
  if (answers.length > 20 || answers.some((value) => value !== undefined && !valid(value))) throw new Error("Resposta inválida no REGULA-20: use índices 0–4 ou 5 para N/O.");
  const domains = REGULA20_DOMAINS.map((name, domainIndex) => {
    const values = Array.from({ length: 5 }, (_, i) => answers[domainIndex * 5 + i]);
    const observed = values.filter((value): value is number => valid(value) && value < 5);
    const sum = observed.reduce((a, b) => a + b, 0);
    return { name, observed: observed.length, notObserved: values.filter((value) => value === 5).length, missing: values.filter((value) => value === undefined).length, sum, mean: observed.length ? sum / observed.length : null };
  });
  const observed = domains.reduce((n, domain) => n + domain.observed, 0);
  const sum = domains.reduce((n, domain) => n + domain.sum, 0);
  const missing = domains.reduce((n, domain) => n + domain.missing, 0);
  return {
    version: REGULA20_VERSION,
    domains,
    observed,
    notObserved: domains.reduce((n, domain) => n + domain.notObserved, 0),
    missing,
    complete: missing === 0,
    globalMean: observed >= 16 ? sum / observed : null,
    rawTotal: observed === 20 ? sum : null,
    observedItemIndexes: Array.from({ length: 20 }, (_, i) => i).filter((i) => valid(answers[i]) && (answers[i] as number) < 5),
  };
}

export type Regula20SafetyAnswer = "presente" | "nao-relatado" | "nao-sei";
export function regula20SafetyState(answers: readonly unknown[]) {
  const complete = answers.length === 7 && Array.from({ length: 7 }, (_, i) => answers[i]).every((value) => ["presente", "nao-relatado", "nao-sei"].includes(String(value)));
  return { complete, needsReview: !complete || answers.some((value) => value === "presente" || value === "nao-sei") };
}

/** Sem percentuais de melhora, cortes clínicos ou comparação entre instrumentos. */
export function compareRegula20(
  basal: { version: string; respondent: string; observer: string; context: string; answers: readonly unknown[] },
  followup: { version: string; respondent: string; observer: string; context: string; answers: readonly unknown[] },
) {
  const a = calculateRegula20(basal.answers);
  const b = calculateRegula20(followup.answers);
  const sameSource = basal.version === REGULA20_VERSION && followup.version === REGULA20_VERSION && basal.respondent === followup.respondent && basal.observer.trim() !== "" && basal.observer === followup.observer && basal.context === followup.context;
  const sameItems = a.observedItemIndexes.join(",") === b.observedItemIndexes.join(",");
  if (!sameSource || !sameItems || !a.complete || !b.complete || a.globalMean === null || b.globalMean === null) return { delta: null, reason: "Comparação não calculada: conferir versão, observador, contexto, completude e o mesmo conjunto de itens observáveis." };
  return { delta: b.globalMean - a.globalMean, reason: "Diferença descritiva seguimento menos basal. Revisar mudanças de contexto; não demonstra eficácia nem mudança clinicamente significativa isoladamente." };
}
