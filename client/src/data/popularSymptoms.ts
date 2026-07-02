// Sinais e sintomas POPULARES por queixa — linguagem de pai/mãe.
//
// Objetivo: dar ao leigo MUITAS opções concretas ("o que a criança faz") para
// marcar e refinar a recomendação, sem depender de faixa etária exata nem de
// jargão clínico. Cada sintoma é um chip tocável no filtro.
//
// Integração com o motor (advancedFilterLogic):
//  - o id é prefixado com a queixa (`<queixa>-slug`) → conta em `idPrefixHits`
//    quando a escala cobre aquela queixa;
//  - o label entra no texto de sinais (selectedSignalText) → casa por token com
//    a descrição/tags da escala, subindo a especificidade do ranking.
// Nenhuma afirmação diagnóstica: são observações do dia a dia, não critérios.

export interface PopularSymptom {
  id: string;
  label: string;
  emoji: string;
}

export const popularSymptomsByQueixa: Record<string, PopularSymptom[]> = {
  atraso: [
    { id: "atraso-nao-senta", label: "Demora pra sentar", emoji: "🍼" },
    { id: "atraso-nao-anda", label: "Demora pra andar", emoji: "🚶" },
    { id: "atraso-nao-fala", label: "Demora pra falar", emoji: "💬" },
    { id: "atraso-poucas-palavras", label: "Fala poucas palavras", emoji: "🗣️" },
    { id: "atraso-nao-aponta", label: "Não aponta pro que quer", emoji: "👆" },
    { id: "atraso-nao-imita", label: "Não imita gestos", emoji: "👋" },
    { id: "atraso-atras-colegas", label: "Atrás das crianças da idade", emoji: "📉" },
    { id: "atraso-perdeu-habilidade", label: "Perdeu algo que já fazia", emoji: "⏬" },
    { id: "atraso-nao-engatinha", label: "Não engatinhou", emoji: "🧎" },
    { id: "atraso-mole-molinho", label: "Corpo mole / molinho", emoji: "🫠" },
  ],
  tea: [
    { id: "tea-pouco-olho", label: "Pouco olho no olho", emoji: "👀" },
    { id: "tea-nao-atende-nome", label: "Não atende quando chama", emoji: "🔇" },
    { id: "tea-nao-aponta", label: "Não aponta pra mostrar", emoji: "👆" },
    { id: "tea-se-isola", label: "Prefere ficar sozinho", emoji: "🧍" },
    { id: "tea-repete-movimentos", label: "Balança mãos / roda objetos", emoji: "🔄" },
    { id: "tea-ecolalia", label: "Repete falas como eco", emoji: "🦜" },
    { id: "tea-rotina-rigida", label: "Muito preso à rotina", emoji: "📅" },
    { id: "tea-crise-mudanca", label: "Surta com mudanças", emoji: "🌪️" },
    { id: "tea-brinca-diferente", label: "Brinca de um jeito só", emoji: "🧩" },
    { id: "tea-nao-aponta-social", label: "Não brinca de faz de conta", emoji: "🎭" },
    { id: "tea-atraso-fala", label: "Não fala ou fala pouco", emoji: "💬" },
    { id: "tea-anda-ponta-pe", label: "Anda na ponta do pé", emoji: "🦶" },
  ],
  tdah: [
    { id: "tdah-nao-para-quieto", label: "Não para quieto", emoji: "🏃" },
    { id: "tdah-desatento", label: "Desatento / no mundo da lua", emoji: "🌙" },
    { id: "tdah-esquece", label: "Esquece as coisas", emoji: "🧠" },
    { id: "tdah-perde-material", label: "Perde material toda hora", emoji: "🎒" },
    { id: "tdah-nao-espera", label: "Não espera a vez", emoji: "⏳" },
    { id: "tdah-interrompe", label: "Interrompe / responde na frente", emoji: "🙋" },
    { id: "tdah-nao-termina", label: "Começa e não termina", emoji: "🧩" },
    { id: "tdah-fala-demais", label: "Fala demais", emoji: "🗣️" },
    { id: "tdah-distrai-facil", label: "Distrai com qualquer coisa", emoji: "🦋" },
    { id: "tdah-desorganizado", label: "Muito desorganizado", emoji: "🌀" },
    { id: "tdah-mexe-tudo", label: "Mexe em tudo, agitado", emoji: "⚡" },
  ],
  comportamento: [
    { id: "comportamento-bate", label: "Bate nos outros", emoji: "✊" },
    { id: "comportamento-morde", label: "Morde / belisca", emoji: "😬" },
    { id: "comportamento-birra", label: "Birras muito intensas", emoji: "😡" },
    { id: "comportamento-desafia", label: "Desafia e responde", emoji: "🙅" },
    { id: "comportamento-nao-obedece", label: "Não obedece regras", emoji: "🚫" },
    { id: "comportamento-quebra", label: "Quebra coisas com raiva", emoji: "💥" },
    { id: "comportamento-grita", label: "Grita muito", emoji: "📢" },
    { id: "comportamento-mente", label: "Mente com frequência", emoji: "🤥" },
    { id: "comportamento-provoca", label: "Provoca / implica", emoji: "😈" },
    { id: "comportamento-irritado", label: "Vive irritado", emoji: "🔥" },
  ],
  ansiedade: [
    { id: "ansiedade-medos", label: "Muitos medos", emoji: "😨" },
    { id: "ansiedade-preocupa", label: "Preocupa demais", emoji: "😟" },
    { id: "ansiedade-apego", label: "Apego grudado no adulto", emoji: "🫂" },
    { id: "ansiedade-dor-barriga", label: "Dor de barriga sem causa", emoji: "🤢" },
    { id: "ansiedade-nao-dorme-sozinho", label: "Não dorme sozinho", emoji: "🛏️" },
    { id: "ansiedade-chora-separar", label: "Chora ao se separar", emoji: "😭" },
    { id: "ansiedade-timido", label: "Muito tímido / travado", emoji: "🙈" },
    { id: "ansiedade-roi-unha", label: "Rói unha / se mexe", emoji: "💅" },
    { id: "ansiedade-evita", label: "Evita coisas novas", emoji: "🚪" },
    { id: "ansiedade-panico", label: "Crises de pânico", emoji: "💓" },
  ],
  depressao: [
    { id: "depressao-triste", label: "Triste a maior parte do tempo", emoji: "☁️" },
    { id: "depressao-sem-graça", label: "Perdeu graça pelas coisas", emoji: "🎈" },
    { id: "depressao-chora", label: "Chora fácil", emoji: "💧" },
    { id: "depressao-isola", label: "Se isola dos amigos", emoji: "🚪" },
    { id: "depressao-cansado", label: "Cansado / sem energia", emoji: "🔋" },
    { id: "depressao-irritado", label: "Irritado, de mau humor", emoji: "😤" },
    { id: "depressao-dorme-mal", label: "Dorme demais ou de menos", emoji: "😴" },
    { id: "depressao-apetite", label: "Comendo mais ou menos", emoji: "🍽️" },
    { id: "depressao-nota-caiu", label: "Notas caíram", emoji: "📉" },
    { id: "depressao-sem-valor", label: "Diz que não presta", emoji: "💔" },
  ],
  linguagem: [
    { id: "linguagem-nao-fala", label: "Não fala ainda", emoji: "🤐" },
    { id: "linguagem-poucas-palavras", label: "Fala poucas palavras", emoji: "🗨️" },
    { id: "linguagem-nao-junta", label: "Não junta palavras", emoji: "🔗" },
    { id: "linguagem-dificil-entender", label: "Difícil de entender", emoji: "❓" },
    { id: "linguagem-troca-sons", label: "Troca sons / letras", emoji: "🔤" },
    { id: "linguagem-gagueja", label: "Gagueja", emoji: "🔁" },
    { id: "linguagem-nao-entende", label: "Não entende o que pedem", emoji: "🙉" },
    { id: "linguagem-nao-conta", label: "Não conta o que aconteceu", emoji: "📖" },
    { id: "linguagem-so-gestos", label: "Só se comunica por gesto", emoji: "🤲" },
  ],
  aprendizagem: [
    { id: "aprendizagem-custa-ler", label: "Custa a ler", emoji: "📖" },
    { id: "aprendizagem-custa-escrever", label: "Custa a escrever", emoji: "✏️" },
    { id: "aprendizagem-troca-letras", label: "Troca / inverte letras", emoji: "🔀" },
    { id: "aprendizagem-conta", label: "Dificuldade com contas", emoji: "🔢" },
    { id: "aprendizagem-nao-acompanha", label: "Não acompanha a turma", emoji: "🐢" },
    { id: "aprendizagem-esquece-licao", label: "Esquece o que estudou", emoji: "🧠" },
    { id: "aprendizagem-odeia-escola", label: "Não quer ir à escola", emoji: "🏫" },
    { id: "aprendizagem-letra-feia", label: "Letra muito ruim", emoji: "🖍️" },
  ],
  sono: [
    { id: "sono-custa-dormir", label: "Custa pegar no sono", emoji: "🌙" },
    { id: "sono-acorda-noite", label: "Acorda de madrugada", emoji: "⏰" },
    { id: "sono-pesadelo", label: "Pesadelos / terror noturno", emoji: "😱" },
    { id: "sono-ronca", label: "Ronca / respira pela boca", emoji: "😮‍💨" },
    { id: "sono-cama-pais", label: "Só dorme na cama dos pais", emoji: "🛏️" },
    { id: "sono-agitado", label: "Sono agitado, se debate", emoji: "🌀" },
    { id: "sono-sonolento-dia", label: "Sonolento de dia", emoji: "🥱" },
    { id: "sono-xixi-cama", label: "Faz xixi dormindo", emoji: "💧" },
  ],
  sensorial: [
    { id: "sensorial-tapa-ouvido", label: "Tapa o ouvido com barulho", emoji: "🙉" },
    { id: "sensorial-incomoda-roupa", label: "Incomoda com etiqueta/roupa", emoji: "👕" },
    { id: "sensorial-nao-suja-mao", label: "Não gosta de sujar a mão", emoji: "🖐️" },
    { id: "sensorial-seletivo-comida", label: "Enjoa de textura de comida", emoji: "🍲" },
    { id: "sensorial-busca-girar", label: "Adora girar / balançar", emoji: "🎠" },
    { id: "sensorial-luz", label: "Incomoda com luz forte", emoji: "💡" },
    { id: "sensorial-cheiro", label: "Sensível a cheiros", emoji: "👃" },
    { id: "sensorial-cai-nao-chora", label: "Cai e não parece sentir", emoji: "🩹" },
  ],
  social: [
    { id: "social-sem-amigos", label: "Custa fazer amigos", emoji: "🧍" },
    { id: "social-nao-divide", label: "Não divide / não espera", emoji: "🤝" },
    { id: "social-nao-le-emocao", label: "Não percebe o outro", emoji: "😐" },
    { id: "social-sofre-bullying", label: "Sofre bullying", emoji: "💔" },
    { id: "social-prefere-adultos", label: "Só brinca com adultos", emoji: "👨‍👧" },
    { id: "social-conflito", label: "Vive em conflito", emoji: "⚔️" },
  ],
  motor: [
    { id: "motor-desajeitado", label: "Desajeitado, cai muito", emoji: "🤸" },
    { id: "motor-custa-correr", label: "Custa correr/pular", emoji: "🏃" },
    { id: "motor-tropeça", label: "Tropeça / esbarra", emoji: "🪑" },
    { id: "motor-custa-lapis", label: "Segura mal o lápis", emoji: "✏️" },
    { id: "motor-custa-botao", label: "Custa botão / cadarço", emoji: "🧵" },
    { id: "motor-cansa-rapido", label: "Cansa rápido no físico", emoji: "😮‍💨" },
  ],
  pc: [
    { id: "pc-rigidez", label: "Braço/perna endurecidos", emoji: "💪" },
    { id: "pc-um-lado", label: "Usa mais um lado do corpo", emoji: "↔️" },
    { id: "pc-atraso-motor", label: "Atraso pra sentar/andar", emoji: "🚶" },
    { id: "pc-mole", label: "Corpo mole / sem firmeza", emoji: "🫠" },
    { id: "pc-mao-fechada", label: "Mãozinha sempre fechada", emoji: "✊" },
    { id: "pc-engasga", label: "Engasga ao comer", emoji: "🥄" },
  ],
  epilepsia: [
    { id: "epilepsia-convulsao", label: "Teve convulsão", emoji: "⚡" },
    { id: "epilepsia-ausencia", label: "Fica 'desligado' segundos", emoji: "😶‍🌫️" },
    { id: "epilepsia-tremor", label: "Tremores/abalos", emoji: "🫨" },
    { id: "epilepsia-perde-forca", label: "Perde a força de repente", emoji: "🥴" },
    { id: "epilepsia-olhar-fixo", label: "Olhar fixo e parado", emoji: "👁️" },
    { id: "epilepsia-piora-sono", label: "Abalos ao dormir/acordar", emoji: "🌙" },
  ],
  alimentacao: [
    { id: "alimentacao-seletivo", label: "Come pouquíssimas coisas", emoji: "🍽️" },
    { id: "alimentacao-engasga", label: "Engasga com facilidade", emoji: "😳" },
    { id: "alimentacao-recusa", label: "Recusa a comida", emoji: "🙅" },
    { id: "alimentacao-vomita", label: "Vomita nas refeições", emoji: "🤢" },
    { id: "alimentacao-demora", label: "Demora horas pra comer", emoji: "🐢" },
    { id: "alimentacao-so-liquido", label: "Só aceita amassado/líquido", emoji: "🥤" },
  ],
  dor: [
    { id: "dor-cabeca", label: "Dor de cabeça frequente", emoji: "🤕" },
    { id: "dor-barriga", label: "Dor de barriga recorrente", emoji: "🤰" },
    { id: "dor-perna", label: "Dores nas pernas", emoji: "🦵" },
    { id: "dor-acorda", label: "Dor que acorda à noite", emoji: "🌙" },
    { id: "dor-falta-escola", label: "Falta aula pela dor", emoji: "🏫" },
    { id: "dor-enjoo-luz", label: "Enjoo e sensível à luz", emoji: "💡" },
  ],
  cognicao: [
    { id: "cognicao-aprende-devagar", label: "Aprende devagar", emoji: "🐢" },
    { id: "cognicao-esquece", label: "Esquece o que acabou de ver", emoji: "🧠" },
    { id: "cognicao-custa-raciocinio", label: "Custa a raciocinar", emoji: "🧩" },
    { id: "cognicao-custa-rotina", label: "Custa a aprender a rotina", emoji: "🔁" },
    { id: "cognicao-imaturo", label: "Parece mais novo que a idade", emoji: "👶" },
  ],
  funcionalidade: [
    { id: "funcionalidade-depende", label: "Depende pra tudo", emoji: "🤲" },
    { id: "funcionalidade-nao-veste", label: "Não se veste sozinho", emoji: "👕" },
    { id: "funcionalidade-nao-come-so", label: "Não come sozinho", emoji: "🥄" },
    { id: "funcionalidade-nao-higiene", label: "Não faz higiene sozinho", emoji: "🪥" },
    { id: "funcionalidade-nao-rua", label: "Sem noção de perigo na rua", emoji: "🚦" },
  ],
  autonomia: [
    { id: "autonomia-nao-veste", label: "Não se veste sozinho", emoji: "👖" },
    { id: "autonomia-nao-banho", label: "Não toma banho sozinho", emoji: "🚿" },
    { id: "autonomia-nao-organiza", label: "Não organiza as coisas", emoji: "🎒" },
    { id: "autonomia-depende-lembrete", label: "Precisa de lembrete pra tudo", emoji: "⏰" },
  ],
  tiques: [
    { id: "tiques-pisca", label: "Pisca / franze os olhos", emoji: "😉" },
    { id: "tiques-cabeca", label: "Movimenta cabeça/ombro", emoji: "🙆" },
    { id: "tiques-som", label: "Faz sons / pigarro", emoji: "🔊" },
    { id: "tiques-piora-estresse", label: "Piora quando nervoso", emoji: "😰" },
    { id: "tiques-repete-palavra", label: "Repete palavras/sons", emoji: "🔁" },
  ],
  toc: [
    { id: "toc-lava-mao", label: "Lava a mão o tempo todo", emoji: "🧼" },
    { id: "toc-organiza", label: "Precisa tudo alinhado", emoji: "📐" },
    { id: "toc-checa", label: "Confere as coisas repetidas vezes", emoji: "🔍" },
    { id: "toc-ritual", label: "Rituais pra ficar calmo", emoji: "🔄" },
    { id: "toc-pensamento", label: "Pensamentos que incomodam", emoji: "🌀" },
  ],
  trauma: [
    { id: "trauma-revive", label: "Revive o que aconteceu", emoji: "🎬" },
    { id: "trauma-pesadelo", label: "Pesadelos com o fato", emoji: "😱" },
    { id: "trauma-assusta", label: "Assusta fácil / alerta", emoji: "⚠️" },
    { id: "trauma-evita", label: "Evita o que lembra o trauma", emoji: "🚷" },
    { id: "trauma-regride", label: "Voltou a agir de bebê", emoji: "🍼" },
  ],
  enurese: [
    { id: "enurese-xixi-cama", label: "Xixi na cama à noite", emoji: "🛏️" },
    { id: "enurese-xixi-dia", label: "Escapa xixi de dia", emoji: "💧" },
    { id: "enurese-coco", label: "Escapa cocô na roupa", emoji: "💩" },
    { id: "enurese-segura", label: "Segura muito o xixi", emoji: "⏳" },
  ],
  substancias: [
    { id: "substancias-alcool", label: "Bebe álcool", emoji: "🍺" },
    { id: "substancias-cigarro", label: "Fuma / vape", emoji: "🚬" },
    { id: "substancias-maconha", label: "Usou maconha/outras", emoji: "🌿" },
    { id: "substancias-sumico", label: "Some / mente onde estava", emoji: "🕳️" },
    { id: "substancias-amizades", label: "Mudou de amizades", emoji: "👥" },
  ],
  psicose: [
    { id: "psicose-ve-ouve", label: "Vê ou ouve coisas", emoji: "👁️" },
    { id: "psicose-desconfia", label: "Muito desconfiado", emoji: "🕵️" },
    { id: "psicose-fala-desconexa", label: "Fala sem nexo", emoji: "🌀" },
    { id: "psicose-isola", label: "Isolou-se de repente", emoji: "🚪" },
    { id: "psicose-acelerado", label: "Muito acelerado / sem dormir", emoji: "🚀" },
  ],
  suicidio: [
    { id: "suicidio-fala-morrer", label: "Fala em morrer / sumir", emoji: "🆘" },
    { id: "suicidio-se-machuca", label: "Se machuca de propósito", emoji: "🩹" },
    { id: "suicidio-despede", label: "Se despede / dá coisas", emoji: "📦" },
    { id: "suicidio-sem-esperanca", label: "Diz que nada tem jeito", emoji: "💔" },
  ],
  neonatal: [
    { id: "neonatal-prematuro", label: "Nasceu prematuro", emoji: "🍼" },
    { id: "neonatal-uti", label: "Ficou na UTI neonatal", emoji: "🏥" },
    { id: "neonatal-mama-mal", label: "Mama com dificuldade", emoji: "🍼" },
    { id: "neonatal-mole", label: "Muito molinho", emoji: "🫠" },
    { id: "neonatal-irritado", label: "Chora demais / irritado", emoji: "😣" },
  ],
  efeitos: [
    { id: "efeitos-sono", label: "Mais sonolento", emoji: "😴" },
    { id: "efeitos-apetite", label: "Perdeu o apetite", emoji: "🍽️" },
    { id: "efeitos-irritado", label: "Mais irritado", emoji: "😠" },
    { id: "efeitos-tique", label: "Apareceram tiques", emoji: "😉" },
    { id: "efeitos-dor-cabeca", label: "Dor de cabeça / barriga", emoji: "🤕" },
    { id: "efeitos-emagreceu", label: "Emagreceu", emoji: "⚖️" },
  ],
};

// Resolução O(1) id → {label, queixa} para o motor de ranking casar por token.
export const popularSymptomById: Record<string, { label: string; queixa: string }> = (() => {
  const out: Record<string, { label: string; queixa: string }> = {};
  for (const [queixa, list] of Object.entries(popularSymptomsByQueixa)) {
    for (const s of list) out[s.id] = { label: s.label, queixa };
  }
  return out;
})();

export function getPopularSymptoms(queixaId: string): PopularSymptom[] {
  return popularSymptomsByQueixa[queixaId] ?? [];
}
