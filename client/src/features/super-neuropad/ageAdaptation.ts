/**
 * Adaptação clínica autoral do roteiro de observação: um perfil explícito por ano (2–17).
 * Não são marcos obrigatórios, escala de desenvolvimento, regra de acerto ou critério diagnóstico.
 * O perfil orienta a forma de oferecer tarefas já existentes, sem mudar o banco do jogo.
 * Entrevista de risco permanece privativa do médico, sem gamificação.
 */
import type { CircuitTask } from "./clinicalCircuit";

export interface PerfilAnual {
  idade: number;
  nome: string;
  convite: string;
  comunicacao: string;
  interacao: string;
  motricidade: string;
  cognicao: string;
  acessibilidade: string;
}

export const PERFIS_ANUAIS: readonly PerfilAnual[] = [
  {idade:2,nome:"Pequenas descobertas",convite:"Oferecer um objeto familiar e observar uma ação de cada vez, com cuidador por perto.",comunicacao:"Nomear ou apontar objeto familiar; aceitar gesto, vocalização ou comunicação alternativa.",interacao:"Convidar a compartilhar objeto ou alternar brevemente uma ação com adulto conhecido.",motricidade:"Observar alcançar com cada mão, levantar e deslocar-se espontaneamente em local seguro.",cognicao:"Experimentar uma ação de causa e efeito durante brincadeira livre, sem exigir verbalização.",acessibilidade:"Instrução curta, demonstração concreta, intervalo livre e encerramento à recusa."},
  {idade:3,nome:"Exploradores da brincadeira",convite:"Propor brincadeira de faz de conta com personagem ou objeto conhecido, sem roteiro rígido.",comunicacao:"Pedir que mostre o uso de um objeto e conte algo com palavras ou gestos.",interacao:"Alternar turnos numa brincadeira simples; observar convite espontâneo e resposta.",motricidade:"Observar manipular peças grandes, transportar objetos e contornar pequeno obstáculo com proteção.",cognicao:"Apresentar duas ações encadeadas de faz de conta, permitindo imitação antes da iniciativa.",acessibilidade:"Aceitar apontar, comunicação alternativa, modelo e participação do cuidador."},
  {idade:4,nome:"Histórias em movimento",convite:"Construir pequena história com dois personagens escolhidos pela criança.",comunicacao:"Convidar a descrever quem fez o quê, apoiando-se em objetos ou imagens.",interacao:"Alternar papéis em brincadeira simbólica e observar a resposta à mudança de turno.",motricidade:"Propor equilíbrio lúdico no chão e manipulação bimanual de objetos sem exigência de precisão rígida.",cognicao:"Organizar duas cenas de uma história e observar compreensão da sequência.",acessibilidade:"Permitir demonstração, ajuda graduada e resposta oral, gestual ou por símbolos."},
  {idade:5,nome:"Guardiões da história",convite:"Escolher começo e fim de uma pequena aventura com três figuras.",comunicacao:"Solicitar narrativa breve com apoio visual e perguntas abertas sem induzir resposta.",interacao:"Propor combinar uma regra de turnos e observar mudanças quando a criança concordar.",motricidade:"Observar coordenação das mãos e marcha em percurso seguro, registrando compensações.",cognicao:"Reordenar cenas ou mudar uma regra simples sem cronometrar por idade.",acessibilidade:"Não exigir alfabetização; usar ilustrações, comunicação alternativa e pausas."},
  {idade:6,nome:"Missão da escola e do brincar",convite:"Usar uma situação cotidiana da escola ou brincadeira sem assumir que já lê.",comunicacao:"Contar um acontecimento com começo e desfecho; leitura somente se alfabetizada.",interacao:"Negociar turnos e explicar uma escolha em interação breve.",motricidade:"Observar equilíbrio e coordenação em atividade segura, sem exigir desempenho esportivo.",cognicao:"Propor duas instruções encadeadas e mudança de regra com demonstração.",acessibilidade:"Incluir figuras e resposta verbal/gestual; considerar oportunidades de ensino."},
  {idade:7,nome:"Detetives do cotidiano",convite:"Convidar a solucionar uma missão ligada a materiais e rotinas da escola.",comunicacao:"Descrever sequência do dia e verificar compreensão de instruções sem confundir com leitura.",interacao:"Explicar como convidaria colega a participar de uma atividade.",motricidade:"Observar marcha, alternância de mãos e coordenação bilateral mediante segurança.",cognicao:"Comparar duas estratégias de organização de materiais, com pistas quando necessárias.",acessibilidade:"Registrar escolarização e apoio recebido; aceitar recursos visuais."},
  {idade:8,nome:"Construtores de soluções",convite:"Criar situação de projeto curto, como organizar mochila ou preparar brincadeira.",comunicacao:"Descrever etapas e pedir esclarecimento de uma instrução ambígua.",interacao:"Explorar um desencontro social fictício sem exigir resposta social única.",motricidade:"Observar movimentos alternados, postura e marcha em condições seguras.",cognicao:"Planejar dois passos e revisar a estratégia quando uma condição muda.",acessibilidade:"Usar linguagem compatível com escolarização, sem penalizar diferenças de leitura."},
  {idade:9,nome:"Mapas de escolhas",convite:"Escolher entre dois caminhos de uma aventura e justificar preferência.",comunicacao:"Contar evento real ou fictício distinguindo sequência e personagens.",interacao:"Discutir reação possível a desacordo, respeitando múltiplas alternativas.",motricidade:"Observar coordenação e equilíbrio com comparação bilateral quando exame indicado.",cognicao:"Propor uma regra com exceção e permitir revisão da primeira resposta.",acessibilidade:"Oferecer tempo para responder e apoio visual sem converter tempo em pontuação."},
  {idade:10,nome:"Planejadores da missão",convite:"Convidar a planejar tarefa escolar ou doméstica conhecida, sem pressupor autonomia.",comunicacao:"Explicar procedimento conhecido, pedir exemplo e reformular instrução.",interacao:"Explorar estratégias para resolver conflito cotidiano com diálogo.",motricidade:"Observar movimentos coordenados e lateralidade funcional sem valorizá-la como acerto.",cognicao:"Pedir que liste etapas, antecipe obstáculo e escolha ajuda útil.",acessibilidade:"Distinguir habilidade demonstrada, oportunidade de ensino e apoio disponível."},
  {idade:11,nome:"Investigadores de estratégias",convite:"Montar uma escolha de percurso e explicar por que a modificaria.",comunicacao:"Relacionar causa e consequência numa história curta de interesse pessoal.",interacao:"Observar reciprocidade durante conversa, sem impor contato ocular.",motricidade:"Comparar tarefas motoras bilateralmente apenas quando clinicamente pertinente.",cognicao:"Planejar sequência com mudança inesperada e descrever correção, sem nota automática.",acessibilidade:"Oferecer instrução escrita apenas quando compreendida; priorizar compreensão funcional."},
  {idade:12,nome:"Autonomia com apoio",convite:"Permitir escolher tema de interesse e como prefere participar da tarefa.",comunicacao:"Pedir narrativa e explicação de decisão, respeitando diferenças pragmáticas.",interacao:"Explorar convivência com colegas e família com privacidade apropriada.",motricidade:"Realizar exame motor dirigido quando necessário, com consentimento e respeito ao corpo.",cognicao:"Discutir organização do estudo ou rotina e recursos que facilitam execução.",acessibilidade:"Oferecer parte da entrevista sem cuidador quando adequado, com limites de sigilo explicados."},
  {idade:13,nome:"Decisões do dia a dia",convite:"Oferecer problema cotidiano escolhido pelo adolescente, sem infantilizar a linguagem.",comunicacao:"Explorar raciocínio narrativo e capacidade de pedir esclarecimento.",interacao:"Distinguir observação na consulta de relato sobre relacionamentos.",motricidade:"Adequar exame presencial a conforto, consentimento, segurança e privacidade.",cognicao:"Pedir que organize duas alternativas e descreva consequências.",acessibilidade:"Respeitar identidade, preferências comunicativas e necessidade de mediação."},
  {idade:14,nome:"Projetos e contextos",convite:"Usar situação sobre escola, lazer ou projeto pessoal escolhida livremente.",comunicacao:"Explorar discurso espontâneo, sequência e flexibilidade temática.",interacao:"Perguntar sobre diferenças de funcionamento entre ambientes sem pressionar revelações.",motricidade:"Observar funções motoras pertinentes e sintomas referidos, preservando privacidade.",cognicao:"Discutir tomada de decisão, execução e ajuste de plano curto.",acessibilidade:"Confirmar compreensão e direito de recusar; questões sensíveis só com profissional."},
  {idade:15,nome:"Rotinas e prioridades",convite:"Propor organização de uma semana com atividades reais ou inventadas.",comunicacao:"Convidar a explicar prioridades e obstáculos concretos.",interacao:"Explorar apoio social e estratégias de resolução de problemas, sem julgar preferências.",motricidade:"Executar exame motor proporcional à queixa e ao conforto do adolescente.",cognicao:"Planejar tarefa de longo prazo em etapas e identificar apoios necessários.",acessibilidade:"Oferecer entrevista reservada quando clinicamente indicada, com consentimento e confidencialidade."},
  {idade:16,nome:"Escolhas e autonomia progressiva",convite:"Debater desafio de planejamento escolar, doméstico ou de lazer escolhido.",comunicacao:"Explicar decisão e pedir ao adolescente que descreva suas próprias estratégias.",interacao:"Confrontar fontes apenas em síntese médica, não como julgamento do adolescente.",motricidade:"Comparar achados físicos pertinentes à queixa, sem manobras desnecessárias.",cognicao:"Criar plano com alternativas e observar adaptação diante de mudança de condições.",acessibilidade:"Respeitar privacidade, contexto cultural e comunicação alternativa."},
  {idade:17,nome:"Transição de cuidados",convite:"Propor situação de escolha de rotina e organização de cuidados ou estudos.",comunicacao:"Solicitar relato de objetivos, dúvidas e necessidade de informação.",interacao:"Observar autonomia comunicativa e quem participa de decisões de modo compartilhado.",motricidade:"Exame dirigido ao sintoma, consentimento, privacidade e segurança.",cognicao:"Identificar passos de planejamento e como busca apoio quando necessário.",acessibilidade:"Discutir autonomia progressiva e participação nas decisões sem presumir independência plena."},
] as const;

/** Exatamente um perfil por ano. Nunca faz interpolação silenciosa. */
export function perfilAnual(anos: number): PerfilAnual | undefined {
  if (!Number.isInteger(anos) || anos < 2 || anos > 17) return undefined;
  return PERFIS_ANUAIS.find((p) => p.idade === anos);
}
const LINGUAGEM = new Set(["language2","language6","conversation6","hearing","sleep"]);
const MOTRICIDADE = new Set(["posture","strength2","strength2p","strength6","reflex","sensation","stereognosis","reach2","dismetria2","finger6","gait2","gait6","romberg","praxis3","praxis6","copy6","hand","involuntary","shoulders","face"]);
const COGNICAO = new Set(["attention2","attention6","memory6","insight9","vision","milestones"]);
const INTERACAO = new Set(["rapport","social2","emotion2","emotion6","thought6"]);

/** A entrevista de risco fica de fora: não acrescentar convites de jogo. */
export function dicaDeMissaoPorIdade(anos: number, estacao: Pick<CircuitTask,"id"|"method">): string | null {
  if (estacao.id === "risk") return null;
  const perfil = perfilAnual(anos);
  if (!perfil) return null;
  const proposta = LINGUAGEM.has(estacao.id) ? perfil.comunicacao
    : MOTRICIDADE.has(estacao.id) ? perfil.motricidade
    : COGNICAO.has(estacao.id) ? perfil.cognicao
    : INTERACAO.has(estacao.id) ? perfil.interacao
    : perfil.convite;
  return estacao.method === "presencial"
    ? `Adaptação para ${anos} anos — orientação ao examinador: ${proposta} A execução e interpretação física pertencem ao profissional; o auxiliar não realiza manobras.`
    : estacao.method === "entrevista"
      ? `Adaptação para ${anos} anos — orientação à entrevista profissional: ${proposta} Respeitar assentimento, privacidade e comunicação preferida.`
      : `Adaptação para ${anos} anos — convite opcional: ${proposta} ${perfil.acessibilidade}`;
}
