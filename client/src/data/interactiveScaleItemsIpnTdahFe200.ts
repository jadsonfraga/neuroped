import type { InteractiveScaleDef } from "./interactiveScaleItems";
import {
  IPN_TDAH_FE_BANDS,
  IPN_TDAH_FE_LABELS,
  IPN_TDAH_FE_OBSERVATION_LABELS,
  IPN_TDAH_FE_TEXT_BANDS,
  IPN_TDAH_FE_TEXT_LABELS,
} from "./interactiveScaleItemsIpnTdahFeCommon";
import { ipnTdahFeFamilyDomains } from "./interactiveScaleItemsIpnTdahFeFamily";
import { ipnTdahFeSchoolDomains } from "./interactiveScaleItemsIpnTdahFeSchool";
import { ipnTdahFeAdolescentDomains } from "./interactiveScaleItemsIpnTdahFeAdolescent";
import { ipnTdahFeObservationDomains } from "./interactiveScaleItemsIpnTdahFeObservation";
import { ipnTdahFeExecutiveDomains } from "./interactiveScaleItemsIpnTdahFeExecutive";
import { ipnTdahFeAnamnesisDomains } from "./interactiveScaleItemsIpnTdahFeAnamnesis";
import { ipnTdahFeDifferentialDomains } from "./interactiveScaleItemsIpnTdahFeDifferentials";
import { ipnTdahFeSynthesisDomains } from "./interactiveScaleItemsIpnTdahFeSynthesis";

const INSTRUCTION =
  "Considere os últimos seis meses e compare com pessoas da mesma idade e oportunidades semelhantes. Para respostas 2 ou 3, registre exemplo, contexto, frequência, prejuízo e suporte que modificou o desempenho. Use N/O quando não houver informação suficiente.";

const TEXT_INSTRUCTION =
  "Preencha somente o que for pertinente. Registre fatos, curso temporal, exemplos e fontes; evite transformar hipótese em conclusão. Os campos são qualitativos e não geram ponto de corte.";

export const ipnTdahFe200Items: Record<string, InteractiveScaleDef> = {
  "ipn-tdah-fe-familia-48": {
    instruction: INSTRUCTION,
    infoBox:
      "IPN-TDAH/FE 200 — Família. Instrumento autoral de organização pré-consulta, sem validação psicométrica e sem ponto de corte diagnóstico. A soma não confirma TDAH; início, persistência, prejuízo e presença em mais de um ambiente devem ser demonstrados. N/O não significa ausência de dificuldade.",
    labels: IPN_TDAH_FE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — IPN-TDAH/FE Família 48",
    bands: [...IPN_TDAH_FE_BANDS],
    domains: ipnTdahFeFamilyDomains,
  },
  "ipn-tdah-fe-escola-32": {
    instruction: INSTRUCTION,
    infoBox:
      "IPN-TDAH/FE 200 — Escola. Inventário autoral para participação em sala, aprendizagem, comportamento e funções executivas escolares. Compare com colegas da mesma idade, registre adaptações já testadas e não atribua automaticamente dificuldade pedagógica a TDAH.",
    labels: IPN_TDAH_FE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — IPN-TDAH/FE Escola 32",
    bands: [...IPN_TDAH_FE_BANDS],
    domains: ipnTdahFeSchoolDomains,
  },
  "ipn-tdah-fe-adolescente-20": {
    instruction:
      "Responda com privacidade sobre os últimos seis meses. Não há resposta certa. Itens de morte ou autolesão têm fluxo de segurança próprio e não devem ser tratados como parte rotineira do escore.",
    infoBox:
      "IPN-TDAH/FE 200 — Autorrelato do adolescente. Instrumento autoral não validado. Útil para experiência interna, impacto e metas; não substitui entrevista clínica nem avaliação específica de depressão, autolesão ou risco suicida.",
    labels: IPN_TDAH_FE_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — IPN-TDAH/FE Adolescente 20",
    bands: [...IPN_TDAH_FE_BANDS],
    domains: ipnTdahFeAdolescentDomains,
  },
  "ipn-tdah-fe-observacao-10": {
    instruction:
      "Registre apenas o que foi observado e em quais tarefas ocorreu. Uma consulta breve pode subestimar ou superestimar dificuldades; interprete junto à história e aos demais ambientes.",
    infoBox:
      "IPN-TDAH/FE 200 — Observação clínica. Registro autoral ecológico, sem validação e sem ponto de corte. O comportamento em consulta isolada não confirma nem exclui TDAH.",
    labels: IPN_TDAH_FE_OBSERVATION_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Registro descritivo — Observação clínica 10",
    bands: [...IPN_TDAH_FE_BANDS],
    domains: ipnTdahFeObservationDomains,
  },
  "ipn-tdah-fe-executivo-10": {
    instruction:
      "Use tarefas ecológicas breves de duas ou três etapas. Registre estratégia, pistas necessárias, autocorreção, tempo de retomada e resposta a mudança; não interprete uma tarefa isolada como teste diagnóstico.",
    infoBox:
      "IPN-TDAH/FE 200 — Perfil executivo ecológico. Instrumento autoral para observação de dez processos executivos; não substitui avaliação neuropsicológica ou inventários normatizados.",
    labels: IPN_TDAH_FE_OBSERVATION_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Perfil descritivo — Funções executivas 10",
    bands: [...IPN_TDAH_FE_BANDS],
    domains: ipnTdahFeExecutiveDomains,
  },
  "ipn-tdah-fe-anamnese-18": {
    instruction: TEXT_INSTRUCTION,
    infoBox:
      "Roteiro autoral de anamnese pré-consulta. Os 18 campos organizam desenvolvimento, curso, prejuízo, sono, escola, comorbidades, forças e red flags. Não gera escore e não substitui entrevista médica.",
    labels: IPN_TDAH_FE_TEXT_LABELS,
    optionPoints: [0],
    scoreDirection: "higher_worse",
    totalLabel: "Roteiro qualitativo — Anamnese TDAH/FE 18",
    bands: [...IPN_TDAH_FE_TEXT_BANDS],
    domains: ipnTdahFeAnamnesisDomains,
  },
  "ipn-tdah-fe-diferenciais-20": {
    instruction: TEXT_INSTRUCTION,
    infoBox:
      "Roteiro autoral de diagnóstico diferencial. Para cada hipótese, registre achados a favor e contra, curso temporal, coexistência e próximo passo. Diferencial não significa exclusão automática de TDAH.",
    labels: IPN_TDAH_FE_TEXT_LABELS,
    optionPoints: [0],
    scoreDirection: "higher_worse",
    totalLabel: "Roteiro qualitativo — Diferenciais TDAH/FE 20",
    bands: [...IPN_TDAH_FE_TEXT_BANDS],
    domains: ipnTdahFeDifferentialDomains,
  },
  "ipn-tdah-fe-sintese-15": {
    instruction: TEXT_INSTRUCTION,
    infoBox:
      "Ferramentas autorais de síntese, exame, documentação, devolutiva e plano de segurança. Os campos apoiam o raciocínio e a comunicação clínica; a decisão final permanece com o médico responsável.",
    labels: IPN_TDAH_FE_TEXT_LABELS,
    optionPoints: [0],
    scoreDirection: "higher_worse",
    totalLabel: "Roteiro qualitativo — Síntese TDAH/FE 15",
    bands: [...IPN_TDAH_FE_TEXT_BANDS],
    domains: ipnTdahFeSynthesisDomains,
  },
};

const EXPECTED_COUNTS: Record<string, number> = {
  "ipn-tdah-fe-familia-48": 48,
  "ipn-tdah-fe-escola-32": 32,
  "ipn-tdah-fe-adolescente-20": 20,
  "ipn-tdah-fe-observacao-10": 10,
  "ipn-tdah-fe-executivo-10": 10,
  "ipn-tdah-fe-anamnese-18": 18,
  "ipn-tdah-fe-diferenciais-20": 20,
  "ipn-tdah-fe-sintese-15": 15,
};

for (const [id, expected] of Object.entries(EXPECTED_COUNTS)) {
  const delivered = (ipnTdahFe200Items[id]?.domains ?? []).reduce(
    (total, domain) => total + domain.items.length,
    0,
  );
  if (delivered !== expected) {
    throw new Error(`[IPN-TDAH/FE 200] ${id}: ${delivered}/${expected} itens entregues`);
  }
}
