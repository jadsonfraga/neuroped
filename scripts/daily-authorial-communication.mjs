// Conteúdo de contingência COM: registro descritivo, não validado e não diagnóstico.
// Uso clínico bloqueado até revisão humana explícita. Sem escores ou normas.
export const COMMUNICATION_DOMAINS = [
  { id: "iniciativa", label: "Iniciativa comunicativa", description: "Solicitar, recusar, pedir ajuda e compartilhar experiências por modalidades acessíveis." },
  { id: "compreensao", label: "Compreensão funcional", description: "Entender mensagens e orientações compatíveis com oportunidades e desenvolvimento." },
  { id: "reciprocidade", label: "Resposta e reciprocidade", description: "Responder e sustentar trocas comunicativas sem exigir fala oral ou contato ocular." },
  { id: "reparo", label: "Reparo comunicativo", description: "Buscar esclarecimento e modificar a mensagem quando necessário." },
  { id: "participacao", label: "Participação e apoios", description: "Usar a comunicação para escolhas e participação em situações significativas." },
  { id: "seguranca", label: "Segurança — avaliação independente", description: "Eventos agudos não são pontuados nem interpretados como dificuldade pragmática." },
];

const item = (id, domainId, text, clinicalNote, redFlag = false) => ({
  id, domainId, text, responseMode: redFlag ? "presente_ausente" : "frequencia_0_3", redFlag, clinicalNote,
});

export const COMMUNICATION_ITEMS = [
  item("CT01", "iniciativa", "Diante de oportunidades reais, inicia comunicação para solicitar, recusar ou pedir ajuda por uma modalidade acessível.", "Registrar situação, interlocutor, modalidade (fala, gesto, sinais, imagens, escrita ou tecnologia assistiva) e apoios disponíveis."),
  item("CT02", "iniciativa", "Compartilha espontaneamente interesse, escolha ou experiência com outra pessoa, de modo compatível com seu repertório.", "Descrever exemplo concreto; não exigir contato ocular, verbalização ou forma cultural específica."),
  item("CT03", "compreensao", "Compreende mensagens relacionadas à rotina, quando apresentadas em modalidade e complexidade acessíveis.", "Registrar instrução, recursos de compreensão, adaptação e contexto; não presumir desatenção."),
  item("CT04", "compreensao", "Responde funcionalmente a pedidos ou informações comunicadas por outra pessoa, considerando acessibilidade sensorial e linguística.", "Distinguir compreensão de execução motora; avaliar se houve oportunidade observável."),
  item("CT05", "reciprocidade", "Responde a tentativas de interação iniciadas por outra pessoa, utilizando sua modalidade habitual de comunicação.", "Registrar parceiro, tema, tempo de resposta e sinais comunicativos idiossincráticos."),
  item("CT06", "reciprocidade", "Mantém trocas comunicativas suficientes para atingir um objetivo compartilhado, com apoios quando necessários.", "Considerar jogo, rotina, conversa ou outra atividade própria da etapa de desenvolvimento; não exigir conversação formal."),
  item("CT07", "reparo", "Quando sua mensagem não é compreendida, tenta esclarecê-la por repetição, reformulação ou outra modalidade acessível.", "Registrar ruptura real, resposta e ajuda disponibilizada; se não houve ruptura, marcar desconhecido."),
  item("CT08", "reparo", "Quando não compreende uma mensagem, sinaliza necessidade de repetição, esclarecimento ou ajuda de modo compatível com seu repertório.", "Descrever a situação, sem penalizar habilidades ainda não esperadas para o estágio de desenvolvimento."),
  item("CT09", "participacao", "Consegue expressar escolhas, preferências e necessidades em atividades significativas do cotidiano.", "Observar autonomia e barreiras; registrar as modalidades de comunicação disponibilizadas."),
  item("CT10", "participacao", "A comunicação favorece sua participação em atividades familiares, escolares ou comunitárias quando há oportunidade e acessibilidade.", "Descrever atividade, facilitadores, barreiras e diferentes fontes; não comparar sem ajuste de contexto."),
  item("CT11", "participacao", "Comunica desconforto, necessidade de pausa ou pedido de apoio em situações cotidianas.", "Considerar sinais não verbais e comunicação aumentativa e alternativa, sem presumir intenção comportamental."),
  item("CT12", "participacao", "Quando necessários, apoios comunicativos ou ambientais permitem que a mensagem seja compreendida e a atividade prossiga.", "Registrar suporte efetivamente testado, efeito observado e se houve indicação de uso; ausência de necessidade não é déficit."),
  item("CT13", "seguranca", "Há, no momento da aplicação, dificuldade respiratória, perda de consciência, trauma grave ou outra ameaça imediata à vida.", "Se presente, interromper o registro e acionar emergência; não usar frequência para reduzir a prioridade.", true),
  item("CT14", "seguranca", "Houve perda súbita de habilidade comunicativa previamente adquirida ou alteração neurológica abrupta associada.", "Registrar momento de início e sinais neurológicos associados; diferenciar declínio gradual de mudança súbita.", true),
  item("CT15", "seguranca", "Após episódio recente de alteração da consciência, a pessoa permanece sem recuperar sua responsividade habitual.", "Se presente agora, acionar emergência imediatamente; não aguardar completar o inventário.", true),
];

export const COMMUNICATION_RED_FLAGS = [
  { itemId: "CT13", action: "Acionar imediatamente o SAMU 192 em dificuldade respiratória, perda de consciência, trauma grave ou ameaça imediata à vida. Proteger contra lesões sem atrasar o socorro." },
  { itemId: "CT14", action: "Perda súbita de habilidade adquirida ou alteração neurológica aguda requer avaliação médica urgente. Com fraqueza assimétrica, convulsão, rebaixamento de consciência ou dificuldade respiratória, acionar o SAMU 192 imediatamente." },
  { itemId: "CT15", action: "Ausência de recuperação da responsividade habitual após um episódio exige acionamento imediato do SAMU 192. Proteger contra lesões; não oferecer alimentos ou líquidos nem colocar objetos na boca." },
];

export const COMMUNICATION_RESPONSE_OPTIONS = [
  { code: "N", label: "Não observado, embora houvesse oportunidade", value: 0 },
  { code: "O", label: "Ocasional nas oportunidades observadas", value: 1 },
  { code: "F", label: "Frequente nas oportunidades observadas", value: 2 },
  { code: "I", label: "Na maioria das oportunidades observadas", value: 3 },
  { code: "D", label: "Desconhecido ou sem oportunidade para observar", value: null },
];

export const COMMUNICATION_INSTRUCTIONS =
  "Registro observacional, não diagnóstico. Considerar oportunidades reais dos últimos sete dias. Separar observação direta de relato, identificar informante, contexto, modalidade de comunicação e apoios. Classificar apenas a frequência de habilidades funcionais por oportunidade, nunca intensidade ou gravidade. Marcar desconhecido quando não houve oportunidade ou quando a habilidade não se aplica ao estágio de desenvolvimento, explicitando o motivo. Não exigir contato ocular, fala oral ou padrão cultural específico. CT13 e CT15 descrevem comprometimento atual; CT14 registra mudança súbita. Red flags têm resposta binária independente e exigem ação conforme o quadro; não aguardar o término do registro. Este registro não substitui avaliação clínica.";

export const COMMUNICATION_LIMITATIONS = [
  "Instrumento de contingência sem validação psicométrica, normas etárias, pontos de corte ou capacidade diagnóstica.",
  "A faixa etária ampla exige interpretação por estágio de desenvolvimento, repertório motor, sensorial e linguístico; ausência de oportunidade não equivale a incapacidade.",
  "Frequência de habilidades observadas não representa gravidade; resultados não permitem soma, inversão automática ou classificação de transtorno.",
  "A classificação temática de risco não exclui emergências: CT13–CT15 são avaliados separadamente.",
  "A duração é apenas estimada; generatedAt pode ser carimbo determinístico de rastreabilidade e não hora efetiva de elaboração.",
  "O campo de autoria identifica o responsável institucional pelo catálogo, não atesta revisão ou aprovação médica deste rascunho.",
  "Observação retrospectiva pode omitir contexto; comunicação aumentativa e alternativa, diferenças culturais e necessidades de acessibilidade devem ser contempladas.",
];

export const COMMUNICATION_SAFETY_NOTE =
  "Rascunho não validado e bloqueado para uso clínico. Dificuldade respiratória, perda de consciência ou ausência de recuperação da responsividade exigem acionamento imediato do SAMU 192. Alteração neurológica súbita exige avaliação médica urgente. Em crise convulsiva, proteger contra lesões, cronometrar e não colocar nada na boca; acionar o SAMU 192 se durar cinco minutos ou mais, houver repetição sem recuperação, respiração comprometida ou primeira crise. Não retardar socorro para preencher o registro.";
