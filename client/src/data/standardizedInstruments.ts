/**
 * LITERATURA E INSTRUMENTOS PADRONIZADOS — Pearson / Hogrefe
 *
 * Biblioteca ÉTICA e LEGALMENTE SEGURA de instrumentos padronizados usados como
 * APOIO à avaliação neuropediátrica.
 *
 * ⚠️ REGRA INEGOCIÁVEL: este arquivo NÃO reproduz itens, pranchas, folhas de
 * resposta, crivos, tabelas normativas, protocolos internos nem qualquer
 * conteúdo protegido por direitos autorais. Apenas metadados públicos:
 * nome, finalidade clínica, faixa etária, domínio, restrição profissional,
 * forma GERAL de uso e referência editorial.
 *
 * A aplicação, correção e interpretação devem seguir o MANUAL ORIGINAL
 * LICENCIADO, e — para testes psicológicos restritos — ser conduzidas por
 * psicóloga(o) habilitada(o), com consulta ao SATEPSI (Resolução CFP nº 31/2022).
 */

export type InstrumentDomain =
  | "tea"
  | "tdah"
  | "desenvolvimento"
  | "cognicao"
  | "comportamento_adaptativo"
  | "sensorial"
  | "atencao"
  | "motricidade"
  | "aprendizagem";

export const DOMAIN_LABEL: Record<InstrumentDomain, string> = {
  tea: "TEA",
  tdah: "TDAH",
  desenvolvimento: "Desenvolvimento infantil",
  cognicao: "Cognição",
  comportamento_adaptativo: "Comportamento adaptativo",
  sensorial: "Processamento sensorial",
  atencao: "Atenção",
  motricidade: "Motricidade",
  aprendizagem: "Aprendizagem",
};

// Como o neuropediatra pode usar o instrumento no fluxo de trabalho.
export type NeuropediatricUse =
  | "integra_relatorio" // Pode integrar resultado de relatório externo
  | "triagem_nao_restrita" // Pode usar como triagem não restrita
  | "requer_psicologo"; // Requer psicóloga(o) habilitada(o)

export const NEUROPED_USE_LABEL: Record<NeuropediatricUse, string> = {
  integra_relatorio: "Pode integrar resultado de relatório externo",
  triagem_nao_restrita: "Pode usar como triagem não restrita",
  requer_psicologo: "Requer psicóloga(o) habilitada(o)",
};

// Grau de PADRONIZAÇÃO/VALIDAÇÃO do instrumento — NÃO é um nível formal de
// evidência clínica (GRADE). Reflete o quão estabelecido/normatizado ele é.
export type EvidenceLevel = "amplo" | "validado" | "triagem";

export const EVIDENCE_LABEL: Record<EvidenceLevel, string> = {
  amplo: "Amplamente validado",
  validado: "Validado",
  triagem: "Triagem / apoio",
};

export interface StandardizedInstrument {
  id: string;
  name: string;
  fullName: string;
  publisher: "Pearson" | "Hogrefe" | "Pearson/Hogrefe";
  domains: InstrumentDomain[];
  ageRange: string;
  /** Indicação clínica principal (finalidade). */
  clinicalIndication: string;
  /** Forma GERAL de uso (sem reproduzir o protocolo do manual). */
  generalUse: string;
  /** Restrição profissional declarada. */
  professionalRestriction: string;
  /** true = teste psicológico restrito (privativo de psicóloga(o)). */
  restricted: boolean;
  neuropediatricUse: NeuropediatricUse;
  /** Grau de padronização/validação (não é GRADE clínico). */
  evidenceLevel: EvidenceLevel;
  /** Referência editorial pública. */
  reference: string;
  /** Texto genérico para citar no laudo — SEM conteúdo proprietário. */
  citation: string;
  /** Observação sobre status no SATEPSI (favorável/desfavorável/não submetido). */
  satepsiNote?: string;
  /** true = SATEPSI desfavorável → uso NÃO recomendado (alerta vermelho). */
  satepsiUnfavorable?: boolean;
}

export const standardizedInstruments: StandardizedInstrument[] = [
  {
    id: "srs-2",
    name: "SRS-2",
    fullName: "Escala de Responsividade Social — 2ª edição",
    publisher: "Pearson/Hogrefe",
    domains: ["tea", "comportamento_adaptativo"],
    ageRange: "Versões pré-escolar, escolar e adulto",
    clinicalIndication:
      "TEA e responsividade social: gravidade dimensional dos sintomas e apoio ao planejamento terapêutico.",
    generalUse:
      "Questionário de heteroavaliação respondido por cuidador/professor; correção informatizada (HTS). Interpretação conforme manual original.",
    professionalRestriction: "Não restrito a psicólogos; requer profissional habilitado.",
    restricted: false,
    neuropediatricUse: "triagem_nao_restrita",
    evidenceLevel: "validado",
    reference: "Constantino & Gruber — Pearson Clinical / Hogrefe CETEPP (Brasil).",
    citation:
      "Responsividade social avaliada pela SRS-2 (Escala de Responsividade Social, 2ª ed.), aplicada por profissional habilitado em [data]. Resultado integrado à avaliação clínica; interpretação conforme manual original (Pearson/Hogrefe).",
  },
  {
    id: "vineland-3",
    name: "Vineland-3",
    fullName: "Escalas de Comportamento Adaptativo Vineland — 3ª edição",
    publisher: "Pearson/Hogrefe",
    domains: ["comportamento_adaptativo", "tea", "desenvolvimento"],
    ageRange: "Do nascimento à vida adulta",
    clinicalIndication:
      "Comportamento adaptativo, autonomia, comunicação, socialização e habilidades diárias. Muito útil em TEA, deficiência intelectual e funcionalidade.",
    generalUse:
      "Entrevista/questionário com cuidador (formas de entrevista e de avaliação). Aplicação e escore conforme manual licenciado.",
    professionalRestriction: "Aplicação por profissional habilitado, conforme o manual.",
    restricted: false,
    neuropediatricUse: "integra_relatorio",
    evidenceLevel: "amplo",
    reference: "Sparrow, Cicchetti & Saulnier — Pearson Clinical / Hogrefe (Brasil).",
    citation:
      "Comportamento adaptativo avaliado pela Vineland-3, integrado ao raciocínio clínico em [data]. Domínios de comunicação, vida diária, socialização e motor; interpretação conforme manual original (Pearson/Hogrefe).",
  },
  {
    id: "bayley-iii",
    name: "Bayley-III",
    fullName: "Escalas Bayley de Desenvolvimento Infantil — 3ª edição",
    publisher: "Pearson/Hogrefe",
    domains: ["desenvolvimento", "cognicao", "motricidade"],
    ageRange: "1 a 42 meses",
    clinicalIndication:
      "Desenvolvimento infantil precoce: domínios cognitivo, linguagem, motor, socioemocional e comportamento adaptativo.",
    generalUse:
      "Avaliação direta do lactente/criança pequena por profissional habilitado, conforme protocolo do manual.",
    professionalRestriction: "Não restrito a psicólogos; requer profissional habilitado.",
    restricted: false,
    neuropediatricUse: "triagem_nao_restrita",
    evidenceLevel: "amplo",
    reference: "Bayley — Pearson Clinical / Hogrefe (Brasil).",
    citation:
      "Desenvolvimento avaliado pela Bayley-III em [data] (domínios cognitivo, linguagem e motor). Resultado integrado à avaliação do neurodesenvolvimento; interpretação conforme manual original (Pearson/Hogrefe).",
  },
  {
    id: "perfil-sensorial-2",
    name: "Perfil Sensorial 2",
    fullName: "Perfil Sensorial 2 (Winnie Dunn)",
    publisher: "Pearson/Hogrefe",
    domains: ["sensorial", "tea", "tdah", "desenvolvimento"],
    ageRange: "Do nascimento até 14 anos e 11 meses",
    clinicalIndication:
      "Processamento sensorial: rotina, escola, seletividade, hiper e hiporresponsividade. Útil em TEA, TDAH, atraso do desenvolvimento e terapia ocupacional.",
    generalUse:
      "Questionário respondido por cuidador/professor; análise por quadrantes conforme manual. Frequentemente integrado por terapeuta ocupacional.",
    professionalRestriction: "Uso por profissional habilitado (ex.: terapeuta ocupacional).",
    restricted: false,
    neuropediatricUse: "integra_relatorio",
    evidenceLevel: "validado",
    reference: "Dunn — Pearson Clinical / Hogrefe (Brasil).",
    citation:
      "Processamento sensorial avaliado pelo Perfil Sensorial 2 (W. Dunn), integrado à avaliação em [data]. Interpretação por quadrantes conforme manual original (Pearson/Hogrefe).",
  },
  {
    id: "wisc-iv",
    name: "WISC-IV",
    fullName: "Escala Wechsler de Inteligência para Crianças — 4ª edição",
    publisher: "Pearson/Hogrefe",
    domains: ["cognicao", "aprendizagem"],
    ageRange: "Idade escolar (geralmente aplicado por psicólogo/neuropsicólogo)",
    clinicalIndication:
      "Perfil cognitivo: inteligência, memória operacional e velocidade de processamento. Literatura útil em TEA, TDAH, DI, dificuldades de aprendizagem e superdotação.",
    generalUse:
      "Avaliação psicométrica individual aplicada, corrigida e interpretada por psicóloga(o) habilitada(o), conforme manual e SATEPSI.",
    professionalRestriction: "Restrito a psicóloga(o); consulta ao SATEPSI.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "amplo",
    reference: "Wechsler — Pearson Clinical / Hogrefe (Brasil).",
    citation:
      "Perfil cognitivo avaliado pela WISC-IV por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Resultado integrado às hipóteses clínicas; aplicação e interpretação conforme manual original (Pearson/Hogrefe).",
  },
  {
    id: "d2-r",
    name: "d2-R",
    fullName: "Teste de Atenção Concentrada d2-R",
    publisher: "Hogrefe",
    domains: ["atencao"],
    ageRange: "A partir de 7 anos (presencial); versão online para adultos",
    clinicalIndication: "Atenção concentrada e sustentada.",
    generalUse:
      "Teste de cancelamento padronizado, aplicado, corrigido e interpretado por psicóloga(o), conforme manual e SATEPSI.",
    professionalRestriction: "Restrito a psicóloga(o); consulta ao SATEPSI.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "validado",
    reference: "Brickenkamp — Hogrefe (Brasil).",
    citation:
      "Atenção concentrada avaliada pelo d2-R por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Interpretação conforme manual original (Hogrefe).",
  },
  {
    id: "etdah-ii",
    name: "ETDAH-II",
    fullName: "Escalas de Avaliação de TDAH — versão professor (ETDAH-II)",
    publisher: "Hogrefe",
    domains: ["tdah", "atencao"],
    ageRange: "6 a 18 anos (relato de professor)",
    clinicalIndication: "Sintomas de TDAH no contexto escolar.",
    generalUse:
      "Questionário respondido pelo professor; correção e interpretação por psicóloga(o), conforme manual e SATEPSI.",
    professionalRestriction: "Restrito a psicóloga(o); consulta ao SATEPSI.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "validado",
    reference: "Hogrefe (Brasil).",
    citation:
      "Sintomas de TDAH em contexto escolar avaliados pela ETDAH-II (relato do professor), conforme relatório de psicóloga(o) habilitada(o) em [data]. Interpretação conforme manual original (Hogrefe).",
  },
  {
    id: "denver-ii",
    name: "Denver II",
    fullName: "Teste de Triagem do Desenvolvimento de Denver II",
    publisher: "Pearson/Hogrefe",
    domains: ["desenvolvimento"],
    ageRange: "Profissionais que trabalham com desenvolvimento infantil",
    clinicalIndication:
      "Triagem do desenvolvimento. NÃO é teste de QI nem preditor diagnóstico definitivo.",
    generalUse:
      "Triagem por observação direta de marcos nos 4 domínios; interpretação conforme manual. Sinaliza necessidade de avaliação aprofundada.",
    professionalRestriction: "Não restrito a psicólogos; profissional da área de desenvolvimento.",
    restricted: false,
    neuropediatricUse: "triagem_nao_restrita",
    evidenceLevel: "triagem",
    reference: "Frankenburg & Dodds — Pearson / Hogrefe (Brasil).",
    citation:
      "Triagem do desenvolvimento pelo Denver II em [data]. Resultado de triagem (não diagnóstico), integrado à avaliação clínica; interpretação conforme manual original.",
  },
  {
    id: "movement-abc-2",
    name: "Movement ABC-2",
    fullName: "Bateria de Avaliação do Movimento para Crianças — 2ª edição",
    publisher: "Hogrefe",
    domains: ["motricidade"],
    ageRange: "Crianças (bateria de avaliação do movimento)",
    clinicalIndication:
      "Coordenação motora, Transtorno do Desenvolvimento da Coordenação (TDC) e dispraxia.",
    generalUse:
      "Bateria padronizada de destreza manual, mira/recepção e equilíbrio, aplicada por profissional habilitado, conforme manual.",
    professionalRestriction: "Bateria padronizada (catálogo Hogrefe); uso por profissional habilitado.",
    restricted: true,
    neuropediatricUse: "integra_relatorio",
    evidenceLevel: "validado",
    reference: "Henderson, Sugden & Barnett — Hogrefe (Brasil).",
    citation:
      "Coordenação motora avaliada pela Movement ABC-2, conforme relatório de profissional habilitado em [data]. Interpretação conforme manual original (Hogrefe).",
  },
  {
    id: "sdmt",
    name: "SDMT",
    fullName: "Teste de Modalidades de Dígitos e Símbolos (SDMT)",
    publisher: "Hogrefe",
    domains: ["atencao", "cognicao"],
    ageRange: "Catálogo de testes Hogrefe (uso neuropsicológico)",
    clinicalIndication:
      "Velocidade de processamento, atenção e funções neuropsicológicas.",
    generalUse:
      "Teste de substituição símbolo-dígito, aplicado e interpretado por psicóloga(o)/neuropsicóloga(o), conforme manual e SATEPSI.",
    professionalRestriction: "Restrito a psicóloga(o); uso neuropsicológico (SATEPSI).",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "validado",
    reference: "Smith — Hogrefe (Brasil).",
    citation:
      "Velocidade de processamento avaliada pelo SDMT por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Interpretação conforme manual original (Hogrefe).",
  },
  {
    id: "wppsi-iv",
    name: "WPPSI-IV",
    fullName: "Escala Wechsler de Inteligência Pré-Escolar e Primária — 4ª edição",
    publisher: "Pearson",
    domains: ["cognicao", "desenvolvimento"],
    ageRange: "Pré-escolar / primeira infância (catálogo Pearson)",
    clinicalIndication:
      "Perfil cognitivo na primeira infância: raciocínio, linguagem, memória de trabalho e velocidade de processamento.",
    generalUse:
      "Avaliação psicométrica individual aplicada, corrigida e interpretada por psicóloga(o), conforme manual e SATEPSI.",
    professionalRestriction: "Restrito a psicóloga(o); consulta ao SATEPSI.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "amplo",
    reference: "Wechsler — Pearson Clinical (Brasil). WPPSI-IV é produto Pearson; no Brasil há edições WPPSI-III/IV — confirmar a vigente.",
    citation:
      "Perfil cognitivo pré-escolar avaliado pela WPPSI-IV por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Interpretação conforme manual original (Pearson).",
    satepsiNote: "Confirmar a edição vigente (WPPSI-III/IV) e o status no SATEPSI antes do uso.",
  },
  {
    id: "nepsy-ii",
    name: "NEPSY-II",
    fullName: "Avaliação Neuropsicológica do Desenvolvimento — 2ª edição",
    publisher: "Pearson",
    domains: ["cognicao", "atencao", "aprendizagem"],
    ageRange: "3 a 16 anos",
    clinicalIndication:
      "Avaliação neuropsicológica por domínios: atenção/função executiva, linguagem, memória e aprendizagem, processamento visuoespacial, sensório-motor e percepção social.",
    generalUse:
      "Bateria neuropsicológica aplicada e interpretada por psicóloga(o)/neuropsicóloga(o), conforme manual.",
    professionalRestriction: "Restrito a psicóloga(o); uso neuropsicológico.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "validado",
    reference: "Korkman, Kirk & Kemp — Pearson / Casa do Psicólogo (Brasil).",
    citation:
      "Perfil neuropsicológico avaliado pela NEPSY-II por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Interpretação conforme manual original (Pearson).",
    satepsiNote: "Disponível no Brasil (Pearson/Casa do Psicólogo); ainda NÃO submetido ao SATEPSI — uso como instrumento complementar.",
  },
  {
    id: "beery-vmi",
    name: "Beery VMI",
    fullName: "Beery-Buktenica — Teste de Integração Visuomotora",
    publisher: "Pearson",
    domains: ["motricidade", "aprendizagem", "cognicao"],
    ageRange: "Faixa ampla (pré-escolar à adolescência; catálogo Pearson)",
    clinicalIndication:
      "Integração visuomotora e coordenação olho-mão; apoio na investigação de dificuldades de escrita/grafismo.",
    generalUse:
      "Tarefa padronizada de cópia de formas geométricas; aplicação e escore por profissional habilitado, conforme manual.",
    professionalRestriction: "Uso por profissional habilitado, conforme o manual.",
    restricted: false,
    neuropediatricUse: "integra_relatorio",
    evidenceLevel: "validado",
    reference: "Beery & Beery — Pearson Clinical. Há adaptação brasileira (Instituto de Psicologia, UnB).",
    citation:
      "Integração visuomotora avaliada pelo Beery VMI em [data], conforme relatório de profissional habilitado. Interpretação conforme manual original (Pearson).",
    satepsiNote: "Possui estudo de adaptação/validação brasileira (UnB). Confirmar a versão e o status no SATEPSI antes do uso.",
  },
  {
    id: "figura-rey",
    name: "Figura de Rey",
    fullName: "Teste de Cópia e Reprodução de Memória de Figuras Complexas (Rey-Osterrieth)",
    publisher: "Hogrefe",
    domains: ["cognicao", "atencao"],
    ageRange: "A partir da idade escolar (catálogo neuropsicológico)",
    clinicalIndication:
      "Organização visuoespacial, planejamento perceptual e memória visual de curto/longo prazo.",
    generalUse:
      "Tarefa de cópia e reprodução de memória, aplicada e interpretada por psicóloga(o)/neuropsicóloga(o), conforme manual e SATEPSI.",
    professionalRestriction: "Restrito a psicóloga(o); uso neuropsicológico.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "validado",
    reference: "Rey & Osterrieth — edições no Brasil por Hogrefe e Casa do Psicólogo.",
    citation:
      "Organização visuoespacial e memória visual avaliadas pela Figura Complexa de Rey por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Interpretação conforme manual original.",
    satepsiNote: "Classificado como DESFAVORÁVEL no SATEPSI — uso NÃO recomendado na prática profissional. Mantido aqui apenas como referência histórica/literatura.",
    satepsiUnfavorable: true,
  },
  {
    id: "stroop",
    name: "Stroop (Cores e Palavras)",
    fullName: "Teste de Stroop — Teste de Cores e Palavras",
    publisher: "Hogrefe",
    domains: ["atencao", "cognicao"],
    ageRange: "Indivíduos alfabetizados (ampla faixa etária)",
    clinicalIndication:
      "Atenção seletiva, controle inibitório e flexibilidade — funções executivas relevantes em TDAH.",
    generalUse:
      "Tarefa de interferência cor-palavra (3 cartões), aplicada e interpretada por psicóloga(o)/neuropsicóloga(o), conforme manual.",
    professionalRestriction: "Restrito a psicóloga(o); uso neuropsicológico.",
    restricted: true,
    neuropediatricUse: "requer_psicologo",
    evidenceLevel: "validado",
    reference: "Stroop (1935); edição brasileira por Hogrefe (Teste de Cores e Palavras).",
    citation:
      "Controle inibitório/atenção seletiva avaliados pelo Teste de Stroop por psicóloga(o) habilitada(o) em [data], conforme relatório anexo. Interpretação conforme manual original (Hogrefe).",
    satepsiNote: "Versões padronizadas em uso clínico cadastradas no SATEPSI; privativo de psicóloga(o).",
  },
];

// Domínios presentes (para montar os filtros dinamicamente).
export const availableDomains: InstrumentDomain[] = Array.from(
  new Set(standardizedInstruments.flatMap((i) => i.domains))
).sort((a, b) => DOMAIN_LABEL[a].localeCompare(DOMAIN_LABEL[b]));
