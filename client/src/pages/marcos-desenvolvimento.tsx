import { useState } from "react";
import { Baby, Move, Hand, MessageCircle, Users, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
import {
  nextMarcoAnswer,
  summarizeMarcos,
  type MarcoAnswer,
  type MarcosAnswers,
} from "@/lib/marcosStatus";

const RESPOSTAS: { value: MarcoAnswer; label: string }[] = [
  { value: "sim", label: "Sim" },
  { value: "ainda-nao", label: "Ainda não" },
  { value: "nao-sei", label: "Não sei" },
];

interface Milestone {
  id: string;
  label: string;
}

interface DomainData {
  name: string;
  icon: React.ElementType;
  color: string;
  milestones: Milestone[];
}

interface AgeData {
  age: string;
  label: string;
  domains: DomainData[];
}

const AGE_DATA: AgeData[] = [
  {
    age: "2m",
    label: "2 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "2m-mg-1", label: "Sustenta cabeça brevemente em prono" },
          { id: "2m-mg-2", label: "Movimenta braços e pernas ativamente" },
          { id: "2m-mg-3", label: "Levanta a cabeça 45° quando em prono" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "2m-mf-1", label: "Abre e fecha as mãos espontaneamente" },
          { id: "2m-mf-2", label: "Segura objeto brevemente ao ser colocado na mão" },
          { id: "2m-mf-3", label: "Mãos predominantemente fechadas" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "2m-li-1", label: "Emite sons guturais e arruados" },
          { id: "2m-li-2", label: "Reage a sons altos (susto ou choro)" },
          { id: "2m-li-3", label: "Vira olhos em direção a sons" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "2m-so-1", label: "Sorriso social (responde ao sorriso do cuidador)" },
          { id: "2m-so-2", label: "Olha atentamente para rostos" },
          { id: "2m-so-3", label: "Segue objeto em movimento com os olhos" },
        ],
      },
    ],
  },
  {
    age: "4m",
    label: "4 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "4m-mg-1", label: "Sustenta cabeça firme (sem oscilação)" },
          { id: "4m-mg-2", label: "Rola de prono para supino" },
          { id: "4m-mg-3", label: "Sustenta-se nos antebraços em prono" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "4m-mf-1", label: "Leva mãos à linha média e as junta" },
          { id: "4m-mf-2", label: "Alcança e toca objetos" },
          { id: "4m-mf-3", label: "Segura chocalho brevemente" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "4m-li-1", label: "Vocaliza sons (aah, ooh)" },
          { id: "4m-li-2", label: "Ri alto (gargalhadas)" },
          { id: "4m-li-3", label: "Vira a cabeça em direção a sons" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "4m-so-1", label: "Reconhece o cuidador principal" },
          { id: "4m-so-2", label: "Sorri espontaneamente" },
          { id: "4m-so-3", label: "Demonstra interesse em pessoas" },
        ],
      },
    ],
  },
  {
    age: "6m",
    label: "6 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "6m-mg-1", label: "Senta com apoio das mãos (trípode)" },
          { id: "6m-mg-2", label: "Rola para ambos os lados" },
          { id: "6m-mg-3", label: "Sustenta peso nas pernas quando apoiado de pé" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "6m-mf-1", label: "Transfere objeto entre as mãos" },
          { id: "6m-mf-2", label: "Preensão palmar presente" },
          { id: "6m-mf-3", label: "Leva objetos à boca" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "6m-li-1", label: "Balbucio (ba-ba, da-da, ma-ma)" },
          { id: "6m-li-2", label: "Vira para a voz do cuidador" },
          { id: "6m-li-3", label: "Demonstra alegria ou desprazer com sons" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "6m-so-1", label: "Estranha desconhecidos (ansiedade de separação iniciando)" },
          { id: "6m-so-2", label: "Brinca de esconde-achou" },
          { id: "6m-so-3", label: "Responde a expressões faciais" },
        ],
      },
    ],
  },
  {
    age: "9m",
    label: "9 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "9m-mg-1", label: "Senta sem apoio de forma estável" },
          { id: "9m-mg-2", label: "Engatinha ou se arrasta" },
          { id: "9m-mg-3", label: "Puxa-se para ficar de pé" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "9m-mf-1", label: "Pinça inferior (polegar e demais dedos)" },
          { id: "9m-mf-2", label: "Bate dois objetos um no outro" },
          { id: "9m-mf-3", label: "Pega objetos pequenos com 2 dedos" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "9m-li-1", label: "Mama/papa de forma inespecífica" },
          { id: "9m-li-2", label: "Imita sons e sílabas" },
          { id: "9m-li-3", label: "Responde ao próprio nome" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "9m-so-1", label: "Acena tchau-tchau" },
          { id: "9m-so-2", label: "Imita gestos simples (palmas)" },
          { id: "9m-so-3", label: "Ansiedade de separação evidente" },
        ],
      },
    ],
  },
  {
    age: "12m",
    label: "12 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "12m-mg-1", label: "Fica de pé com apoio" },
          { id: "12m-mg-2", label: "Primeiros passos (pode ser com apoio)" },
          { id: "12m-mg-3", label: "Cruza móveis (marcha lateral com suporte)" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "12m-mf-1", label: "Pinça fina (polegar e indicador)" },
          { id: "12m-mf-2", label: "Coloca e tira objetos de recipientes" },
          { id: "12m-mf-3", label: "Empilha 2 cubos" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "12m-li-1", label: "1 a 3 palavras com sentido (mama, papa, água)" },
          { id: "12m-li-2", label: "Aponta para o que quer" },
          { id: "12m-li-3", label: "Entende 'não' e comandos simples" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "12m-so-1", label: "Brinca de dar e receber objetos" },
          { id: "12m-so-2", label: "Imita ações simples (bater palmas)" },
          { id: "12m-so-3", label: "Atenção conjunta com cuidador" },
        ],
      },
    ],
  },
  {
    age: "15m",
    label: "15 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "15m-mg-1", label: "Anda sozinho de forma estável" },
          { id: "15m-mg-2", label: "Agacha e levanta sem apoio" },
          { id: "15m-mg-3", label: "Sobe escadas engatinhando" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "15m-mf-1", label: "Empilha 2 cubos" },
          { id: "15m-mf-2", label: "Rabisca espontaneamente" },
          { id: "15m-mf-3", label: "Vira páginas de livro (agrupadas)" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "15m-li-1", label: "5 a 10 palavras com sentido" },
          { id: "15m-li-2", label: "Cumpre comandos simples de 1 etapa" },
          { id: "15m-li-3", label: "Aponta para objetos nomeados" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "15m-so-1", label: "Bebe no copo com apoio" },
          { id: "15m-so-2", label: "Usa colher (com muita sujeira)" },
          { id: "15m-so-3", label: "Brincadeira funcional com objetos" },
        ],
      },
    ],
  },
  {
    age: "18m",
    label: "18 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "18m-mg-1", label: "Sobe escada com apoio (dois pés por degrau)" },
          { id: "18m-mg-2", label: "Chuta bola para frente" },
          { id: "18m-mg-3", label: "Corre (embora de forma instável)" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "18m-mf-1", label: "Empilha 3 a 4 cubos" },
          { id: "18m-mf-2", label: "Vira páginas uma a uma" },
          { id: "18m-mf-3", label: "Rabisca com lápis de cera" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "18m-li-1", label: "15 a 20 palavras com sentido" },
          { id: "18m-li-2", label: "Nomeia objetos familiares" },
          { id: "18m-li-3", label: "Aponta para partes do corpo (2-3)" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "18m-so-1", label: "Brincadeira imitativa (imita adultos)" },
          { id: "18m-so-2", label: "Mostra o que quer (aponta, puxa)" },
          { id: "18m-so-3", label: "Demonstra afeto espontaneamente" },
        ],
      },
    ],
  },
  {
    age: "24m",
    label: "24 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "24m-mg-1", label: "Corre com boa coordenação" },
          { id: "24m-mg-2", label: "Sobe e desce escada com apoio" },
          { id: "24m-mg-3", label: "Chuta e arremessa bola" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "24m-mf-1", label: "Empilha 6 cubos" },
          { id: "24m-mf-2", label: "Faz torre com blocos (4-6)" },
          { id: "24m-mf-3", label: "Vira páginas uma a uma com facilidade" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "24m-li-1", label: "Frases de 2 palavras ('mamã água', 'papai foi')" },
          { id: "24m-li-2", label: "Vocabulário de 50 ou mais palavras" },
          { id: "24m-li-3", label: "Nomeia partes do corpo (5-6)" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "24m-so-1", label: "Brincadeira paralela (próximo mas não junto)" },
          { id: "24m-so-2", label: "Ajuda a vestir-se (braços no casaco)" },
          { id: "24m-so-3", label: "Brincadeira de faz de conta simples" },
        ],
      },
    ],
  },
  {
    age: "30m",
    label: "30 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "30m-mg-1", label: "Pula com os dois pés juntos" },
          { id: "30m-mg-2", label: "Equilibra-se em um pé brevemente" },
          { id: "30m-mg-3", label: "Sobe escada alternando os pés com apoio" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "30m-mf-1", label: "Copia linha vertical" },
          { id: "30m-mf-2", label: "Rosqueia e desrosqueia tampas" },
          { id: "30m-mf-3", label: "Encaixa peças simples de quebra-cabeça" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "30m-li-1", label: "Frases de 3 palavras" },
          { id: "30m-li-2", label: "Entende conceitos de tamanho (grande/pequeno)" },
          { id: "30m-li-3", label: "Faz perguntas simples ('O que é?')" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "30m-so-1", label: "Brincadeira simbólica (faz de conta elaborado)" },
          { id: "30m-so-2", label: "Diz seu próprio nome" },
          { id: "30m-so-3", label: "Mostra interesse em outras crianças" },
        ],
      },
    ],
  },
  {
    age: "36m",
    label: "36 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "36m-mg-1", label: "Pedala triciclo" },
          { id: "36m-mg-2", label: "Sobe escada alternando pés sem apoio" },
          { id: "36m-mg-3", label: "Salta sobre obstáculos baixos" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "36m-mf-1", label: "Copia círculo" },
          { id: "36m-mf-2", label: "Corta com tesoura (linha reta)" },
          { id: "36m-mf-3", label: "Empilha 9-10 cubos" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "36m-li-1", label: "Frases completas (3-4 palavras)" },
          { id: "36m-li-2", label: "Conta até 3 objetos" },
          { id: "36m-li-3", label: "Entendido por estranhos em ~75% do tempo" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "36m-so-1", label: "Brincadeira cooperativa com outras crianças" },
          { id: "36m-so-2", label: "Veste-se com ajuda mínima" },
          { id: "36m-so-3", label: "Reconhece emoções básicas (alegre, triste)" },
        ],
      },
    ],
  },
  {
    age: "48m",
    label: "48 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "48m-mg-1", label: "Pula num pé só (2-3 vezes)" },
          { id: "48m-mg-2", label: "Pega bola arremessada" },
          { id: "48m-mg-3", label: "Desce escada alternando pés" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "48m-mf-1", label: "Desenha pessoa com 3 partes (cabeça, tronco, membros)" },
          { id: "48m-mf-2", label: "Recorta em linha reta com tesoura" },
          { id: "48m-mf-3", label: "Copia cruz e quadrado" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "48m-li-1", label: "Conta histórias com sequência" },
          { id: "48m-li-2", label: "Pergunta 'por quê?' frequentemente" },
          { id: "48m-li-3", label: "Vocabulário de 1000+ palavras" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "48m-so-1", label: "Brinca com regras simples" },
          { id: "48m-so-2", label: "Tem amigos imaginários" },
          { id: "48m-so-3", label: "Distingue fantasia de realidade (parcialmente)" },
        ],
      },
    ],
  },
  {
    age: "60m",
    label: "60 meses",
    domains: [
      {
        name: "Motor Grosso",
        icon: Move,
        color: "text-blue-600 dark:text-blue-400",
        milestones: [
          { id: "60m-mg-1", label: "Salta alternando os pés (pula corda)" },
          { id: "60m-mg-2", label: "Anda em linha reta com equilíbrio" },
          { id: "60m-mg-3", label: "Anda de bicicleta com rodinhas" },
        ],
      },
      {
        name: "Motor Fino",
        icon: Hand,
        color: "text-violet-600 dark:text-violet-400",
        milestones: [
          { id: "60m-mf-1", label: "Desenha pessoa com 6 partes ou mais" },
          { id: "60m-mf-2", label: "Escreve ou copia o próprio nome" },
          { id: "60m-mf-3", label: "Usa garfo e faca" },
        ],
      },
      {
        name: "Linguagem",
        icon: MessageCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        milestones: [
          { id: "60m-li-1", label: "Frases complexas com tempo e causa" },
          { id: "60m-li-2", label: "Conta de 1 a 10 objetos" },
          { id: "60m-li-3", label: "Entendido por estranhos quase 100% do tempo" },
        ],
      },
      {
        name: "Social",
        icon: Users,
        color: "text-orange-600 dark:text-orange-400",
        milestones: [
          { id: "60m-so-1", label: "Entende e segue regras sociais" },
          { id: "60m-so-2", label: "Coopera em grupo de crianças" },
          { id: "60m-so-3", label: "Demonstra empatia com colegas" },
        ],
      },
    ],
  },
];

function AgeTab({
  data,
  answers,
  onAnswer,
}: {
  data: AgeData;
  answers: MarcosAnswers;
  onAnswer: (id: string, next: MarcoAnswer | undefined) => void;
}) {
  const allIds = data.domains.flatMap((d) => d.milestones.map((m) => m.id));
  const summary = summarizeMarcos(allIds, answers);

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        aria-live="polite"
        data-testid="marcos-resumo"
      >
        <span>Sim: <strong className="text-foreground">{summary.sim}</strong></span>
        <span>Ainda não: <strong className="text-foreground">{summary.aindaNao}</strong></span>
        <span>Não sei: <strong className="text-foreground">{summary.naoSei}</strong></span>
        <span>Sem resposta: <strong className="text-foreground">{summary.semResposta}</strong></span>
      </div>

      {summary.aindaNao > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs font-medium">
            Há marcos marcados como &quot;ainda não&quot;. Leve esta lista ao pediatra para conversar sobre eles.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.domains.map((domain) => (
          <div key={domain.name} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <domain.icon className={`w-4 h-4 ${domain.color}`} aria-hidden="true" />
              <h3 className="text-xs font-semibold text-foreground">{domain.name}</h3>
            </div>
            <div className="space-y-3">
              {domain.milestones.map((milestone) => {
                const current = answers[milestone.id];
                const labelId = `${milestone.id}-label`;
                return (
                  <div key={milestone.id} className="space-y-1.5">
                    <p id={labelId} className="text-xs leading-snug text-foreground">
                      {milestone.label}
                    </p>
                    <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-1.5">
                      {RESPOSTAS.map((resposta) => (
                        <Button
                          key={resposta.value}
                          type="button"
                          variant={current === resposta.value ? "default" : "outline"}
                          size="sm"
                          aria-pressed={current === resposta.value}
                          data-testid={`marco-${milestone.id}-${resposta.value}`}
                          className="h-7 px-2.5 text-[11px]"
                          onClick={() => onAnswer(milestone.id, nextMarcoAnswer(current, resposta.value))}
                        >
                          {resposta.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarcosDesenvolvimentoPage() {
  // Estado na página: a aba de cada idade é desmontada ao trocar de idade.
  const [answersByAge, setAnswersByAge] = useState<Record<string, MarcosAnswers>>({});

  function handleAnswer(age: string, id: string, next: MarcoAnswer | undefined) {
    setAnswersByAge((prev) => {
      const ageAnswers = { ...(prev[age] ?? {}) };
      if (next === undefined) delete ageAnswers[id];
      else ageAnswers[id] = next;
      return { ...prev, [age]: ageAnswers };
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHero
        icon={Baby}
        eyebrow="desenvolvimento infantil"
        title="Marcos do Desenvolvimento"
        subtitle="Checklist baseado nos marcos OMS/CDC. Responda marco por marco; não há pontuação."
        gradient="from-amber-500 to-orange-500"
      />

      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 flex items-start gap-2">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" aria-hidden="true" />
        <span>
          Deixar um marco em branco <strong>não</strong> significa que a criança já o atingiu. Escolha &quot;Sim&quot;, &quot;Ainda não&quot; ou &quot;Não sei&quot; para cada um.
        </span>
      </div>

      <Tabs defaultValue="12m" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 mb-2">
          {AGE_DATA.map((a) => (
            <TabsTrigger key={a.age} value={a.age} className="text-xs py-1.5 px-2.5" data-testid={`tab-age-${a.age}`}>
              {a.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {AGE_DATA.map((a) => (
          <TabsContent key={a.age} value={a.age} className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Marcos dos {a.label}</h2>
              <span className="text-xs text-muted-foreground">(OMS / CDC)</span>
            </div>
            <AgeTab
              data={a}
              answers={answersByAge[a.age] ?? {}}
              onAnswer={(id, next) => handleAnswer(a.age, id, next)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-xs text-muted-foreground border-t pt-4">
        Fonte: WHO Child Growth Standards, CDC Developmental Milestones (domínio público). Este checklist não substitui avaliação clínica formal. As respostas ficam apenas nesta tela e não são salvas nem enviadas.
      </p>
    </div>
  );
}
