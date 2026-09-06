import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Baby,
  Brain,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Eye,
  Hand,
  MessageCircle,
  MonitorSmartphone,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Sonda Dez — avaliação direta pré-consulta.
 *
 * Fonte clínica canônica: fichas AFN-10 A1/A2/B/C/D/E fornecidas pelo médico.
 * Esta página deliberadamente NÃO calcula escore global, percentil, norma ou
 * diagnóstico. O resultado é um registro observacional estruturado para
 * integração médica posterior.
 *
 * Privacidade: todo o estado desta tela vive apenas em memória. Não há
 * localStorage, D1, endpoint clínico nem persistência automática.
 */

type Phase = "setup" | "materials" | "run" | "report";
type ResponseCode = "E" | "I" | "P" | "0" | "NA";
type FieldValue = string | number;
type FieldKind = "choice" | "count" | "text";

type FieldDef = {
  id: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  max?: number;
  hint?: string;
};

type ChildVisual = {
  title: string;
  subtitle?: string;
  items: string[];
};

type MissionDef = {
  id: string;
  title: string;
  start: string;
  end: string;
  say: string[];
  doSteps: string[];
  materials: string[];
  observe: string[];
  fields: FieldDef[];
  interpretation: string[];
  childVisual?: ChildVisual;
};

type BandDef = {
  id: string;
  label: string;
  minMonths: number;
  maxMonths: number;
  icon: string;
  subtitle: string;
  materials: string[];
  missions: MissionDef[];
};

type MissionRecord = {
  values: Record<string, FieldValue>;
  notes: string;
};

type Interference = "nenhum" | "sono" | "dor/fome" | "ansiedade/recusa";
type RedFlag =
  | "regressão"
  | "evento paroxístico"
  | "assimetria/marcha"
  | "auto/heteroagressão"
  | "não tolerou";

const CODES = ["E", "I", "P", "0", "NA"] as const;
const CODE_LABELS: Record<ResponseCode, string> = {
  E: "Espontâneo",
  I: "Após instrução",
  P: "Após pista/repetição",
  "0": "Não demonstrado",
  NA: "Não avaliável",
};
const CODE_MEANINGS: Record<ResponseCode, string> = {
  E: "A reação apareceu sem mediação adicional nesta situação; é evidência observacional de que o comportamento estava acessível aqui.",
  I: "A reação apareceu depois de uma instrução direta; a estrutura verbal foi suficiente para evocar o comportamento nesta tarefa.",
  P: "A reação apareceu somente após pista ou repetição; houve necessidade de mediação adicional nesta oportunidade.",
  "0": "A reação não apareceu nesta oportunidade. Isso não prova ausência da habilidade fora desta situação e não deve ser convertido em diagnóstico.",
  NA: "As condições da aplicação não permitiram inferência válida; não converter em erro, zero ou ausência de habilidade.",
};

const INTERFERENCES: Interference[] = [
  "nenhum",
  "sono",
  "dor/fome",
  "ansiedade/recusa",
];
const RED_FLAGS: RedFlag[] = [
  "regressão",
  "evento paroxístico",
  "assimetria/marcha",
  "auto/heteroagressão",
  "não tolerou",
];

const codeField = (id: string, label: string): FieldDef => ({
  id,
  label,
  kind: "choice",
  options: [...CODES],
});
const choiceField = (id: string, label: string, options: string[]): FieldDef => ({
  id,
  label,
  kind: "choice",
  options,
});
const countField = (id: string, label: string, max?: number, hint?: string): FieldDef => ({
  id,
  label,
  kind: "count",
  max,
  hint,
});

const BANDS: BandDef[] = [
  {
    id: "12-23m",
    label: "12–23 meses",
    minMonths: 12,
    maxMonths: 23,
    icon: "🌱",
    subtitle: "Interação, compreensão, gestos, brincadeira e autorregulação inicial",
    materials: [
      "brinquedo pequeno e interessante",
      "bola",
      "carrinho",
      "boneco/bebê",
      "colher e copo",
      "telefone de brinquedo",
      "caixa transparente difícil de abrir",
      "2 recipientes opacos iguais",
    ],
    missions: [
      {
        id: "a1-social-nome",
        title: "Entrada social + resposta ao nome",
        start: "0:00",
        end: "1:00",
        say: ["Após 30 s livres, chame o nome da criança 2 vezes, sem tocar."],
        doSteps: ["Mostre um brinquedo interessante.", "Espere 30 segundos sem comando.", "Chame o nome duas vezes, sem tocar na criança."],
        materials: ["brinquedo interessante"],
        observe: ["alterna olhar entre pessoa e objeto", "gesto ou vocalização espontânea", "quantas vezes responde ao nome"],
        fields: [
          choiceField("alterna", "Alterna pessoa–objeto", ["E", "0", "NA"]),
          choiceField("gesto", "Gesto/vocalização", ["E", "0", "NA"]),
          choiceField("nome", "Resposta ao nome", ["0/2", "1/2", "2/2", "NA"]),
        ],
        interpretation: ["Alternar pessoa–objeto descreve coordenação social da atenção nesta situação.", "Responder ao nome em uma, duas ou nenhuma oportunidade é registro bruto; não é ponto de corte."],
      },
      {
        id: "a1-receptiva",
        title: "Linguagem receptiva",
        start: "1:00",
        end: "2:30",
        say: ["Me dê a bola.", "Pegue o carro.", "Cadê o bebê?"],
        doSteps: ["Apresente os objetos ao alcance.", "Diga cada ordem uma vez.", "Só depois use pista/repetição se necessário e registre isso."],
        materials: ["bola", "carrinho", "boneco/bebê"],
        observe: ["se executa após instrução", "se precisa de pista/repetição", "se a tarefa fica não avaliável"],
        fields: [codeField("bola", "Bola"), codeField("carro", "Carrinho"), codeField("bebe", "Bebê")],
        interpretation: ["I registra execução após a instrução direta; P registra necessidade de pista/repetição; 0 significa apenas que não foi demonstrado aqui."],
        childVisual: { title: "Mostre os objetos", items: ["⚽", "🚗", "🧸"] },
      },
      {
        id: "a1-imitacao",
        title: "Imitação + gestos",
        start: "2:30",
        end: "3:45",
        say: ["Faz igual."],
        doSteps: ["Bata palmas.", "Mande beijo.", "Toque a cabeça.", "Empurre o carrinho."],
        materials: ["carrinho"],
        observe: ["quantas das 4 ações imita", "apontar espontâneo", "mostrar/entregar objeto espontaneamente"],
        fields: [
          countField("imitacoes", "Imitações", 4),
          choiceField("apontar", "Apontar", ["E", "0", "NA"]),
          choiceField("mostrar", "Mostrar/entregar objeto", ["E", "0", "NA"]),
        ],
        interpretation: ["O número de imitações é uma contagem bruta das quatro oportunidades apresentadas.", "Gestos espontâneos são registrados separadamente de respostas provocadas."],
      },
      {
        id: "a1-atencao-conjunta",
        title: "Atenção conjunta",
        start: "3:45",
        end: "5:15",
        say: ["Olha!"],
        doSteps: ["Aponte para um estímulo lateral.", "Crie duas oportunidades naturais, sem reposicionar fisicamente a criança."],
        materials: ["objeto lateral interessante"],
        observe: ["segue apontar/olhar", "olha de volta para a pessoa", "inicia compartilhamento"],
        fields: [
          countField("segue", "Segue apontar/olhar", 2),
          countField("retorno", "Olha de volta para a pessoa", 2),
          choiceField("inicia", "Inicia compartilhamento", ["E", "0", "NA"]),
        ],
        interpretation: ["Seguir a referência e depois retornar o olhar descreve coordenação da atenção social na aplicação.", "Iniciativa de compartilhar deve ser registrada somente quando surgir sem indução."],
      },
      {
        id: "a1-brincadeira",
        title: "Brincadeira funcional",
        start: "5:15",
        end: "6:45",
        say: ["O bebê está com fome."],
        doSteps: ["Deixe 30 segundos de exploração livre.", "Depois use a frase proposta, sem modelar imediatamente a ação."],
        materials: ["boneco", "colher", "copo", "carrinho", "telefone de brinquedo"],
        observe: ["uso funcional", "simbolismo", "sequência de ações"],
        fields: [
          choiceField("funcional", "Uso funcional", ["E", "I", "0", "NA"]),
          choiceField("simbolismo", "Simbolismo observado", ["sim", "não", "NA"]),
          choiceField("sequencia", "Sequência de ações", ["sim", "não", "NA"]),
        ],
        interpretation: ["Uso funcional descreve ação coerente com o objeto; simbolismo e sequência são descritos separadamente para não colapsar comportamentos diferentes."],
      },
      {
        id: "a1-ajuda",
        title: "Problema + pedido de ajuda",
        start: "6:45",
        end: "8:15",
        say: ["Precisa de alguma coisa?"],
        doSteps: ["Coloque um brinquedo desejável dentro de caixa difícil.", "Espere 20 segundos.", "Só então faça a pergunta."],
        materials: ["brinquedo desejável", "caixa transparente difícil"],
        observe: ["como solicita ajuda", "se muda estratégia", "como se regula diante do obstáculo"],
        fields: [
          codeField("ajuda", "Solicitação de ajuda"),
          choiceField("estrategia", "Muda estratégia", ["sim", "não", "NA"]),
          choiceField("regula", "Regula-se", ["sim", "não", "NA"]),
        ],
        interpretation: ["Pedido espontâneo e pedido após instrução/pista representam graus diferentes de mediação; nenhum deles equivale a diagnóstico.", "Frustração intensa ou sofrimento sustentado é motivo para interromper, não para insistir."],
      },
      {
        id: "a1-espera",
        title: "Espera + permanência do objeto",
        start: "8:15",
        end: "10:00",
        say: ["Espera... agora!"],
        doSteps: ["Faça a espera três vezes.", "Depois esconda um objeto sob um de dois recipientes, em duas tentativas."],
        materials: ["objeto pequeno", "2 recipientes opacos iguais"],
        observe: ["quantas vezes espera", "busca no recipiente correto", "reação à interrupção"],
        fields: [
          countField("espera", "Espera até o sinal", 3),
          countField("busca", "Busca objeto correto", 2),
          choiceField("interrupcao", "Reação à interrupção", ["adequada", "intensa", "NA"]),
        ],
        interpretation: ["A contagem de espera descreve controle da resposta nas três oportunidades.", "Reação intensa deve ser contextualizada por sono, dor/fome, ansiedade/recusa e demais interferentes."],
      },
    ],
  },
  {
    id: "24-35m",
    label: "24–35 meses",
    minMonths: 24,
    maxMonths: 35,
    icon: "🌿",
    subtitle: "Comunicação, simbolismo, resolução de problema e inibição inicial",
    materials: ["bola", "carrinho", "caixa", "colher", "boneco/bebê", "banana ou figura de banana", "telefone de brinquedo", "caixa transparente difícil"],
    missions: [
      {
        id: "a2-social",
        title: "Entrada social + nome",
        start: "0:00",
        end: "1:00",
        say: ["Após 30 s livres, chame o nome 2 vezes sem tocar."],
        doSteps: ["Ofereça um brinquedo interessante.", "Observe por 30 segundos sem dirigir.", "Chame o nome duas vezes."],
        materials: ["brinquedo interessante"],
        observe: ["alterna pessoa–objeto", "iniciativa comunicativa", "resposta ao nome"],
        fields: [
          choiceField("alterna", "Alterna pessoa–objeto", ["E", "0", "NA"]),
          choiceField("iniciativa", "Iniciativa comunicativa", ["E", "0", "NA"]),
          choiceField("nome", "Resposta ao nome", ["0/2", "1/2", "2/2", "NA"]),
        ],
        interpretation: ["Iniciativa comunicativa deve ser marcada como espontânea apenas se surgir sem solicitação direta.", "Resposta ao nome permanece uma contagem bruta de duas oportunidades."],
      },
      {
        id: "a2-compreensao",
        title: "Compreensão verbal",
        start: "1:00",
        end: "2:30",
        say: ["Me dê a bola.", "Ponha o carro dentro da caixa.", "Pegue a colher e dê ao bebê."],
        doSteps: ["Apresente os objetos.", "Diga as três ordens na sequência prevista.", "Registre se foi necessário repetir ou dar pista."],
        materials: ["bola", "carrinho", "caixa", "colher", "boneco/bebê"],
        observe: ["ordem simples", "relação espacial", "ordem em duas etapas"],
        fields: [codeField("ordem1", "Ordem 1"), codeField("ordem2", "Ordem 2"), codeField("duas", "Ordem de 2 etapas")],
        interpretation: ["Compare a quantidade de mediação necessária entre ordens, sem converter esse padrão em classificação normativa."],
      },
      {
        id: "a2-expressiva",
        title: "Linguagem expressiva + fala",
        start: "2:30",
        end: "3:45",
        say: ["O que é isso?"],
        doSteps: ["Mostre bola, carrinho e banana.", "Depois crie uma oportunidade natural para uma solicitação espontânea."],
        materials: ["bola", "carrinho", "banana ou figura"],
        observe: ["nomeação", "combinação de palavras", "inteligibilidade nesta amostra"],
        fields: [
          countField("nomeacao", "Nomeação", 3),
          choiceField("combina", "Combina palavras", ["sim", "não", "NA"]),
          choiceField("inteligibilidade", "Inteligibilidade", ["boa", "parcial", "baixa", "NA"]),
        ],
        interpretation: ["A inteligibilidade é uma descrição da fala produzida nesta amostra curta; não substitui avaliação fonoaudiológica."],
        childVisual: { title: "O que é isso?", items: ["⚽", "🚗", "🍌"] },
      },
      {
        id: "a2-atencao",
        title: "Atenção conjunta + gesto",
        start: "3:45",
        end: "5:00",
        say: ["Olha!"],
        doSteps: ["Aponte duas vezes para estímulos laterais.", "Depois ofereça oportunidade para a criança apontar/mostrar algo interessante."],
        materials: ["2 estímulos interessantes"],
        observe: ["segue referência", "aponta", "mostra/compartilha"],
        fields: [
          countField("segue", "Segue referência", 2),
          choiceField("apontar", "Apontar", ["E", "I", "0", "NA"]),
          choiceField("mostrar", "Mostrar/compartilhar", ["E", "0", "NA"]),
        ],
        interpretation: ["Diferencie resposta ao apontar de iniciativa de compartilhar; são comportamentos distintos no registro."],
      },
      {
        id: "a2-simbolica",
        title: "Brincadeira simbólica",
        start: "5:00",
        end: "6:30",
        say: ["O bebê está com fome."],
        doSteps: ["Deixe 30 segundos livres com os objetos.", "Depois faça a frase sem modelar a ação."],
        materials: ["boneco", "copo", "colher", "telefone"],
        observe: ["uso funcional", "simbolismo", "sequência de 2 ações"],
        fields: [
          choiceField("funcional", "Uso funcional", ["sim", "não", "NA"]),
          choiceField("simbolico", "Simbólico", ["E", "I", "0", "NA"]),
          choiceField("sequencia", "Sequência de 2 ações", ["sim", "não", "NA"]),
        ],
        interpretation: ["O app separa uso funcional, simbolismo e sequência para evitar uma conclusão única a partir de comportamentos diferentes."],
      },
      {
        id: "a2-problema",
        title: "Resolução de problema + ajuda",
        start: "6:30",
        end: "8:00",
        say: ["Precisa de alguma coisa?"],
        doSteps: ["Coloque o objeto desejável em caixa transparente difícil.", "Espere antes de perguntar."],
        materials: ["objeto desejável", "caixa transparente difícil"],
        observe: ["solicitação de ajuda", "persistência", "frustração"],
        fields: [
          codeField("ajuda", "Solicita ajuda"),
          choiceField("persistencia", "Persistência", ["boa", "baixa", "NA"]),
          choiceField("frustracao", "Frustração", ["leve", "intensa", "NA"]),
        ],
        interpretation: ["Frustração intensa ou recusa sustentada deve interromper a exigência da tarefa; marque interferente/alerta em vez de insistir."],
      },
      {
        id: "a2-memoria-inibicao",
        title: "Memória inicial + inibição",
        start: "8:00",
        end: "10:00",
        say: ["Primeiro o carro, depois a bola.", "Espera... só quando eu disser JÁ."],
        doSteps: ["Aplique a sequência carro→bola.", "Depois faça três oportunidades de espera."],
        materials: ["carrinho", "bola"],
        observe: ["sequência correta", "quantas esperas cumpre", "respostas antecipadas"],
        fields: [
          codeField("sequencia", "Sequência correta"),
          countField("espera", "Espera até o JÁ", 3),
          countField("antecipadas", "Respostas antecipadas", 3),
        ],
        interpretation: ["Resposta antecipada descreve ação antes do sinal; pode ocorrer por compreensão, engajamento, controle da resposta ou outros fatores e não é diagnóstico de impulsividade."],
      },
    ],
  },
  {
    id: "3-4a",
    label: "3–4 anos",
    minMonths: 36,
    maxMonths: 59,
    icon: "🚀",
    subtitle: "Interação, conceitos, linguagem, atenção sustentada e troca de regra",
    materials: ["banana/figura", "objetos grande/pequeno", "carrinho e caixa", "boneco", "copo", "colher", "telefone", "15 figuras com 5 cachorros", "cartões SOL/LUA", "fichas"],
    missions: [
      {
        id: "b-interacao",
        title: "Interação espontânea",
        start: "0:00",
        end: "1:00",
        say: ["Oi. Olha o que eu tenho aqui."],
        doSteps: ["Deixe a criança explorar e conversar sem dirigir por 30 segundos."],
        materials: ["objeto interessante"],
        observe: ["reciprocidade", "comentário/pergunta", "fala espontânea"],
        fields: [codeField("reciprocidade", "Reciprocidade"), choiceField("comentario", "Comentário/pergunta", ["E", "0", "NA"]), choiceField("fala", "Fala espontânea", ["sim", "não", "NA"])],
        interpretation: ["Espontaneidade é registrada antes de qualquer ajuda; não confunda silêncio inicial com incapacidade se houver ansiedade/recusa."],
      },
      {
        id: "b-receptivo",
        title: "Receptivo + conceitos",
        start: "1:00",
        end: "2:30",
        say: ["Mostre a banana.", "Mostre o grande.", "Ponha o carro dentro da caixa.", "Boneco em cima."],
        doSteps: ["Aplique as quatro instruções.", "Conte quantas repetições foram necessárias."],
        materials: ["banana/figura", "objetos grande/pequeno", "carrinho", "caixa", "boneco"],
        observe: ["nomeação receptiva", "conceitos espaciais/tamanho", "necessidade de repetição"],
        fields: [countField("nomeacao", "Nomeação receptiva", 1), countField("conceitos", "Conceitos", 3), choiceField("repetir", "Precisou repetir", ["0", "1", "2+", "NA"])],
        interpretation: ["Registre o número de conceitos demonstrados e a repetição necessária sem classificar o resultado como normal ou alterado."],
        childVisual: { title: "Mostre o que eu pedir", items: ["🍌", "🔵", "🔷", "🚗"] },
      },
      {
        id: "b-expressivo",
        title: "Expressivo + amostra de fala",
        start: "2:30",
        end: "4:00",
        say: ["O que é isso?", "O que está acontecendo?"],
        doSteps: ["Nomeie quatro figuras, uma por vez.", "Depois mostre uma cena autoral e peça uma descrição."],
        materials: ["4 figuras", "cena autoral"],
        observe: ["nomeação", "frase espontânea", "inteligibilidade"],
        fields: [countField("nomeacao", "Nomeação", 4), choiceField("frase", "Frase espontânea", ["sim", "não", "NA"]), choiceField("inteligibilidade", "Inteligibilidade", ["boa", "parcial", "baixa", "NA"])],
        interpretation: ["Descreva a amostra produzida; não extrapole a inteligibilidade desta tarefa para todos os contextos."],
      },
      {
        id: "b-atencao-ajuda",
        title: "Atenção conjunta + ajuda",
        start: "4:00",
        end: "5:15",
        say: ["Olha!", "Precisa de ajuda?"],
        doSteps: ["Crie um episódio de apontar/olhar.", "Crie um objeto difícil ou inacessível."],
        materials: ["estímulo lateral", "objeto difícil/inacessível"],
        observe: ["segue referência", "alterna olhar", "pede ajuda"],
        fields: [codeField("segue", "Segue referência"), choiceField("alterna", "Alterna olhar", ["E", "0", "NA"]), codeField("ajuda", "Pede ajuda")],
        interpretation: ["Observe separadamente resposta à referência social e estratégia de pedir ajuda."],
      },
      {
        id: "b-simbolica",
        title: "Brincadeira simbólica",
        start: "5:15",
        end: "6:30",
        say: ["O bebê está doente. O que a gente pode fazer?"],
        doSteps: ["Deixe 20 segundos livres com boneco e objetos.", "Depois faça a pergunta."],
        materials: ["boneco e objetos de faz-de-conta"],
        observe: ["simbolismo", "sequência", "flexibilidade"],
        fields: [codeField("simbolismo", "Simbolismo"), choiceField("sequencia", "Sequência", ["sim", "não", "NA"]), choiceField("flexibilidade", "Flexibilidade", ["boa", "limitada", "NA"])],
        interpretation: ["Flexibilidade aqui descreve variedade/ajuste do brincar na cena proposta, não um traço diagnóstico."],
      },
      {
        id: "b-atencao-sustentada",
        title: "Atenção sustentada",
        start: "6:30",
        end: "8:15",
        say: ["Toda vez que aparecer um cachorro, coloque uma ficha aqui."],
        doSteps: ["Apresente 15 figuras, sendo 5 alvos.", "Não corrija durante a sequência.", "Registre redirecionamentos externos."],
        materials: ["15 figuras", "fichas"],
        observe: ["acertos", "omissões", "comissões", "redirecionamentos"],
        fields: [countField("acertos", "Acertos", 5), countField("omissoes", "Omissões", 15), countField("comissoes", "Comissões", 10), countField("redirecionamentos", "Redirecionamentos")],
        interpretation: ["Omissão = alvo apresentado sem resposta registrada; pode refletir atenção, compreensão, fadiga, engajamento ou outros fatores.", "Comissão = resposta quando o estímulo não era alvo; descreve falha de contenção da resposta nesta tarefa, sem confirmar TDAH."],
        childVisual: { title: "Quando aparecer 🐶, coloque uma ficha", subtitle: "Não toque nos outros", items: ["🐶", "🐱", "🐰", "🐶", "🦊", "🐻", "🐶", "🐼", "🐯", "🐸", "🐶", "🐵", "🦁", "🐶", "🐮"] },
      },
      {
        id: "b-inibicao",
        title: "Inibição + troca de regra",
        start: "8:15",
        end: "10:00",
        say: ["SOL = bater palma. LUA = não fazer nada.", "Agora vamos inverter a regra."],
        doSteps: ["Aplique 10 itens na regra inicial.", "Se a criança compreendeu, inverta nos 4 finais."],
        materials: ["cartões SOL/LUA"],
        observe: ["acertos na regra inicial", "comissões", "acertos após inversão", "perseverações"],
        fields: [countField("acertos", "Regra inicial: acertos", 10), countField("comissoes", "Comissões", 10), countField("inversao", "Inversão: acertos", 4), countField("perseveracoes", "Perseverações", 4)],
        interpretation: ["Perseveração = manutenção da regra anterior após a mudança; descreva a adaptação observada sem classificá-la por norma."],
        childVisual: { title: "SOL = palma · LUA = parar", items: ["☀️", "🌙", "☀️", "☀️", "🌙", "☀️", "🌙", "🌙", "☀️", "🌙"] },
      },
    ],
  },
  {
    id: "5-7a",
    label: "5–7 anos",
    minMonths: 60,
    maxMonths: 95,
    icon: "🧭",
    subtitle: "Narrativa, memória operacional, atenção, inibição, flexibilidade e visuoconstrução",
    materials: ["cena autoral", "objetos para ordens de 2–3 etapas", "20 estímulos com 6 cachorros", "cartões SOL/LUA", "6 blocos de construção"],
    missions: [
      {
        id: "c-conversa",
        title: "Conversação",
        start: "0:00",
        end: "0:45",
        say: ["Me conta alguma coisa legal que aconteceu hoje ou ontem."],
        doSteps: ["Espere a resposta sem completar a história pela criança."],
        materials: ["nenhum"],
        observe: ["reciprocidade", "organização narrativa"],
        fields: [choiceField("reciprocidade", "Reciprocidade", ["boa", "limitada", "NA"]), choiceField("narrativa", "Narrativa", ["coerente", "breve", "desorganizada", "NA"])],
        interpretation: ["A classificação descreve esta conversa curta; ansiedade, timidez e pouco vínculo podem interferir."],
      },
      {
        id: "c-compreensao",
        title: "Compreensão + memória operacional",
        start: "0:45",
        end: "2:15",
        say: ["Vou te pedir algumas coisas. Escuta tudo antes de começar."],
        doSteps: ["Aplique três ordens progressivas de 2 a 3 etapas.", "Inclua antes/depois em uma delas.", "Conte repetições."],
        materials: ["objetos para ordens de 2–3 etapas"],
        observe: ["etapas cumpridas", "ordem temporal", "pedidos de repetição"],
        fields: [countField("ordem1", "Ordem 1: etapas corretas", 2), countField("ordem2", "Ordem 2: etapas corretas", 3), countField("temporal", "Ordem temporal: etapas corretas", 3), countField("repeticao", "Repetições")],
        interpretation: ["Etapas corretas são contagem bruta de execução; pedidos de repetição também podem representar estratégia de checagem."],
      },
      {
        id: "c-narrativa",
        title: "Narrativa + inferência",
        start: "2:15",
        end: "3:30",
        say: ["O que aconteceu?", "Por quê?", "O que vai acontecer depois?"],
        doSteps: ["Mostre uma cena autoral.", "Faça as três perguntas sem sugerir respostas."],
        materials: ["cena autoral"],
        observe: ["sequência", "causalidade", "previsão"],
        fields: [choiceField("sequencia", "Sequência", ["sim", "não", "NA"]), codeField("causalidade", "Causalidade"), codeField("previsao", "Previsão")],
        interpretation: ["Registre se a criança constrói sequência, causa e previsão a partir desta cena específica."],
        childVisual: { title: "Olhe a cena e conte a história", items: ["🌧️", "🧒", "☂️", "🏠"] },
      },
      {
        id: "c-atencao",
        title: "Atenção sustentada",
        start: "3:30",
        end: "5:15",
        say: ["Responda apenas quando aparecer o cachorro."],
        doSteps: ["Apresente 20 estímulos, 6 alvos, um a cada 2–3 s.", "Não comente os erros durante a tarefa."],
        materials: ["20 estímulos"],
        observe: ["acertos", "omissões", "comissões", "autocorreções", "redirecionamentos"],
        fields: [countField("acertos", "Acertos", 6), countField("omissoes", "Omissões", 6), countField("comissoes", "Comissões", 14), countField("autocorrecoes", "Autocorreções"), countField("redirecionamentos", "Redirecionamentos")],
        interpretation: ["Omissões e comissões são fenômenos distintos; uma tarefa curta não estabelece causa clínica isoladamente.", "Autocorreção registra monitoramento da própria resposta quando ocorre sem correção externa."],
        childVisual: { title: "Responda só ao 🐶", items: ["🐶", "🐱", "🦊", "🐶", "🐻", "🐰", "🐶", "🐼", "🐯", "🐸", "🐶", "🐵", "🦁", "🐮", "🐶", "🐷", "🐔", "🐧", "🐶", "🦆"] },
      },
      {
        id: "c-inibitorio",
        title: "Controle inibitório",
        start: "5:15",
        end: "6:45",
        say: ["SOL = uma palma. LUA = ficar parado."],
        doSteps: ["Aplique 16 itens.", "Não comente erros durante a tarefa."],
        materials: ["cartões SOL/LUA"],
        observe: ["acertos", "comissões", "omissões", "antecipações"],
        fields: [countField("acertos", "Acertos", 16), countField("comissoes", "Comissões", 16), countField("omissoes", "Omissões", 16), countField("antecipacoes", "Antecipações", 16)],
        interpretation: ["Comissão = agir quando deveria inibir; omissão = não agir no alvo; antecipação = agir antes da apresentação completa. Registre separadamente."],
        childVisual: { title: "☀️ = palma · 🌙 = parado", items: ["☀️", "🌙", "☀️", "🌙", "🌙", "☀️", "☀️", "🌙"] },
      },
      {
        id: "c-flexibilidade",
        title: "Flexibilidade cognitiva",
        start: "6:45",
        end: "8:15",
        say: ["Agora mudou: LUA = palma; SOL = parado."],
        doSteps: ["Aplique 8 itens com a regra invertida."],
        materials: ["cartões SOL/LUA"],
        observe: ["acertos", "perseverações", "quantos itens até adaptação", "autocorreção"],
        fields: [countField("acertos", "Acertos", 8), countField("perseveracoes", "Perseverações", 8), countField("adaptou", "Adaptou após quantos itens", 8), choiceField("autocorrecao", "Autocorreção", ["sim", "não", "NA"])],
        interpretation: ["Perseveração descreve continuidade da regra anterior após a mudança; adaptação rápida ou gradual é registrada sem ponto de corte."],
      },
      {
        id: "c-visuoconstrutivo",
        title: "Planejamento visuoconstrutivo",
        start: "8:15",
        end: "10:00",
        say: ["Agora faça uma igual."],
        doSteps: ["Mostre uma construção de 6 blocos por 5 segundos.", "Desmonte e peça a reprodução."],
        materials: ["6 blocos"],
        observe: ["conclusão", "autocorreções", "estratégia organizada"],
        fields: [choiceField("conclusao", "Conclusão", ["concluiu", "parcial", "não concluiu", "NA"]), countField("autocorrecoes", "Autocorreções"), choiceField("estrategia", "Estratégia organizada", ["sim", "não", "NA"])],
        interpretation: ["Observe o método usado além do produto final: organização e autocorreção são dados diferentes de conclusão."],
        childVisual: { title: "Veja por 5 segundos", subtitle: "Depois faça uma igual com os blocos", items: ["🟦", "🟨", "🟥", "🟩", "🟪", "🟧"] },
      },
    ],
  },
  {
    id: "8-11a",
    label: "8–11 anos",
    minMonths: 96,
    maxMonths: 143,
    icon: "🧠",
    subtitle: "Pragmática, inferência social, memória operacional, atenção, flexibilidade e planejamento",
    materials: ["cena social ambígua autoral", "4 objetos", "grade autoral de alvos", "cronômetro do app", "cartões/estímulos DIA/NOITE", "cartões de rotina"],
    missions: [
      {
        id: "d-pragmatica",
        title: "Pragmática espontânea",
        start: "0:00",
        end: "0:45",
        say: ["Me conta como foi seu dia até chegar aqui."],
        doSteps: ["Escute sem interromper inicialmente.", "Não complete a narrativa pela criança."],
        materials: ["nenhum"],
        observe: ["organização", "reciprocidade", "manutenção do tópico"],
        fields: [choiceField("organizacao", "Organização", ["boa", "parcial", "baixa", "NA"]), choiceField("reciprocidade", "Reciprocidade", ["boa", "limitada", "NA"]), choiceField("topico", "Mantém tópico", ["sim", "não", "NA"])],
        interpretation: ["A pragmática é descrita a partir desta conversa breve e deve ser correlacionada com contextos naturais."],
      },
      {
        id: "d-inferencia",
        title: "Inferência social",
        start: "0:45",
        end: "2:00",
        say: ["O que acontece?", "Como a pessoa se sente?", "O que faz você pensar isso?"],
        doSteps: ["Mostre uma cena social ambígua autoral.", "Faça as três perguntas sem oferecer alternativas."],
        materials: ["cena social ambígua autoral"],
        observe: ["contexto", "emoção", "justificativa espontânea ou após instrução/pista"],
        fields: [choiceField("contexto", "Identifica contexto", ["sim", "não", "NA"]), choiceField("emocao", "Identifica emoção", ["sim", "não", "NA"]), codeField("justificativa", "Justificativa")],
        interpretation: ["Uma justificativa espontânea mostra que a criança explicitou pistas usadas; ausência nesta cena não define cognição social global."],
        childVisual: { title: "O que você acha que aconteceu?", items: ["🧒📚", "👧↩️", "😕", "💬"] },
      },
      {
        id: "d-memoria",
        title: "Memória operacional",
        start: "2:00",
        end: "3:30",
        say: ["Vou dizer quatro coisas. Faça na ordem que eu falar."],
        doSteps: ["Diga uma ordem de 4 etapas com objetos.", "Não repita automaticamente."],
        materials: ["4 objetos"],
        observe: ["etapas corretas", "ordem preservada", "pedido de repetição"],
        fields: [countField("etapas", "Etapas corretas", 4), choiceField("ordem", "Ordem preservada", ["sim", "não", "NA"]), choiceField("repeticao", "Pediu repetição", ["sim", "não", "NA"])],
        interpretation: ["Pedir repetição pode ser estratégia adaptativa; registre em separado do número de etapas executadas."],
      },
      {
        id: "d-atencao",
        title: "Atenção seletiva/sustentada",
        start: "3:30",
        end: "5:15",
        say: ["Você tem 60 segundos. Marque apenas os círculos com ponto dentro."],
        doSteps: ["Apresente a grade autoral.", "Inicie o cronômetro de 60 segundos.", "Não indique erros durante a tarefa."],
        materials: ["grade autoral de alvos"],
        observe: ["alvos", "omissões", "falsos positivos", "estratégia de varredura"],
        fields: [countField("alvos", "Alvos marcados"), countField("omissoes", "Omissões"), countField("falsos", "Falsos positivos"), choiceField("varredura", "Varredura", ["organizada", "aleatória", "NA"])],
        interpretation: ["Varredura organizada ou aleatória descreve a estratégia visível; omissões e falsos positivos permanecem medidas brutas desta grade."],
        childVisual: { title: "Marque somente círculos com ponto", subtitle: "60 segundos", items: ["⊙", "○", "□", "⊙", "△", "○", "⊙", "◇", "⊙", "□", "○", "⊙", "△", "⊙", "○", "◇"] },
      },
      {
        id: "d-inibicao",
        title: "Inibição verbal",
        start: "5:15",
        end: "6:45",
        say: ["Quando eu disser DIA, responda NOITE. Quando eu disser NOITE, responda DIA."],
        doSteps: ["Aplique 12 itens em ritmo regular.", "Não corrija durante a sequência."],
        materials: ["estímulos DIA/NOITE"],
        observe: ["acertos", "erros impulsivos", "autocorreções", "latência"],
        fields: [countField("acertos", "Acertos", 12), countField("erros", "Erros impulsivos", 12), countField("autocorrecoes", "Autocorreções"), choiceField("latencia", "Latência", ["estável", "variável", "NA"])],
        interpretation: ["Erro impulsivo aqui significa resposta automática antes de aplicar a regra oposta; não equivale por si só a impulsividade clínica."],
        childVisual: { title: "Responda o contrário", items: ["DIA", "NOITE", "DIA", "DIA", "NOITE", "NOITE", "DIA", "NOITE"] },
      },
      {
        id: "d-flexibilidade",
        title: "Flexibilidade",
        start: "6:45",
        end: "8:00",
        say: ["Agora mudou: DIA = SOL; NOITE = LUA."],
        doSteps: ["Aplique 8 itens com a nova regra."],
        materials: ["estímulos DIA/NOITE"],
        observe: ["acertos", "perseverações", "velocidade de adaptação"],
        fields: [countField("acertos", "Acertos", 8), countField("perseveracoes", "Perseverações", 8), choiceField("adaptacao", "Adaptação", ["rápida", "gradual", "não ocorreu", "NA"])],
        interpretation: ["Adaptação descreve o comportamento após a troca; não há ponto de corte para rápida/gradual nesta prova piloto."],
      },
      {
        id: "d-planejamento",
        title: "Planejamento + imprevisto",
        start: "8:00",
        end: "10:00",
        say: ["Organize esta rotina antes de sair às 7h30.", "O material ainda não está pronto. O que muda?"],
        doSteps: ["Apresente cartões com uma rotina.", "Depois introduza o imprevisto."],
        materials: ["cartões de rotina"],
        observe: ["priorização", "sequência", "flexibilidade diante do imprevisto"],
        fields: [choiceField("prioriza", "Prioriza", ["sim", "não", "NA"]), choiceField("sequencia", "Sequência", ["coerente", "parcial", "NA"]), choiceField("flexibiliza", "Flexibiliza após imprevisto", ["sim", "não", "NA"])],
        interpretation: ["Planejamento e replanejamento são registrados como respostas à situação proposta; o produto não estima função executiva por norma."],
      },
    ],
  },
  {
    id: "12-17a",
    label: "12–17 anos",
    minMonths: 144,
    maxMonths: 215,
    icon: "✨",
    subtitle: "Narrativa, cognição social, atenção seletiva, memória operacional e planejamento executivo",
    materials: ["cenário de mensagem visualizada", "grade autoral de símbolos/letras", "listas de 3–5 palavras", "estímulos DIREITA/ESQUERDA", "cartões de tarefas para planejamento"],
    missions: [
      {
        id: "e-rotina",
        title: "Narrativa da rotina",
        start: "0:00",
        end: "1:00",
        say: ["Me conta como está sendo sua rotina ultimamente."],
        doSteps: ["Deixe o adolescente organizar o relato antes de fazer perguntas adicionais."],
        materials: ["nenhum"],
        observe: ["organização", "espontaneidade", "reciprocidade"],
        fields: [choiceField("organizacao", "Organização", ["boa", "parcial", "baixa", "NA"]), choiceField("espontaneidade", "Espontaneidade", ["boa", "baixa", "NA"]), choiceField("reciprocidade", "Reciprocidade", ["boa", "limitada", "NA"])],
        interpretation: ["Descreva a forma do relato e considere vínculo, ansiedade e disposição para falar como possíveis interferentes."],
      },
      {
        id: "e-social",
        title: "Cognição social + flexibilidade",
        start: "1:00",
        end: "2:30",
        say: ["Uma mensagem foi visualizada e não teve resposta. Que explicações existem?", "Qual seria a pior reação?", "Qual seria uma resposta mais adequada?"],
        doSteps: ["Apresente o cenário sem sugerir motivo para a falta de resposta."],
        materials: ["cenário de mensagem visualizada"],
        observe: ["número de hipóteses", "considera alternativas", "resposta impulsiva/rígida"],
        fields: [countField("hipoteses", "Hipóteses levantadas"), choiceField("alternativas", "Considera alternativas", ["sim", "não", "NA"]), choiceField("rigida", "Resposta impulsiva/rígida", ["sim", "não", "NA"])],
        interpretation: ["Gerar múltiplas hipóteses descreve flexibilidade de explicações nesta situação social; uma resposta rígida isolada não fecha diagnóstico."],
        childVisual: { title: "Mensagem visualizada · sem resposta", subtitle: "Pense em mais de uma explicação possível", items: ["📱", "✓✓", "…", "🤔"] },
      },
      {
        id: "e-atencao",
        title: "Atenção seletiva",
        start: "2:30",
        end: "4:00",
        say: ["Durante 60 segundos, marque apenas os alvos definidos."],
        doSteps: ["Apresente a grade autoral de símbolos/letras.", "Defina claramente o alvo antes de iniciar."],
        materials: ["grade autoral de símbolos/letras"],
        observe: ["alvos", "omissões", "comissões", "estratégia"],
        fields: [countField("alvos", "Alvos"), countField("omissoes", "Omissões"), countField("comissoes", "Comissões"), choiceField("estrategia", "Estratégia", ["organizada", "aleatória", "NA"])],
        interpretation: ["Omissões e comissões são descritas separadamente; estratégia organizada/aleatória é observacional e não normativa."],
        childVisual: { title: "Marque somente: ★A", subtitle: "60 segundos", items: ["★A", "B", "★A", "△", "C", "★A", "□", "D", "★A", "○", "E", "★A"] },
      },
      {
        id: "e-memoria",
        title: "Memória operacional verbal",
        start: "4:00",
        end: "5:30",
        say: ["Vou falar palavras. Repita em ordem inversa."],
        doSteps: ["Use sequências de 3 a 5 palavras.", "Pare após dificuldade consistente."],
        materials: ["listas de 3–5 palavras"],
        observe: ["desempenho em 3, 4 e 5 itens", "estratégia verbal espontânea"],
        fields: [countField("tres", "3 itens: corretos", 3), countField("quatro", "4 itens: corretos", 4), countField("cinco", "5 itens: corretos", 5), choiceField("estrategia", "Estratégia verbal espontânea", ["sim", "não", "NA"])],
        interpretation: ["Registre até onde a sequência foi manipulada nesta tarefa; não use o número como índice padronizado."],
      },
      {
        id: "e-inibicao",
        title: "Inibição",
        start: "5:30",
        end: "7:00",
        say: ["DIREITA → responda ESQUERDA. ESQUERDA → responda DIREITA."],
        doSteps: ["Aplique 12 itens rápidos.", "Não corrija cada resposta durante a sequência."],
        materials: ["estímulos DIREITA/ESQUERDA"],
        observe: ["acertos", "erros", "autocorreções", "impulsividade observável na tarefa"],
        fields: [countField("acertos", "Acertos", 12), countField("erros", "Erros", 12), countField("autocorrecoes", "Autocorreções"), choiceField("impulsividade", "Resposta impulsiva observável", ["sim", "não", "NA"])],
        interpretation: ["Resposta impulsiva observável é rótulo descritivo da forma de responder nesta tarefa; não equivale a diagnóstico de TDAH."],
        childVisual: { title: "Responda o lado contrário", items: ["DIREITA", "ESQUERDA", "DIREITA", "DIREITA", "ESQUERDA", "ESQUERDA"] },
      },
      {
        id: "e-troca",
        title: "Troca de regra",
        start: "7:00",
        end: "8:15",
        say: ["Agora DIREITA continua DIREITA e ESQUERDA continua ESQUERDA."],
        doSteps: ["Aplique 8 itens com a regra nova."],
        materials: ["estímulos DIREITA/ESQUERDA"],
        observe: ["acertos", "perseverações", "adaptação"],
        fields: [countField("acertos", "Acertos", 8), countField("perseveracoes", "Perseverações", 8), choiceField("adaptacao", "Adaptação", ["rápida", "gradual", "não ocorreu", "NA"])],
        interpretation: ["Perseveração descreve manutenção da regra oposta anterior; adaptação é registrada sem corte normativo."],
      },
      {
        id: "e-planejamento",
        title: "Planejamento executivo",
        start: "8:15",
        end: "10:00",
        say: ["Organize uma noite com prova, trabalho, banho, jantar e 30 minutos livres.", "Agora acrescente 1 hora ao trabalho. O que muda?"],
        doSteps: ["Apresente as demandas juntas.", "Depois introduza a mudança de duração do trabalho."],
        materials: ["cartões de tarefas para planejamento"],
        observe: ["priorização", "estimativa de tempo", "replanejamento"],
        fields: [choiceField("prioriza", "Prioriza", ["sim", "não", "NA"]), choiceField("estima", "Estima tempo", ["sim", "não", "NA"]), choiceField("replaneja", "Replaneja", ["sim", "parcial", "não", "NA"])],
        interpretation: ["O foco é se e como o adolescente reorganiza o plano quando a restrição muda; não há classificação normativa automática."],
      },
    ],
  },
];

function bandForMonths(months: number): BandDef | undefined {
  return BANDS.find((band) => months >= band.minMonths && months <= band.maxMonths);
}

function fieldValueText(field: FieldDef, value: FieldValue | undefined): string {
  if (value === undefined || value === "") return "não registrado";
  if (field.options?.includes(String(value)) && CODES.includes(String(value) as ResponseCode)) {
    return `${value} — ${CODE_LABELS[String(value) as ResponseCode]}`;
  }
  if (field.kind === "count" && field.max) return `${value}/${field.max}`;
  return String(value);
}

function explainValue(field: FieldDef, value: FieldValue | undefined): string {
  if (value === undefined || value === "") return "Ainda não há resposta registrada para interpretar.";
  if (CODES.includes(String(value) as ResponseCode)) return CODE_MEANINGS[String(value) as ResponseCode];
  const normalized = String(value).toLowerCase();
  if (normalized === "sim") return `Foi observado “${field.label}” nesta oportunidade. Registre o contexto e evite generalizar para outros ambientes.`;
  if (normalized === "não") return `“${field.label}” não foi observado nesta oportunidade; isso não prova ausência da habilidade fora desta tarefa.`;
  if (normalized === "na") return CODE_MEANINGS.NA;
  if (normalized.includes("intensa") || normalized.includes("não ocorreu")) return `A resposta “${value}” merece destaque ao médico e correlação com interferentes, sem insistir na tarefa se houver sofrimento.`;
  if (field.kind === "count") return `É uma medida bruta desta aplicação. Interprete junto ao modo de execução, interferentes e necessidade de mediação; não há ponto de corte automático.`;
  return `Registro descritivo desta aplicação: “${field.label}: ${value}”. O significado clínico depende da integração médica.`;
}

function buildAnalysis(band: BandDef, records: Record<string, MissionRecord>, interferences: Interference[], flags: RedFlag[]): string {
  const sentences: string[] = [];
  for (const mission of band.missions) {
    const record = records[mission.id];
    if (!record) continue;
    const parts = mission.fields
      .map((field) => {
        const value = record.values[field.id];
        if (value === undefined || value === "") return null;
        const valueText = fieldValueText(field, value);
        if (String(value) === "E") return `demonstrou ${field.label.toLowerCase()} espontaneamente`;
        if (String(value) === "I") return `demonstrou ${field.label.toLowerCase()} após instrução direta`;
        if (String(value) === "P") return `demonstrou ${field.label.toLowerCase()} apenas após pista/repetição, com necessidade de mediação adicional`;
        if (String(value) === "0") return `não demonstrou ${field.label.toLowerCase()} nesta oportunidade`;
        if (String(value) === "NA") return `${field.label.toLowerCase()} não foi avaliável`;
        return `${field.label.toLowerCase()} = ${valueText}`;
      })
      .filter(Boolean);
    if (parts.length) sentences.push(`Em ${mission.title.toLowerCase()}, ${parts.join("; ")}.`);
  }
  if (!sentences.length) sentences.push("Não houve registros suficientes para produzir síntese observacional.");
  const interferenceText = interferences.length ? interferences.join(", ") : "nenhum interferente marcado";
  sentences.push(`Interferentes registrados pela aplicadora: ${interferenceText}.`);
  if (flags.length) sentences.push(`Há alertas que exigem ciência do médico responsável: ${flags.join(", ")}.`);
  sentences.push("Os achados descrevem exclusivamente esta aplicação breve e devem ser integrados à história, exame e demais fontes pelo médico responsável.");
  return sentences.join(" ");
}

const BLOCKED_PATTERNS: RegExp[] = [
  /percentil/i,
  /escore\s*(total)?/i,
  /ponto\s+de\s+corte/i,
  /(abaixo|acima)\s+da\s+m[eé]dia/i,
  /(normal|anormal)\s+(para|pela)\s+idade/i,
  /confirma\s+(o\s+)?diagn[oó]stico/i,
  /diagn[oó]stico\s+de/i,
];

function auditAnalysis(text: string): string[] {
  return BLOCKED_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
}

function Seconds({ value }: { value: number }) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return <>{minutes}:{String(seconds).padStart(2, "0")}</>;
}

function FieldControl({ field, value, onChange }: { field: FieldDef; value: FieldValue | undefined; onChange: (value: FieldValue) => void }) {
  if (field.kind === "count") {
    const current = typeof value === "number" ? value : 0;
    return (
      <div className="rounded-2xl border border-border/70 bg-background p-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">{field.label}</p>
            {field.hint && <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>}
          </div>
          {field.max && <Badge variant="outline">máx. {field.max}</Badge>}
        </div>
        <div className="grid grid-cols-[52px_1fr_52px] items-center gap-2">
          <Button type="button" variant="outline" className="h-12 rounded-xl text-xl" onClick={() => onChange(Math.max(0, current - 1))}>−</Button>
          <div className="flex h-12 items-center justify-center rounded-xl bg-muted text-2xl font-black tabular-nums">{current}{field.max ? ` / ${field.max}` : ""}</div>
          <Button type="button" variant="outline" className="h-12 rounded-xl text-xl" onClick={() => onChange(field.max ? Math.min(field.max, current + 1) : current + 1)}>+</Button>
        </div>
      </div>
    );
  }

  if (field.kind === "text") {
    return (
      <label className="block rounded-2xl border border-border/70 bg-background p-3">
        <span className="text-sm font-bold">{field.label}</span>
        <Input className="mt-2 h-12" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background p-3">
      <p className="mb-3 text-sm font-bold text-foreground">{field.label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(field.options ?? []).map((option) => {
          const selected = String(value ?? "") === option;
          const code = CODES.includes(option as ResponseCode);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:bg-muted"}`}
            >
              <span>{option}</span>
              {code && <span className={`mt-0.5 block text-[11px] font-medium ${selected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{CODE_LABELS[option as ResponseCode]}</span>}
            </button>
          );
        })}
      </div>
      {value !== undefined && value !== "" && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
          <strong>O que esta reação pode significar:</strong> {explainValue(field, value)}
        </div>
      )}
    </div>
  );
}

export default function SondaDezPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [caseCode, setCaseCode] = useState("");
  const [years, setYears] = useState(3);
  const [months, setMonths] = useState(0);
  const [schoolYear, setSchoolYear] = useState("");
  const [interferences, setInterferences] = useState<Interference[]>(["nenhum"]);
  const [materialsChecked, setMaterialsChecked] = useState<Record<string, boolean>>({});
  const [missionIndex, setMissionIndex] = useState(0);
  const [records, setRecords] = useState<Record<string, MissionRecord>>({});
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [globalElapsed, setGlobalElapsed] = useState(0);
  const [missionElapsed, setMissionElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [childMode, setChildMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const totalMonths = years * 12 + months;
  const band = useMemo(() => bandForMonths(totalMonths), [totalMonths]);
  const mission = band?.missions[missionIndex];
  const allMaterialsReady = !!band && band.materials.every((item) => materialsChecked[item]);

  useEffect(() => {
    if (!running || phase !== "run") return;
    const timer = window.setInterval(() => {
      setGlobalElapsed((value) => Math.min(600, value + 1));
      setMissionElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, phase]);

  useEffect(() => {
    if (globalElapsed >= 600) setRunning(false);
  }, [globalElapsed]);

  const missionTargetSeconds = useMemo(() => {
    if (!mission) return 0;
    const toSeconds = (clock: string) => {
      const [m, s] = clock.split(":").map(Number);
      return m * 60 + s;
    };
    return Math.max(1, toSeconds(mission.end) - toSeconds(mission.start));
  }, [mission]);

  function toggleInterference(item: Interference) {
    setInterferences((current) => {
      if (item === "nenhum") return ["nenhum"];
      const clean = current.filter((value) => value !== "nenhum");
      return clean.includes(item) ? clean.filter((value) => value !== item) : [...clean, item];
    });
  }

  function toggleFlag(flag: RedFlag) {
    setRedFlags((current) => current.includes(flag) ? current.filter((value) => value !== flag) : [...current, flag]);
  }

  function setField(missionId: string, fieldId: string, value: FieldValue) {
    setRecords((current) => ({
      ...current,
      [missionId]: {
        values: { ...(current[missionId]?.values ?? {}), [fieldId]: value },
        notes: current[missionId]?.notes ?? "",
      },
    }));
  }

  function setNotes(missionId: string, notes: string) {
    setRecords((current) => ({
      ...current,
      [missionId]: { values: current[missionId]?.values ?? {}, notes },
    }));
  }

  function beginRun() {
    setPhase("run");
    setMissionIndex(0);
    setGlobalElapsed(0);
    setMissionElapsed(0);
    setRunning(true);
  }

  function goMission(index: number) {
    if (!band) return;
    setMissionIndex(Math.max(0, Math.min(band.missions.length - 1, index)));
    setMissionElapsed(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finish() {
    setRunning(false);
    setChildMode(false);
    setPhase("report");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetAll() {
    setPhase("setup");
    setCaseCode("");
    setSchoolYear("");
    setInterferences(["nenhum"]);
    setMaterialsChecked({});
    setMissionIndex(0);
    setRecords({});
    setRedFlags([]);
    setGlobalElapsed(0);
    setMissionElapsed(0);
    setRunning(false);
    setChildMode(false);
    setCopied(false);
  }

  const analysis = band ? buildAnalysis(band, records, interferences, redFlags) : "";
  const auditFindings = auditAnalysis(analysis);

  const reportText = band
    ? [
        `SONDA DEZ — AVALIAÇÃO DIRETA PRÉ-CONSULTA`,
        `Código/iniciais: ${caseCode || "não informado"}. Idade: ${years}a ${months}m. Série: ${schoolYear || "não informada"}. Faixa: ${band.label}.`,
        `Interferentes: ${interferences.join(", ")}.`,
        "",
        "REGISTRO COMPLETO",
        ...band.missions.flatMap((item, index) => {
          const record = records[item.id];
          return [
            `${index + 1}. ${item.title} (${item.start}–${item.end})`,
            `Fala/pergunta: ${item.say.join(" / ")}`,
            ...item.fields.map((field) => `• ${field.label}: ${fieldValueText(field, record?.values[field.id])}`),
            `• Observação livre: ${record?.notes?.trim() || "não registrada"}`,
          ];
        }),
        "",
        "ANÁLISE AUTOMÁTICA DESCRITIVA",
        analysis,
        "",
        `Alertas ao médico: ${redFlags.length ? redFlags.join(", ") : "nenhum marcado"}.`,
        "Prova observacional clínica piloto. Não gera diagnóstico, percentil ou escore total. Interpretação integrada pelo médico.",
      ].join("\n")
    : "";

  async function copyReport() {
    if (auditFindings.length) return;
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (childMode && mission?.childVisual) {
    return (
      <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-slate-950 text-white">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Tela da criança</p>
            <p className="text-sm text-white/65">Sem instruções clínicas na área central</p>
          </div>
          <Button variant="secondary" onClick={() => setChildMode(false)}>Voltar à aplicadora</Button>
        </div>
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-5 text-4xl">{band?.icon} ✨</div>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{mission.childVisual.title}</h1>
          {mission.childVisual.subtitle && <p className="mt-3 text-lg text-white/70">{mission.childVisual.subtitle}</p>}
          <div className="mt-10 grid w-full max-w-4xl grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {mission.childVisual.items.map((item, index) => (
              <div key={`${item}-${index}`} className="flex min-h-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 p-3 text-3xl font-black shadow-2xl sm:min-h-28 sm:text-4xl">{item}</div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-12">
      <section className="overflow-hidden rounded-[30px] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-amber-50/80 shadow-sm dark:to-amber-950/10">
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Sonda Dez</Badge>
              <Badge variant="outline">10 minutos</Badge>
              <Badge variant="outline">estado somente em memória</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Avaliação direta pré-consulta</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">Um roteiro guiado para a assistente: o app escolhe a faixa pela idade, prepara os materiais, mostra a fala exata, explica o que observar e registra pergunta por pergunta para revisão médica.</p>
          </div>
          <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
            {["🌱", "🚀", "🧭", "⭐"].map((icon) => <div key={icon} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-background/80 text-2xl shadow-sm">{icon}</div>)}
          </div>
        </div>
      </section>

      {phase === "setup" && (
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <Card className="rounded-[26px] border-primary/15">
            <CardContent className="space-y-5 p-5 sm:p-7">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10"><Baby className="h-5 w-5 text-primary" /></div><div><h2 className="text-xl font-black">1. Quem vai fazer a Sonda?</h2><p className="text-sm text-muted-foreground">Use somente iniciais ou código interno.</p></div></div>
              <label className="block"><span className="text-sm font-bold">Iniciais/código <span className="font-normal text-muted-foreground">(opcional)</span></span><Input className="mt-2 h-12 rounded-xl" value={caseCode} onChange={(event) => setCaseCode(event.target.value.slice(0, 24))} placeholder="Ex.: A.L. ou CASO-07" /></label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <label><span className="text-sm font-bold">Anos</span><Input type="number" min={0} max={17} className="mt-2 h-12 rounded-xl" value={years} onChange={(event) => setYears(Math.max(0, Math.min(17, Number(event.target.value))))} /></label>
                <label><span className="text-sm font-bold">Meses</span><Input type="number" min={0} max={11} className="mt-2 h-12 rounded-xl" value={months} onChange={(event) => setMonths(Math.max(0, Math.min(11, Number(event.target.value))))} /></label>
                <label className="col-span-2 sm:col-span-1"><span className="text-sm font-bold">Série/ano escolar</span><Input className="mt-2 h-12 rounded-xl" value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} placeholder="Ex.: 3º ano" /></label>
              </div>
              {band ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"><p className="text-xs font-bold uppercase tracking-wider">Trilha selecionada automaticamente</p><p className="mt-1 text-lg font-black">{band.icon} {band.label}</p><p className="mt-1 text-sm">{band.subtitle}</p></div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">A Sonda Dez desta versão é aplicável de 12 meses a 17 anos e 11 meses. Revise a idade informada.</div>
              )}
              <div><p className="text-sm font-bold">Interferentes observados antes de iniciar</p><div className="mt-3 grid grid-cols-2 gap-2">{INTERFERENCES.map((item) => <button key={item} type="button" onClick={() => toggleInterference(item)} className={`min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${interferences.includes(item) ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>{interferences.includes(item) && <Check className="mr-1 inline h-4 w-4" />}{item}</button>)}</div></div>
              <Button size="lg" className="h-13 w-full rounded-2xl" disabled={!band} onClick={() => { setMaterialsChecked({}); setPhase("materials"); }}>Ver materiais desta criança <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-amber-200/80 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/10">
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-700" /><h2 className="font-black">Guia rápido da aplicadora</h2></div>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p><strong className="text-foreground">DIGA</strong> exatamente o que aparece na tela. Não crie pistas extras.</p>
                <p><strong className="text-foreground">FAÇA</strong> o passo a passo na ordem. Só repita quando a missão autorizar.</p>
                <p><strong className="text-foreground">OBSERVE</strong> o comportamento, não tente adivinhar diagnóstico.</p>
                <p><strong className="text-foreground">REGISTRE</strong> o que aconteceu. Se não foi possível avaliar, use NA — nunca zero por conveniência.</p>
              </div>
              <div className="rounded-2xl bg-background p-4 text-xs leading-relaxed"><strong>Se houver sofrimento:</strong> não force. Interrompa a exigência, registre o interferente e use o alerta “não tolerou”.</div>
            </CardContent>
          </Card>
        </div>
      )}

      {phase === "materials" && band && (
        <Card className="rounded-[28px] border-primary/15">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/20"><PackageCheck className="h-6 w-6 text-cyan-700 dark:text-cyan-300" /></div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">2. Preparação</p><h2 className="text-2xl font-black">Separe apenas estes materiais</h2><p className="mt-1 text-sm text-muted-foreground">Faixa automática: {band.label}. Marque cada item quando estiver sobre a mesa.</p></div></div>
              <Badge variant="outline">{Object.values(materialsChecked).filter(Boolean).length}/{band.materials.length} prontos</Badge>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{band.materials.map((item) => { const checked = !!materialsChecked[item]; return <button key={item} type="button" onClick={() => setMaterialsChecked((current) => ({ ...current, [item]: !checked }))} className={`flex min-h-16 items-center gap-3 rounded-2xl border p-4 text-left transition ${checked ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-border bg-background hover:bg-muted/50"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{checked ? <Check className="h-5 w-5" /> : "○"}</span><span className="text-sm font-bold">{item}</span></button>; })}</div>
            <div className="mt-6 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm leading-relaxed"><strong>Antes de começar:</strong> deixe a mesa com poucos estímulos, posicione o tablet de modo que a aplicadora veja as instruções e preserve espaço para virar a “Tela da criança” quando a missão pedir.</div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><Button variant="outline" className="h-12 rounded-xl" onClick={() => setPhase("setup")}><ChevronLeft className="mr-1 h-4 w-4" /> Voltar</Button><Button className="h-12 rounded-xl" disabled={!allMaterialsReady} onClick={beginRun}><Timer className="mr-1 h-4 w-4" /> Iniciar 10 minutos</Button></div>
          </CardContent>
        </Card>
      )}

      {phase === "run" && band && mission && (
        <>
          <div className="sticky top-2 z-30 overflow-hidden rounded-2xl border border-primary/20 bg-background/95 p-3 shadow-lg backdrop-blur sm:p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Combustível da Sonda</p><p className="text-xl font-black tabular-nums"><Seconds value={600 - globalElapsed} /></p></div><div className="text-right"><p className="text-xs text-muted-foreground">Missão {missionIndex + 1}/{band.missions.length}</p><p className="text-sm font-bold">{mission.start}–{mission.end}</p></div></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-primary transition-all" style={{ width: `${Math.max(0, 100 - (globalElapsed / 600) * 100)}%` }} /></div>
          </div>

          {redFlags.length > 0 && <div className="flex flex-col gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">Alerta sinalizado: {redFlags.join(", ")}</p><p className="text-xs">Não force a tarefa. Se o cenário exigir interrupção, encerre e leve o registro ao médico.</p></div></div><Button variant="destructive" onClick={finish}>Encerrar e avisar médico</Button></div>}

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <main className="space-y-4">
              <Card className="rounded-[28px] border-primary/15">
                <CardContent className="p-5 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-2xl">{band.icon}</span><Badge variant="outline">{band.label}</Badge></div><h2 className="mt-2 text-2xl font-black tracking-tight">{mission.title}</h2></div><div className="rounded-2xl bg-muted px-4 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">tempo da missão</p><p className="text-lg font-black tabular-nums"><Seconds value={missionElapsed} /> <span className="text-xs font-medium text-muted-foreground">/ <Seconds value={missionTargetSeconds} /></span></p></div></div>
                </CardContent>
              </Card>

              <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-xl sm:p-7"><div className="flex items-center gap-2 text-cyan-300"><MessageCircle className="h-5 w-5" /><p className="text-xs font-black uppercase tracking-[0.2em]">Diga exatamente</p></div><div className="mt-4 space-y-3">{mission.say.map((line) => <p key={line} className="text-2xl font-black leading-tight sm:text-3xl">“{line}”</p>)}</div></section>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-[24px]"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Hand className="h-5 w-5 text-primary" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Faça</h3></div><ol className="space-y-3">{mission.doSteps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-relaxed"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-black text-primary">{index + 1}</span><span>{step}</span></li>)}</ol></CardContent></Card>
                <Card className="rounded-[24px]"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><PackageCheck className="h-5 w-5 text-primary" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Materiais agora</h3></div><div className="flex flex-wrap gap-2">{mission.materials.map((item) => <Badge key={item} variant="secondary" className="rounded-lg px-3 py-2">{item}</Badge>)}</div></CardContent></Card>
              </div>

              {mission.childVisual && <button type="button" onClick={() => setChildMode(true)} className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-cyan-200 bg-cyan-50 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md dark:border-cyan-900 dark:bg-cyan-950/20"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white"><MonitorSmartphone className="h-6 w-6" /></div><div><p className="font-black">Abrir Tela da criança</p><p className="text-sm text-muted-foreground">Mostra só o estímulo, sem o texto da aplicadora.</p></div></div><ChevronRight className="h-5 w-5" /></button>}

              <Card className="rounded-[24px] border-amber-200/80 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Eye className="h-5 w-5 text-amber-700 dark:text-amber-300" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Observe</h3></div><div className="grid gap-2 sm:grid-cols-2">{mission.observe.map((item) => <div key={item} className="flex gap-2 rounded-xl bg-background/80 p-3 text-sm"><span aria-hidden="true">👀</span><span>{item}</span></div>)}</div></CardContent></Card>

              <Card className="rounded-[26px] border-primary/20 bg-primary/[0.025]"><CardContent className="space-y-3 p-5 sm:p-6"><div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Registre</h3></div>{mission.fields.map((field) => <FieldControl key={field.id} field={field} value={records[mission.id]?.values[field.id]} onChange={(value) => setField(mission.id, field.id, value)} />)}<label className="block rounded-2xl border border-border/70 bg-background p-3"><span className="text-sm font-bold">Observação livre <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={records[mission.id]?.notes ?? ""} onChange={(event) => setNotes(mission.id, event.target.value)} placeholder="Descreva algo que não cabe nos botões, sem interpretar diagnóstico." /></label></CardContent></Card>

              <Card className="rounded-[24px] border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/10"><CardContent className="p-5"><div className="mb-3 flex items-center gap-2"><Brain className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /><h3 className="text-xs font-black uppercase tracking-[0.18em]">Como interpretar a reação?</h3></div><div className="space-y-2">{mission.interpretation.map((item) => <p key={item} className="text-sm leading-relaxed">{item}</p>)}</div><p className="mt-3 rounded-xl bg-background p-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Regra:</strong> a assistente descreve; o médico integra. Não transforme uma reação isolada em TEA, TDAH, atraso, deficiência ou qualquer diagnóstico.</p></CardContent></Card>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"><Button variant="outline" className="h-12 rounded-xl" disabled={missionIndex === 0} onClick={() => goMission(missionIndex - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Anterior</Button>{missionIndex + 1 < band.missions.length ? <Button className="h-12 rounded-xl" onClick={() => goMission(missionIndex + 1)}>Próxima missão <ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button className="h-12 rounded-xl" onClick={finish}><CheckCircle2 className="mr-1 h-4 w-4" /> Finalizar e revisar</Button>}</div>
            </main>

            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <Card className="rounded-[24px]"><CardContent className="p-5"><h3 className="font-black">Legenda sem jargão</h3><div className="mt-3 space-y-2">{CODES.map((code) => <div key={code} className="rounded-xl bg-muted/60 p-3"><div className="flex items-center gap-2"><Badge className="min-w-9 justify-center">{code}</Badge><span className="text-sm font-bold">{CODE_LABELS[code]}</span></div><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{CODE_MEANINGS[code]}</p></div>)}</div></CardContent></Card>
              <Card className="rounded-[24px] border-red-200/80 dark:border-red-900"><CardContent className="p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-600" /><h3 className="font-black">Alertas ao médico</h3></div><p className="mt-2 text-xs text-muted-foreground">Toque se surgir/for relatado durante a aplicação. Em sofrimento, pare a exigência.</p><div className="mt-3 space-y-2">{RED_FLAGS.map((flag) => <button key={flag} type="button" onClick={() => toggleFlag(flag)} className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold ${redFlags.includes(flag) ? "border-red-400 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200" : "border-border bg-background"}`}>{redFlags.includes(flag) ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full border" />}{flag}</button>)}</div></CardContent></Card>
            </aside>
          </div>
        </>
      )}

      {phase === "report" && band && (
        <div className="space-y-5">
          <Card className="rounded-[28px] border-primary/15"><CardContent className="p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Resultado da aplicação</p><h2 className="mt-1 text-2xl font-black">Registro completo + análise descritiva</h2><p className="mt-1 text-sm text-muted-foreground">{caseCode || "Sem código"} · {years}a {months}m · {band.label} · {schoolYear || "série não informada"}</p></div><Badge variant="outline">tempo registrado <Seconds value={globalElapsed} /></Badge></div></CardContent></Card>

          {redFlags.length > 0 && <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/20 dark:text-red-100"><strong>Prioridade de revisão médica:</strong> {redFlags.join(", ")}.</div>}

          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <div className="space-y-4">
              <Card className="rounded-[26px]"><CardContent className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h3 className="text-lg font-black">Registro completo</h3></div><div className="space-y-3">{band.missions.map((item, index) => { const record = records[item.id]; return <details key={item.id} className="group rounded-2xl border border-border/70 bg-background p-4" open={index === 0}><summary className="cursor-pointer list-none font-black">{index + 1}. {item.title} <span className="ml-2 text-xs font-medium text-muted-foreground">{item.start}–{item.end}</span></summary><div className="mt-4 space-y-3 text-sm"><div className="rounded-xl bg-slate-950 p-3 text-white"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Fala/pergunta aplicada</p><p className="mt-1 font-semibold">{item.say.join(" / ")}</p></div>{item.fields.map((field) => <div key={field.id} className="flex flex-col justify-between gap-1 rounded-xl bg-muted/50 p-3 sm:flex-row"><span className="font-semibold">{field.label}</span><span className="font-black text-primary">{fieldValueText(field, record?.values[field.id])}</span></div>)}<div className="rounded-xl border border-dashed p-3 text-muted-foreground"><strong className="text-foreground">Observação livre:</strong> {record?.notes?.trim() || "não registrada"}</div></div></details>; })}</div></CardContent></Card>

              <Card className="rounded-[26px] border-emerald-200 dark:border-emerald-900"><CardContent className="p-5 sm:p-6"><div className="flex items-center gap-2"><Brain className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /><h3 className="text-lg font-black">Análise automática descritiva</h3></div><p className="mt-4 text-sm leading-7 text-foreground">{analysis}</p></CardContent></Card>
            </div>

            <aside className="space-y-4">
              <Card className={`rounded-[26px] ${auditFindings.length ? "border-red-300" : "border-emerald-300"}`}><CardContent className="p-5"><div className="flex items-center gap-2">{auditFindings.length ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <ShieldCheck className="h-5 w-5 text-emerald-600" />}<h3 className="font-black">Portão de conferência</h3></div>{auditFindings.length ? <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-900 dark:bg-red-950/20 dark:text-red-100">Bloqueado: a análise contém expressão normativa/diagnóstica proibida. Revise antes de copiar.</div> : <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100"><strong>LIBERADO.</strong> A análise não contém termos de normatização ou salto diagnóstico previstos na trava.</div>}<div className="mt-3 space-y-2 text-xs text-muted-foreground"><p>✓ sem percentil ou classificação normativa na análise</p><p>✓ sem ponto de corte</p><p>✓ sem confirmação diagnóstica automática</p><p>✓ dados não registrados permanecem “não registrado”</p></div></CardContent></Card>
              <Card className="rounded-[26px] border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10"><CardContent className="p-5"><p className="text-sm font-black">Aviso obrigatório</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Prova observacional clínica piloto. Não gera diagnóstico, percentil ou escore total. Interpretação integrada pelo médico.</p></CardContent></Card>
              <Button size="lg" className="h-13 w-full rounded-2xl" disabled={auditFindings.length > 0} onClick={copyReport}>{copied ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}{copied ? "Copiado" : "Copiar resultado completo"}</Button>
              <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={resetAll}><RotateCcw className="mr-2 h-4 w-4" /> Nova aplicação</Button>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
