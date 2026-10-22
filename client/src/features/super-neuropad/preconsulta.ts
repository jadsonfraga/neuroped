/**
 * Roteiro de pré-consulta: observações feitas AO LONGO da aventura, sem reproduzir
 * desafios da bateria e sem delegar exame médico à assistente.
 * Não produz escore, diagnóstico, interpretação ou atestado de normalidade.
 */
import { circuitForAge, type CircuitTask } from "./clinicalCircuit";

export const PRECONSULTA_IDS = [
  "rapport", "consciencia", "social2", "conversation6", "attention2",
  "attention6", "involuntary", "hand", "milestones", "sleep", "emotion2",
] as const;

export interface MissaoRapida {
  convite: string;
  material: string;
  momento: string;
  passos: readonly [string, string, string];
  pistas: readonly string[];
}

/** Não inclui fundoscopia, reflexos, pares cranianos, tônus, sensibilidade,
 * testes motores dirigidos, entrevista de risco ou interpretação clínica. */
export function tarefasDaAssistente(years: number, area?: "neurologico" | "mental"): CircuitTask[] {
  const permitidos = new Set<string>(PRECONSULTA_IDS);
  return circuitForAge(years, area).filter((task) => permitidos.has(task.id));
}

export const PRECONSULTA_MISSOES: Readonly<Record<string, MissaoRapida>> = {
  rapport: {
    convite: "👋 Bem-vindo à nossa aventura! Qual personagem você quer conhecer?",
    material: "Nenhum material extra",
    momento: "Observe na chegada — não crie outra prova",
    passos: ["Receba a criança normalmente e ofereça a escolha do personagem.", "Enquanto escolhe, veja como reage à sala e ao convite, sem exigir olhar nos olhos.", "Marque apenas comportamentos que aconteceram de fato durante a recepção."],
    pistas: ["Aceitou o convite", "Preferiu observar primeiro", "Explorou o ambiente", "Precisou de ajuda para começar", "Ficou incomodada com a sala"],
  },
  consciencia: {
    convite: "🔔 Os exploradores estão prontos para jogar!",
    material: "O próprio jogo",
    momento: "Observe ao longo da partida — sem tarefa nova",
    passos: ["Durante o jogo, observe se a criança permanece desperta e acompanha a atividade.", "Note se responde quando a assistente fala naturalmente com ela.", "Se houver sonolência intensa ou mudança súbita de comportamento, interrompa e avise o médico."],
    pistas: ["Acompanhou a atividade", "Demorou a responder", "Ficou sonolenta", "Alternou entre atenção e agitação", "Precisou de ajuda para acompanhar"],
  },
  social2: {
    convite: "🧸 Sua vez, minha vez! Vamos escolher juntos?",
    material: "Um brinquedo seguro já disponível na sala",
    momento: "Somente durante o acolhimento dos 2 aos 5 anos",
    passos: ["Ofereça um brinquedo simples e convide a alternar a vez uma única vez.", "Observe se mostra ou aponta algo para compartilhar o interesse, sem exigir contato ocular.", "Registre o gesto, a ajuda ou a recusa; não insista nem transforme em teste."],
    pistas: ["Alternou a vez", "Mostrou ou apontou algo", "Preferiu brincar sozinha", "Aceitou ajuda", "Não quis a brincadeira"],
  },
  conversation6: {
    convite: "💬 Conte qual parte da aventura você mais gostou!",
    material: "Nenhum material extra",
    momento: "Conversa breve na transição entre mundos, sem nova prova",
    passos: ["Pergunte naturalmente qual personagem ou desafio a criança preferiu.", "Escute se consegue compartilhar uma ideia e manter uma troca simples.", "Respeite gestos, fala breve e comunicação alternativa; não repita perguntas como interrogatório."],
    pistas: ["Compartilhou uma ideia", "Respondeu com poucas palavras", "Usou gesto ou comunicação alternativa", "Mudou de assunto", "Precisou de pergunta de apoio"],
  },
  attention2: {
    convite: "💎 Vamos ver o próximo tesouro!",
    material: "Os próprios desafios do jogo",
    momento: "Observe os desafios normais dos 2 aos 5 anos",
    passos: ["Não apresente cartões ou provas extras: acompanhe os desafios que já estão na tela.", "Veja se inicia a atividade após compreender o convite e como reage quando a tela muda.", "Marque se precisou de repetição, pausa ou ajuda; considere cansaço e interesse."],
    pistas: ["Iniciou após o convite", "Precisou repetir a instrução", "Mudou de foco", "Retomou com ajuda", "Pediu pausa"],
  },
  attention6: {
    convite: "🔄 Novo mundo, novas regras da aventura!",
    material: "Os próprios desafios do jogo",
    momento: "Observe as transições de fase — não acrescente cartas nem regras",
    passos: ["Acompanhe como a criança inicia um desafio novo da bateria normal.", "Observe como se ajusta quando a tela apresenta outra atividade, sem criar tarefa adicional.", "Marque necessidade de explicação, ajuda ou pausa; não atribua classificação."],
    pistas: ["Entendeu a mudança", "Pediu explicação", "Continuou na atividade anterior", "Retomou com ajuda", "Precisou de pausa"],
  },
  involuntary: {
    convite: "🌀 O explorador pode brincar do seu jeito!",
    material: "Nenhum material extra",
    momento: "Observação espontânea — não solicite movimentos repetitivos",
    passos: ["Enquanto a criança brinca, observe sem chamar atenção para piscadas, movimentos ou sons repetidos.", "Se algo aparecer espontaneamente, anote o que fez, onde ocorreu e quando.", "Não peça para suprimir movimentos, não imite e não decida se é tique; relate ao médico."],
    pistas: ["Nenhum movimento repetido percebido", "Piscadas ou caretas repetidas", "Movimento repetido de braços ou cabeça", "Sons repetidos percebidos", "Não foi possível observar"],
  },
  hand: {
    convite: "✋ Qual mão vai guiar a aventura?",
    material: "Os próprios toques e desenhos da bateria",
    momento: "Observe as ações que a criança já realiza",
    passos: ["Enquanto toca na tela ou pega objetos do jogo, repare qual mão usa espontaneamente.", "Se houver desenho dentro da bateria, observe a mão usada sem pedir outra cópia.", "Registre uso observado, troca de mão e ajuda; não defina dominância em crianças pequenas."],
    pistas: ["Usou mais a direita", "Usou mais a esquerda", "Alternou as mãos", "Usou as duas mãos juntas", "Não foi possível observar"],
  },
  milestones: {
    convite: "📅 Perguntas rápidas ao responsável enquanto a criança descansa.",
    material: "Responsável disponível; sem documentos obrigatórios",
    momento: "Pergunte uma única vez ao responsável, fora da brincadeira",
    passos: ["Pergunte aproximadamente quando a criança começou a andar e falar as primeiras palavras.", "Pergunte se alguma habilidade que já tinha foi perdida; se sim, avise o médico.", "Registre somente as informações lembradas pelo responsável, inclusive quando não souber."],
    pistas: ["Responsável informou sobre a marcha", "Informou sobre primeiras palavras", "Relatou perda de habilidade", "Não soube informar", "Responsável indisponível"],
  },
  sleep: {
    convite: "🌙 Uma pergunta sobre como foi a noite do explorador.",
    material: "Conversa breve com responsável",
    momento: "Pergunte uma única vez ao responsável, sem testar a criança",
    passos: ["Pergunte se costuma dormir bem e se desperta muitas vezes durante a noite.", "Pergunte se ronca forte, tem pausas respiratórias percebidas ou muito sono durante o dia.", "Registre as respostas como relato do responsável, sem supor causa ou diagnóstico."],
    pistas: ["Sono sem queixa relatada", "Dificuldade para dormir", "Despertares frequentes", "Ronco ou pausas relatadas", "Sonolência durante o dia"],
  },
  emotion2: {
    convite: "🌈 Cada explorador tem seu ritmo.",
    material: "Observação durante a brincadeira",
    momento: "Observe a reação ao jogar — sem questionário novo",
    passos: ["Perceba como a criança reage ao começar, ganhar, errar ou mudar de atividade.", "Quando ficar desconfortável, ofereça pausa sem insistir ou provocar frustração.", "Registre o comportamento e o contexto; não rotule temperamento nem transtorno."],
    pistas: ["Mostrou alegria ou interesse", "Ficou frustrada em uma troca", "Aceitou pausa ou ajuda", "Preferiu parar", "Não foi possível observar"],
  },
};
