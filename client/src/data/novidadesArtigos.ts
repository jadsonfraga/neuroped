/**
 * Artigos do Portal das Famílias — portados de portal-novidades.html (app legado).
 * Conteúdo educativo baseado em evidências sobre neurodesenvolvimento infantil.
 * O HTML de cada artigo é confiável (origem própria) e renderizado com sanitização leve.
 */

export interface NovidadeCategoria {
  key: string;
  emoji: string;
  label: string;
}

export const NOVIDADES_CATEGORIAS: NovidadeCategoria[] = [
  { key: "todos", emoji: "📋", label: "Todos" },
  { key: "tea", emoji: "🧩", label: "TEA" },
  { key: "tdah", emoji: "⚡", label: "TDAH" },
  { key: "dev", emoji: "🌱", label: "Desenvolvimento" },
  { key: "sono", emoji: "🌙", label: "Sono" },
  { key: "comp", emoji: "💛", label: "Comportamento" },
  { key: "fala", emoji: "💬", label: "Fala" },
  { key: "escola", emoji: "🎒", label: "Escola" },
  { key: "nutri", emoji: "🥦", label: "Nutrição" },
];

export interface NovidadeArtigo {
  id: string;
  cat: string;
  emoji: string;
  isNew: boolean;
  title: string;
  summary: string;
  readTime: string;
  date: string;
  /** HTML do corpo (confiável, origem própria). */
  content: string;
}

export const NOVIDADES_ARTIGOS: NovidadeArtigo[] = [
  {
    id: "destaque-tea",
    cat: "tea",
    emoji: "🧩",
    isNew: true,
    title: "Sinais precoces do TEA: quando buscar avaliação?",
    summary:
      "Entenda os principais marcos do desenvolvimento e quando a ausência deles pode indicar necessidade de avaliação especializada.",
    readTime: "5 min",
    date: "28 Mar 2026",
    content: `
      <p>O Transtorno do Espectro Autista (TEA) pode ser identificado precocemente quando pais e cuidadores conhecem os marcos esperados do desenvolvimento infantil. Quanto mais cedo a identificação, melhores são os resultados das intervenções.</p>
      <h3>Sinais de alerta por faixa etária</h3>
      <p><strong>Até 12 meses:</strong> pouco contato visual, não responde ao nome quando chamado, não aponta para objetos ou pessoas, ausência de balbucio variado.</p>
      <p><strong>12 a 18 meses:</strong> não fala nenhuma palavra, não imita gestos (tchau, mandar beijo), não demonstra interesse em brincadeiras compartilhadas (mostrar brinquedos para o adulto).</p>
      <p><strong>18 a 24 meses:</strong> vocabulário menor que 10 palavras, não faz brincadeira simbólica (faz de conta), dificuldade em entender instruções simples, movimentos repetitivos com mãos ou corpo.</p>
      <p><strong>Após 24 meses:</strong> não combina duas palavras, prefere brincar sozinho, reage de forma intensa a sons, texturas ou luzes, dificuldade com mudanças na rotina.</p>
      <div class="tip-box">
        <div class="tip-title">💡 Dica importante</div>
        <p>Cada criança tem seu ritmo, e a presença de um sinal isolado não significa diagnóstico. No entanto, quando vários sinais aparecem juntos, é fundamental procurar avaliação com neuropediatra ou psiquiatra infantil.</p>
      </div>
      <h3>O que fazer ao notar sinais?</h3>
      <p>Converse com o pediatra e solicite encaminhamento para avaliação especializada. Não espere para "ver se melhora" — a intervenção precoce (antes dos 3 anos) é o maior preditor de evolução positiva no TEA.</p>
      <p class="source-note">Baseado nas diretrizes da Sociedade Brasileira de Pediatria (SBP) e American Academy of Pediatrics (AAP), 2023-2025.</p>
    `,
  },
  {
    id: "destaque-sono",
    cat: "sono",
    emoji: "🌙",
    isNew: true,
    title: "Higiene do sono: guia prático para crianças de 2 a 10 anos",
    summary:
      "Rotinas consistentes de sono melhoram atenção, humor e aprendizado. Veja como estruturar o sono do seu filho.",
    readTime: "4 min",
    date: "25 Mar 2026",
    content: `
      <p>O sono é fundamental para o desenvolvimento cerebral da criança. Durante o sono profundo, ocorre a consolidação da memória, regulação emocional e liberação do hormônio do crescimento. Crianças que dormem mal apresentam mais irritabilidade, dificuldade de atenção e problemas de comportamento.</p>
      <h3>Quanto tempo de sono por idade?</h3>
      <ul>
        <li><strong>2 a 3 anos:</strong> 11 a 14 horas (incluindo soneca)</li>
        <li><strong>3 a 5 anos:</strong> 10 a 13 horas</li>
        <li><strong>6 a 12 anos:</strong> 9 a 12 horas</li>
      </ul>
      <h3>7 regras de ouro da higiene do sono</h3>
      <ul>
        <li><strong>Horário fixo:</strong> dormir e acordar no mesmo horário todos os dias (inclusive fins de semana).</li>
        <li><strong>Ritual de desaceleração:</strong> 30 minutos antes de dormir, diminuir luzes, falar mais baixo, ler história.</li>
        <li><strong>Sem telas 1h antes:</strong> luz azul bloqueia a melatonina. Sem TV, tablet ou celular.</li>
        <li><strong>Quarto escuro e fresco:</strong> use cortina blackout e mantenha temperatura confortável.</li>
        <li><strong>Evitar açúcar à noite:</strong> alimentos estimulantes dificultam o início do sono.</li>
        <li><strong>Exercício físico de dia:</strong> crianças ativas dormem melhor, mas evite atividade intensa à noite.</li>
        <li><strong>A cama é só para dormir:</strong> não usar para castigo, lição de casa ou brincadeira.</li>
      </ul>
      <div class="tip-box">
        <div class="tip-title">💡 Para crianças com TDAH ou TEA</div>
        <p>Dificuldades de sono são ainda mais comuns nesses casos. Use apoios visuais (quadro de rotina noturna com imagens) e considere discutir com o médico sobre suplementação de melatonina quando necessário.</p>
      </div>
      <p class="source-note">Referências: American Academy of Sleep Medicine (AASM), 2024. Sociedade Brasileira de Pediatria — Departamento de Sono, 2023.</p>
    `,
  },
  {
    id: "destaque-tdah",
    cat: "tdah",
    emoji: "⚡",
    isNew: false,
    title: "TDAH na escola: estratégias que realmente funcionam",
    summary:
      "Adaptações simples no ambiente escolar podem transformar o desempenho e a autoestima de crianças com TDAH.",
    readTime: "6 min",
    date: "18 Fev 2026",
    content: `
      <p>Crianças com TDAH não aprendem menos — aprendem diferente. O ambiente escolar tradicional muitas vezes penaliza características do TDAH (necessidade de movimento, dificuldade com tarefas longas e monótonas), mas com adaptações simples, essas crianças podem ter um desempenho excelente.</p>
      <h3>Estratégias comprovadas</h3>
      <ul>
        <li><strong>Sentar na frente:</strong> reduz distrações visuais e auditivas. Perto do professor, não da janela.</li>
        <li><strong>Instruções curtas e claras:</strong> uma instrução por vez. "Abra o livro na página 32" é melhor que "Abra o livro, leia o texto e responda as questões".</li>
        <li><strong>Pausas programadas:</strong> intervalos de 5 min a cada 20-25 min de atividade. Deixe a criança levantar e se mover.</li>
        <li><strong>Checklist visual:</strong> quadro com os passos da tarefa. A criança vai marcando conforme avança.</li>
        <li><strong>Tempo extra em provas:</strong> 20-30% a mais de tempo é uma adaptação legítima e necessária.</li>
        <li><strong>Reforço positivo:</strong> elogiar o esforço ("Você ficou concentrado por 15 minutos, parabéns!") em vez de só apontar erros.</li>
      </ul>
      <div class="tip-box">
        <div class="tip-title">💡 Comunicação escola-família</div>
        <p>Peça ao professor um caderno de comunicação diário ou semanal. Saber como foi o dia na escola (pontos positivos!) ajuda a manter a criança motivada e a família informada.</p>
      </div>
      <h3>O que evitar</h3>
      <p>Nunca retirar o recreio como punição — o intervalo é terapêutico para crianças com TDAH. Evite expor a criança ("Fulano, presta atenção de novo?") e não use o TDAH como desculpa para não cobrar responsabilidade — cobre com adaptações.</p>
      <p class="source-note">Baseado em: ABDA (Associação Brasileira do Déficit de Atenção), CHADD (Children and Adults with ADHD), e evidências do Journal of Attention Disorders.</p>
    `,
  },
  {
    id: "art-fala-atraso",
    cat: "fala",
    emoji: "💬",
    isNew: true,
    title: "Atraso na fala: o que é esperado e quando se preocupar",
    summary:
      "Marcos da linguagem de 1 a 4 anos e sinais de que uma avaliação fonoaudiológica é necessária.",
    readTime: "4 min",
    date: "22 Mar 2026",
    content: `
      <p>A linguagem é uma das áreas do desenvolvimento que mais gera dúvidas nas famílias. É normal que cada criança tenha seu ritmo, mas existem marcos que ajudam a identificar quando algo pode precisar de atenção profissional.</p>
      <h3>Marcos esperados</h3>
      <ul>
        <li><strong>12 meses:</strong> primeiras palavras com significado (mamã, papá, dá).</li>
        <li><strong>18 meses:</strong> vocabulário de pelo menos 10-20 palavras.</li>
        <li><strong>24 meses:</strong> combina 2 palavras ("qué água"), vocabulário de 50+ palavras.</li>
        <li><strong>3 anos:</strong> frases de 3-4 palavras, pessoas de fora entendem ~75% do que fala.</li>
        <li><strong>4 anos:</strong> conta histórias simples, é entendido por estranhos quase totalmente.</li>
      </ul>
      <h3>Quando buscar avaliação?</h3>
      <p>Se a criança não atinge os marcos acima, ou se houve regressão (falava e parou), procure avaliação com fonoaudiólogo e neuropediatra. O atraso de fala pode ser isolado ou fazer parte de quadros como TEA, deficiência auditiva ou transtorno de linguagem.</p>
      <div class="tip-box">
        <div class="tip-title">💡 O que fazer enquanto isso</div>
        <p>Converse bastante com seu filho, nomeie objetos do cotidiano, leia histórias com figuras e evite o uso excessivo de telas antes dos 2 anos — a interação humana é o maior estimulador da linguagem.</p>
      </div>
      <p class="source-note">Referências: Sociedade Brasileira de Fonoaudiologia, American Speech-Language-Hearing Association (ASHA).</p>
    `,
  },
  {
    id: "art-comp-birra",
    cat: "comp",
    emoji: "💛",
    isNew: false,
    title: "Birras e crises: como lidar sem perder a calma",
    summary:
      "Entenda por que birras acontecem e aprenda técnicas baseadas em evidências para manejar crises com acolhimento.",
    readTime: "5 min",
    date: "15 Mar 2026",
    content: `
      <p>Birras são uma parte normal do desenvolvimento entre 1 e 4 anos. Elas acontecem porque o cérebro da criança ainda não tem maturidade para regular emoções intensas — a parte do cérebro responsável pelo autocontrole (córtex pré-frontal) só amadurece completamente por volta dos 25 anos.</p>
      <h3>Por que acontecem?</h3>
      <ul>
        <li><strong>Frustração:</strong> a criança quer algo e não consegue (abrir um pote, ter um brinquedo).</li>
        <li><strong>Cansaço ou fome:</strong> necessidades básicas não atendidas amplificam qualquer emoção.</li>
        <li><strong>Dificuldade de comunicação:</strong> não consegue expressar o que sente com palavras.</li>
        <li><strong>Sobrecarga sensorial:</strong> especialmente em crianças com TEA ou sensibilidade sensorial.</li>
      </ul>
      <h3>Técnica dos 3 passos</h3>
      <p><strong>1. Acolha:</strong> "Eu sei que você está com raiva." Nomear a emoção ajuda a criança a se sentir vista.</p>
      <p><strong>2. Espere:</strong> Não tente racionalizar durante a crise. Fique perto, em silêncio seguro. A crise vai passar.</p>
      <p><strong>3. Converse depois:</strong> Quando a calma voltar, converse sobre o que aconteceu e o que fazer diferente na próxima vez.</p>
      <div class="tip-box">
        <div class="tip-title">💡 Quando as birras merecem atenção profissional?</div>
        <p>Se as crises são muito frequentes (várias por dia após os 4 anos), muito intensas (autoagressão, destruição), ou se a criança não consegue se acalmar após 30 minutos, converse com o neuropediatra ou psiquiatra infantil.</p>
      </div>
      <p class="source-note">Referências: Yale Child Study Center. Disciplina Positiva — Jane Nelsen.</p>
    `,
  },
  {
    id: "art-dev-telas",
    cat: "dev",
    emoji: "📱",
    isNew: true,
    title: "Tempo de tela por idade: recomendações atualizadas 2026",
    summary:
      "As diretrizes mais recentes sobre uso de telas e seu impacto no desenvolvimento cerebral infantil.",
    readTime: "4 min",
    date: "20 Mar 2026",
    content: `
      <p>O uso de telas na infância é um dos temas mais discutidos na neuropsiquiatria infantil. Evidências crescentes mostram que o excesso de tempo de tela está associado a atrasos de linguagem, dificuldades de atenção e problemas de sono.</p>
      <h3>Recomendações por faixa etária</h3>
      <ul>
        <li><strong>0 a 2 anos:</strong> evitar totalmente (exceto videochamadas com familiares).</li>
        <li><strong>2 a 5 anos:</strong> máximo 1 hora/dia, com conteúdo educativo de qualidade e sempre com adulto junto.</li>
        <li><strong>6 a 12 anos:</strong> máximo 2 horas/dia de tempo recreativo de tela (não conta o uso para escola).</li>
      </ul>
      <h3>Por que o limite importa?</h3>
      <p>O cérebro infantil precisa de interações reais (olhar nos olhos, toque, conversa de ida e volta) para desenvolver linguagem, empatia e regulação emocional. Telas passivas não substituem essa interação.</p>
      <div class="tip-box">
        <div class="tip-title">💡 Dicas práticas</div>
        <p>Crie "zonas livres de tela" (refeições, quarto de dormir). Use timer visual para a criança saber quando o tempo acaba. Ofereça alternativas: massinha, desenho livre, brincadeira ao ar livre, livros.</p>
      </div>
      <p class="source-note">Referências: SBP — #MenosTelas #MaisSaúde, 2024. OMS — Guidelines on Physical Activity, Sedentary Behaviour and Sleep, 2024.</p>
    `,
  },
  {
    id: "art-tdah-mitos",
    cat: "tdah",
    emoji: "⚡",
    isNew: false,
    title: "5 mitos sobre TDAH que toda família precisa conhecer",
    summary: "Desfazendo equívocos comuns que podem atrasar o diagnóstico e tratamento adequado.",
    readTime: "3 min",
    date: "10 Mar 2026",
    content: `
      <p>O TDAH (Transtorno de Déficit de Atenção e Hiperatividade) é um dos transtornos mais estudados da infância, mas ainda cercado de desinformação. Vamos esclarecer os mitos mais prejudiciais.</p>
      <h3>Mitos e verdades</h3>
      <p><strong>Mito 1: "TDAH é falta de disciplina."</strong><br>Verdade: TDAH é um transtorno neurobiológico com base genética. Exames de neuroimagem mostram diferenças no funcionamento do córtex pré-frontal.</p>
      <p><strong>Mito 2: "Só menino tem TDAH."</strong><br>Verdade: Meninas também têm, mas com apresentação diferente — mais desatenção, menos hiperatividade. Por isso, são subdiagnosticadas.</p>
      <p><strong>Mito 3: "Se consegue jogar videogame por horas, não tem TDAH."</strong><br>Verdade: O hiperfoco é uma característica do TDAH. A criança consegue se concentrar em atividades muito estimulantes, mas não nas de baixo estímulo.</p>
      <p><strong>Mito 4: "Medicação transforma a criança em zumbi."</strong><br>Verdade: Quando a dose é correta e ajustada pelo médico, a medicação melhora a atenção sem alterar a personalidade.</p>
      <p><strong>Mito 5: "TDAH passa com a idade."</strong><br>Verdade: Cerca de 60% dos casos persistem na vida adulta. A hiperatividade pode diminuir, mas a desatenção frequentemente continua.</p>
      <p class="source-note">Referências: ABDA, American Psychiatric Association (DSM-5-TR), meta-análises publicadas no Lancet Psychiatry.</p>
    `,
  },
  {
    id: "art-tea-sensorial",
    cat: "tea",
    emoji: "🧩",
    isNew: false,
    title: "Sensibilidade sensorial no TEA: entendendo o mundo do seu filho",
    summary:
      "Como crianças com TEA processam estímulos sensoriais de forma diferente e estratégias para o dia a dia.",
    readTime: "5 min",
    date: "05 Mar 2026",
    content: `
      <p>Muitas crianças com TEA processam informações sensoriais de forma diferente. Sons, luzes, texturas, cheiros ou movimentos que para outros são neutros, para elas podem ser extremamente desconfortáveis — ou, ao contrário, podem buscar sensações intensas.</p>
      <h3>Dois perfis sensoriais</h3>
      <p><strong>Hipersensibilidade (evita estímulos):</strong> tampa os ouvidos com barulho, recusa certas texturas de roupa ou alimentos, se incomoda com luzes fortes, evita abraços.</p>
      <p><strong>Hipossensibilidade (busca estímulos):</strong> gira o corpo, balança, toca tudo, coloca objetos na boca, busca pressão profunda (abraços apertados, se enfiar debaixo de almofadas).</p>
      <h3>Estratégias para o dia a dia</h3>
      <ul>
        <li><strong>Ambiente previsível:</strong> avise sobre mudanças com antecedência, use apoio visual (quadro de rotina).</li>
        <li><strong>Kit sensorial:</strong> fone abafador para ambientes barulhentos, brinquedo de apertar (fidget), óculos de sol.</li>
        <li><strong>Respeite os limites:</strong> se a criança evita certos alimentos por textura, não force — trabalhe gradualmente com terapeuta ocupacional.</li>
        <li><strong>Espaço de descompressão:</strong> um cantinho calmo em casa onde a criança pode ir quando se sentir sobrecarregada.</li>
      </ul>
      <div class="tip-box">
        <div class="tip-title">💡 Profissional indicado</div>
        <p>O Terapeuta Ocupacional com formação em Integração Sensorial é o profissional mais indicado para avaliar o perfil sensorial da criança e orientar estratégias individualizadas.</p>
      </div>
      <p class="source-note">Referências: Dunn's Sensory Profile, STAR Institute for Sensory Processing.</p>
    `,
  },
  {
    id: "art-escola-inclusao",
    cat: "escola",
    emoji: "🎒",
    isNew: false,
    title: "Direitos da criança com deficiência na escola: o que exigir",
    summary: "Conheça os direitos legais do seu filho e como garantir inclusão real no ambiente escolar.",
    readTime: "4 min",
    date: "28 Fev 2026",
    content: `
      <p>Toda criança tem direito à educação inclusiva. A legislação brasileira garante que crianças com TEA, TDAH, deficiência intelectual e outros transtornos do neurodesenvolvimento tenham acesso e permanência na escola regular com os apoios necessários.</p>
      <h3>Principais direitos</h3>
      <ul>
        <li><strong>Matrícula garantida:</strong> a escola não pode recusar matrícula por causa do diagnóstico (Lei 12.764/2012 para TEA).</li>
        <li><strong>Acompanhante especializado:</strong> crianças com TEA que necessitam têm direito a profissional de apoio em sala.</li>
        <li><strong>Adaptação curricular:</strong> o conteúdo e as avaliações devem ser adaptados conforme o PEI (Plano Educacional Individualizado).</li>
        <li><strong>Tempo extra em provas:</strong> previsto em lei para crianças com TDAH e outros transtornos.</li>
        <li><strong>AEE (Atendimento Educacional Especializado):</strong> no contraturno, gratuito, em sala de recursos.</li>
      </ul>
      <div class="tip-box">
        <div class="tip-title">💡 Como garantir na prática</div>
        <p>Solicite por escrito a elaboração do PEI (Plano Educacional Individualizado) com metas claras. Participe das reuniões de revisão. Se a escola não cumprir, procure o Conselho Tutelar ou o Ministério Público.</p>
      </div>
      <p class="source-note">Referências: Lei Berenice Piana (12.764/2012), LBI (13.146/2015), LDB (9.394/1996).</p>
    `,
  },
  {
    id: "art-nutri-omega",
    cat: "nutri",
    emoji: "🥦",
    isNew: false,
    title: "Ômega-3 e cérebro infantil: o que a ciência diz",
    summary: "Evidências atuais sobre suplementação de ômega-3 e seu papel no neurodesenvolvimento.",
    readTime: "3 min",
    date: "20 Fev 2026",
    content: `
      <p>O ômega-3 (especialmente DHA e EPA) é um ácido graxo essencial para o desenvolvimento cerebral. O cérebro é composto por cerca de 60% de gordura, e o DHA é um dos principais componentes estruturais.</p>
      <h3>O que as evidências mostram?</h3>
      <p><strong>Para todas as crianças:</strong> uma dieta rica em ômega-3 (peixes, nozes, linhaça) está associada a melhor desenvolvimento cognitivo e de linguagem.</p>
      <p><strong>No TDAH:</strong> alguns estudos mostram melhora discreta na atenção com suplementação, mas não substitui o tratamento padrão.</p>
      <p><strong>No TEA:</strong> evidências ainda inconclusivas. Pode ajudar como complemento, mas não há comprovação de benefício isolado.</p>
      <h3>Fontes alimentares</h3>
      <ul>
        <li>Salmão, sardinha, atum (2x por semana)</li>
        <li>Chia, linhaça (triturada), nozes</li>
        <li>Ovos enriquecidos com ômega-3</li>
      </ul>
      <div class="tip-box">
        <div class="tip-title">💡 Sobre suplementação</div>
        <p>Não suplemente por conta própria. Converse com o médico da criança para avaliar necessidade, dose e forma adequada (líquido para crianças menores, cápsula para maiores).</p>
      </div>
      <p class="source-note">Referências: Cochrane Reviews, Journal of Child Psychology and Psychiatry, SBP.</p>
    `,
  },
  {
    id: "art-comp-ansiedade",
    cat: "comp",
    emoji: "💛",
    isNew: true,
    title: "Ansiedade na infância: quando o medo vira transtorno",
    summary:
      "Medos são normais no desenvolvimento, mas quando passam a limitar a vida da criança, é hora de buscar ajuda.",
    readTime: "5 min",
    date: "18 Mar 2026",
    content: `
      <p>Ter medo é normal e faz parte do desenvolvimento saudável. Medo de escuro aos 3 anos, de monstros aos 5, de provas aos 8 — todos esperados. O problema surge quando o medo é desproporcional, persistente e começa a impedir a criança de fazer atividades do dia a dia.</p>
      <h3>Sinais de transtorno de ansiedade</h3>
      <ul>
        <li>Recusa em ir à escola repetidamente (não é preguiça).</li>
        <li>Queixas físicas frequentes: dor de barriga, dor de cabeça, náusea — sem causa médica.</li>
        <li>Dificuldade em se separar dos pais (além do esperado para a idade).</li>
        <li>Preocupação excessiva com situações do futuro ("e se acontecer algo ruim?").</li>
        <li>Dificuldade em dormir por causa de preocupações.</li>
        <li>Evita situações sociais, festas, apresentações.</li>
      </ul>
      <h3>O que fazer</h3>
      <p>Valide o sentimento ("Eu entendo que você está com medo"), mas não evite a situação temida — a evitação reforça a ansiedade. Ajude gradualmente, em pequenos passos. A terapia cognitivo-comportamental (TCC) é o tratamento com mais evidência para ansiedade infantil.</p>
      <div class="tip-box">
        <div class="tip-title">💡 Quando buscar profissional</div>
        <p>Se os sintomas duram mais de 4 semanas e impactam escola, amizades ou vida familiar, procure avaliação com psiquiatra infantil ou psicólogo especializado em TCC infantil.</p>
      </div>
      <p class="source-note">Referências: AACAP (American Academy of Child and Adolescent Psychiatry), NICE Guidelines for Anxiety in Children.</p>
    `,
  },
  {
    id: "art-dev-marcos",
    cat: "dev",
    emoji: "🌱",
    isNew: false,
    title: "Marcos do desenvolvimento motor: do rolar ao correr",
    summary: "Acompanhe as conquistas motoras esperadas do primeiro ano até os 5 anos de idade.",
    readTime: "4 min",
    date: "12 Mar 2026",
    content: `
      <p>O desenvolvimento motor segue uma sequência previsível, embora o ritmo varie de criança para criança. Conhecer os marcos ajuda a identificar precocemente possíveis atrasos que podem se beneficiar de intervenção.</p>
      <h3>Marcos esperados</h3>
      <ul>
        <li><strong>3-4 meses:</strong> sustenta a cabeça, começa a rolar.</li>
        <li><strong>6-7 meses:</strong> senta sem apoio, transfere objetos entre mãos.</li>
        <li><strong>9-10 meses:</strong> engatinha, fica de pé com apoio.</li>
        <li><strong>12-15 meses:</strong> primeiros passos independentes.</li>
        <li><strong>18-24 meses:</strong> corre (com base alargada), chuta bola, sobe escadas com apoio.</li>
        <li><strong>3 anos:</strong> pedala triciclo, pula com os dois pés, equilibra-se em um pé por 1-2 segundos.</li>
        <li><strong>4-5 anos:</strong> pula em um pé, desce escada alternando pés, anda em linha reta.</li>
      </ul>
      <h3>Sinais de alerta</h3>
      <p>Atraso significativo (mais de 2-3 meses) em qualquer marco, assimetria persistente (usa mais um lado), perda de habilidades já adquiridas, ou tônus muscular muito mole (hipotonia) ou muito rígido (hipertonia).</p>
      <div class="tip-box">
        <div class="tip-title">💡 Estimulação natural</div>
        <p>Deixe a criança brincar no chão, explorar diferentes superfícies, subir e descer (com supervisão). O excesso de tempo no bebê-conforto, andador ou tela reduz as oportunidades de prática motora.</p>
      </div>
      <p class="source-note">Referências: Denver II, Bayley Scales, Caderneta de Saúde da Criança (MS).</p>
    `,
  },
];
