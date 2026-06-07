import {
  NOVIDADES_ARTIGOS,
  NOVIDADES_CATEGORIAS,
  type NovidadeArtigo,
  type NovidadeCategoria,
} from "@/data/novidadesArtigos";

const EXTRA_CATEGORIAS: NovidadeCategoria[] = [
  { key: "med", emoji: "💊", label: "Medicação" },
  { key: "epilepsia", emoji: "⚡", label: "Epilepsia" },
  { key: "terapias", emoji: "🧠", label: "Terapias" },
  { key: "autonomia", emoji: "🧭", label: "Autonomia" },
  { key: "seguranca", emoji: "🛡️", label: "Segurança" },
  { key: "familia", emoji: "🏠", label: "Família" },
  { key: "exames", emoji: "🔎", label: "Exames" },
];

export const NOVIDADES_ARTIGOS_EXTRAS: NovidadeArtigo[] = [
  {
    id: "art-med-efeitos-colaterais",
    cat: "med",
    emoji: "💊",
    isNew: true,
    title: "Efeitos colaterais: o que observar antes do retorno",
    summary: "Um guia simples para a família registrar sono, apetite, humor, comportamento e possíveis reações ao remédio.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Quando uma medicação é iniciada ou ajustada, a observação da família é parte essencial do acompanhamento. O objetivo não é vigiar a criança com ansiedade, mas registrar mudanças relevantes com clareza.</p>
      <h3>O que anotar</h3>
      <ul>
        <li><strong>Sono:</strong> sonolência, insônia, despertares ou pesadelos.</li>
        <li><strong>Apetite:</strong> aumento, redução importante ou mudança no padrão alimentar.</li>
        <li><strong>Humor:</strong> irritabilidade, apatia, choro fácil ou agitação incomum.</li>
        <li><strong>Corpo:</strong> tremores, tontura, dor abdominal, náuseas, alergias ou rigidez.</li>
        <li><strong>Benefício percebido:</strong> atenção, sono, impulsividade, crises, linguagem ou interação.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Como registrar</div><p>Use frases objetivas: “dormiu 9h”, “comeu metade do habitual”, “ficou mais irritado às 18h”. Isso ajuda mais do que descrições genéricas.</p></div>
      <p class="source-note">Conteúdo educativo. Não suspenda, reduza ou aumente medicação sem orientação do médico assistente.</p>
    `,
  },
  {
    id: "art-med-perda-eficacia",
    cat: "med",
    emoji: "💊",
    isNew: true,
    title: "Quando parece que o remédio perdeu efeito",
    summary: "Nem toda piora significa falha da medicação. Sono, escola, crescimento e rotina podem mudar a resposta clínica.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Algumas famílias percebem melhora inicial e, depois de algumas semanas, relatam que “parece que voltou tudo”. Essa informação merece atenção, mas precisa ser analisada em contexto.</p>
      <h3>Pontos que podem confundir</h3>
      <ul>
        <li><strong>Sono ruim:</strong> pode piorar irritabilidade e atenção mesmo com a medicação correta.</li>
        <li><strong>Nova demanda escolar:</strong> provas, mudanças de professor ou tarefas mais longas expõem dificuldades.</li>
        <li><strong>Crescimento/peso:</strong> pode alterar necessidade de reavaliação de dose, sempre pelo médico.</li>
        <li><strong>Uso irregular:</strong> esquecimentos frequentes criam impressão de instabilidade.</li>
        <li><strong>Comorbidades:</strong> ansiedade, dor, constipação, epilepsia ou seletividade alimentar podem interferir.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Antes do retorno</div><p>Leve uma linha do tempo simples: data de início, dose, horário, benefício percebido, quando piorou e quais mudanças ocorreram na rotina.</p></div>
      <p class="source-note">Ajustes terapêuticos devem ser individualizados e feitos pelo profissional responsável.</p>
    `,
  },
  {
    id: "art-epilepsia-primeiros-socorros",
    cat: "epilepsia",
    emoji: "⚡",
    isNew: true,
    title: "Crise convulsiva: primeiros socorros para família e escola",
    summary: "Condutas seguras durante uma crise: proteger, marcar o tempo, não colocar nada na boca e saber quando chamar ajuda.",
    readTime: "5 min",
    date: "07 Jun 2026",
    content: `
      <p>Presenciar uma crise convulsiva assusta. Ter um plano simples reduz pânico e aumenta segurança.</p>
      <h3>Durante a crise</h3>
      <ul>
        <li>Coloque a criança de lado, se possível, e afaste objetos duros ou pontiagudos.</li>
        <li>Marque o tempo desde o início da crise.</li>
        <li>Não segure braços ou pernas com força.</li>
        <li>Não coloque colher, dedo, pano ou qualquer objeto na boca.</li>
        <li>Afrouxe roupas apertadas e observe respiração, cor da pele e tipo de movimento.</li>
      </ul>
      <h3>Procure urgência se</h3>
      <p>A crise durar mais que o tempo definido no plano médico, houver dificuldade respiratória persistente, trauma, repetição de crises sem recuperação ou se for a primeira crise da vida.</p>
      <div class="tip-box"><div class="tip-title">💡 Escola</div><p>A escola deve ter uma orientação escrita: quem aciona a família, quando chamar SAMU e qual medicação de resgate foi prescrita, quando houver.</p></div>
      <p class="source-note">Conteúdo educativo. O plano de crise deve ser individualizado pelo médico.</p>
    `,
  },
  {
    id: "art-epilepsia-diario",
    cat: "epilepsia",
    emoji: "⚡",
    isNew: true,
    title: "Diário de epilepsia: o que vale a pena registrar",
    summary: "Um diário bem feito ajuda a diferenciar crise, gatilho, efeito colateral e resposta ao tratamento.",
    readTime: "3 min",
    date: "07 Jun 2026",
    content: `
      <p>O diário de epilepsia não precisa ser longo. Ele precisa ser consistente e útil para a consulta.</p>
      <h3>Campos essenciais</h3>
      <ul>
        <li>Data e horário da crise.</li>
        <li>Duração aproximada.</li>
        <li>Como começou: olhar parado, queda, susto, rigidez, abalos, desvio ocular.</li>
        <li>O que aconteceu depois: sono, confusão, fraqueza, dor de cabeça, vômitos.</li>
        <li>Possíveis gatilhos: febre, privação de sono, esquecimento de remédio, doença, estresse.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Vídeo ajuda</div><p>Quando for seguro, um vídeo curto da crise pode ajudar muito o médico. A prioridade continua sendo proteger a criança.</p></div>
      <p class="source-note">Leve o diário em consultas e retornos. Não altere medicação por conta própria.</p>
    `,
  },
  {
    id: "art-terapias-como-medir-evolucao",
    cat: "terapias",
    emoji: "🧠",
    isNew: true,
    title: "Como saber se a terapia está funcionando?",
    summary: "Evolução real não é só “ficar mais calmo”: é ganhar função, comunicação, autonomia e participação.",
    readTime: "5 min",
    date: "07 Jun 2026",
    content: `
      <p>Famílias frequentemente perguntam se a terapia “está dando resultado”. A resposta deve olhar para função, não apenas para impressão geral.</p>
      <h3>Sinais de boa evolução</h3>
      <ul>
        <li>A criança comunica melhor o que quer, mesmo que ainda não fale fluentemente.</li>
        <li>Tolera pequenas frustrações com menos crise ou crise mais curta.</li>
        <li>Participa mais de brincadeiras, tarefas escolares ou rotina familiar.</li>
        <li>Ganha autonomia: vestir, comer, organizar material, ir ao banheiro.</li>
        <li>Generaliza habilidades: usa em casa, escola e terapia.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Pergunta-chave</div><p>“O que meu filho faz hoje, na vida real, que não fazia há 3 meses?” Essa pergunta organiza a avaliação de progresso.</p></div>
      <p class="source-note">Metas terapêuticas devem ser individualizadas, mensuráveis e revisadas periodicamente.</p>
    `,
  },
  {
    id: "art-terapias-relatorio-util",
    cat: "terapias",
    emoji: "🧠",
    isNew: true,
    title: "Relatório terapêutico: o que a família deve pedir",
    summary: "Um bom relatório descreve metas, frequência, evolução funcional, dificuldades e próximos passos.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Relatório terapêutico não deve ser apenas uma lista de presença. Ele precisa ajudar a família, a escola e o médico a entenderem a evolução.</p>
      <h3>O que não pode faltar</h3>
      <ul>
        <li>Frequência e duração das sessões.</li>
        <li>Objetivos trabalhados no período.</li>
        <li>Habilidades adquiridas e exemplos concretos.</li>
        <li>Dificuldades persistentes e gatilhos observados.</li>
        <li>Condutas recomendadas para casa e escola.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Melhor formato</div><p>Relatórios trimestrais costumam ser úteis para acompanhar evolução sem burocratizar demais a rotina.</p></div>
      <p class="source-note">O relatório não substitui avaliação médica, mas melhora a integração multiprofissional.</p>
    `,
  },
  {
    id: "art-autonomia-desfralde",
    cat: "autonomia",
    emoji: "🧭",
    isNew: true,
    title: "Desfralde: sinais de prontidão e erros comuns",
    summary: "Desfralde funciona melhor quando há maturidade corporal, rotina previsível e pressão reduzida.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>O desfralde é uma etapa de autonomia, não uma prova de obediência. Forçar cedo demais costuma aumentar resistência.</p>
      <h3>Sinais de prontidão</h3>
      <ul>
        <li>Fica algum tempo com a fralda seca.</li>
        <li>Percebe ou avisa quando fez xixi/cocô.</li>
        <li>Consegue sentar por poucos minutos.</li>
        <li>Entende comandos simples.</li>
        <li>Demonstra incômodo com fralda suja.</li>
      </ul>
      <h3>Evite</h3>
      <p>Broncas, comparações, retirada brusca sem preparo, longos períodos sentado no vaso e transformar acidentes em vergonha.</p>
      <div class="tip-box"><div class="tip-title">💡 Crianças neurodivergentes</div><p>Podem precisar de mais tempo, apoio visual, rotina fixa e adaptação sensorial do banheiro.</p></div>
      <p class="source-note">Em constipação, dor, retenção fecal ou regressão, converse com o pediatra/neuropediatra.</p>
    `,
  },
  {
    id: "art-autonomia-rotina-visual",
    cat: "autonomia",
    emoji: "🧭",
    isNew: true,
    title: "Rotina visual: como usar sem virar enfeite na parede",
    summary: "Quadros visuais ajudam mais quando são simples, usados diariamente e revisados junto com a criança.",
    readTime: "3 min",
    date: "07 Jun 2026",
    content: `
      <p>Rotina visual não é decoração. É uma ferramenta de previsibilidade para reduzir ansiedade e aumentar autonomia.</p>
      <h3>Como montar</h3>
      <ul>
        <li>Use poucas etapas por vez: manhã, escola, banho, jantar, dormir.</li>
        <li>Prefira figuras claras ou fotos reais da própria rotina.</li>
        <li>Mostre antes da transição: “agora banho, depois pijama”.</li>
        <li>Permita que a criança marque o que já terminou.</li>
        <li>Atualize quando a rotina mudar.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Regra prática</div><p>Se ninguém aponta para o quadro durante o dia, ele não está sendo usado. A força está no uso, não no material bonito.</p></div>
      <p class="source-note">Ferramenta educativa útil em TEA, TDAH, ansiedade e atraso de linguagem.</p>
    `,
  },
  {
    id: "art-seguranca-fuga",
    cat: "seguranca",
    emoji: "🛡️",
    isNew: true,
    title: "Risco de fuga: plano de segurança para crianças neurodivergentes",
    summary: "Medidas simples para casa, escola, passeio e transporte quando a criança tem tendência a sair correndo ou se perder.",
    readTime: "5 min",
    date: "07 Jun 2026",
    content: `
      <p>Algumas crianças, especialmente com TEA, TDAH ou impulsividade intensa, podem sair correndo sem avaliar risco. Isso exige prevenção sem culpabilizar a criança.</p>
      <h3>Medidas práticas</h3>
      <ul>
        <li>Identificação na mochila ou pulseira com telefone da família.</li>
        <li>Trancas altas ou alarmes simples em portas, quando necessário.</li>
        <li>Combinar ponto fixo de encontro em locais públicos.</li>
        <li>Na escola, definir quem acompanha transições e saída.</li>
        <li>Ensinar resposta simples: nome, “estou perdido”, telefone dos pais, conforme a capacidade da criança.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Passeios</div><p>Antes de sair, diga em frases curtas: onde vão, quanto tempo, o que pode acontecer e o que fazer se se perder.</p></div>
      <p class="source-note">Se houver fugas repetidas, o plano deve ser discutido com equipe terapêutica e escola.</p>
    `,
  },
  {
    id: "art-seguranca-autoagressao",
    cat: "seguranca",
    emoji: "🛡️",
    isNew: true,
    title: "Autoagressão: como registrar e quando buscar ajuda",
    summary: "Bater a cabeça, se morder ou se arranhar exige observação objetiva de gatilhos, função e intensidade.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Autoagressão pode ter várias funções: dor, frustração, comunicação, busca sensorial, escape de demanda ou sobrecarga. O registro ajuda a entender o padrão.</p>
      <h3>Registro ABC</h3>
      <ul>
        <li><strong>A — Antes:</strong> o que aconteceu imediatamente antes?</li>
        <li><strong>B — Behavior/comportamento:</strong> o que a criança fez exatamente?</li>
        <li><strong>C — Consequência:</strong> o que aconteceu depois? A demanda foi retirada? Ganhou atenção? Foi para outro ambiente?</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Procure ajuda rapidamente se</div><p>Houver ferimento, perda de consciência, escalada de intensidade, risco de trauma ou associação com dor, regressão ou mudança abrupta de comportamento.</p></div>
      <p class="source-note">Conteúdo educativo. Crises intensas exigem plano individualizado e avaliação profissional.</p>
    `,
  },
  {
    id: "art-familia-irmaos",
    cat: "familia",
    emoji: "🏠",
    isNew: true,
    title: "Irmãos de crianças neurodivergentes: como cuidar da relação",
    summary: "Irmãos também precisam de explicação, tempo individual e espaço para sentimentos ambivalentes.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Quando uma criança demanda muitos cuidados, os irmãos podem sentir ciúme, culpa, medo, vergonha ou excesso de responsabilidade. Isso não significa falta de amor.</p>
      <h3>O que ajuda</h3>
      <ul>
        <li>Explicar o diagnóstico em linguagem adequada à idade.</li>
        <li>Reservar pequenos momentos exclusivos com cada filho.</li>
        <li>Não transformar o irmão em “terapeuta” ou cuidador permanente.</li>
        <li>Validar sentimentos difíceis sem punição moral.</li>
        <li>Celebrar conquistas de todos, não apenas da criança em tratamento.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Frase útil</div><p>“Seu irmão precisa de ajuda em algumas coisas, mas você também é importante e também pode pedir ajuda.”</p></div>
      <p class="source-note">O equilíbrio familiar protege vínculos e reduz sobrecarga emocional.</p>
    `,
  },
  {
    id: "art-familia-devolutiva",
    cat: "familia",
    emoji: "🏠",
    isNew: true,
    title: "Como conversar com a família após um diagnóstico",
    summary: "Diagnóstico não deve ser sentença: deve organizar cuidado, direitos, terapias e expectativas realistas.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Receber um diagnóstico pode trazer alívio, medo e luto ao mesmo tempo. A família precisa de linguagem clara, plano concreto e tempo para elaborar.</p>
      <h3>Três ideias centrais</h3>
      <ul>
        <li>O diagnóstico explica dificuldades, mas não resume a criança.</li>
        <li>O objetivo é aumentar função, comunicação, autonomia e participação.</li>
        <li>O plano deve ser revisado conforme evolução, idade e resposta terapêutica.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Após a consulta</div><p>Anote dúvidas que surgirem em casa. A primeira conversa raramente resolve tudo; o cuidado é longitudinal.</p></div>
      <p class="source-note">Conteúdo educativo para acolhimento familiar. Cada caso precisa de avaliação individual.</p>
    `,
  },
  {
    id: "art-exames-eeg",
    cat: "exames",
    emoji: "🔎",
    isNew: true,
    title: "EEG: para que serve e o que ele não responde",
    summary: "O eletroencefalograma avalia atividade elétrica cerebral, mas não diagnostica sozinho TEA, TDAH ou atraso de fala.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>O EEG é um exame importante quando há suspeita de epilepsia, eventos paroxísticos, regressão, alterações de consciência ou episódios que precisam ser diferenciados de crise epiléptica.</p>
      <h3>O que ele pode ajudar a avaliar</h3>
      <ul>
        <li>Descargas epileptiformes.</li>
        <li>Padrões relacionados a certos tipos de epilepsia.</li>
        <li>Eventos durante sono ou vigília, quando registrados.</li>
      </ul>
      <h3>O que ele não faz sozinho</h3>
      <p>EEG não confirma nem exclui TEA, TDAH, transtorno de linguagem ou deficiência intelectual. Esses diagnósticos dependem da história clínica, exame, desenvolvimento e contexto funcional.</p>
      <div class="tip-box"><div class="tip-title">💡 Leve vídeos</div><p>Se a dúvida envolve episódios, vídeos feitos com segurança podem orientar melhor a escolha do tipo de EEG.</p></div>
      <p class="source-note">A indicação do exame deve ser definida pelo médico responsável.</p>
    `,
  },
  {
    id: "art-exames-audicao-fala",
    cat: "exames",
    emoji: "🔎",
    isNew: true,
    title: "Atraso de fala: por que avaliar audição?",
    summary: "Mesmo quando a criança parece ouvir, perdas leves ou flutuantes podem impactar linguagem e comportamento.",
    readTime: "3 min",
    date: "07 Jun 2026",
    content: `
      <p>Quando há atraso de fala, a avaliação auditiva é uma etapa básica. Algumas crianças escutam sons altos, mas têm dificuldade para discriminar fala, especialmente em ambientes ruidosos.</p>
      <h3>Sinais que aumentam suspeita</h3>
      <ul>
        <li>Não responde ao nome de forma consistente.</li>
        <li>Aumenta muito o volume da TV.</li>
        <li>História de otites repetidas.</li>
        <li>Fala pouco clara ou atraso importante de linguagem.</li>
        <li>Piora em ambientes com barulho.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Importante</div><p>“Parece ouvir” não substitui avaliação auditiva quando há atraso de linguagem significativo.</p></div>
      <p class="source-note">A indicação de audiometria, imitanciometria, BERA/PEATE ou outros exames depende da idade e colaboração da criança.</p>
    `,
  },
  {
    id: "art-escola-pei",
    cat: "escola",
    emoji: "🎒",
    isNew: true,
    title: "PEI: o que deve constar em um plano educacional individualizado",
    summary: "Um PEI útil tem metas claras, adaptações reais, responsáveis definidos e revisão periódica.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>O PEI não deve ser um documento genérico. Ele precisa traduzir as necessidades da criança em ações práticas dentro da escola.</p>
      <h3>Elementos essenciais</h3>
      <ul>
        <li>Perfil funcional da criança: comunicação, atenção, autonomia, comportamento e aprendizagem.</li>
        <li>Metas trimestrais ou semestrais, específicas e observáveis.</li>
        <li>Adaptações de conteúdo, prova, tempo, ambiente e comunicação.</li>
        <li>Responsáveis por cada ação: professor, apoio, coordenação, família e terapeutas.</li>
        <li>Data de revisão.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Sinal de bom PEI</div><p>Qualquer professor substituto deveria conseguir entender o que fazer ao ler o plano.</p></div>
      <p class="source-note">O PEI deve ser construído com escola, família e equipe assistente quando possível.</p>
    `,
  },
  {
    id: "art-escola-crise-sensorial",
    cat: "escola",
    emoji: "🎒",
    isNew: true,
    title: "Crise sensorial na escola: como agir sem aumentar o problema",
    summary: "Durante uma crise, menos fala, menos público e mais previsibilidade costumam ajudar.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Crise sensorial não é “manha”. Muitas vezes é uma resposta de sobrecarga a barulho, toque, luz, frustração ou mudança inesperada.</p>
      <h3>Durante a crise</h3>
      <ul>
        <li>Reduza público e comentários.</li>
        <li>Use poucas palavras e tom calmo.</li>
        <li>Ofereça espaço seguro e previsível.</li>
        <li>Evite tocar sem necessidade se o toque piora a crise.</li>
        <li>Não discuta moralmente no pico da desregulação.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Depois da crise</div><p>Registrar gatilho, duração, estratégia que ajudou e retorno à atividade é mais útil do que procurar culpados.</p></div>
      <p class="source-note">Crises frequentes exigem plano escolar individualizado.</p>
    `,
  },
  {
    id: "art-sono-melatonina",
    cat: "sono",
    emoji: "🌙",
    isNew: true,
    title: "Melatonina: expectativas realistas no sono infantil",
    summary: "Melatonina pode ajudar em situações específicas, mas rotina, luz, horário e telas continuam fundamentais.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Algumas crianças recebem melatonina para dificuldade de iniciar o sono. Ela pode ser útil em casos selecionados, mas não corrige sozinha uma rotina desorganizada.</p>
      <h3>O que revisar antes</h3>
      <ul>
        <li>Horário regular para dormir e acordar.</li>
        <li>Exposição à luz natural pela manhã.</li>
        <li>Redução de telas à noite.</li>
        <li>Ambiente escuro, calmo e previsível.</li>
        <li>Evitar cochilos longos ou tardios.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Conversa com o médico</div><p>Informe dose, horário, marca/manipulação, benefício percebido e possíveis efeitos como sonolência matinal ou sonhos vívidos.</p></div>
      <p class="source-note">Não inicie ou ajuste melatonina sem orientação profissional, especialmente em crianças pequenas ou com comorbidades.</p>
    `,
  },
  {
    id: "art-nutri-seletividade",
    cat: "nutri",
    emoji: "🥦",
    isNew: true,
    title: "Seletividade alimentar: quando insistir e quando adaptar",
    summary: "Forçar pode piorar aversão. Exposição gradual, rotina e avaliação sensorial costumam ser mais produtivas.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Seletividade alimentar não é apenas “frescura” em muitas crianças. Textura, cheiro, cor, previsibilidade e experiências negativas podem influenciar bastante.</p>
      <h3>Estratégias iniciais</h3>
      <ul>
        <li>Manter horários previsíveis de refeição.</li>
        <li>Apresentar alimento novo em pequena quantidade, sem ameaça.</li>
        <li>Permitir explorar: olhar, cheirar, tocar, lamber, morder.</li>
        <li>Evitar transformar a mesa em campo de batalha.</li>
        <li>Registrar alimentos aceitos por textura, temperatura, cor e marca.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Sinais de alerta</div><p>Perda de peso, engasgos, vômitos frequentes, restrição extrema ou deficiência nutricional exigem avaliação profissional.</p></div>
      <p class="source-note">O manejo pode envolver nutricionista, fonoaudiologia, terapia ocupacional e acompanhamento médico.</p>
    `,
  },
  {
    id: "art-fala-ecolalia",
    cat: "fala",
    emoji: "💬",
    isNew: true,
    title: "Ecolalia: repetição de fala pode ser comunicação",
    summary: "Repetir frases não é sempre “sem sentido”; pode servir para pedir, regular emoção, responder ou participar.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Ecolalia é a repetição de palavras ou frases ouvidas. Pode ser imediata ou tardia. Em muitas crianças, especialmente no TEA, pode ter função comunicativa.</p>
      <h3>Possíveis funções</h3>
      <ul>
        <li>Pedir algo usando uma frase memorizada.</li>
        <li>Responder quando ainda não consegue formular frase própria.</li>
        <li>Regular ansiedade ou organizar pensamento.</li>
        <li>Participar de uma interação social.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Como ajudar</div><p>Em vez de apenas dizer “não repete”, tente modelar uma frase funcional curta: “quero água”, “me ajuda”, “acabou”.</p></div>
      <p class="source-note">A avaliação fonoaudiológica ajuda a diferenciar repetição sem função aparente de comunicação emergente.</p>
    `,
  },
  {
    id: "art-tdah-organizacao-casa",
    cat: "tdah",
    emoji: "⚡",
    isNew: true,
    title: "TDAH em casa: organização que reduz brigas",
    summary: "Ambiente previsível, comandos curtos e rotinas visuais reduzem desgaste familiar.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>Em casa, o TDAH aparece em tarefas simples: banho, dever, mochila, horário, sono e frustração. A solução não é repetir o comando vinte vezes.</p>
      <h3>Medidas práticas</h3>
      <ul>
        <li>Dar uma instrução por vez.</li>
        <li>Usar checklist visual para manhã e noite.</li>
        <li>Preparar mochila e roupa no dia anterior.</li>
        <li>Dividir dever em blocos curtos com pausa.</li>
        <li>Elogiar início e esforço, não apenas tarefa perfeita.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Frase útil</div><p>Troque “vai logo” por “primeiro escova os dentes; depois me chama”. Menos fala, mais direção.</p></div>
      <p class="source-note">Estrutura ambiental não substitui tratamento, mas reduz conflito e melhora adesão.</p>
    `,
  },
  {
    id: "art-tea-comunicacao-funcional",
    cat: "tea",
    emoji: "🧩",
    isNew: true,
    title: "Comunicação funcional no TEA: falar não é o único objetivo",
    summary: "Apontar, escolher, entregar figura, usar gesto ou CAA também são comunicação e devem ser valorizados.",
    readTime: "4 min",
    date: "07 Jun 2026",
    content: `
      <p>O objetivo inicial da intervenção em comunicação é reduzir frustração e aumentar intenção comunicativa. A fala é importante, mas não é a única forma de comunicar.</p>
      <h3>Exemplos de comunicação funcional</h3>
      <ul>
        <li>Apontar para pedir ou mostrar.</li>
        <li>Entregar objeto para pedir ajuda.</li>
        <li>Escolher entre duas opções.</li>
        <li>Usar figura, gesto, botão ou prancha de CAA.</li>
        <li>Dizer “não”, “acabou”, “mais”, “ajuda”.</li>
      </ul>
      <div class="tip-box"><div class="tip-title">💡 Regra de ouro</div><p>Valorize toda tentativa de comunicação. Quando a criança percebe que comunicar funciona, a interação aumenta.</p></div>
      <p class="source-note">Fonoaudiologia e equipe terapêutica devem individualizar o plano de comunicação.</p>
    `,
  },
];

function mergeCategorias(base: NovidadeCategoria[], extras: NovidadeCategoria[]) {
  const seen = new Set<string>();
  return [...base, ...extras].filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

export const NOVIDADES_CATEGORIAS_AMPLIADAS = mergeCategorias(
  NOVIDADES_CATEGORIAS,
  EXTRA_CATEGORIAS,
);

export const NOVIDADES_ARTIGOS_AMPLIADOS: NovidadeArtigo[] = [
  ...NOVIDADES_ARTIGOS_EXTRAS,
  ...NOVIDADES_ARTIGOS,
];

export const novidadesConteudoStats = {
  artigosBase: NOVIDADES_ARTIGOS.length,
  artigosExtras: NOVIDADES_ARTIGOS_EXTRAS.length,
  artigosTotal: NOVIDADES_ARTIGOS.length + NOVIDADES_ARTIGOS_EXTRAS.length,
  categoriasTotal: NOVIDADES_CATEGORIAS_AMPLIADAS.length,
} as const;
