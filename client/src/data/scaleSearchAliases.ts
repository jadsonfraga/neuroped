/**
 * Apelidos de busca por instrumento e grupos de sinônimos (busca v2).
 *
 * Regras de curadoria:
 *  - Apelido é como a pessoa DIGITA (sigla sem pontuação, autor, nome
 *    coloquial, sigla em inglês), nunca um metadado clínico.
 *  - Um apelido nunca cria norma, escore ou equivalência entre instrumentos:
 *    "columbia" leva ao C-SSRS porque é o nome do instrumento, não porque
 *    outro instrumento seja equivalente a ele.
 *  - Sinônimos leigos mapeiam para QUEIXAS (ids de scaleFilter.queixas) e para
 *    termos que aparecem nos textos dos instrumentos — ampliam a consulta sem
 *    esconder por onde o acerto aconteceu (o motor devolve o campo e o termo).
 *
 * As chaves de scaleSearchAliases são ids de ScaleEntry. Ids inexistentes são
 * inofensivos (o índice ignora), e o teste de qualidade de busca verifica a
 * cobertura sobre o catálogo real.
 */

export const scaleSearchAliases: Readonly<Record<string, readonly string[]>> = {
  // Desenvolvimento
  denver: ["denver ii", "denver 2", "ddst", "denver developmental"],
  asq3: ["asq 3", "ages and stages", "ages stages", "idades e estagios"],
  catclams: ["cat clams", "clams", "capute", "cat/clams"],
  pant: ["pant 100", "protocolo avaliacao neurodesenvolvimento tipico", "neurodesenvolvimento tipico"],
  emdi: ["escala medica desenvolvimento infantil"],
  hine: ["hammersmith", "exame neurologico lactente"],
  ballard: ["new ballard", "idade gestacional"],
  apgar: ["apgar score", "boletim apgar"],
  "tdn-bebe": ["tdn", "triagem desenvolvimento bebe", "triagem lactente"],
  "eci-fraga-qdce": ["eci", "qdce", "quociente desenvolvimento cognitivo", "escala cognitiva infantil"],
  efdi: ["efdi v", "efdi nv", "escala funcional dr jadson", "deficiencia intelectual"],

  // TEA
  mchat: ["mchat", "m chat", "m-chat", "mchat r f", "m chat r/f", "mchatrf", "chat modificado", "checklist autismo toddlers", "triagem autismo bebe"],
  cars: ["cars", "cars 2", "cars2", "childhood autism rating"],
  atec: ["atec", "autism treatment evaluation"],
  "aq10-adolescente": ["autism quotient", "quociente autismo", "aq adolescente"],
  "q-chat-10": ["qchat", "q chat", "qchat10", "q-chat"],
  "tea-checklists": ["ados", "ados 2", "ados2", "adi r", "adir", "gars", "gars 3", "srs", "srs 2", "srs2", "checklists autismo"],
  "tea-comportamentos": ["comportamentos atipicos", "comportamento atipico autismo"],
  "podj-tea-prime-familiar": ["podj", "podj tea", "podj familiar"],
  "podj-tea-prime-escola-terapia": ["podj escola", "podj terapia"],
  "podj-tea-prime-1-6a": ["podj 1 6", "podj prime"],
  "podj-tea-prime-6-12a": ["podj 6 12"],
  "podj-tea-prime-12-19a": ["podj 12 19"],
  "camuflagem-tea-neuroped": ["camuflagem", "masking", "cat q", "catq"],
  "ipn-tea-familia-100": ["ipn tea", "ipn tea familia", "inventario tea familia"],
  "ipn-tea-escola-100": ["ipn tea escola"],
  "ipn-tea-adolescente-60": ["ipn tea adolescente", "autorrelato tea"],
  "ipn-tea-observacao-60": ["ipn tea observacao"],
  ecsm: ["cognicao social", "mentalizacao", "teoria da mente"],

  // TDAH / funções executivas
  snap: ["snap", "snap iv", "snap-iv", "snap4", "snapiv", "swanson", "mta snap", "snap 4"],
  conners: ["conners", "conners 3", "conners3", "conner", "connors"],
  vanderbilt: ["vanderbilt", "nichq", "nichq vanderbilt", "vanderbild"],
  brief2: ["brief", "brief 2", "brief2", "brief-2", "executive function", "inventario funcoes executivas"],
  "afi12-sdg": ["afi", "afi 12", "atencao freio impacto"],
  "ipn-tdah-fe-familia-48": ["ipn tdah", "ipn tdah familia", "ipn fe"],
  "ipn-tdah-fe-escola-32": ["ipn tdah escola"],
  "ipn-tdah-fe-adolescente-20": ["ipn tdah adolescente"],
  "ipn-tdah-fe-observacao-10": ["ipn tdah observacao"],
  "ipn-tdah-fe-executivo-10": ["ipn tdah executivo", "perfil executivo"],

  // Comportamento / banda larga
  cbcl: ["cbcl", "achenbach", "aseba", "child behavior checklist", "inventario comportamentos crianca"],
  sdq: ["sdq", "goodman", "capacidades e dificuldades", "forcas e dificuldades", "strengths difficulties"],
  abc: ["abc", "aberrant behavior", "comportamento aberrante"],
  psc17: ["psc", "psc 17", "psc17", "psc-17", "pediatric symptom checklist", "sintomas pediatricos"],
  erc: ["erc", "regulacao emocional checklist", "emotion regulation"],
  ari: ["ari", "irritabilidade", "affective reactivity"],
  "ejia-15": ["ejia", "ejia 15", "irritabilidade agressividade"],
  eaah: ["eaah", "autoagressividade", "heteroagressividade", "agressividade"],
  "regula-20-sdg": ["regula", "regula 20", "regula20"],
  "mapa-ri-18-sdg": ["mapa ri", "mapa ri 18"],
  "mcri-24-sdg": ["mcri", "mcri 24"],

  // Ansiedade / humor
  scared: ["scared", "scared ansiedade", "screen child anxiety"],
  scas: ["scas", "spence", "spence ansiedade"],
  gad7: ["gad", "gad 7", "gad7", "gad-7", "ansiedade generalizada"],
  gad7ped: ["gad 7 pediatrico", "gad7 pediatrico", "gad pediatrico"],
  cdi2: ["cdi", "cdi 2", "cdi2", "cdi-2", "kovacs", "depressao infantil inventario"],
  phqa: ["phq", "phq a", "phqa", "phq-a", "phq 9", "phq9", "phq-9", "patient health questionnaire"],
  smfq: ["smfq", "mfq", "mood and feelings", "humor e sentimentos"],
  who5: ["who", "who 5", "who5", "who-5", "oms 5", "bem estar oms", "indice bem estar"],
  edi: ["edi", "edi nexus", "depressao infantil nexus"],
  eai: ["eai", "eai nexus", "ansiedade infantil nexus"],
  easi: ["easi", "ansiedade social infantil"],
  "eani-fj": ["eani", "eani fj", "ansiedade neuropediatrica"],
  nddie: ["nddi", "nddi e", "nddie", "depressao epilepsia"],
  ems: ["ems", "mutismo", "mutismo seletivo nexus"],
  "escala-maria-clara-ansiedade": ["maria clara"],

  // Risco / psicose / mania
  cssrs: ["cssrs", "c ssrs", "c-ssrs", "columbia", "columbia suicidio", "columbia suicide"],
  "asq-suicide": ["asq suicidio", "ask suicide", "ask suicide screening", "asq suicide"],
  "ecar-si": ["ecar", "ecar si", "ecarsi", "risco suicida nexus", "suicidalidade"],
  ymrs: ["ymrs", "young mania", "young", "mania"],
  "prime-screen": ["prime", "prime screen", "risco psicose"],
  "erp-np": ["erp", "entrevista risco psicose"],

  // TOC / tiques / trauma
  cybocs: ["cybocs", "cy bocs", "cy-bocs", "ybocs", "y-bocs", "yale brown", "toc yale"],
  "cybocs-sr": ["cybocs sr", "cy bocs sr", "ybocs autorrelato"],
  "oci-cv": ["oci", "oci cv", "ocicv", "obsessive compulsive inventory"],
  docs: ["docs", "dimensional obsessive"],
  "fas-pr": ["fas pr", "faspr", "acomodacao familiar", "family accommodation"],
  "toc-drj-psicologia": ["ecg toc", "gravidade toc", "toc adolescentes"],
  ygtss: ["ygtss", "yale tic", "yale global tic", "tourette", "gravidade tiques"],
  tsi: ["tsi", "tics screening", "triagem tiques"],
  "ticar-18-sdg": ["ticar", "ticar 18"],
  "cpss-v": ["cpss", "cpss v", "cpss 5", "ptsd crianca", "tept crianca"],
  cries13: ["cries 13", "cries13", "impact of event", "impacto evento"],
  ace: ["ace", "aces", "experiencias adversas", "adversidade infancia"],
  cats: ["cats", "trauma screen", "rastreio trauma"],
  "tpp-np": ["tpp", "estresse pos traumatico pre escolar"],

  // Epilepsia
  "epilepsia-diario": ["diario crises", "diario epilepsia", "calendario crises", "registro crises"],
  lsss: ["lsss", "liverpool", "gravidade crises"],
  engel: ["engel", "classificacao engel", "desfecho cirurgia epilepsia"],
  "hague-szs": ["hague", "hague seizure"],
  ssq: ["ssq", "seizure severity questionnaire"],
  "ipn-epi-seg-familia-50": ["ipn epi", "ipn epi seg", "ipn epilepsia"],

  // PC / motor
  gmfcs: ["gmfcs", "gross motor function", "funcao motora grossa", "classificacao pc motora"],
  macs: ["macs", "manual ability", "habilidade manual"],
  "mini-macs": ["mini macs", "minimacs"],
  cfcs: ["cfcs", "communication function classification", "funcao comunicativa"],
  edacs: ["edacs", "eating drinking ability", "alimentacao pc"],
  bfmf: ["bfmf", "bimanual fine motor", "motor fino bimanual"],
  "viking-speech": ["viking", "viking speech", "inteligibilidade fala pc"],
  ashworth: ["ashworth", "ashworth modificada", "espasticidade", "tonus muscular", "mas"],
  "ipn-pc-fun-familia-50": ["ipn pc", "ipn pc fun", "ipn paralisia cerebral"],

  // Sono
  cshq: ["cshq", "habitos de sono", "sleep habits", "questionario sono"],
  bisq: ["bisq", "sono lactente", "brief infant sleep"],
  "bisq-r": ["bisq r", "bisqr", "bisq revisado"],
  bears: ["bears", "bears sono", "triagem sono"],
  "ess-adol": ["ess", "epworth", "sonolencia diurna", "epworth adolescente"],
  "sdrd12-sdg": ["sdrd", "sdrd 12", "sono despertares"],
  "vigia-sd-20-sdg": ["vigia sd", "vigia sono"],
  "ritmo-sono-20-sdg": ["ritmo sono"],

  // Dor
  wongbaker: ["wong baker", "wongbaker", "wong-baker", "faces dor", "escala de faces"],
  flacc: ["flacc", "dor nao verbal", "dor lactente"],
  rflacc: ["r flacc", "rflacc", "flacc revisada"],
  faces: ["faces", "fps", "faces pain"],
  "fps-r": ["fps r", "fpsr", "faces pain revised"],
  "eva-ped": ["eva", "escala visual analogica", "eva dor"],
  "nrs-pain": ["nrs", "escala numerica dor", "numeric rating"],
  "vas-pain": ["vas", "visual analog"],
  cheops: ["cheops", "dor pos operatoria"],
  cries: ["cries", "dor neonatal"],
  "comfort-b": ["comfort", "comfort b", "sedacao"],
  "cefaleia-calendario": ["calendario cefaleia", "diario cefaleia", "diario dor de cabeca", "diario enxaqueca"],
  "ecnfaj-1": ["ecnfaj", "cefaleia neuropediatrica", "fraga araujo"],

  // Alimentação / eliminação
  scoff: ["scoff", "transtorno alimentar rastreio"],
  etare: ["etare", "tare", "arfid", "restritivo evitativo"],
  "sarf12-sdg": ["sarf", "sarf 12", "seletividade alimentar"],
  dvss: ["dvss", "disfuncao miccional", "voiding"],
  "bristol-stool": ["bristol", "escala bristol", "fezes"],
  "bowel-bladder-checklist": ["bbd", "bexiga intestino", "bowel bladder"],
  "j26-146": ["autonomia alimentar"],

  // Funcionalidade / qualidade de vida / família
  pedsql: ["pedsql", "peds ql", "qualidade de vida", "quality of life"],
  eaf: ["eaf", "adaptacao funcional"],
  "ead-np": ["ead", "comportamento adaptativo", "adaptativo"],
  "qec-np": ["qec", "estresse do cuidador", "sobrecarga cuidador"],
  "psn-np": ["psn", "perfil sensorial"],
  ips: ["ips", "processamento sensorial"],
  "nexo-s-24-sdg": ["nexo s", "regulacao sensorial"],
  "nexo-fam-24": ["nexo fam", "sustentabilidade familiar"],
  "ritmo-18-sdg": ["ritmo", "ritmo 18", "fadiga"],
  "trilha-20-sdg": ["trilha", "trilha 20", "autogestao", "transicao cuidado"],
  "adapta-18-sdg": ["adapta", "adapta 18"],
  "porta-20-sdg": ["porta", "porta 20"],
  "ponte-16-sdg": ["ponte 16"],
  "rota-aut-18-sdg": ["rota aut", "rota autonomia"],

  // Aprendizagem / linguagem
  pdae: ["pdae", "desempenho academico", "desempenho escolar"],
  nepedq: ["nepedq", "pedagogica neuropediatrica", "questionario pedagogico"],
  "tdl-aprendizagem": ["tdl", "transtorno desenvolvimento linguagem", "dificuldade aprendizagem"],
  "farol-escolar": ["farol", "farol escolar", "rastreio escolar"],
  "fas-fluencia": ["fas", "fluencia verbal", "fas fluencia"],
  "ipn-lfc-familia-50": ["ipn lfc", "ipn linguagem", "ipn fala"],
  "mutismo-seletivo-familia-30": ["mutismo seletivo", "mutismo"],

  // Medicação / efeitos
  uku: ["uku", "efeitos colaterais uku", "side effect"],
  bars: ["bars", "barnes", "acatisia"],
  "esm-edj": ["esm", "satisfacao medicacao", "satisfacao com a medicacao"],
  "vigia-med-24": ["vigia med", "tolerabilidade medicamentosa"],
  "balanco-med-24-sdg": ["balanco med", "beneficio tolerabilidade"],
  "j26-260": ["exames laboratoriais", "laboratorial medicacao"],
  crafft: ["crafft", "uso de substancias", "alcool drogas adolescente"],

  // Banda larga autorais
  "ndi-360": ["ndi", "ndi 360", "ndi360"],
  "mnp-psi-100": ["matrix", "matrix 100", "matrix neuroped", "psi 100"],
  "nef-360": ["nef", "nef 360", "neuro escola funcional"],
  "neurofunc-360": ["neurofunc", "neurofunc 360"],
  "integra-kids-360": ["integra kids", "integra 360"],
  "mapa-360": ["mapa 360"],
  "sinaf-neuroped": ["sinaf"],
  "integra-neuroped-90": ["integra 90", "integra neuroped"],
  "einpi-360": ["einpi", "einpi 360"],
  "einpi-drj-v1": ["einpi drj"],
  "ponte-ped-72": ["ponte ped", "ponte 72"],
  "sinapse-fi-60": ["sinapse", "sinapse fi"],
  "nexus-ped-52": ["nexus ped", "nexus 52"],
  "nefi-ped-96": ["nefi", "nefi ped"],
  idafeni: ["idafeni"],
  "eidaf-neuroinfantil": ["eidaf"],
  "navi-ped-84": ["navi", "navi ped"],
  "sinergi-neuroped": ["sinergi"],
  "orbita-neurofuncional": ["orbita"],
  "nexus360-neuroped": ["nexus 360", "nexus360"],
  "prisma-nf-60": ["prisma", "prisma nf"],
  "mosaico-np-72": ["mosaico", "mosaico np"],
  "ita-adultos": ["ita", "tracos autisticos adultos"],
};

/**
 * Grupos de sinônimos: a chave é o termo canônico (de preferência um id de
 * queixa ou um termo que aparece nos textos das escalas); os membros são as
 * formas leigas, clínicas ou em inglês que a pessoa digita. Grupos com mais de
 * uma palavra ("nao para quieto") são reconhecidos na consulta inteira.
 */
export const searchSynonymGroups: Readonly<Record<string, readonly string[]>> = {
  tea: ["autismo", "autista", "autismo infantil", "espectro autista", "espectro", "asd", "autism", "tea leve", "suspeita de autismo", "nao olha nos olhos", "nao aponta", "nao responde ao nome", "se isola", "ecolalia", "alinha brinquedos", "estereotipia", "flapping"],
  tdah: ["adhd", "deficit de atencao", "hiperatividade", "hiperativo", "hiperativa", "desatencao", "desatento", "desatenta", "impulsividade", "impulsivo", "nao para quieto", "agitado", "agitada", "agitacao", "distraido", "distraida", "nao presta atencao", "dda", "tda"],
  ansiedade: ["ansioso", "ansiosa", "medo", "medos", "fobia", "panico", "preocupacao", "preocupado", "nervoso", "nervosa", "anxiety", "ansiedade de separacao", "timidez", "dor de barriga"],
  depressao: ["deprimido", "deprimida", "depressivo", "tristeza", "triste", "humor", "desanimo", "desanimado", "apatia", "choro facil", "depression", "mood"],
  suicidio: ["suicida", "ideacao suicida", "autolesao", "automutilacao", "se corta", "se machuca", "risco de suicidio", "suicide", "self harm", "quer morrer"],
  psicose: ["psicotico", "alucinacao", "alucinacoes", "delirio", "mania", "bipolar", "bipolaridade", "psychosis", "ouve vozes"],
  comportamento: ["agressividade", "agressivo", "agressiva", "birra", "birras", "oposicao", "opositor", "desafiador", "desafiadora", "tod", "conduta", "bate", "morde", "explosivo", "irritabilidade", "irritado", "irritada", "desregulacao", "externalizante", "behavior"],
  linguagem: ["fala", "nao fala", "fala pouco", "atraso de fala", "atraso na fala", "comunicacao", "vocabulario", "fonologia", "gagueira", "troca letras", "fala enrolado", "tdl", "language", "speech"],
  atraso: ["desenvolvimento", "atraso global", "marcos", "marco", "nao anda", "nao senta", "demora para andar", "bebe", "lactente", "prematuro", "prematuridade", "delay", "milestones"],
  aprendizagem: ["escola", "escolar", "leitura", "escrita", "dislexia", "discalculia", "disgrafia", "matematica", "nota baixa", "repetiu de ano", "dificuldade escolar", "academico", "learning"],
  sono: ["dormir", "dorme mal", "nao dorme", "insonia", "ronco", "despertares", "acorda a noite", "pesadelo", "sonolencia", "apneia", "sleep", "melatonina"],
  epilepsia: ["crise", "crises", "convulsao", "convulsoes", "epileptico", "epileptica", "ausencia", "desmaio", "seizure", "eeg"],
  pc: ["paralisia cerebral", "paralisia", "espasticidade", "espastico", "hemiparesia", "diparesia", "tetraparesia", "cerebral palsy"],
  motor: ["motricidade", "coordenacao", "desajeitado", "desajeitada", "cai muito", "motor fino", "motor grosso", "dispraxia", "apraxia", "hipotonia", "tonus", "marcha", "equilibrio"],
  sensorial: ["hipersensibilidade", "sensibilidade", "barulho", "textura", "texturas", "integracao sensorial", "processamento sensorial", "seletivo com roupa", "sensory"],
  alimentacao: ["seletividade alimentar", "seletivo", "seletiva", "nao come", "recusa alimentar", "engasgo", "engasga", "disfagia", "arfid", "tare", "anorexia", "bulimia", "compulsao alimentar", "eating"],
  dor: ["cefaleia", "dor de cabeca", "enxaqueca", "migranea", "dor cronica", "pain", "headache"],
  cognicao: ["inteligencia", "qi", "deficiencia intelectual", "di", "raciocinio", "memoria", "funcao executiva", "funcoes executivas", "neuropsicologico", "cognitivo", "cognitiva"],
  funcionalidade: ["adaptativo", "adaptativa", "habilidades adaptativas", "participacao", "impacto funcional", "qualidade de vida", "functioning"],
  autonomia: ["autocuidado", "vida diaria", "avd", "avds", "independencia", "se veste sozinho", "desfralde"],
  neonatal: ["recem nascido", "rn", "neonato", "uti neonatal", "prematuro extremo"],
  tiques: ["tique", "tic", "tics", "tourette", "piscar", "cacoete", "cacoetes"],
  toc: ["obsessao", "obsessoes", "compulsao", "compulsoes", "ritual", "rituais", "mania de limpeza", "ocd", "obsessivo"],
  trauma: ["tept", "ptsd", "estresse pos traumatico", "abuso", "violencia", "luto", "evento traumatico"],
  enurese: ["xixi na cama", "faz xixi na cama", "escape urinario", "encoprese", "coco na roupa", "incontinencia", "bexiga"],
  efeitos: ["medicacao", "medicamento", "remedio", "efeito colateral", "efeitos colaterais", "efeitos adversos", "tolerabilidade", "adesao", "ritalina", "metilfenidato", "risperidona", "aripiprazol", "satisfacao"],
  evolucao: ["acompanhamento", "seguimento", "reavaliacao", "evolutivo", "retorno", "monitorizacao", "monitoramento", "follow up", "resposta ao tratamento"],
  social: ["habilidades sociais", "amizade", "amigos", "sem amigos", "bullying", "reciprocidade", "pragmatica", "isolamento social", "mutismo seletivo", "nao fala na escola"],
  substancias: ["drogas", "alcool", "maconha", "uso de substancias", "vape", "cigarro"],
  triagem: ["rastreio", "screening", "rastreamento", "rapida", "rapido", "breve"],
  diagnostico: ["diagnostica", "confirmacao", "confirmar", "avaliacao completa", "padrao ouro"],
  pais: ["mae", "pai", "cuidador", "cuidadora", "familia", "responsavel", "parent", "caregiver", "hetero relato", "heterorrelato"],
  professor: ["professora", "escola", "creche", "educador", "educadora", "teacher", "escolar"],
  autoaplicavel: ["autorrelato", "autoaplicavel", "autoaplicacao", "self report", "o proprio adolescente", "ele mesmo", "ela mesma"],
  clinico: ["observacao clinica", "entrevista clinica", "medico", "clinica", "consultorio"],
  gratuito: ["gratis", "gratuita", "livre", "free", "sem custo", "dominio publico", "open access"],
};
