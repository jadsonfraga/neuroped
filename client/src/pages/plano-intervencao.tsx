import {
  Lightbulb, BookOpen, MessageCircle, Calculator,
  Brain, Activity, Layers, School, AlertCircle, Users, CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import childDevImg from "@assets/images/child-development.webp";

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <h2 className={`text-sm font-bold uppercase tracking-wider ${color}`}>{title}</h2>
    </div>
  );
}

function BulletItem({ text, accent = "bg-primary" }: { text: string; accent?: string }) {
  return (
    <li className="flex items-start gap-2">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${accent}`} />
      <p className="text-xs text-muted-foreground leading-snug">{text}</p>
    </li>
  );
}

function SubTitle({ label }: { label: string }) {
  return <p className="text-xs font-semibold text-foreground uppercase tracking-wide mt-3 mb-1.5">{label}</p>;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

const areas = [
  {
    id: "social",
    title: "Habilidades Sociais e Comunicação",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-l-4 border-l-blue-500",
    badgeBg: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    gradient: "from-blue-500 to-indigo-600",
    accent: "bg-blue-500",
    profissional: "Psicólogo(a)",
    estrategias: [
      "Treinamento de turnos comunicativos: atividades de pergunta-resposta com espera estruturada, promovendo iniciativa e reciprocidade na conversa",
      "Interação com pares por meio de brincadeiras simbólicas e cooperativas, com apoio terapêutico gradualmente retirado (prompt fading)",
      "Dinâmicas de grupo em pequenos grupos (3–4 crianças) para treino de negociação, divisão de materiais e resolução de conflitos simples",
      "Treinamento de expressão estruturada de ideias e emoções por meio de narrativas pessoais (o que fiz no fim de semana, o que sinto agora)",
      "Linguagem pragmática: contexto de uso da linguagem, leitura de pistas sociais (tom de voz, expressão facial, proximidade corporal)",
      "Atividades de teoria da mente: histórias em perspectiva (o que o outro pensa/sente), jogos de dedução social e roleplay",
    ],
    atividades: [
      "Jogo dos sentimentos (cartas de emoções com situações)", "Mímica e teatro simples", "Jogos cooperativos de tabuleiro (Dobble, Dixit, Uno em duplas)",
      "Roda de conversa com tópicos estruturados", "Histórias sociais personalizadas (Social Stories™)", "Jogos de faz-de-conta com roteiros semi-estruturados",
    ],
    desfechos: [
      "Ampliação do repertório de iniciação e manutenção de conversas",
      "Melhora na leitura de pistas sociais e empatia situacional",
      "Redução de conflitos por dificuldade de regulação pragmática",
      "Aumento de interações sociais espontâneas com pares",
    ],
  },
  {
    id: "cognitivo",
    title: "Repertório Cognitivo e Pedagógico",
    icon: BookOpen,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-l-4 border-l-violet-500",
    badgeBg: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
    gradient: "from-violet-500 to-purple-600",
    accent: "bg-violet-500",
    profissional: "Psicopedagogo(a)",
    estrategias: [
      "Adaptação curricular para alfabetização com método fônico: correspondência grafema-fonema, sílabas diretas, inversas e complexas em progressão gradual",
      "Reconhecimento de letras com apoio multimodal: visual (cartazes, fichas), auditivo (rimas, canções) e cinestésico (letras de lixa, modelagem em argila)",
      "Segmentação silábica com palmas, fichas silábicas e palavras-âncora para cada fonema trabalhado",
      "Leitura de palavras dissílabas e trissílabas com contextualização semântica — nunca palavras soltas sem sentido",
      "Identificação e correção de erros ortográficos típicos: hipossegmentação (palavras coladas), hipersegmentação (palavras separadas erroneamente), omissão e inversão de letras",
      "Treino de caligrafia com materiais adaptados: lápis triangular, guia de escrita, caderno pautado ampliado — respeitando o ritmo e a pressão grafo-motora da criança",
      "Apoio visual e auditivo sistemático: agenda pictográfica, fichas de rotina, gravações de leitura para automonitoramento",
    ],
    atividades: [
      "Alfabeto móvel e fichas de palavras", "Caça-palavras e cruzadinhas adaptadas", "Bingo de sílabas", "Livros de pano e livros ilustrados de nível gradual",
      "Ditado com apoio (ditado-relâmpago com palavras estudadas)", "Jogo da memória ortográfico", "Produção de texto coletivo com apoio do terapeuta",
    ],
    desfechos: [
      "Consolidação da consciência fonológica e decodificação leitora",
      "Produção de texto escrito com erros ortográficos reduzidos",
      "Autonomia crescente em tarefas escolares de leitura e escrita",
      "Motivação aumentada para atividades acadêmicas",
    ],
  },
  {
    id: "oral",
    title: "Compreensão e Expressão Oral",
    icon: MessageCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-l-4 border-l-emerald-500",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    gradient: "from-emerald-500 to-teal-600",
    accent: "bg-emerald-500",
    profissional: "Fonoaudiólogo(a)",
    estrategias: [
      "Compreensão de histórias em três níveis: identificação de personagens, reconstituição de cenários e antecipação de desfechos a partir de pistas textuais",
      "Síntese oral: treino de resumir histórias e textos com as próprias palavras, iniciando por 3–4 orações e progredindo em complexidade",
      "Fluência verbal formal (FAS fonológico, categorias semânticas): aumento do acesso lexical por ensaios cronometrados e estratégias de recuperação",
      "Controle da disfluência (gagueira): técnicas de respiração diafragmática, fala em ritmo suave (easy onset), pausas planejadas e monitoramento de tensão muscular",
      "Tempo de resposta e organização do turno: sinalizadores linguísticos (\"Deixa eu pensar...\", \"O que eu quero dizer é...\") para ganhar tempo de processamento sem interromper a fluidez",
      "Narrativas sequenciais: uso de sequências de imagens para treinar início-meio-fim, conectivos temporais (primeiro, depois, por fim) e coerência textual",
      "Dramatização e roleplay fonoaudiológico: treino de prosódia, entonação e expressividade em contextos comunicativos variados",
    ],
    atividades: [
      "Contação de histórias com imagens sequenciadas", "Jogo de adivinhas e enigmas verbais", "Teatro de fantoches com roteiro livre",
      "Gravação da fala para auto-escuta e feedback", "Jogo dos sinônimos e antônimos", "Completar histórias iniciadas pelo terapeuta",
    ],
    desfechos: [
      "Melhora na organização do discurso oral e na coerência narrativa",
      "Aumento do vocabulário expressivo e da fluência de recuperação lexical",
      "Redução de disfluências em contextos de alta demanda comunicativa",
      "Maior confiança para falar em público (sala de aula, grupos)",
    ],
  },
  {
    id: "matematica",
    title: "Habilidades Matemáticas e Raciocínio Lógico",
    icon: Calculator,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-l-4 border-l-amber-500",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    gradient: "from-amber-500 to-orange-500",
    accent: "bg-amber-500",
    profissional: "Psicopedagogo(a)",
    estrategias: [
      "Cálculo mental com apoio de manipulativos concretos: ábacos, blocos multibase, palitos, fichas numéricas — progressão do concreto ao pictórico ao abstrato",
      "Sequenciação numérica com desafios de \"continuar a sequência\", identificar o número que falta e explicar o padrão (series com +2, +5, pares/ímpares)",
      "Classificação e seriação com objetos reais: tamanho, forma, cor, peso — base para pensamento lógico-matemático e formação de conceitos",
      "Conceitos temporais: sequência de dias, meses, estações, ontem-hoje-amanhã, leitura de calendário e de relógio analógico",
      "Raciocínio espacial: quebra-cabeças, montagem de figuras geométricas, simetria, Tangram — ativação do raciocínio visuoespacial e geométrico",
      "Resolução de problemas com contextos significativos (situações do cotidiano da criança) — desenvolvendo raciocínio dedutivo, plano de ação e verificação da resposta",
      "Noção de dinheiro e troco: atividades lúdicas de compra e venda com moedas e notas reais ou maquetes, promovendo matemática funcional",
      "Flexibilidade cognitiva matemática: mais de uma forma de resolver o mesmo problema; discutir o \"por quê\" da resposta certa",
    ],
    atividades: [
      "Dominó matemático (adição, subtração, multiplicação)", "Jogo de trilha com operações", "Sudoku infantil adaptado",
      "Batalha naval com coordenadas numéricas", "Jogo da loja (dinheiro)", "Quebra-cabeça de figuras geométricas", "Jogos de memória matemática",
    ],
    desfechos: [
      "Automatização de fatos aritméticos básicos sem suporte concreto",
      "Melhora na resolução de problemas com contexto",
      "Compreensão de conceitos matemáticos abstratos (fração, proporcionalidade)",
      "Aplicação de noções matemáticas em situações funcionais do cotidiano",
    ],
  },
  {
    id: "atencao",
    title: "Atenção, Funções Executivas e Comportamento Adaptativo",
    icon: Brain,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-l-4 border-l-orange-500",
    badgeBg: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    gradient: "from-orange-500 to-red-500",
    accent: "bg-orange-500",
    profissional: "Neuropsicólogo(a) / Psicólogo(a)",
    estrategias: [
      "Atenção sustentada: tarefas de duração progressivamente maior, iniciando por 5 minutos e ampliando gradualmente com reforço positivo intermitente",
      "Regulação emocional: identificação de emoções de alta intensidade (\"termômetro emocional\"), técnicas de respiração (4-7-8, barriga de urso) e estratégias de auto-acalmia",
      "Controle inibitório: jogos do tipo \"Pare / Continue\" (Sinal Verde-Vermelho), exercício \"Simon diz\", e tarefas de Stroop adaptadas — treinar a inibição de resposta dominante",
      "Memória operacional: sequências crescentes de dígitos, repetição de instruções em duas etapas e progressão para três, jogos de memória com demanda de manipulação",
      "Adaptação ao contexto: rotinas visuais estruturadas (agenda do dia), antecipação de transições, ensaio de regras antes de entrar em novo contexto",
      "Planejamento e organização: decomposição de tarefas em etapas numeradas, uso de checklists, aprendizado de estimativa de tempo com timer visual",
      "Flexibilidade cognitiva: transição entre regras de jogo, resolução de labirintos com caminhos alternativos, atividades com mais de uma solução válida",
      "Comportamento adaptativo em contexto: encaixe e montagem de peças que exigem planejamento sequencial; instruções em múltiplos passos com aumento gradual de complexidade",
    ],
    atividades: [
      "Jogo dos erros e diferenças", "Labirinto de papel e digital", "Jogo Memória em versões diversas", "Sequências de tarefas com timer",
      "Siga o mestre (instrução de sequência)", "Quebra-cabeça de 24–48 peças", "Jogos de construção (Lego, blocos)", "Caça ao objeto escondido com pistas",
    ],
    desfechos: [
      "Aumento do tempo on-task em tarefas acadêmicas e estruturadas",
      "Melhora na autorregulação emocional e comportamental",
      "Redução de impulsividade em contextos sociais e acadêmicos",
      "Maior independência na organização de materiais e rotinas",
    ],
  },
  {
    id: "sensorial",
    title: "Integração Sensorial e Motricidade",
    icon: Activity,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
    border: "border-l-4 border-l-cyan-500",
    badgeBg: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
    gradient: "from-cyan-500 to-sky-600",
    accent: "bg-cyan-500",
    profissional: "Terapeuta Ocupacional",
    estrategias: [
      "Processamento tátil: atividades de exploração de diferentes texturas (areia, gel, massa de modelar, água), iniciando pelo tato defensivo e avançando para a discriminação tátil fina",
      "Estimulação vestibular: balanço controlado (rede, plataforma), giros em cadeira giratória supervisionados, escorregador, pula-pula — sempre respeitando limiares individuais",
      "Input proprioceptivo: atividades com resistência (empurrar caixas, puxar cordas, carregar mochila com peso calibrado), abraços compressivos, brincadeiras de \"estátua\"",
      "Dieta sensorial individualizada: rotina estruturada de atividades sensoriais ao longo do dia — manhã, antes da escola, pós-almoço e à tarde — para regulação e prevenção de crises",
      "Planejamento motor (praxia): sequências motoras novas (obstacle course), dança com coreografia aprendida passo a passo, atividades de imitação de postura",
      "Motricidade fina: pinça trípode e pinça lateral, recorte com tesoura de pontas arredondadas, enfiar miçangas, traçado de formas geométricas, cópia de figuras",
      "Motricidade grossa: equilíbrio unipodal, caminhada em linha, salto com dois pés, skipping, arremesso e recepção de bola em distâncias progressivas",
      "Adaptação por perfil sensorial: hiporresponsivo (estimulação intensa e variada), hipersensível (redução de estímulos, adaptação ambiental gradual), buscador (oferecer canais sensoriais seguros)",
    ],
    atividades: [
      "Caixa de exploração sensorial (areia, feijão, arroz)", "Circuito motor com obstáculos", "Pintura com os dedos e esponjas",
      "Argila e massa de modelar", "Bola suíça para equilíbrio", "Treino de escrita em diferentes superfícies", "Brincadeiras aquáticas (banheira, piscina de bolinhas)",
    ],
    desfechos: [
      "Ampliação da tolerância sensorial e redução de crises de desregulação",
      "Melhora na qualidade da escrita e no controle da pressão do lápis",
      "Maior equilíbrio e coordenação motora em brincadeiras e esporte",
      "Autorregulação sensorial mais eficiente em ambientes variados (escola, supermercado)",
    ],
  },
  {
    id: "inclusao",
    title: "Acomodações Inclusivas e Monitoramento",
    icon: School,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-l-4 border-l-rose-500",
    badgeBg: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
    gradient: "from-rose-500 to-pink-600",
    accent: "bg-rose-500",
    profissional: "Psicopedagogo(a) / Equipe",
    estrategias: [
      "Materiais adaptados: fontes ampliadas, espaçamento entre linhas aumentado, prova dividida em duas partes, uso de marcador de leitura, questões com imagens de apoio",
      "Atividades extraclasse de consciência fonológica: envio de tarefas lúdicas para casa (rima, segmentação, formação de palavras) com orientação detalhada para os pais",
      "Apoio individualizado: monitor escolar ou estagiário de pedagogia para suporte nas atividades de alta exigência cognitiva, sem substituir o aluno na tarefa",
      "Comunicação escola-família-terapeuta: relatórios mensais curtos e objetivos, reuniões trimestrais com a equipe escolar, uso de agenda de comunicação diária",
      "Monitoramento contínuo do progresso: análise de portfólio (cadernos, provas, produções escritas) mensalmente, com identificação de áreas em avanço e áreas que precisam de mais suporte",
      "Relatórios colaborativos: documento unificado assinado por todos os profissionais, revisado semestralmente com atualização das metas do PTI",
      "Revisão periódica de metas: o PTI deve ser formalmente reavaliado a cada 3–6 meses, com ajuste de objetivos conforme o progresso alcançado e as novas demandas emergentes",
    ],
    atividades: [
      "Reunião de alinhamento escola-terapeutas (trimestral)", "Portfólio físico ou digital da evolução do aluno",
      "Lista de verificação de acomodações implementadas", "Diário do professor com observações semanais",
      "Visita técnica do terapeuta ao ambiente escolar", "Treinamento de professores sobre necessidades específicas do aluno",
    ],
    desfechos: [
      "Maior participação e desempenho do aluno no ambiente escolar",
      "Redução de barreiras de aprendizagem por falta de acomodações",
      "Parceria ativa e informada entre família, escola e equipe terapêutica",
      "Metas terapêuticas mais realistas e atualizadas ao longo do tempo",
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PlanoIntervencaoPage() {
  return (
    <div className="space-y-8" data-testid="plano-intervencao-page">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.06),transparent_50%)]" />
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
            <Lightbulb className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-xl font-bold leading-tight">
              Guia de Intervenção por Áreas e Habilidades — Dr. Jadson
            </h1>
            <p className="text-white/80 text-sm leading-relaxed">
              Como intervir em cada domínio do desenvolvimento: estratégias práticas, atividades recomendadas e desfechos esperados
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge className="bg-white/20 text-white border-white/30 text-xs">7 áreas</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Guia Clínico</Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs">Multiprofissional</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHILD DEV IMAGE ── */}
      <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-lg">
        <img src={childDevImg} alt="" className="w-full h-full object-cover" />
      </div>

      {/* ── INTRO ── */}
      <Card className="border-card-border">
        <CardContent className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este guia organiza as <strong className="text-foreground">principais estratégias de intervenção clínica e pedagógica</strong> em 7 áreas do desenvolvimento infantil. Cada seção inclui: estratégias específicas com fundamentação clínica, atividades e jogos recomendados, o profissional que conduz a intervenção e os desfechos terapêuticos esperados.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O conteúdo é direcionado a <strong className="text-foreground">profissionais da equipe multiprofissional</strong> (fonoaudiólogos, psicólogos, neuropsicólogos, psicopedagogos, terapeutas ocupacionais) e serve como referência para o planejamento e execução das intervenções.
          </p>
        </CardContent>
      </Card>

      {/* ── AREAS ── */}
      <section className="space-y-3">
        <SectionHeader icon={Lightbulb} title="7 Áreas de Intervenção" color="text-amber-600 dark:text-amber-400" />

        <Accordion type="multiple" className="space-y-3">
          {areas.map((area, index) => {
            const Icon = area.icon;
            return (
              <AccordionItem
                key={area.id}
                value={area.id}
                className={`rounded-2xl border border-border bg-card overflow-hidden ${area.border}`}
              >
                <AccordionTrigger className="hover:no-underline px-4 py-4">
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${area.gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${area.color}`}>{index + 1}. {area.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${area.badgeBg}`}>
                          {area.profissional}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{area.estrategias.length} estratégias</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-5 space-y-4">

                  {/* Estratégias */}
                  <div>
                    <SubTitle label="Estratégias de Intervenção" />
                    <ul className="space-y-2">
                      {area.estrategias.map((e, i) => (
                        <BulletItem key={i} text={e} accent={area.accent} />
                      ))}
                    </ul>
                  </div>

                  {/* Atividades */}
                  <div>
                    <SubTitle label="Atividades e Jogos Recomendados" />
                    <div className="flex flex-wrap gap-1.5">
                      {area.atividades.map((a, i) => (
                        <span key={i} className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${area.badgeBg} border-transparent`}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Profissional */}
                  <div className={`rounded-xl ${area.bg} border border-opacity-40 p-3 flex items-center gap-2`} style={{ borderColor: "transparent" }}>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${area.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Profissional que conduz</p>
                      <p className={`text-xs font-bold ${area.color}`}>{area.profissional}</p>
                    </div>
                  </div>

                  {/* Desfechos */}
                  <div>
                    <SubTitle label="Desfechos Esperados" />
                    <ul className="space-y-1.5">
                      {area.desfechos.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${area.color}`} />
                          <p className="text-xs text-muted-foreground leading-snug">{d}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      {/* ── NOTA INTEGRATIVA ── */}
      <Card className="border-card-border overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500" />
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-bold text-foreground">Integração das Intervenções</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            As 7 áreas de intervenção descritas neste guia não são estanques — elas se influenciam mutuamente. Uma melhora na <strong className="text-foreground">regulação emocional</strong> impacta diretamente a <strong className="text-foreground">atenção</strong> disponível para aprendizagem. O trabalho de <strong className="text-foreground">integração sensorial</strong> potencializa a <strong className="text-foreground">motricidade fina</strong> necessária para a escrita. A intervenção em <strong className="text-foreground">linguagem oral</strong> é pré-requisito para a <strong className="text-foreground">aprendizagem da leitura</strong>.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Por isso, o planejamento integrado — com comunicação frequente entre os membros da equipe — é sempre mais eficaz do que intervenções isoladas. O PTI (Plano Terapêutico Individualizado) é a ferramenta que garante essa coesão.
          </p>
        </CardContent>
      </Card>

      {/* ── DISCLAIMER ── */}
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Aviso educacional:</strong> Este guia tem finalidade didática para profissionais de saúde e educação. As estratégias apresentadas devem ser adaptadas às necessidades individuais de cada paciente por profissional habilitado. Não substitui avaliação clínica individualizada nem supervisão profissional.
          </p>
        </div>
      </div>

    </div>
  );
}
