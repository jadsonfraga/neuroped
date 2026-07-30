import type { InteractiveScaleDef } from "./interactiveScaleItems";
import { IPN_BANDS, IPN_LABELS } from "./interactiveScaleItemsIpnTeaCommon";
import { ipnTeaFamilyDomainsPart1 } from "./interactiveScaleItemsIpnTeaFamilyPart1";
import { ipnTeaFamilyDomainsPart2 } from "./interactiveScaleItemsIpnTeaFamilyPart2";
import { ipnTeaFamilyDomainsPart3 } from "./interactiveScaleItemsIpnTeaFamilyPart3";
import { ipnTeaFamilyDomainsPart4 } from "./interactiveScaleItemsIpnTeaFamilyPart4";
import { ipnTeaFamilyDomainsPart5 } from "./interactiveScaleItemsIpnTeaFamilyPart5";
import { ipnTeaSchoolDomainsPart1 } from "./interactiveScaleItemsIpnTeaSchoolPart1";
import { ipnTeaSchoolDomainsPart2 } from "./interactiveScaleItemsIpnTeaSchoolPart2";
import { ipnTeaSchoolDomainsPart3 } from "./interactiveScaleItemsIpnTeaSchoolPart3";
import { ipnTeaSchoolDomainsPart4 } from "./interactiveScaleItemsIpnTeaSchoolPart4";
import { ipnTeaSchoolDomainsPart5 } from "./interactiveScaleItemsIpnTeaSchoolPart5";
import { ipnTeaAdolescentDomainsPart1 } from "./interactiveScaleItemsIpnTeaAdolescentPart1";
import { ipnTeaAdolescentDomainsPart2 } from "./interactiveScaleItemsIpnTeaAdolescentPart2";
import { ipnTeaAdolescentDomainsPart3 } from "./interactiveScaleItemsIpnTeaAdolescentPart3";
import { ipnTeaClinicalDomainsPart1 } from "./interactiveScaleItemsIpnTeaClinicalPart1";
import { ipnTeaClinicalDomainsPart2 } from "./interactiveScaleItemsIpnTeaClinicalPart2";
import { ipnTeaClinicalDomainsPart3 } from "./interactiveScaleItemsIpnTeaClinicalPart3";

const INSTRUCTION =
  "Pontue cada item conforme o período e o contexto observados. Para respostas 2 ou 3, registre exemplo concreto, frequência, impacto e suporte que modificou o desempenho. Use N/O quando não houve oportunidade ou informação suficiente.";

export const ipnTeaCoreItems: Record<string, InteractiveScaleDef> = {
  "ipn-tea-familia-100": {
    instruction: INSTRUCTION,
    infoBox: "IPN-TEA 200 — versão Família. Instrumento autoral de apoio clínico, sem validação psicométrica e sem ponto de corte diagnóstico. N/O deve ser excluído de qualquer cálculo; um domínio só pode ser sintetizado com pelo menos 70% de respostas válidas. Alertas sentinela exigem ação própria antes de qualquer soma.",
    labels: IPN_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Registro clínico descritivo — IPN-TEA Família 100",
    bands: [...IPN_BANDS],
    domains: [
      ...ipnTeaFamilyDomainsPart1,
      ...ipnTeaFamilyDomainsPart2,
      ...ipnTeaFamilyDomainsPart3,
      ...ipnTeaFamilyDomainsPart4,
      ...ipnTeaFamilyDomainsPart5,
    ],
  },
  "ipn-tea-escola-100": {
    instruction: INSTRUCTION,
    infoBox: "IPN-TEA 200 — versão Escola. Instrumento autoral multicontextual, sem validação psicométrica e sem ponto de corte diagnóstico. Solicite exemplos em sala, recreio e transições. Bullying, fuga, exploração, recusa escolar ou fala de morte têm fluxo de proteção independente.",
    labels: IPN_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Registro clínico descritivo — IPN-TEA Escola 100",
    bands: [...IPN_BANDS],
    domains: [
      ...ipnTeaSchoolDomainsPart1,
      ...ipnTeaSchoolDomainsPart2,
      ...ipnTeaSchoolDomainsPart3,
      ...ipnTeaSchoolDomainsPart4,
      ...ipnTeaSchoolDomainsPart5,
    ],
  },
  "ipn-tea-adolescente-60": {
    instruction: INSTRUCTION,
    infoBox: "IPN-TEA 200 — autorrelato do adolescente. Instrumento autoral, sem validação psicométrica e sem ponto de corte diagnóstico. Deve ser respondido com privacidade e linguagem acessível. Abuso, exploração, autolesão ou ideação suicida exigem avaliação imediata.",
    labels: IPN_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Registro clínico descritivo — IPN-TEA Adolescente 60",
    bands: [...IPN_BANDS],
    domains: [
      ...ipnTeaAdolescentDomainsPart1,
      ...ipnTeaAdolescentDomainsPart2,
      ...ipnTeaAdolescentDomainsPart3,
    ],
  },
  "ipn-tea-observacao-60": {
    instruction: INSTRUCTION,
    infoBox: "IPN-TEA 200 — observação clínica. Registro autoral descritivo; uma consulta isolada não representa todos os contextos. Itens têm redação positiva e negativa, portanto não use o total como medida diagnóstica. Integre história, família, escola, autorrelato, acessibilidade e diferenciais.",
    labels: IPN_LABELS,
    optionPoints: [0, 1, 2, 3, 0],
    scoreDirection: "higher_worse",
    totalLabel: "Registro clínico descritivo — IPN-TEA Observação 60",
    bands: [...IPN_BANDS],
    domains: [
      ...ipnTeaClinicalDomainsPart1,
      ...ipnTeaClinicalDomainsPart2,
      ...ipnTeaClinicalDomainsPart3,
    ],
  },
};
