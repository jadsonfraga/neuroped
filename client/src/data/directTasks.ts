export interface DirectTask {
  title: string;
  instruction: string;
  observe: string;
  minAge?: number;
  maxAge?: number;
}

export interface DirectDomain {
  id: string;
  label: string;
  queixas: string[];
  minAge: number;
  maxAge: number;
  tasks: DirectTask[];
}

export const directDomains: DirectDomain[] = [
  {
    id: "linguagem",
    label: "Linguagem",
    queixas: ["linguagem", "atraso", "tea"],
    minAge: 24,
    maxAge: 216,
    tasks: [
      { title: "Nomeacao por figuras", instruction: "Mostre figuras/objetos comuns e pergunte o nome.", observe: "Nomeacao, trocas fonologicas, gestos substituindo fala." },
      { title: "Ordem em duas etapas", instruction: "Peca para pegar um item e colocar em um local especifico.", observe: "Compreensao sem pista visual e manutencao da sequencia." },
      { title: "Repeticao de frase", instruction: "Diga uma frase curta e peca para repetir igual.", observe: "Omissoes, trocas e memoria verbal." },
    ],
  },
  {
    id: "tea-social",
    label: "TEA / social",
    queixas: ["tea", "social", "linguagem"],
    minAge: 12,
    maxAge: 84,
    tasks: [
      { title: "Resposta ao nome", instruction: "Chame pelo nome fora do campo visual.", observe: "Orientacao, busca do olhar e compartilhamento." },
      { title: "Atencao compartilhada", instruction: "Aponte algo interessante e convide a olhar.", observe: "Segue o apontar e alterna olhar entre pessoa e objeto." },
      { title: "Brincar simbolico", instruction: "Ofereca boneco, copo e colher para uma cena simples.", observe: "Faz de conta, imitacao e reciprocidade." },
    ],
  },
  {
    id: "atencao",
    label: "Atencao / executiva",
    queixas: ["tdah", "cognicao", "aprendizagem"],
    minAge: 48,
    maxAge: 216,
    tasks: [
      { title: "Alvo auditivo", instruction: "Leia uma lista curta e combine uma batida ao ouvir a palavra-alvo.", observe: "Omissoes, impulsividade e manutencao de regra." },
      { title: "Span de digitos", instruction: "Peca para repetir sequencias curtas, depois uma ao contrario.", observe: "Memoria de trabalho e ordem da sequencia.", minAge: 60 },
      { title: "Dia/noite", instruction: "Combine responder o oposto ao ouvir dia ou noite.", observe: "Controle inibitorio e autocorrecao.", minAge: 60 },
    ],
  },
  {
    id: "aprendizagem",
    label: "Aprendizagem",
    queixas: ["aprendizagem", "cognicao", "tdah"],
    minAge: 48,
    maxAge: 216,
    tasks: [
      { title: "Reconhecimento de letras", instruction: "Mostre letras fora de ordem.", observe: "Nomeacao, confusoes visuais e automatizacao.", maxAge: 144 },
      { title: "Consciencia fonologica", instruction: "Pergunte som inicial, silabas e rimas simples.", observe: "Segmentacao, rima e manipulacao sonora.", maxAge: 120 },
      { title: "Leitura e compreensao curta", instruction: "Use um texto breve e faca duas perguntas objetivas.", observe: "Fluencia, trocas e compreensao.", minAge: 72 },
      { title: "Matematica rapida", instruction: "Proponha contas simples adequadas a idade.", observe: "Estrategia, contagem nos dedos e acuracia.", minAge: 72 },
    ],
  },
  {
    id: "emocional",
    label: "Emocional",
    queixas: ["ansiedade", "depressao", "suicidio"],
    minAge: 48,
    maxAge: 216,
    tasks: [
      { title: "Nomear emocoes", instruction: "Mostre ou descreva emocoes basicas.", observe: "Vocabulário emocional e reconhecimento." },
      { title: "Termometro emocional", instruction: "Peca nota de 0 a 10 para preocupacao/tristeza hoje.", observe: "Intensidade, gatilhos e capacidade de relato.", minAge: 72 },
      { title: "Checagem de seguranca", instruction: "Com acolhimento, investigue risco de autoagressao quando indicado.", observe: "Se positivo ou duvidoso, acionar protocolo clinico.", minAge: 96 },
    ],
  },
  {
    id: "motor",
    label: "Motor",
    queixas: ["motor", "pc", "atraso"],
    minAge: 24,
    maxAge: 216,
    tasks: [
      { title: "Coordenacao grossa", instruction: "Pular, andar sobre linha, chutar ou pegar bola conforme idade.", observe: "Equilibrio, assimetria e quedas." },
      { title: "Motricidade fina", instruction: "Desenhar, recortar ou manipular botoes conforme idade.", observe: "Pinca, esforco, planejamento motor e legibilidade." },
    ],
  },
];

export function domainsForQueixas(queixas: string[], ageMonths: number | null): DirectDomain[] {
  const matched = queixas.length
    ? directDomains.filter((domain) => domain.queixas.some((queixa) => queixas.includes(queixa)))
    : directDomains;
  const pool = matched.length ? matched : directDomains;
  if (ageMonths == null) return pool;
  return pool.filter((domain) => ageMonths >= domain.minAge - 6 && ageMonths <= domain.maxAge + 6);
}
