// ============================================================
// Aplicações interativas dos instrumentos AUTORAIS NEXUS-NP
// (2026-07-12) — versões aplicáveis dos construtos cujos
// padrões-ouro comerciais saíram do banco (regra de ouro total).
// Redação 100% própria; cada infoBox declara o não-substituto.
// ============================================================
import type { InteractiveScaleDef } from "./interactiveScaleItems";

const FREQ4 = ["Nunca ou raramente", "Às vezes (1–2x/semana)", "Frequentemente (3–4x/semana)", "Quase sempre (diariamente)"];

const TRIAGEM_BANDS_NP = [
  { minPct: 0, classification: "Sem sinais relevantes", color: "emerald", description: "Padrão dentro do esperado no período observado. Manter acompanhamento de rotina. Triagem não substitui avaliação clínica." },
  { minPct: 25, classification: "Atenção — observar e reavaliar", color: "amber", description: "Alguns sinais presentes. Orientar família/escola, observar por 4–8 semanas e levar o resultado à consulta." },
  { minPct: 50, classification: "Alterações moderadas — investigar", color: "orange", description: "Sinais frequentes com provável impacto funcional. Discutir com o clínico para investigação dirigida." },
  { minPct: 75, classification: "Alterações importantes — priorizar avaliação", color: "red", description: "Sinais intensos e persistentes. Priorizar avaliação clínica detalhada e plano de intervenção." },
] as const;

const MARCOS_BANDS_NP = [
  { minPct: 85, classification: "Desenvolvimento adequado para a idade", color: "emerald", description: "A maioria dos marcos esperados está presente. Manter acompanhamento de rotina e estimulação no dia a dia." },
  { minPct: 65, classification: "Em desenvolvimento — vigiar e reavaliar", color: "amber", description: "Alguns marcos ainda não apareceram. Reforçar estimulação e reavaliar em 4–8 semanas; levar à consulta." },
  { minPct: 40, classification: "Atenção — discutir com o pediatra", color: "orange", description: "Vários marcos ausentes para a idade. Agendar avaliação do desenvolvimento e considerar estimulação precoce." },
  { minPct: 0, classification: "Investigação prioritária", color: "red", description: "Muitos marcos ausentes. Priorizar avaliação padronizada do desenvolvimento e intervenção precoce." },
] as const;

export const nexusAplicaveis2026Items: Record<string, InteractiveScaleDef> = {
  "ead-np": {
    instruction: "Compare com crianças/adolescentes da MESMA IDADE e marque com que frequência cada dificuldade aparece no dia a dia (últimos 2 meses).",
    infoBox: "EAD-NP — Escala de Comportamento Adaptativo NeuroPed (autoral, Dr. Jadson Fraga). Triagem do funcionamento adaptativo em 4 domínios. NÃO substitui escalas adaptativas padronizadas (ex.: Vineland-3/ABAS-3) quando avaliação normatizada for necessária (ex.: definição de elegibilidade).",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "EAD-NP — escore total (0–48)",
    bands: [...TRIAGEM_BANDS_NP],
    domains: [
      { name: "Comunicação funcional", items: [
        { text: "Tem dificuldade de pedir o que precisa de forma que os outros entendam.", emoji: "🗣️", example: "Ex.: não consegue pedir água/ajuda; a família precisa adivinhar." },
        { text: "Tem dificuldade de entender e seguir instruções do dia a dia esperadas para a idade.", emoji: "👂", example: "Ex.: se perde com 'pegue a mochila e espere na porta'." },
        { text: "Tem dificuldade de contar um acontecimento simples (o que fez, onde dói, o que houve).", emoji: "💬", example: "Ex.: não consegue relatar como foi a escola ou explicar uma dor." },
        { text: "Depende de gestos/terceiros para se comunicar além do esperado para a idade.", emoji: "🤝", example: "Ex.: o irmão 'traduz' o que ele(a) quer dizer." },
      ] },
      { name: "Autocuidado e vida diária", items: [
        { text: "Precisa de mais ajuda que o esperado para comer sozinho(a).", emoji: "🍽️", example: "Ex.: em idade escolar, ainda precisa que cortem tudo e deem na boca." },
        { text: "Precisa de mais ajuda que o esperado para vestir-se e calçar-se.", emoji: "👕", example: "Ex.: não veste a camiseta nem calça o tênis na idade em que os colegas já fazem." },
        { text: "Precisa de mais ajuda que o esperado na higiene (banho, dentes, banheiro).", emoji: "🪥", example: "Ex.: não escova os dentes nem toma banho sem supervisão total." },
        { text: "Tem dificuldade com tarefas domésticas simples da idade (guardar brinquedos, arrumar material).", emoji: "🧸", example: "Ex.: não guarda os pertences mesmo com lembretes diários." },
      ] },
      { name: "Socialização", items: [
        { text: "Tem dificuldade de brincar/conviver com crianças da mesma idade.", emoji: "🎲", example: "Ex.: fica à margem ou os encontros terminam em conflito." },
        { text: "Tem dificuldade de seguir regras de convivência (esperar a vez, dividir, cumprimentar).", emoji: "🤝", example: "Ex.: toma os brinquedos, não espera a vez, ignora cumprimentos." },
        { text: "Tem dificuldade de perceber e reagir aos sentimentos dos outros.", emoji: "💛", example: "Ex.: não percebe quando alguém se machuca ou fica triste ao lado." },
        { text: "Evita ou não busca interação social espontânea esperada para a idade.", emoji: "🚪", example: "Ex.: prefere sempre ficar só, não chama ninguém para brincar." },
      ] },
      { name: "Autonomia prática", items: [
        { text: "Tem dificuldade de se organizar em rotinas conhecidas (arrumar-se para sair, sequência do banho).", emoji: "🧭", example: "Ex.: trava em rotinas que faz todo dia se ninguém guiar passo a passo." },
        { text: "Tem dificuldade de se manter seguro(a) em situações cotidianas para a idade (rua, cozinha, alturas).", emoji: "⚠️", example: "Ex.: solta a mão e sai correndo na rua sem noção de perigo." },
        { text: "Tem dificuldade de fazer escolhas simples e resolver pequenos problemas sozinho(a).", emoji: "🧩", example: "Ex.: não escolhe entre duas opções nem resolve 'perdi o lápis' sem ajuda." },
        { text: "Depende de supervisão além do esperado para permanecer em atividades sem o adulto ao lado.", emoji: "👀", example: "Ex.: só permanece na tarefa com um adulto sentado junto o tempo todo." },
      ] },
    ],
  },
  "tdn-bebe": {
    instruction: "Marque o que o bebê/criança JÁ FAZ hoje. Compare com o esperado para a idade em meses (se nasceu prematuro(a), converse com o clínico sobre a idade corrigida).",
    infoBox: "TDN-Bebê — Triagem do Desenvolvimento NeuroPed 1–42 meses (autoral, Dr. Jadson Fraga). Marcos de motor, comunicação e interação. NÃO substitui avaliação padronizada do desenvolvimento (ex.: Bayley-III) quando indicada. Quanto MAIOR o percentual, melhor.",
    labels: ["Ainda não", "Às vezes / começando", "Sim, já faz"],
    optionPoints: [0, 1, 2],
    scoreDirection: "higher_better",
    totalLabel: "TDN-Bebê — marcos alcançados (0–24)",
    bands: [...MARCOS_BANDS_NP],
    domains: [
      { name: "Motor", items: [
        { text: "Sustenta a cabeça firme e, depois, o tronco (conforme a fase).", emoji: "🧷", example: "Ex.: de bruços levanta a cabeça; mais adiante senta com apoio." },
        { text: "Rola, senta sem apoio e/ou engatinha (conforme a fase).", emoji: "🔄", example: "Ex.: rola da barriga para as costas; senta estável no chão." },
        { text: "Fica em pé com apoio e/ou anda (conforme a fase).", emoji: "🚶", example: "Ex.: anda apoiado nos móveis; depois dá passos sozinho." },
        { text: "Usa as mãos para alcançar, transferir e manipular objetos pequenos.", emoji: "✋", example: "Ex.: passa o brinquedo de uma mão para a outra; faz pinça com os dedos." },
      ] },
      { name: "Comunicação", items: [
        { text: "Balbucia e, depois, fala primeiras palavras com significado (conforme a fase).", emoji: "🗣️", example: "Ex.: 'mamama'; depois 'mamã' e 'água' com intenção." },
        { text: "Entende ordens simples com gesto e, depois, sem gesto.", emoji: "👂", example: "Ex.: 'dá tchau', 'cadê o papai?', 'pega a bola'." },
        { text: "Aponta para pedir e para MOSTRAR coisas de interesse.", emoji: "👉", example: "Ex.: aponta o avião no céu e olha para você compartilhando." },
        { text: "Combina palavras em frases curtas (a partir da fase esperada).", emoji: "💬", example: "Ex.: 'quer água', 'cadê bola' por volta dos 2 anos." },
      ] },
      { name: "Interação e cognição", items: [
        { text: "Sorri em resposta às pessoas e busca o rosto de quem cuida.", emoji: "😊", example: "Ex.: abre sorriso quando você chega e conversa com ele(a)." },
        { text: "Responde quando é chamado(a) pelo nome.", emoji: "📣", example: "Ex.: vira e olha quando você chama, mesmo distraído(a)." },
        { text: "Imita gestos e brincadeiras simples e participa de jogos sociais.", emoji: "👏", example: "Ex.: bate palminha, brinca de esconde-achou com prazer." },
        { text: "Brinca de faz de conta simples (a partir da fase esperada).", emoji: "🧸", example: "Ex.: dá comidinha à boneca, faz o carrinho 'andar'." },
      ] },
    ],
  },
  "qec-np": {
    instruction: "Responda sobre COMO VOCÊ (cuidador/a) tem se sentido nas últimas 4 semanas. Não há resposta certa — este resultado serve para cuidarmos também de quem cuida.",
    infoBox: "QEC-NP — Questionário de Estresse do Cuidador NeuroPed (autoral, Dr. Jadson Fraga). Triagem breve de sobrecarga do cuidador (construto de estresse parental, ex.: PSI — sem substituí-lo). Sobrecarga alta merece acolhimento e plano de suporte à família.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "QEC-NP — escore total (0–36)",
    bands: [...TRIAGEM_BANDS_NP],
    domains: [
      { name: "Como você tem se sentido", items: [
        { text: "Sinto-me esgotado(a) física ou emocionalmente pelo cuidado.", emoji: "🪫", example: "Ex.: termina o dia sem energia nenhuma, todos os dias." },
        { text: "Durmo mal ou de menos por causa das demandas de cuidado.", emoji: "🌙", example: "Ex.: noites entrecortadas viraram rotina." },
        { text: "Sinto que não dou conta das demandas da criança.", emoji: "⛰️", example: "Ex.: sensação constante de estar 'enxugando gelo'." },
        { text: "Tenho me irritado ou perdido a paciência mais do que gostaria.", emoji: "😤", example: "Ex.: explosões por coisas pequenas, seguidas de culpa." },
        { text: "Sinto culpa ou sensação de falha como cuidador(a).", emoji: "💭", example: "Ex.: pensamento frequente de 'estou fazendo tudo errado'." },
        { text: "Deixei de cuidar da minha própria saúde (consultas, sono, refeições).", emoji: "🩺", example: "Ex.: remarcou/cancelou os próprios médicos várias vezes." },
      ] },
      { name: "Rede, rotina e relação", items: [
        { text: "Sinto que carrego o cuidado praticamente sozinho(a).", emoji: "🎒", example: "Ex.: sem revezamento; ninguém mais sabe a rotina da criança." },
        { text: "Tenho pouca ou nenhuma pausa/tempo para mim na semana.", emoji: "⏸️", example: "Ex.: nenhum momento da semana só seu." },
        { text: "A rotina da casa gira quase toda em torno das demandas da criança.", emoji: "🏠", example: "Ex.: horários, passeios e finanças todos condicionados ao cuidado." },
        { text: "O cuidado tem gerado conflito no casal ou na família.", emoji: "⚡", example: "Ex.: brigas frequentes sobre manejo e divisão de tarefas." },
        { text: "Evito sair, receber visitas ou ir a lugares por causa do comportamento/das demandas.", emoji: "🚪", example: "Ex.: parou de ir a festas e restaurantes para evitar crises." },
        { text: "Sinto que perdi momentos de troca gostosa com a criança (brincar, curtir juntos).", emoji: "💛", example: "Ex.: os únicos momentos juntos viraram tarefa e cobrança." },
      ] },
    ],
  },
  "psn-np": {
    instruction: "Marque a frequência de cada reação nos últimos 2 meses, em casa, na escola e em passeios.",
    infoBox: "PSN-NP — Perfil Sensorial NeuroPed (autoral, Dr. Jadson Fraga). Triagem do processamento sensorial em 4 padrões. NÃO substitui avaliação padronizada de perfil/integração sensorial (ex.: Sensory Profile 2) quando indicada.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "PSN-NP — escore total (0–48)",
    bands: [...TRIAGEM_BANDS_NP],
    domains: [
      { name: "Busca sensorial", items: [
        { text: "Busca movimento intenso: gira, pula, balança-se, escala, se joga.", emoji: "🌀", example: "Ex.: gira em círculos sem enjoar; pula no sofá o dia todo." },
        { text: "Toca tudo e todos; explora objetos pela boca além da fase esperada.", emoji: "✋", example: "Ex.: passa a mão em todas as prateleiras; morde lápis e roupas." },
        { text: "Busca pressão forte: abraços apertados, espremer-se em cantos, colocar peso sobre o corpo.", emoji: "🫂", example: "Ex.: gosta de ficar 'imprensado' entre almofadas." },
        { text: "Produz sons/estimulação repetida para si (cantarolar constante, estalar, olhar luzes de perto).", emoji: "🔁", example: "Ex.: aproxima objetos dos olhos, fixa em ventilador/rodas." },
      ] },
      { name: "Evitação e defensividade", items: [
        { text: "Evita texturas no corpo: etiquetas, costuras, certos tecidos, mãos sujas.", emoji: "👕", example: "Ex.: só aceita 2-3 roupas; crise com areia ou tinta na mão." },
        { text: "Evita ou sofre com sons comuns (liquidificador, descarga, festa, sinal da escola).", emoji: "🎧", example: "Ex.: tapa os ouvidos e foge quando ligam o liquidificador." },
        { text: "Evita alimentos por textura/cheiro/aparência, além de seletividade comum.", emoji: "🍽️", example: "Ex.: recusa grupos inteiros de comida pela consistência." },
        { text: "Evita cuidados pessoais que envolvem toque (cortar unha/cabelo, escovar dentes, lavar o rosto).", emoji: "✂️", example: "Ex.: cortar o cabelo é sempre uma batalha com choro intenso." },
      ] },
      { name: "Hipersensibilidade", items: [
        { text: "Reage de forma intensa a barulhos, luzes ou ambientes cheios (crise, choro, fuga).", emoji: "📢", example: "Ex.: desorganiza em supermercado, festa ou refeitório." },
        { text: "Incomoda-se com toques leves ou inesperados.", emoji: "🤏", example: "Ex.: reage mal a um toque no ombro que nem doeu." },
        { text: "Percebe e sofre com detalhes sensoriais que os outros nem notam.", emoji: "🔍", example: "Ex.: reclama do zumbido da lâmpada ou do cheiro do sabonete novo." },
        { text: "Demora muito a se recuperar após sobrecarga sensorial.", emoji: "🧯", example: "Ex.: depois de uma festa, segue desorganizado(a) pelo resto do dia." },
      ] },
      { name: "Baixo registro", items: [
        { text: "Parece não perceber quando o chamam ou quando algo acontece ao redor.", emoji: "😶", example: "Ex.: 'no mundo da lua' — precisa tocar nele(a) para responder." },
        { text: "Reage pouco à dor, ao frio ou ao calor.", emoji: "🌡️", example: "Ex.: cai, se machuca e nem chora; sai no frio sem se incomodar." },
        { text: "Não percebe sujeira no rosto/mãos ou roupa torta/molhada.", emoji: "🧼", example: "Ex.: fica com o rosto sujo sem notar nem se incomodar." },
        { text: "Precisa de estímulos muito intensos para reagir ou se engajar.", emoji: "📣", example: "Ex.: só responde quando falam alto e de frente." },
      ] },
    ],
  },
  "erp-np": {
    instruction: "Roteiro para o CLÍNICO em entrevista com o adolescente (≥12 anos), com tempo e privacidade. Explore cada dimensão com exemplos e gradue pelo ÚLTIMO ANO. Tom acolhedor: experiências isoladas são comuns e não definem diagnóstico.",
    infoBox: "ERP-NP — Entrevista de Risco de Psicose NeuroPed (autoral, Dr. Jadson Fraga). Roteiro clínico de exploração de experiências do espectro psicótico e impacto funcional (construto de estados mentais de risco, ex.: SIPS/SOPS — sem substituí-lo). Triagem clínica: sinais intensos + sofrimento/queda funcional → avaliação psiquiátrica especializada. NÃO é diagnóstico.",
    labels: ["Ausente", "Leve/duvidoso", "Presente, sem prejuízo claro", "Presente, com sofrimento ou prejuízo"],
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "ERP-NP — total (0–30)",
    bands: [
      { minPct: 0, classification: "Sem sinais relevantes", color: "emerald", description: "Sem experiências significativas do espectro. Manter acompanhamento habitual." },
      { minPct: 25, classification: "Experiências presentes — acompanhar de perto", color: "amber", description: "Explorar contexto (sono, substâncias, estresse, luto), psicoeducar e reavaliar em intervalo curto." },
      { minPct: 50, classification: "Sinais consistentes — avaliação especializada", color: "red", description: "Encaminhar para avaliação especializada em saúde mental do adolescente; atenção a sofrimento e queda funcional." },
    ],
    domains: [
      { name: "Experiências exploradas na entrevista", items: [
        { text: "Percepções incomuns: ouvir sons/vozes ou ver coisas que outros não percebem.", emoji: "👂", example: "Explorar frequência, contexto (adormecer?), crítica sobre a experiência." },
        { text: "Dúvida sobre a realidade das próprias percepções ou sensação de irrealidade.", emoji: "🪞", example: "'Já ficou em dúvida se era real ou coisa da sua cabeça?'" },
        { text: "Desconfiança fora de proporção: sentir-se vigiado(a), perseguido(a) ou alvo de má intenção.", emoji: "🕵️", example: "Diferenciar de bullying/conflito real relatado por terceiros." },
        { text: "Ideias de referência: mensagens pessoais em mídia, música, internet.", emoji: "📺", example: "'Já sentiu que a TV/rede social mandava recado só para você?'" },
        { text: "Pensamento com interferência: ideias 'colocadas', lidas ou controladas por outros.", emoji: "🧠", example: "Explorar com naturalidade e sem induzir resposta." },
        { text: "Grandiosidade ou missão especial fora da realidade do contexto.", emoji: "✨", example: "Diferenciar de autoestima elevada e fantasia própria da idade." },
        { text: "Desorganização do pensamento/fala percebida pelo próprio ou por terceiros.", emoji: "🌪️", example: "Família/escola notou fala confusa, difícil de acompanhar?" },
        { text: "Perplexidade ou estranheza persistente com o mundo ('algo mudou e não sei explicar').", emoji: "❓", example: "Sensação difusa e angustiante de que as coisas estão 'diferentes'." },
        { text: "Isolamento novo ou queda funcional (notas, higiene, atividades que abandonou).", emoji: "📉", example: "Comparar com o funcionamento de 6–12 meses atrás." },
        { text: "Sofrimento com as experiências ou medo de 'estar enlouquecendo'.", emoji: "💙", example: "Acolher: medo de contar é comum; validar a coragem de falar." },
      ] },
    ],
  },
  "tpp-np": {
    instruction: "Para o CUIDADOR de criança de 2 a 7 anos que passou por evento difícil (acidente, violência, perda, internação…). Marque a frequência de cada mudança DEPOIS do evento (último mês).",
    infoBox: "TPP-NP — Triagem de Estresse Pós-Traumático Pré-Escolar NeuroPed (autoral, Dr. Jadson Fraga). Heterorrelato do cuidador sobre mudanças após evento potencialmente traumático (construto de TEPT pré-escolar, ex.: TSCYC — sem substituí-lo). Sinais frequentes → avaliação especializada em trauma infantil. Tema sensível: acolher sem culpar.",
    labels: FREQ4,
    optionPoints: [0, 1, 2, 3],
    scoreDirection: "higher_worse",
    totalLabel: "TPP-NP — escore total (0–36)",
    bands: [...TRIAGEM_BANDS_NP],
    domains: [
      { name: "Revivescência e evitação", items: [
        { text: "Brinca repetidamente de cenas ligadas ao evento, com tensão e sem prazer.", emoji: "🧸", example: "Ex.: repete a 'batida de carro' com os brinquedos, sério(a) e tenso(a)." },
        { text: "Tem pesadelos ou terrores noturnos que começaram/pioraram após o evento.", emoji: "🌙", example: "Ex.: acorda gritando várias noites desde o ocorrido." },
        { text: "Fica muito angustiado(a) com lembretes do evento (lugar, som, pessoa, palavra).", emoji: "⚡", example: "Ex.: entra em pânico ao passar perto do local." },
        { text: "Evita falar do assunto, pessoas, lugares ou brincadeiras que lembram o evento.", emoji: "🙈", example: "Ex.: muda de assunto ou sai da sala se alguém menciona." },
      ] },
      { name: "Humor e regressão", items: [
        { text: "Ficou mais apegado(a), com medo de separar-se de você.", emoji: "🫂", example: "Ex.: não deixa você sair de perto nem para ir ao banheiro." },
        { text: "Perdeu habilidades que já tinha (voltou a fazer xixi, chupeta, fala de bebê).", emoji: "↩️", example: "Ex.: voltou a molhar a cama depois de meses seco(a)." },
        { text: "Perdeu o interesse por brincadeiras que antes adorava.", emoji: "🎈", example: "Ex.: os brinquedos favoritos ficaram de lado." },
        { text: "Está mais triste, quieto(a) ou 'desligado(a)' das pessoas.", emoji: "😔", example: "Ex.: olhar distante, menos sorrisos, menos troca." },
      ] },
      { name: "Hiperativação", items: [
        { text: "Assusta-se com facilidade exagerada (sobressalto a barulhos comuns).", emoji: "😨", example: "Ex.: pula de susto com porta batendo, o que não acontecia." },
        { text: "Está mais irritado(a), com birras ou explosões mais intensas que antes.", emoji: "😤", example: "Ex.: crises desproporcionais que não eram do feitio dele(a)." },
        { text: "Está mais agitado(a) ou vigilante, 'de olho' no ambiente o tempo todo.", emoji: "👀", example: "Ex.: monitora a porta, checa onde você está a todo momento." },
        { text: "O sono ou a alimentação mudaram claramente após o evento.", emoji: "🍽️", example: "Ex.: custa a dormir sozinho(a); apetite caiu visivelmente." },
      ] },
    ],
  },
};
