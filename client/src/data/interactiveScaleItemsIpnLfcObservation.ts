import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnLfcObservationDomains: InteractiveDomainDef[] = [
  {
    name: "Atenção compartilhada e intenção",
    items: [
      { text: "Orienta atenção para pessoa e objeto durante atividade compartilhada.", emoji: "👀", example: "Alterna olhar, gesto, vocalização ou CAA de modo funcional. Aprofundar: A resposta depende de estímulo altamente preferido?" },
      { text: "Inicia comunicação sem pergunta direta do avaliador.", emoji: "👀", example: "Comenta, mostra, chama, protesta ou solicita espontaneamente. Aprofundar: Quais funções surgem espontaneamente?" },
      { text: "Responde a iniciativas de parceiros diferentes.", emoji: "👀", example: "Mantém troca com avaliador, cuidador e profissional conhecido. Aprofundar: A resposta varia por familiaridade ou demanda?" },
      { text: "Usa meio comunicativo eficiente para sua condição motora e sensorial.", emoji: "👀", example: "Fala, gesto, olhar, símbolo ou dispositivo é acessível e confiável. Aprofundar: O acesso falha por posicionamento ou velocidade?" },
      { text: "Repara falha comunicativa com estratégia própria ou apoiada.", emoji: "👀", example: "Muda modalidade, demonstra, repete ou seleciona alternativa. Aprofundar: Quanto suporte é necessário?" },
    ],
  },
  {
    name: "Compreensão funcional",
    items: [
      { text: "Segue instrução de uma etapa em contexto não rotineiro.", emoji: "👂", example: "Executa sem imitação ou pista gestual automática. Aprofundar: Registrar tipo de pista mínima eficaz." },
      { text: "Segue instrução de duas etapas relacionadas.", emoji: "👂", example: "Mantém ordem e objetivo. Aprofundar: Diferenciar memória de trabalho de compreensão lexical." },
      { text: "Responde a perguntas variadas sem ecoar a estrutura.", emoji: "👂", example: "Demonstra compreensão de quem, onde, como e por quê. Aprofundar: Registrar tipo de pergunta e tempo de resposta." },
      { text: "Compreende conceitos espaciais, temporais e quantitativos em tarefa real.", emoji: "👂", example: "Dentro/fora, antes/depois, mais/menos, primeiro/último. Aprofundar: Verificar generalização fora do material de teste." },
      { text: "Detecta mensagem impossível, ambígua ou insuficiente.", emoji: "👂", example: "Pede esclarecimento ou recusa escolha incoerente. Aprofundar: Observar tendência a adivinhar." },
    ],
  },
  {
    name: "Expressão e formulação",
    items: [
      { text: "Produz mensagem com conteúdo suficiente para o parceiro entender.", emoji: "📝", example: "Inclui agentes, ações e elementos essenciais. Aprofundar: Registrar extensão média e omissões relevantes." },
      { text: "Acessa palavras específicas sem latência ou circunlóquio desproporcional.", emoji: "📝", example: "Nomeia e descreve com precisão. Aprofundar: Comparar nomeação, conversa e narrativa." },
      { text: "Usa morfossintaxe funcional para idade e repertório linguístico.", emoji: "📝", example: "Tempo verbal, concordância, pronomes e conectivos. Aprofundar: Distinguir diferença dialetal de dificuldade." },
      { text: "Formula frases complexas sem perda de coerência.", emoji: "📝", example: "Integra causa, condição, contraste e tempo. Aprofundar: Registrar estruturas preservadas e frágeis." },
      { text: "Adapta mensagem ao conhecimento do interlocutor.", emoji: "📝", example: "Fornece contexto para alguém que não presenciou o evento. Aprofundar: Observar pressuposições inadequadas." },
    ],
  },
  {
    name: "Narrativa, pragmática e discurso",
    items: [
      { text: "Organiza narrativa com cenário, problema, ações e desfecho.", emoji: "🤝", example: "Mantém sequência e relação causal. Aprofundar: Usar amostra espontânea e recontagem." },
      { text: "Mantém referência clara a personagens e objetos.", emoji: "🤝", example: "Pronomes e nomes permitem acompanhar quem fez o quê. Aprofundar: Registrar rupturas de coesão." },
      { text: "Inclui estados mentais, emoções e motivos quando pertinente.", emoji: "🤝", example: "Explica intenção além de ação visível. Aprofundar: Evitar concluir teoria da mente por um único item." },
      { text: "Mantém tópico e responde ao conteúdo do parceiro.", emoji: "🤝", example: "Evita monólogo desconectado ou respostas tangenciais. Aprofundar: Considerar interesse, ansiedade e carga linguística." },
      { text: "Compreende e usa reparo conversacional.", emoji: "🤝", example: "Sinaliza dúvida, corrige e confirma entendimento. Aprofundar: Observar resposta quando o avaliador finge não entender." },
    ],
  },
  {
    name: "Fala e inteligibilidade",
    items: [
      { text: "A inteligibilidade é suficiente em palavra, frase e fala espontânea.", emoji: "🔊", example: "Comparar tarefas e parceiro familiar/não familiar. Aprofundar: Estimar impacto funcional, não só acurácia de fonema." },
      { text: "Os erros apresentam padrão fonológico identificável.", emoji: "🔊", example: "Processos são consistentes e analisáveis. Aprofundar: Registrar processos, contexto e idade." },
      { text: "A produção de palavras repetidas é estável.", emoji: "🔊", example: "Mesma palavra mantém forma semelhante em três tentativas. Aprofundar: Variabilidade pode sugerir planejamento motor, mas não diagnostica isoladamente." },
      { text: "A acurácia piora com comprimento e complexidade articulatória.", emoji: "🔊", example: "Palavras multissilábicas e sequências novas mostram maior carga. Aprofundar: Comparar sílabas simples e complexas." },
      { text: "Prosódia, acento e transições entre sons são funcionais.", emoji: "🔊", example: "Entonação e duração não prejudicam inteligibilidade. Aprofundar: Registrar segmentação, acento lexical e coarticulação." },
    ],
  },
  {
    name: "Aprendizagem dinâmica e suporte",
    items: [
      { text: "Melhora com modelagem, repetição espaçada e pistas graduadas.", emoji: "◇", example: "Mostra potencial de aprendizagem durante a sessão. Aprofundar: Registrar pista mínima e manutenção após intervalo." },
      { text: "Generaliza uma forma ensinada para palavra, frase ou contexto novo.", emoji: "◇", example: "Transfere estratégia além do item treinado. Aprofundar: Diferenciar imitação imediata de aprendizagem." },
      { text: "Usa apoio visual ou gestual sem ficar dependente dele.", emoji: "◇", example: "O suporte amplia compreensão e pode ser reduzido gradualmente. Aprofundar: Registrar quando a pista vira muleta." },
      { text: "Tolera correção e mantém participação.", emoji: "◇", example: "Aceita feedback sem bloquear comunicação espontânea. Aprofundar: Observar impacto emocional e ritmo da sessão." },
      { text: "Demonstra uma prioridade funcional mensurável para o plano.", emoji: "◇", example: "A meta é escolhida por impacto em participação e segurança. Aprofundar: Definir linha de base observável." },
    ],
  },
];
