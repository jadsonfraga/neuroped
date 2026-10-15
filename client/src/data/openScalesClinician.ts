// Onda 1 — escalas ABERTAS aplicadas pelo clínico (fonte oficial verificada em 2026-10-15).
import { type OpenScaleSpec, dupCheck } from "./openScaleKit";

const V = "2026-10-15";
const AIMS_URL = "https://www.gov.br/conitec/pt-br/midias/protocolos/20210601_portaria-conjunta_pcdt-transtorno-esquizoafetivo-1.pdf/@@display-file/file";

export const clinicianSpecs: OpenScaleSpec[] = [
  {
    wave: 1, id: "aims-pt", name: "AIMS (movimentos involuntários)",
    fullName: "Escala de Movimentos Involuntários Anormais (AIMS) — versão em português do PCDT do Transtorno Esquizoafetivo",
    ageMin: 60, ageMax: 216, queixas: ["efeitos"], respondente: ["clinico"], prioridade: "monitorizacao", tempo: "5–10 min",
    description: "Exame clínico estruturado de movimentos involuntários (discinesia tardia e afins) em tratamento com antipsicóticos: 7 itens de movimento (face/boca, extremidades, tronco) e 2 julgamentos globais, graduados de 0 a 4. Aplicação pelo clínico; uso seriado.",
    fonte: "Guy W. ECDEU Assessment Manual for Psychopharmacology. Rockville: NIMH, 1976 (domínio público, governo dos EUA); texto em português: Portaria Conjunta SAES/SCTIE nº 7, de 14/05/2021 — PCDT do Transtorno Esquizoafetivo (Ministério da Saúde).",
    validacaoBrasil: "Texto em português de documento oficial do Ministério da Saúde (PCDT 2021); sem validação psicométrica pediátrica no Brasil (instrumento desenvolvido e usado sobretudo em adultos).",
    scoringCutoff: "Sem ponto de corte oficial na fonte: a escala é descritiva e seriada (graduação 0–4 por item, comparar com exames anteriores). Não classifica discinesia tardia por si só; o diagnóstico é clínico.",
    assessmentUse: "monitorizacao", applicationMode: "observacional_clinico", primaryDomain: "efeitos", overlapGroup: "movimentos-involuntarios",
    signalTags: ["discinesia tardia", "movimentos involuntários", "movimentos orofaciais", "monitorização de antipsicótico"],
    license: {
      status: "public_domain", sourceUrl: AIMS_URL, verifiedOn: V,
      attribution: "AIMS: Guy W. (NIMH/ECDEU, 1976), obra do governo dos EUA em domínio público; tradução em português publicada no PCDT do Transtorno Esquizoafetivo (Portaria Conjunta SAES/SCTIE nº 7/2021, Ministério da Saúde — documento oficial de acesso público).",
      note: `Anexo do PCDT (Conitec/Ministério da Saúde). Na cópia, a 3ª linha do 'Julgamento global' (incapacidade) está truncada; por isso apenas 2 dos 3 julgamentos globais foram incluídos, com o texto exato da fonte; os itens dentários não constam da fonte.`,
    },
    def: {
      instruction: "Antes ou depois de completar o escore, o clínico deve observar: (1) a marcha no caminho para a sala; (2) retirar chiclete/dentadura mal encaixada; (3) se o paciente está ciente de cada movimento; (4) paciente sentado em cadeira firme e sem braços, mãos sobre os joelhos, pernas ligeiramente afastadas e pés nivelados no chão — procurar movimentos no corpo inteiro; (5) sentado com as mãos não apoiadas, pendentes sobre os joelhos; (6) abrir a boca duas vezes (movimentos linguais); (7) protrair a língua duas vezes; (8) bater o polegar contra cada dedo da mão por 15 s em cada mão (observar face e pernas); (9) ficar de pé com os braços estendidos para frente. Gradue cada item de 0 a 4 pela maior gravidade observada. Segundo a fonte, movimentos que ocorrem somente após a ativação merecem um ponto a menos que os que ocorrem espontaneamente.",
      infoBox: "Escala da fonte oficial: 0 = Nenhuma; 1 = Mínima, podendo ser normal extremo; 2 = Leve; 3 = Moderada; 4 = Grave. O item de consciência do paciente usa: 0 = não ciente; 4 = desconforto grave. Sem ponto de corte oficial: use como registro descritivo e seriado, comparando com avaliações anteriores. Exame clínico — não substitui a avaliação neurológica/psiquiátrica. Uso pediátrico sem validação específica.",
      labels: ["0", "1", "2", "3", "4"], optionPoints: [0, 1, 2, 3, 4], scoreDirection: "higher_worse", totalLabel: "AIMS — soma descritiva",
      instrumentVersion: "aims-pt-pcdt-2021", descriptiveDomainSummary: true,
      bands: [{ minPct: 0, classification: "Registro descritivo (sem ponto de corte)", color: "amber", description: "Registre os escores por região e compare com exames anteriores. A fonte não define ponto de corte; a conclusão clínica depende do exame e da história." }],
      domains: [
        { name: "Movimentos faciais e orais", items: ["Músculos de expressão facial", "Lábios e área perioral (ao redor da boca e nariz)", "Maxilares", "Língua"] },
        { name: "Movimentos das extremidades", items: ["Braços", "Pernas"] },
        { name: "Movimentos do tronco", items: ["Pescoço, ombros e quadris"] },
        { name: "Julgamento global", items: ["Gravidade dos movimentos anormais", "Consciência do paciente dos movimentos anormais (0 = não ciente; 4 = desconforto grave)"] },
      ],
    },
  },
];
dupCheck(clinicianSpecs);
