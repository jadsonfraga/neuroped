/**
 * Biblioteca de SONDAGENS DIRETAS por domínio — recuperada do app legado
 * (scales-direct-tasks.js). Tarefas aplicadas ATIVAMENTE na criança, com
 * instrução lúdica (o que dizer/fazer) e o que observar. Complementa as escalas
 * de heterorrelato com avaliação direta na pré-consulta.
 *
 * Apoio à observação clínica; NÃO é teste normatizado nem ponto de corte.
 */

export interface DirectTask {
  emoji: string;
  titulo: string;
  instrucao: string;
  observar: string;
  faixa?: [number, number]; // meses
  risk?: boolean; // tarefa de checagem de segurança — exibe protocolo
}

export interface DirectDomain {
  id: string;
  emoji: string;
  label: string;
  domain: string;
  age: [number, number]; // meses
  queixas: string[]; // ids de queixa do filtro
  tasks: DirectTask[];
}

export const directDomains: DirectDomain[] = [
  {
    id: "linguagem", emoji: "🗣️", label: "Linguagem", domain: "Linguagem", age: [24, 215],
    queixas: ["linguagem"],
    tasks: [
      { emoji: "🐶", titulo: "Nomeação por figuras", instrucao: 'Mostre objetos/figuras: "O que é isso?" (copo, bola, cachorro, mão, sapato).', observar: "Quantos nomeia, trocas de som, se usa gesto no lugar da palavra." },
      { emoji: "💬", titulo: "Compreensão de ordem", instrucao: 'Sem apontar, peça: "Pegue o lápis e coloque em cima da mesa."', observar: "Se cumpre as duas etapas sem pista visual." },
      { emoji: "🗣️", titulo: "Repetição de frase", instrucao: '"O menino pegou a bola azul." Peça para repetir igualzinho.', observar: "Se omite ou troca palavras (memória + fala)." },
      { emoji: "⚡", titulo: "Nomeação rápida", instrucao: 'Aponte 5 figuras conhecidas: "Diga o nome o mais rápido que conseguir."', observar: "Velocidade, pausas e travas de evocação.", faixa: [48, 215] },
    ],
  },
  {
    id: "social", emoji: "🧩", label: "Social / TEA", domain: "TEA e comunicação social", age: [12, 84],
    queixas: ["tea", "social"],
    tasks: [
      { emoji: "🙋", titulo: "Resposta ao nome", instrucao: "Chame o nome 2–3 vezes, fora do campo de visão da criança.", observar: "Se vira e busca o olhar de quem chamou.", faixa: [12, 72] },
      { emoji: "👉", titulo: "Atenção compartilhada", instrucao: 'Aponte algo interessante e diga "Olha!".', observar: "Se segue o apontar e alterna o olhar entre você e o objeto.", faixa: [12, 72] },
      { emoji: "🧸", titulo: "Brincar simbólico", instrucao: 'Ofereça boneco, copo e colher: "Vamos dar comidinha?"', observar: "Se faz de conta, imita e cria pequenas cenas.", faixa: [18, 84] },
      { emoji: "🔁", titulo: "Troca de turno", instrucao: 'Brinque de "minha vez, sua vez" com uma bola ou torre de blocos.', observar: "Se espera a vez e mantém a reciprocidade." },
    ],
  },
  {
    id: "atencao", emoji: "🎯", label: "Atenção / Executiva", domain: "TDAH e função executiva", age: [48, 215],
    queixas: ["tdah", "cognicao"],
    tasks: [
      { emoji: "🎯", titulo: "Atenção auditiva (alvo)", instrucao: 'Leia: sol, bola, peixe, bola, casa, bola. "Bata na mesa quando ouvir BOLA."', observar: "Acertos, omissões e impulsos (bate na palavra errada)." },
      { emoji: "🔢", titulo: "Span de dígitos", instrucao: "Repetir: 4-8-2; depois 7-1-9-3; depois de trás pra frente: 5-2-9.", observar: "Maior sequência correta, ordem direta e inversa.", faixa: [60, 215] },
      { emoji: "🚦", titulo: "Inibição (dia/noite)", instrucao: 'Combine: ao ouvir "dia", responda "noite"; e o contrário.', observar: "Se segura a resposta automática (controle inibitório).", faixa: [60, 215] },
      { emoji: "🧭", titulo: "Sequência de 3 passos", instrucao: '"Desenhe um círculo, escreva seu nome e faça um risco embaixo."', observar: "Se mantém a ordem e conclui (planejamento)." },
    ],
  },
  {
    id: "escola", emoji: "📚", label: "Pedagógico", domain: "Aprendizagem escolar", age: [48, 215],
    queixas: ["aprendizagem"],
    tasks: [
      { emoji: "🔤", titulo: "Reconhecimento de letras", instrucao: "Mostre letras fora de ordem (A, M, S, O, P, E): vamos descobrir as letras?", observar: "Quantas nomeia e confusões (b/d, p/q).", faixa: [48, 144] },
      { emoji: "🧩", titulo: "Consciência fonológica", instrucao: '"Com que som começa BOLA?" · "ca-sa, bo-ne-ca" · "O que rima com PÃO?"', observar: "Sílabas, som inicial e rima.", faixa: [48, 120] },
      { emoji: "📖", titulo: "Leitura curta", instrucao: '"Lia viu um sapo no jardim. O sapo pulou perto da flor." Quem viu? onde estava?', observar: "Fluência, trocas e compreensão.", faixa: [72, 215] },
      { emoji: "✏️", titulo: "Ditado", instrucao: 'Dite: casa, bola, janela, prato. Depois: "A menina gosta de ler."', observar: "Trocas, omissões e organização na linha.", faixa: [72, 215] },
      { emoji: "🔢", titulo: "Matemática rápida", instrucao: "Resolva junto: 8+5, 14−6, 3 grupos de 4, metade de 10.", observar: "Estratégia (conta nos dedos?) e acertos.", faixa: [72, 215] },
    ],
  },
  {
    id: "cognicao", emoji: "🧠", label: "Cognitivo", domain: "Cognição", age: [48, 215],
    queixas: ["cognicao", "aprendizagem"],
    tasks: [
      { emoji: "🧠", titulo: "Memória visual imediata", instrucao: "Mostre 4 figuras por 5 s, cubra e peça para lembrar quais eram.", observar: "Quantas recorda e se usa estratégia.", faixa: [48, 215] },
      { emoji: "🔗", titulo: "Semelhanças (raciocínio)", instrucao: '"No que banana e maçã se parecem? E cachorro e gato?"', observar: "Se abstrai a categoria ou fica no concreto.", faixa: [60, 215] },
      { emoji: "🧩", titulo: "Sequência lógica", instrucao: "Conte uma história em 3 partes fora de ordem e peça para ordenar.", observar: "Noção de antes/depois, causa e efeito.", faixa: [54, 215] },
      { emoji: "⚡", titulo: "Velocidade de processamento", instrucao: "Nomear o mais rápido possível 8 cores/figuras em sequência.", observar: "Ritmo, pausas e travas; compare com o esperado.", faixa: [60, 215] },
    ],
  },
  {
    id: "visual", emoji: "🔷", label: "Reconhecimento visual", domain: "Percepção visual", age: [36, 168],
    queixas: ["aprendizagem", "cognicao", "linguagem"],
    tasks: [
      { emoji: "🔷", titulo: "Reconhecimento de formas", instrucao: "Nomear: círculo, quadrado, triângulo, estrela.", observar: "Quantas reconhece e nomeia.", faixa: [36, 144] },
      { emoji: "🎨", titulo: "Reconhecimento de cores", instrucao: 'Aponte objetos e pergunte a cor; depois "me dê o que é azul".', observar: "Nomeia e seleciona cores corretamente?", faixa: [36, 120] },
      { emoji: "🔍", titulo: "Discriminação visual", instrucao: 'Mostre 4 figuras quase iguais e 1 diferente: "Qual é a diferente?"', observar: "Percebe pequenos detalhes que mudam.", faixa: [48, 168] },
      { emoji: "🖼️", titulo: "Figura-fundo", instrucao: 'Numa cena cheia, peça para achar um objeto ("ache o gato").', observar: "Isola a figura do fundo sem se perder.", faixa: [48, 168] },
      { emoji: "✏️", titulo: "Cópia de figura", instrucao: "Desenhe quadrado, triângulo e cruz e peça para copiar.", observar: "Proporção, linhas e organização (visomotor).", faixa: [48, 168] },
    ],
  },
  {
    id: "sensorial", emoji: "✨", label: "Sensorial", domain: "Processamento sensorial", age: [24, 215],
    queixas: ["sensorial", "alimentacao"],
    tasks: [
      { emoji: "✨", titulo: "Termômetro sensorial", instrucao: '"De 0 a 5, quanto incomoda: barulho de liquidificador? etiqueta na roupa? luz forte?"', observar: "Reações e quais estímulos pesam mais." },
      { emoji: "🖐️", titulo: "Tolerância gradual", instrucao: "Ofereça olhar → tocar → cheirar um item novo, sem forçar.", observar: "Até onde aceita e o que ajuda a regular." },
    ],
  },
  {
    id: "emocional", emoji: "😊", label: "Emocional", domain: "Emoção e regulação", age: [48, 215],
    queixas: ["ansiedade", "depressao"],
    tasks: [
      { emoji: "😊", titulo: "Nomear emoções", instrucao: "Apontar: feliz, triste, bravo, com medo, cansado.", observar: "Vocabulário emocional e reconhecimento." },
      { emoji: "🌡️", titulo: "Termômetro emocional", instrucao: '"De 0 a 10, quanto está a preocupação/tristeza hoje?"', observar: "Intensidade percebida e gatilhos.", faixa: [72, 215] },
      { emoji: "💬", titulo: "Situação social", instrucao: '"Um colega não respondeu sua mensagem. O que pode ter acontecido?"', observar: "Flexibilidade de interpretação (viés negativo?).", faixa: [96, 215] },
      { emoji: "🛟", titulo: "Checagem de segurança", instrucao: "Com acolhimento e linguagem apropriada, pergunte se já pensou em se machucar ou sumir. Liste 3 adultos de confiança.", observar: "Se positivo/hesitante: acionar protocolo — CVV 188 · SAMU 192.", risk: true, faixa: [96, 215] },
    ],
  },
  {
    id: "motor", emoji: "🤸", label: "Motor", domain: "Motricidade", age: [24, 215],
    queixas: ["motor", "pc"],
    tasks: [
      { emoji: "🤸", titulo: "Coordenação grossa", instrucao: "Pular num pé só, andar sobre uma linha, chutar e pegar uma bola.", observar: "Equilíbrio, quedas e diferença em relação à idade." },
      { emoji: "✍️", titulo: "Motricidade fina", instrucao: "Recortar, abotoar e desenhar uma pessoa.", observar: "Preensão do lápis, esforço e legibilidade." },
    ],
  },
];

export function domainsForQueixas(queixas: string[], ageMonths: number | null): DirectDomain[] {
  if (queixas.length === 0) return directDomains;
  const match = directDomains.filter((d) => d.queixas.some((q) => queixas.includes(q)));
  const pool = match.length ? match : directDomains;
  if (ageMonths == null) return pool;
  return pool.filter((d) => ageMonths >= d.age[0] - 6 && ageMonths <= d.age[1] + 6);
}
