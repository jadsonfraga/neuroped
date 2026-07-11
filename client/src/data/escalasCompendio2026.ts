// ============================================================
// Compêndio de Escalas — Neuropsiquiatria Infantojuvenil (DOCX
// enviado pelo Dr. Jadson, 2026-07). Das 23 escalas do compêndio,
// 20 JÁ EXISTIAM no banco e foram descartadas como duplicatas:
// SNAP-IV, SWAN, Vanderbilt, M-CHAT-R/F, CAST, ASSQ, SCARED,
// SCAS-Brasil, GAD-7, PHQ-9/PHQ-A, CES-DC, SMFQ/MFQ, ASQ (NIMH),
// CATS, SDQ, PSC-35/17, CRAFFT 2.1, BEARS, SDSC e YGTSS.
//
// Entram aqui apenas as 3 genuinamente novas:
//  - CGAS: citada no fluxograma clínico como padrão-ouro de "função
//    global", mas até agora SEM entrada no banco (não filtrável).
//  - AQ-Adolescente (50 itens): o banco só tinha a forma curta
//    AQ-10; a versão completa tem corte e uso próprios.
//  - Q-CHAT (25 itens): o banco só tinha a forma curta Q-CHAT-10;
//    a versão completa é dimensional (0–100) com corte próprio.
//
// As duas com licencaUso "restrita" entram como ficha técnica
// (sem itens embutidos), seguindo a política do catálogo.
// ============================================================
import { type ScaleEntry } from "./scaleFilter";

export const escalasCompendio2026: ScaleEntry[] = [
  {
    id: "cgas",
    name: "CGAS",
    fullName: "Children's Global Assessment Scale — Escala de Avaliação Global de Crianças",
    ageMin: 48, // 4 anos
    ageMax: 204, // 17 anos (faixa original 4–16, uso estendido)
    queixas: ["funcionalidade", "evolucao"],
    respondente: ["clinico"],
    prioridade: "monitorizacao",
    tempo: "< 5 min após a avaliação",
    description:
      "Escore único de funcionamento global (1–100, maior = melhor) atribuído pelo clínico integrando todas as fontes, geralmente sobre o menor nível de funcionamento do último mês. Descritores por faixa de 10 pontos, do funcionamento superior em todas as áreas (91–100) à necessidade de supervisão constante (1–10). Referida no fluxograma clínico como medida de função global.",
    fonte: "Shaffer D et al., Arch Gen Psychiatry, 1983 (Columbia University; adaptada da GAS de Endicott)",
    pubmedId: "PMID 6639293",
    scoringCutoff:
      "Convenção clínica: >70 faixa normal; 61–70 dificuldade leve; ≤60 'caso' com necessidade de cuidado; <50 comprometimento moderado-grave. Não é escala de itens — escore único do clínico.",
    validacaoBrasil: "Sem validação formal brasileira publicada (uso clínico corrente).",
    licencaUso: "livre",
    assessmentUse: "monitorizacao",
    applicationMode: "registro_clinico",
    signalTags: ["funcionamento global", "prejuízo funcional", "autonomia", "supervisão", "desempenho escolar", "evolução do tratamento"],
  },
  {
    id: "aq-adolescente",
    name: "AQ-Adolescente",
    fullName: "Quociente do Espectro Autista — versão Adolescente (50 itens)",
    ageMin: 144, // 12 anos
    ageMax: 192, // 16 anos
    queixas: ["tea", "social"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "~10 min",
    description:
      "Rastreio dimensional de traços do espectro autista em adolescentes, respondido pelos pais, com 50 itens em 5 domínios: habilidades sociais, alternância de atenção, atenção a detalhes, comunicação e imaginação. Versão COMPLETA da família AQ — o banco já traz a forma curta AQ-10 com aplicação interativa; esta ficha cobre a versão longa, com corte próprio. Não diagnóstico.",
    fonte: "Baron-Cohen S, Hoekstra RA, Knickmeyer R, Wheelwright S. J Autism Dev Disord, 2006. Distribuição: ARC Cambridge, com versão oficial em português do Brasil.",
    pubmedId: "PMID 16552625",
    scoringCutoff:
      "1 ponto por resposta 'autística' (total 0–50); corte ≥30 (média do grupo TEA de alto funcionamento ≈ 39,5 no estudo original).",
    validacaoBrasil: "Tradução oficial PT-BR hospedada pelo ARC Cambridge; validação formal brasileira pendente.",
    licencaUso: "restrita", // gratuito p/ uso clínico não comercial; reprodução restrita — usar PDF oficial
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["habilidades sociais", "atenção a detalhes", "alternância de atenção", "comunicação", "imaginação", "rigidez"],
  },
  {
    id: "q-chat-25",
    name: "Q-CHAT",
    fullName: "Quantitative Checklist for Autism in Toddlers — versão completa (25 itens)",
    ageMin: 18,
    ageMax: 30, // faixa nominal 18–24 m, uso estendido até ~30 m
    queixas: ["tea", "linguagem", "social"],
    respondente: ["pais"],
    prioridade: "triagem",
    tempo: "5–10 min",
    description:
      "Rastreio quantitativo (dimensional) de TEA em lactentes, respondido pelos pais, com 25 itens sobre atenção compartilhada, apontar, linguagem, jogo simbólico, comportamentos repetitivos e sensorialidade. Cada item pontua 0–4 (total 0–100) — mede o traço como contínuo. Versão COMPLETA da família Q-CHAT — o banco já traz a forma curta Q-CHAT-10 com aplicação interativa.",
    fonte: "Allison C, Baron-Cohen S et al. J Autism Dev Disord, 2008. Distribuição: ARC Cambridge. Cortes: Allison et al., 2021.",
    pubmedId: "PMID 18240013",
    scoringCutoff:
      "Total 0–100 (metade dos itens invertida; item 4 com sexta opção para não verbais). Corte de triagem usual: ≥39. Forma curta Q-CHAT-10: ≥3.",
    validacaoBrasil: "Sem versão PT-BR validada (versão em português europeu no ARC).",
    licencaUso: "restrita", // download gratuito no ARC (não comercial); reprodução restrita
    assessmentUse: "triagem",
    applicationMode: "questionario_pais",
    signalTags: ["atenção compartilhada", "apontar", "linguagem", "jogo simbólico", "comportamentos repetitivos", "sensorialidade"],
  },
];
