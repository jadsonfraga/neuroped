import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Printer,
  TrendingUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type AgeGroup = "5-6" | "7-8" | "9-10" | "11-12" | "13-14";
type Score = 0 | 1 | 2 | null;
type Answers = Record<string, Score>;

interface AgeGroupInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// ── Age group config ───────────────────────────────────────────────────────
const AGE_GROUPS: Record<AgeGroup, AgeGroupInfo> = {
  "5-6": {
    label: "5–6 anos",
    description: "Pré-escola / 1º ano",
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-800/40",
  },
  "7-8": {
    label: "7–8 anos",
    description: "2º–3º ano",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800/40",
  },
  "9-10": {
    label: "9–10 anos",
    description: "4º–5º ano",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    borderColor: "border-amber-200 dark:border-amber-800/40",
  },
  "11-12": {
    label: "11–12 anos",
    description: "6º–7º ano",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    borderColor: "border-emerald-200 dark:border-emerald-800/40",
  },
  "13-14": {
    label: "13–14 anos",
    description: "8º–9º ano",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-800/40",
  },
};

// ── Item definitions ───────────────────────────────────────────────────────
// Cada item da avaliação acadêmica carrega:
//  - hab: a habilidade/competência avaliada (frase-critério)
//  - mat: o MATERIAL CONCRETO a apresentar à criança (texto, palavras, contas)
//         OU a instrução de como aplicar/observar — para o examinador julgar
//         diretamente se a criança é capaz (✅ / 🔶 / ❌).
interface AcademicItem {
  hab: string;
  mat: string;
}

const LEITURA_ITEMS: Record<AgeGroup, AcademicItem[]> = {
  "5-6": [
    { hab: "Reconhece o próprio nome escrito", mat: "Escreva o nome da criança em letra de forma ao lado de outros 2 nomes e peça que aponte/leia o próprio nome." },
    { hab: "Identifica as vogais (A, E, I, O, U)", mat: "Mostre e pergunte o nome de cada uma:\nA   E   I   O   U" },
    { hab: "Lê sílabas simples (MA, PA, BO)", mat: "Peça que leia em voz alta:\nMA · PA · BO · LE · VI · TU · NA · FE" },
    { hab: "Identifica a letra inicial de palavras (B de bola)", mat: "Pergunte com que letra começa cada palavra:\nBOLA · CASA · DADO · GATO" },
    { hab: "Diferencia letras de números", mat: "Peça separar letras de números:\nA · 5 · M · 8 · P · 3 · R · 7" },
    { hab: "Reconhece palavras do cotidiano (PARE, SAÍDA)", mat: "Peça que leia as placas:\nPARE · SAÍDA · BANHEIRO · ABERTO" },
    { hab: "Segue o texto com o dedo ao ouvir leitura", mat: "Leia uma frase em voz alta e observe se a criança acompanha com o dedo, da esquerda para a direita." },
    { hab: "Reconta história ouvida com sequência lógica", mat: "Conte: «O cachorro viu um osso, pegou o osso e enterrou no quintal.» Peça que reconte na ordem certa." },
  ],
  "7-8": [
    { hab: "Lê palavras dissílabas (bola, gato)", mat: "Peça que leia:\nbola · gato · mesa · pato · dedo · sapo" },
    { hab: "Lê palavras trissílabas (banana, macaco)", mat: "Peça que leia:\nbanana · macaco · cabeça · janela · sapato" },
    { hab: "Lê frases curtas com compreensão (O gato bebe leite)", mat: "Peça que leia em voz alta:\nO gato bebe leite.\nA bola é azul.\nO pato nada no lago." },
    { hab: "Compreende o que leu — responde perguntas simples", mat: "Após ler «O gato bebe leite», pergunte: O que o gato faz? O que ele bebe?" },
    { hab: "Lê com fluência mínima (não soletra letra a letra)", mat: "Peça que leia: «A menina tem um cachorro pequeno.» Observe se lê por palavras, sem soletrar." },
    { hab: "Identifica singular e plural nas palavras lidas", mat: "Pergunte qual indica «mais de um»:\ngato / gatos · flor / flores · casa / casas" },
    { hab: "Reconhece pontuação básica (ponto, interrogação, exclamação)", mat: "Mostre e pergunte o que cada sinal indica:\nVocê viu?   Que legal!   Eu fui." },
    { hab: "Lê texto de 3 linhas sem perder a linha", mat: "Peça que leia em voz alta:\nO sol apareceu no céu azul.\nOs pássaros cantaram na árvore.\nAs crianças foram brincar no parque." },
  ],
  "9-10": [
    { hab: "Lê texto de 5+ linhas com fluência", mat: "Peça que leia em voz alta, observando a fluência:\nEra uma manhã de sábado e o céu estava bem azul.\nPedro acordou cedo e foi andar de bicicleta.\nNo caminho, encontrou o seu amigo João.\nOs dois resolveram brincar na praça perto de casa.\nQuando bateu a fome, voltaram correndo para o almoço." },
    { hab: "Identifica a ideia principal do texto", mat: "Sobre o texto acima, pergunte: «Do que fala a história?» (esperado: dois amigos que brincam num sábado de manhã)." },
    { hab: "Responde perguntas de inferência (o que não está explícito)", mat: "Sobre o texto acima: Por que eles voltaram correndo? Em que período do dia a história acontece?" },
    { hab: "Lê palavras irregulares corretamente (hoje, homem, aquele)", mat: "Peça que leia:\nhoje · homem · aquele · muito · também · exceção" },
    { hab: "Lê em voz alta com entonação adequada", mat: "Peça que leia respeitando a pontuação:\nQue dia lindo! Vamos passear? Não esqueça o casaco." },
    { hab: "Identifica personagens e cenário da história", mat: "Sobre o texto acima: Quem são os personagens? Onde a história acontece?" },
    { hab: "Diferencia fato de opinião no texto", mat: "Peça classificar cada frase:\n«O céu estava azul» (fato) · «Sábado é o melhor dia» (opinião)" },
    { hab: "Resume com suas palavras o que leu", mat: "Peça que conte o texto acima em 1–2 frases, com as próprias palavras." },
  ],
  "11-12": [
    { hab: "Lê texto informativo com compreensão plena", mat: "Peça que leia e explique:\nA água é essencial para a vida. Ela cobre a maior parte do planeta,\nmas só uma pequena parte é doce e própria para beber. Por isso,\nevitar o desperdício de água é importante para todos." },
    { hab: "Interpreta gráficos e tabelas simples", mat: "Mostre uma tabela: Seg 10 · Ter 8 · Qua 15 livros lidos. Pergunte: Em que dia leram mais? Quantos a mais que na terça?" },
    { hab: "Identifica recursos de linguagem (ex.: metáfora)", mat: "Pergunte o sentido de:\n«Ele é um leão na hora de competir.»" },
    { hab: "Compara informações de fontes diferentes", mat: "Texto A: «choveu o dia todo». Texto B: «o sol apareceu à tarde». Pergunte o que há de diferente entre os dois." },
    { hab: "Faz inferências complexas além do texto", mat: "«João pegou o guarda-chuva antes de sair.» Pergunte: como estava o tempo? Como você sabe?" },
    { hab: "Identifica argumento e contra-argumento em textos", mat: "«Devemos usar menos o celular (argumento), mas ele ajuda a estudar (contra-argumento).» Peça que aponte cada um." },
    { hab: "Reconhece e usa vocabulário técnico da área", mat: "Pergunte o significado de termos escolares: «fração», «sinônimo», «ecossistema»." },
    { hab: "Resume texto longo de forma coerente", mat: "Após o texto informativo acima, peça um resumo de 2 frases mantendo a ideia central." },
  ],
  "13-14": [
    { hab: "Lê texto argumentativo/jornalístico com compreensão", mat: "Peça que leia e diga a tese:\nA leitura diária amplia o vocabulário e a capacidade de concentração.\nQuem lê com frequência compreende melhor o que estuda e se expressa\ncom mais clareza. Ler, portanto, deveria ser um hábito de todos." },
    { hab: "Identifica ironia e ambiguidade no texto", mat: "Pergunte o sentido real de:\n«Que ótimo, mais lição de casa para o fim de semana...»" },
    { hab: "Analisa criticamente o conteúdo lido", mat: "Sobre o texto acima: você concorda com a tese? Que outro argumento daria a favor ou contra?" },
    { hab: "Sintetiza informações de múltiplas fontes", mat: "Dê 2 manchetes sobre o mesmo tema e peça uma frase que una as duas informações." },
    { hab: "Identifica o viés ou ponto de vista do autor", mat: "Sobre o texto acima: o autor é a favor ou contra a leitura? Que palavras mostram isso?" },
    { hab: "Compreende e usa vocabulário abstrato", mat: "Peça que explique com exemplo: «liberdade», «justiça», «responsabilidade»." },
    { hab: "Interpreta texto literário com linguagem figurada", mat: "Pergunte o sentido de:\n«O tempo voou e a infância ficou para trás.»" },
    { hab: "Produz resumo escrito do texto com qualidade", mat: "Após o texto acima, peça um resumo escrito de 3–4 linhas, com início, meio e fim." },
  ],
};

const ESCRITA_ITEMS: Record<AgeGroup, AcademicItem[]> = {
  "5-6": [
    { hab: "Escreve o primeiro nome sem modelo", mat: "Peça que escreva o próprio nome numa folha em branco, sem copiar de nenhum modelo." },
    { hab: "Copia letras de modelo com legibilidade", mat: "Mostre e peça que copie:\nA   M   S   O   E" },
    { hab: "Escreve as vogais por ditado", mat: "Dite, uma a uma (sem mostrar): A · E · I · O · U" },
    { hab: "Traça formas geométricas básicas (círculo, quadrado, cruz)", mat: "Peça que desenhe, copiando o modelo:  ○   □   +" },
    { hab: "Segura o lápis corretamente (preensão trípode)", mat: "Observe a preensão do lápis durante as tarefas de escrita acima (pinça com 3 dedos)." },
    { hab: "Escreve 5 letras por ditado corretamente", mat: "Dite (sem mostrar): P · L · T · M · B" },
    { hab: "Separa palavras com espaço ao escrever", mat: "Dite a frase e observe os espaços: «o gato bebe leite»." },
    { hab: "Copia palavra curta do quadro/cartão", mat: "Mostre num cartão e peça que copie: CASA" },
  ],
  "7-8": [
    { hab: "Escreve o nome completo", mat: "Peça que escreva o nome e o sobrenome completos, sem modelo." },
    { hab: "Escreve palavras simples por ditado (bola, pato)", mat: "Dite (sem mostrar):\nbola · pato · dado · fila · sapo" },
    { hab: "Diferencia e usa maiúscula/minúscula corretamente", mat: "Dite e observe o uso de maiúscula: «Maria mora em Recife.»" },
    { hab: "Escreve frase curta por ditado", mat: "Dite a frase completa: «O cachorro corre no parque.»" },
    { hab: "Usa ponto final ao terminar a frase", mat: "Após o ditado acima, verifique se a criança colocou o ponto final." },
    { hab: "Copia texto curto sem erros graves", mat: "Peça que copie:\n«Hoje o dia está bonito. Vamos brincar lá fora.»" },
    { hab: "Escreve bilhete simples espontaneamente", mat: "Peça que escreva um bilhete curto avisando a mãe que foi à casa do amigo." },
    { hab: "Segmenta sílabas ao escrever (pa-to, bo-la)", mat: "Dite devagar, por sílabas, e observe a segmentação: «ca-va-lo», «bo-ne-ca»." },
  ],
  "9-10": [
    { hab: "Escreve texto narrativo de 5 frases com início, meio e fim", mat: "Tema: «Um dia na praia». Peça que escreva 5 frases com começo, meio e fim." },
    { hab: "Usa vírgula e ponto adequadamente", mat: "Dite: «Comprei pão, leite e ovos. Depois voltei para casa.» Verifique vírgulas e pontos." },
    { hab: "Escreve palavras com dígrafos (ch, nh, lh) corretamente", mat: "Dite (sem mostrar):\nchave · ninho · palha · chuva · banho · folha" },
    { hab: "Ortografia adequada em palavras de escrita regular", mat: "Dite:\ncavalo · janela · sapato · pipoca · tomate" },
    { hab: "Produz texto com coerência e progressão temática", mat: "Tema: «Meu animal preferido». Verifique se as frases se conectam e seguem o tema." },
    { hab: "Organiza o texto em parágrafos", mat: "Após escrever o texto acima, verifique se há divisão em parágrafos." },
    { hab: "Acerta ≥70% em ditado de 10 palavras", mat: "Dite as 10 palavras:\nbola · escola · amigo · cachorro · janela · livro · pássaro · feliz · trabalho · cidade" },
    { hab: "Relê e revisa o próprio texto", mat: "Peça que releia o texto que escreveu e corrija o que achar errado. Observe se identifica erros." },
  ],
  "11-12": [
    { hab: "Produz texto dissertativo com tema definido", mat: "Tema: «A importância de ler livros». Peça um texto curto defendendo um ponto de vista." },
    { hab: "Usa concordância verbal e nominal corretamente", mat: "Dite: «As crianças brincaram felizes no parque.» Verifique concordância (plural)." },
    { hab: "Aplica acentuação gráfica corretamente", mat: "Dite:\ncafé · história · médico · sofá · lâmpada · você" },
    { hab: "Organiza texto em introdução, desenvolvimento e conclusão", mat: "No texto dissertativo acima, verifique se há introdução, desenvolvimento e conclusão." },
    { hab: "Usa conectivos adequados (porém, entretanto, portanto)", mat: "Peça que complete: «Estudei muito, ____ fui bem na prova.» (esperado: por isso/portanto)." },
    { hab: "Escreve em registro formal quando solicitado", mat: "Peça que escreva um pedido formal ao diretor da escola solicitando uma quadra nova." },
    { hab: "Produz 10+ linhas com coerência e coesão", mat: "Tema livre: peça um texto de pelo menos 10 linhas. Verifique se mantém o assunto e a ligação entre as ideias." },
    { hab: "Identifica e corrige erros no próprio texto", mat: "Peça que releia e revise o texto, marcando e corrigindo erros de ortografia/pontuação." },
  ],
  "13-14": [
    { hab: "Produz texto dissertativo-argumentativo", mat: "Tema: «As redes sociais fazem mais bem ou mal aos jovens?» Peça um texto com tese e argumentos." },
    { hab: "Apresenta tese e argumentos articulados", mat: "No texto acima, verifique se há uma tese clara apoiada por pelo menos 2 argumentos." },
    { hab: "Mantém coesão textual ao longo do texto", mat: "Verifique o uso de conectivos e a ligação entre parágrafos no texto produzido." },
    { hab: "Domina crase e acentuação com consistência", mat: "Dite: «Fui à feira às oito horas e à tarde estudei história.» Verifique crase e acentos." },
    { hab: "Mantém registro formal consistente", mat: "Verifique se o texto evita gírias/abreviações e mantém linguagem formal do início ao fim." },
    { hab: "Faz revisão crítica e reescrita do texto", mat: "Peça que releia o próprio texto e reescreva ao menos um trecho para melhorá-lo." },
    { hab: "Produz resumo acadêmico de texto científico", mat: "Dê um parágrafo informativo e peça um resumo objetivo em 2–3 frases, sem opinião pessoal." },
    { hab: "Escreve 20+ linhas organizadas e coesas", mat: "Tema dissertativo: peça um texto de 20+ linhas, organizado em parágrafos coesos." },
  ],
};

const ARITMETICA_ITEMS: Record<AgeGroup, AcademicItem[]> = {
  "5-6": [
    { hab: "Conta até 20 em sequência sem erros", mat: "Peça que conte em voz alta de 1 até 20." },
    { hab: "Reconhece numerais de 1 a 20", mat: "Aponte fora de ordem e pergunte o nome:\n3 · 7 · 12 · 15 · 9 · 20" },
    { hab: "Correspondência número-quantidade até 10", mat: "Mostre 7 objetos (ou ●●●●●●●) e pergunte «quantos são?»." },
    { hab: "Compara quantidades (mais/menos, maior/menor)", mat: "Mostre dois grupos: ●●● e ●●●●●. Pergunte qual tem mais." },
    { hab: "Classifica por tamanho (grande, médio, pequeno)", mat: "Apresente 3 objetos de tamanhos diferentes e peça que ordene do menor ao maior." },
    { hab: "Completa sequência numérica (o que vem depois do 5?)", mat: "Pergunte:\n1, 2, 3, 4, 5, ___   ·   8, 9, ___" },
    { hab: "Realiza adição simples com dedos até 5", mat: "Pergunte (pode usar os dedos):\n2 + 1 = ?   ·   3 + 2 = ?" },
    { hab: "Reconhece formas geométricas básicas (círculo, quadrado, triângulo)", mat: "Mostre e pergunte o nome:  ○   □   △" },
  ],
  "7-8": [
    { hab: "Conta até 100 em sequência", mat: "Peça que conte de 10 em 10 até 100: 10, 20, 30..." },
    { hab: "Realiza adição simples até 20", mat: "Peça que resolva:\n8 + 7 = ?   ·   14 + 5 = ?   ·   9 + 9 = ?" },
    { hab: "Realiza subtração simples até 20", mat: "Peça que resolva:\n15 − 6 = ?   ·   20 − 8 = ?   ·   13 − 5 = ?" },
    { hab: "Resolve problemas orais simples de 1 etapa", mat: "«Ana tinha 8 figurinhas e ganhou 5. Com quantas ficou?»" },
    { hab: "Reconhece dezenas e unidades (23 = 2 dezenas e 3 unidades)", mat: "Pergunte quantas dezenas e unidades há em:\n23 · 47 · 60" },
    { hab: "Completa sequência numérica até 100", mat: "Complete:\n45, 46, 47, ___   ·   30, 40, 50, ___" },
    { hab: "Mede objetos com régua em centímetros", mat: "Dê uma régua e peça que meça o comprimento de um lápis em cm." },
    { hab: "Identifica horas cheias no relógio analógico", mat: "Mostre um relógio marcando 3:00 e pergunte que horas são." },
  ],
  "9-10": [
    { hab: "Domina a tabuada de 2, 3, 4 e 5", mat: "Pergunte:\n3 × 4 = ?   ·   5 × 6 = ?   ·   2 × 8 = ?   ·   4 × 7 = ?" },
    { hab: "Realiza divisão simples com exatidão", mat: "Peça que resolva:\n12 ÷ 3 = ?   ·   20 ÷ 4 = ?   ·   18 ÷ 6 = ?" },
    { hab: "Resolve problemas com 2 operações", mat: "«Comprei 3 pacotes com 6 balas cada e comi 4. Quantas sobraram?»" },
    { hab: "Opera com números até 1000", mat: "Peça que resolva:\n345 + 278 = ?   ·   600 − 245 = ?" },
    { hab: "Compreende frações simples (metade, terço, quarto)", mat: "Pergunte: quanto é a metade de 8? E 1/4 de 12?" },
    { hab: "Usa medidas de comprimento, peso e capacidade", mat: "Pergunte: quantos centímetros há em 1 metro? Quantos gramas em 1 quilo?" },
    { hab: "Lê horas e minutos no relógio", mat: "Mostre um relógio marcando 3:45 e pergunte que horas são." },
    { hab: "Calcula perímetro de figuras simples", mat: "«Um quadrado tem lados de 5 cm. Qual é o perímetro (soma dos lados)?»" },
  ],
  "11-12": [
    { hab: "Opera com frações (soma, subtração, multiplicação)", mat: "Peça que resolva:\n1/2 + 1/4 = ?   ·   3/5 − 1/5 = ?   ·   1/2 × 1/3 = ?" },
    { hab: "Opera com números decimais", mat: "Peça que resolva:\n2,5 + 1,75 = ?   ·   10 − 3,4 = ?   ·   1,2 × 3 = ?" },
    { hab: "Calcula porcentagem simples (10%, 25%, 50%)", mat: "Pergunte:\n10% de 200 = ?   ·   25% de 80 = ?   ·   50% de 50 = ?" },
    { hab: "Resolve problemas com múltiplas etapas", mat: "«Um caderno custa R$ 8 e uma caneta R$ 3. Comprei 2 cadernos e 4 canetas. Quanto gastei?»" },
    { hab: "Interpreta gráfico de barras e tabelas", mat: "Tabela de vendas: Seg 20 · Ter 35 · Qua 15. Pergunte: qual o total? E o dia de maior venda?" },
    { hab: "Calcula área de retângulo e quadrado", mat: "«Um retângulo tem 6 cm de base e 4 cm de altura. Qual é a área (base × altura)?»" },
    { hab: "Calcula média aritmética de um conjunto", mat: "«As notas foram 6, 8 e 10. Qual é a média?»" },
    { hab: "Opera com números negativos", mat: "Peça que resolva:\n−5 + 8 = ?   ·   3 − 7 = ?   ·   −2 − 4 = ?" },
  ],
  "13-14": [
    { hab: "Resolve equação de 1º grau", mat: "Peça que resolva:\n2x + 3 = 11   ·   5x − 10 = 0" },
    { hab: "Aplica proporcionalidade e regra de três", mat: "«Se 3 cadernos custam R$ 12, quanto custam 5 cadernos?»" },
    { hab: "Calcula área e perímetro de figuras variadas", mat: "«Um triângulo tem base 8 cm e altura 5 cm. Qual a área? (base × altura ÷ 2)»" },
    { hab: "Interpreta gráficos de setores e linhas", mat: "Descreva um gráfico de pizza (50% futebol, 30% vôlei, 20% natação) e pergunte qual esporte é o preferido." },
    { hab: "Realiza potenciação e radiciação básica", mat: "Pergunte:\n2³ = ?   ·   5² = ?   ·   √49 = ?   ·   √81 = ?" },
    { hab: "Resolve expressões numéricas com parênteses", mat: "Peça que resolva:\n(8 + 2) × 3 = ?   ·   20 − (4 × 3) = ?" },
    { hab: "Calcula probabilidade simples", mat: "«Num dado de 6 faces, qual a probabilidade de sair o número 4?»" },
    { hab: "Resolve problemas com porcentagem composta", mat: "«Um produto de R$ 100 teve 10% de desconto e depois mais 10%. Qual o preço final?»" },
  ],
};

// ── Scoring helpers ────────────────────────────────────────────────────────
function getClassification(pct: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
} {
  if (pct >= 80)
    return {
      label: "Adequado",
      color: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
      borderColor: "border-emerald-300 dark:border-emerald-700/40",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      description:
        "Desempenho dentro do esperado para a faixa etária. Habilidades acadêmicas preservadas.",
    };
  if (pct >= 60)
    return {
      label: "Em desenvolvimento",
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-300 dark:border-amber-700/40",
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      description:
        "Desempenho em desenvolvimento. Acompanhamento pedagógico recomendado.",
    };
  if (pct >= 40)
    return {
      label: "Abaixo do esperado",
      color: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-orange-300 dark:border-orange-700/40",
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      description:
        "Desempenho abaixo do esperado — investigação e suporte especializado recomendados.",
    };
  return {
    label: "Significativamente abaixo",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-300 dark:border-red-700/40",
    icon: <XCircle className="w-5 h-5 text-red-600" />,
    description:
      "Desempenho significativamente abaixo do esperado — encaminhamento para avaliação especializada indicado.",
  };
}

function getDomainClassification(score: number): string {
  const pct = (score / 16) * 100;
  if (pct >= 80) return "Adequado";
  if (pct >= 60) return "Em desenvolvimento";
  if (pct >= 40) return "Abaixo do esperado";
  return "Significativamente abaixo";
}

// ── Score button ───────────────────────────────────────────────────────────
interface _ScoreButtonProps {
  value: Score;
  selected: boolean;
  onClick: () => void;
}

const SCORE_OPTIONS: {
  value: Score;
  label: string;
  short: string;
  color: string;
  selectedColor: string;
  icon: string;
}[] = [
  {
    value: 2,
    label: "Correto",
    short: "Correto",
    color: "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    selectedColor:
      "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700",
    icon: "✅",
  },
  {
    value: 1,
    label: "Parcial",
    short: "Parcial",
    color:
      "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30",
    selectedColor: "bg-amber-500 border-amber-500 text-white hover:bg-amber-600",
    icon: "🔶",
  },
  {
    value: 0,
    label: "Incorreto",
    short: "Incorreto",
    color:
      "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30",
    selectedColor: "bg-red-600 border-red-600 text-white hover:bg-red-700",
    icon: "❌",
  },
];

function ScoreButtons({
  currentValue,
  onChange,
  itemKey,
}: {
  currentValue: Score;
  onChange: (v: Score) => void;
  itemKey: string;
}) {
  return (
    <div className="flex gap-1.5">
      {SCORE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(currentValue === opt.value ? null : opt.value)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            currentValue === opt.value ? opt.selectedColor : opt.color
          }`}
          data-testid={`score-${itemKey}-${opt.value}`}
        >
          <span className="text-sm leading-none">{opt.icon}</span>
          <span className="hidden sm:inline">{opt.short}</span>
        </button>
      ))}
    </div>
  );
}

// ── Domain tab content ─────────────────────────────────────────────────────
function DomainTab({
  domain,
  items,
  answers,
  onChange,
  domainKey,
  emoji,
}: {
  domain: string;
  items: AcademicItem[];
  answers: Answers;
  onChange: (key: string, value: Score) => void;
  domainKey: string;
  emoji: string;
}) {
  const domainScore = items.reduce(
    (acc, _, idx) => acc + (answers[`${domainKey}-${idx}`] ?? 0),
    0
  );
  const answered = items.filter(
    (_, idx) => answers[`${domainKey}-${idx}`] !== null && answers[`${domainKey}-${idx}`] !== undefined
  ).length;
  const pct = (domainScore / 16) * 100;

  return (
    <div className="space-y-4">
      {/* Domain summary bar */}
      <div className="rounded-xl border border-card-border bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-semibold text-foreground">{domain}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {answered}/{items.length} respondidos
            </Badge>
            <Badge
              className={`text-xs font-bold ${
                pct >= 80
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : pct >= 60
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  : pct >= 40
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400"
                  : answered > 0
                  ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {domainScore}/16
            </Badge>
          </div>
        </div>
        <Progress value={answered > 0 ? pct : 0} className="h-2" />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const key = `${domainKey}-${idx}`;
          const val = answers[key] ?? null;
          const isAnswered = val !== null;

          return (
            <Card
              key={key}
              className={`border transition-all ${
                val === 2
                  ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/10"
                  : val === 1
                  ? "border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/10"
                  : val === 0
                  ? "border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-950/10"
                  : "border-card-border"
              }`}
            >
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isAnswered
                          ? val === 2
                            ? "bg-emerald-600 text-white"
                            : val === 1
                            ? "bg-amber-500 text-white"
                            : "bg-red-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground leading-relaxed">{item.hab}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <ScoreButtons
                      currentValue={val}
                      onChange={(v) => onChange(key, v)}
                      itemKey={key}
                    />
                  </div>
                </div>
                {/* Material concreto a apresentar à criança (enunciado aplicável) */}
                <div className="ml-8 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">
                    Aplicar / mostrar à criança
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{item.mat}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function TestesAcademicosPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [activeTab, setActiveTab] = useState("leitura");

  // ── Computed scores ──
  const leituraItems = useMemo(() => (ageGroup ? LEITURA_ITEMS[ageGroup] : []), [ageGroup]);
  const escritaItems = useMemo(() => (ageGroup ? ESCRITA_ITEMS[ageGroup] : []), [ageGroup]);
  const aritmeticaItems = useMemo(() => (ageGroup ? ARITMETICA_ITEMS[ageGroup] : []), [ageGroup]);

  const leituraScore = leituraItems.reduce(
    (acc, _, i) => acc + (answers[`leitura-${i}`] ?? 0),
    0
  );
  const escritaScore = escritaItems.reduce(
    (acc, _, i) => acc + (answers[`escrita-${i}`] ?? 0),
    0
  );
  const aritmeticaScore = aritmeticaItems.reduce(
    (acc, _, i) => acc + (answers[`aritmetica-${i}`] ?? 0),
    0
  );

  const totalScore = leituraScore + escritaScore + aritmeticaScore;
  const maxScore = 48;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const classification = getClassification(percentage);

  const totalAnswered = useMemo(() => {
    return Object.values(answers).filter((v) => v !== null).length;
  }, [answers]);

  const _allAnswered = totalAnswered === 24;

  // ── Clinical report items ──
  const reportItems = useMemo(() => {
    if (!ageGroup) return [];
    const items: { question: string; answer: string; value: number }[] = [];

    leituraItems.forEach((item, i) => {
      const v = answers[`leitura-${i}`] ?? 0;
      items.push({
        question: `[📖 Leitura] ${item.hab}`,
        answer: v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto",
        value: v,
      });
    });
    escritaItems.forEach((item, i) => {
      const v = answers[`escrita-${i}`] ?? 0;
      items.push({
        question: `[✏️ Escrita] ${item.hab}`,
        answer: v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto",
        value: v,
      });
    });
    aritmeticaItems.forEach((item, i) => {
      const v = answers[`aritmetica-${i}`] ?? 0;
      items.push({
        question: `[🔢 Aritmética] ${item.hab}`,
        answer: v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto",
        value: v,
      });
    });

    return items;
  }, [answers, ageGroup, leituraItems, escritaItems, aritmeticaItems]);

  const domainResults = [
    { domain: "📖 Leitura", score: leituraScore, classification: getDomainClassification(leituraScore) },
    { domain: "✏️ Escrita", score: escritaScore, classification: getDomainClassification(escritaScore) },
    { domain: "🔢 Aritmética", score: aritmeticaScore, classification: getDomainClassification(aritmeticaScore) },
  ];

  function handleAnswer(key: string, value: Score) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setStep(1);
    setChildName("");
    setChildAge("");
    setAgeGroup(null);
    setAnswers({});
    setActiveTab("leitura");
  }

  function handlePrint() {
    if (!ageGroup) return;
    const ageInfo = AGE_GROUPS[ageGroup];
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const rowStyle =
      "padding:5px 10px;border-bottom:1px solid #eee;font-size:9pt;";
    const domainHeader = (emoji: string, name: string, score: number, pct: number) =>
      `<tr style="background:#f3f0ff;"><td colspan="4" style="padding:8px 10px;font-weight:bold;font-size:10pt;color:#6d28d9;">${emoji} ${name} — ${score}/16 pts (${Math.round(pct)}%)</td></tr>`;

    const itemRows = (items: AcademicItem[], domainKey: string, _emoji: string) =>
      items
        .map((item, i) => {
          const v = answers[`${domainKey}-${i}`] ?? 0;
          const ans = v === 2 ? "✅ Correto" : v === 1 ? "🔶 Parcial" : "❌ Incorreto";
          const bg = v === 2 ? "#f0fdf4" : v === 1 ? "#fffbeb" : "#fff1f2";
          return `<tr style="background:${bg};"><td style="${rowStyle}">${i + 1}</td><td style="${rowStyle}">${item.hab}</td><td style="${rowStyle}">${ans}</td><td style="${rowStyle}">${v}</td></tr>`;
        })
        .join("");

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Testes Acadêmicos — ${childName} — ${dateStr}</title>
  <style>
    @page { margin: 1.8cm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1a1a1a; }
    .header { border-bottom: 3px solid #6d28d9; padding-bottom: 14px; margin-bottom: 18px; }
    .header h1 { font-size: 15pt; color: #6d28d9; }
    .header .sub { font-size: 10pt; color: #555; margin-top: 3px; }
    .result-box { display:flex; gap:20px; background:#f3f0ff; border-left:4px solid #6d28d9; padding:12px 16px; border-radius:4px; margin-bottom:16px; }
    .result-box .score { font-size: 22pt; font-weight: bold; color: #6d28d9; }
    .result-box .label { font-size: 9pt; color: #555; }
    .result-box .classif { font-size: 12pt; font-weight: bold; }
    .domains { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:18px; }
    .domain-card { background:#faf9ff; border:1px solid #e5e7eb; border-radius:4px; padding:8px 12px; text-align:center; }
    .domain-card .emoji { font-size:16pt; }
    .domain-card .name { font-weight:bold; font-size:9pt; margin-top:2px; }
    .domain-card .pts { font-size:11pt; font-weight:bold; color:#6d28d9; }
    .domain-card .classif { font-size:8pt; color:#555; }
    h2 { font-size:11pt; color:#6d28d9; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; margin-bottom:10px; margin-top:18px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#6d28d9; color:#fff; padding:6px 10px; text-align:left; font-size:9pt; }
    .footer { margin-top:24px; border-top:2px solid #6d28d9; padding-top:10px; font-size:9pt; color:#555; text-align:center; }
    .footer strong { font-size:10pt; color:#1a1a1a; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎓 NeuroPed — Testes Acadêmicos por Faixa Etária</h1>
    <div class="sub">Leitura · Escrita · Aritmética | Paciente: <strong>${childName || "—"}</strong>${childAge ? ` | Idade: ${childAge} anos` : ""} | Faixa: <strong>${ageInfo.label} (${ageInfo.description})</strong></div>
    <div class="sub" style="margin-top:4px;color:#888;">Data: ${dateStr}</div>
  </div>

  <div class="result-box">
    <div>
      <div class="score">${totalScore}<span style="font-size:13pt;color:#555">/${maxScore}</span></div>
      <div class="label">Pontuação total</div>
    </div>
    <div style="border-left:1px solid #c4b5fd;padding-left:20px;">
      <div class="score" style="font-size:18pt;">${percentage}%</div>
      <div class="label">do máximo</div>
    </div>
    <div style="border-left:1px solid #c4b5fd;padding-left:20px;display:flex;align-items:center;">
      <div class="classif">${classification.label}</div>
    </div>
  </div>

  <div class="domains">
    <div class="domain-card"><div class="emoji">📖</div><div class="name">Leitura</div><div class="pts">${leituraScore}/16</div><div class="classif">${getDomainClassification(leituraScore)}</div></div>
    <div class="domain-card"><div class="emoji">✏️</div><div class="name">Escrita</div><div class="pts">${escritaScore}/16</div><div class="classif">${getDomainClassification(escritaScore)}</div></div>
    <div class="domain-card"><div class="emoji">🔢</div><div class="name">Aritmética</div><div class="pts">${aritmeticaScore}/16</div><div class="classif">${getDomainClassification(aritmeticaScore)}</div></div>
  </div>

  <h2>Detalhamento dos Itens Avaliados</h2>
  <table>
    <thead><tr><th>#</th><th>Item</th><th>Resposta</th><th>Pts</th></tr></thead>
    <tbody>
      ${domainHeader("📖", "Leitura", leituraScore, (leituraScore / 16) * 100)}
      ${itemRows(leituraItems, "leitura", "📖")}
      ${domainHeader("✏️", "Escrita", escritaScore, (escritaScore / 16) * 100)}
      ${itemRows(escritaItems, "escrita", "✏️")}
      ${domainHeader("🔢", "Aritmética", aritmeticaScore, (aritmeticaScore / 16) * 100)}
      ${itemRows(aritmeticaItems, "aritmetica", "🔢")}
    </tbody>
  </table>

  <h2>Interpretação</h2>
  <p style="line-height:1.6;text-align:justify;">${classification.description} Este relatório deve ser interpretado no contexto clínico global da criança, considerando anamnese, exame neurológico e avaliação multidisciplinar.</p>

  <div class="footer">
    <strong>Dr. Jadson Fraga Araújo Júnior</strong><br>
    CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119<br>
    NeuroPed — Escalas de Neuropediatria
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }

  // ── Render helpers ──
  function renderStep1() {
    return (
      <div className="space-y-6">
        {/* Child info */}
        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Dados da Criança
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="child-name" className="text-xs text-muted-foreground">
                  Nome da criança
                </Label>
                <Input
                  id="child-name"
                  placeholder="Ex.: Maria"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  data-testid="input-child-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="child-age" className="text-xs text-muted-foreground">
                  Idade (anos)
                </Label>
                <Input
                  id="child-age"
                  placeholder="Ex.: 7"
                  type="number"
                  min={5}
                  max={14}
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  data-testid="input-child-age"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age group selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Selecione a Faixa Etária
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.entries(AGE_GROUPS) as [AgeGroup, AgeGroupInfo][]).map(
              ([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAgeGroup(key)}
                  data-testid={`age-group-${key}`}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    ageGroup === key
                      ? `${info.bgColor} ${info.borderColor} ring-2 ring-offset-1 ring-primary/40`
                      : "border-card-border hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className={`text-base font-bold ${ageGroup === key ? info.color : "text-foreground"}`}>
                    {info.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {info.description}
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p>
                <strong>Como aplicar:</strong> Apresente cada tarefa diretamente à
                criança. Registre: ✅ Correto (2 pts), 🔶 Parcial (1 pt) ou ❌
                Incorreto (0 pts).
              </p>
              <p>
                São <strong>24 itens</strong> no total (8 por domínio), com pontuação
                máxima de <strong>48 pontos</strong>.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setStep(2)}
          disabled={!ageGroup}
          className="w-full gap-2"
          data-testid="btn-start-test"
        >
          Iniciar Avaliação <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  function renderStep2() {
    if (!ageGroup) return null;
    const info = AGE_GROUPS[ageGroup];

    const leituraAnswered = leituraItems.filter(
      (_, i) => answers[`leitura-${i}`] !== null && answers[`leitura-${i}`] !== undefined
    ).length;
    const escritaAnswered = escritaItems.filter(
      (_, i) => answers[`escrita-${i}`] !== null && answers[`escrita-${i}`] !== undefined
    ).length;
    const aritmeticaAnswered = aritmeticaItems.filter(
      (_, i) => answers[`aritmetica-${i}`] !== null && answers[`aritmetica-${i}`] !== undefined
    ).length;

    return (
      <div className="space-y-5">
        {/* Header bar */}
        <div
          className={`rounded-xl border p-4 ${info.bgColor} ${info.borderColor}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className={`text-sm font-bold ${info.color}`}>
                🎓 {childName || "Criança"} — {info.label} ({info.description})
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalAnswered}/24 itens respondidos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-bold">
                {totalAnswered}/24
              </Badge>
              <Progress value={(totalAnswered / 24) * 100} className="w-20 h-2" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="leitura" className="gap-1.5 text-xs sm:text-sm">
              <span>📖</span>
              <span className="hidden sm:inline">Leitura</span>
              <Badge
                variant={leituraAnswered === 8 ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {leituraAnswered}/8
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="escrita" className="gap-1.5 text-xs sm:text-sm">
              <span>✏️</span>
              <span className="hidden sm:inline">Escrita</span>
              <Badge
                variant={escritaAnswered === 8 ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {escritaAnswered}/8
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="aritmetica" className="gap-1.5 text-xs sm:text-sm">
              <span>🔢</span>
              <span className="hidden sm:inline">Aritmética</span>
              <Badge
                variant={aritmeticaAnswered === 8 ? "default" : "secondary"}
                className="text-xs ml-1"
              >
                {aritmeticaAnswered}/8
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leitura" className="mt-4">
            <DomainTab
              domain="Leitura"
              items={leituraItems}
              answers={answers}
              onChange={handleAnswer}
              domainKey="leitura"
              emoji="📖"
            />
          </TabsContent>
          <TabsContent value="escrita" className="mt-4">
            <DomainTab
              domain="Escrita"
              items={escritaItems}
              answers={answers}
              onChange={handleAnswer}
              domainKey="escrita"
              emoji="✏️"
            />
          </TabsContent>
          <TabsContent value="aritmetica" className="mt-4">
            <DomainTab
              domain="Aritmética"
              items={aritmeticaItems}
              answers={answers}
              onChange={handleAnswer}
              domainKey="aritmetica"
              emoji="🔢"
            />
          </TabsContent>
        </Tabs>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="gap-2"
            data-testid="btn-back"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button
            onClick={() => setStep(3)}
            className="flex-1 gap-2"
            disabled={totalAnswered < 24}
            data-testid="btn-see-results"
          >
            Ver Resultados <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        {totalAnswered < 24 && (
          <p className="text-xs text-center text-muted-foreground">
            Responda todos os {24 - totalAnswered} itens restantes para ver o resultado completo.
          </p>
        )}
      </div>
    );
  }

  function renderStep3() {
    if (!ageGroup) return null;
    const info = AGE_GROUPS[ageGroup];

    return (
      <div className="space-y-6">
        {/* Result header */}
        <div
          className={`rounded-2xl border-2 p-5 ${classification.bgColor} ${classification.borderColor} space-y-3`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {classification.icon}
              <div>
                <p className={`text-lg font-bold ${classification.color}`}>
                  {classification.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {childName ? `${childName} — ` : ""}{info.label} ({info.description})
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black ${classification.color}`}>
                {totalScore}
                <span className="text-lg font-medium text-muted-foreground">
                  /{maxScore}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{percentage}% do máximo</p>
            </div>
          </div>
          <Progress value={percentage} className="h-3" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {classification.description}
          </p>
        </div>

        {/* Domain cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              emoji: "📖",
              name: "Leitura",
              score: leituraScore,
              items: leituraItems,
              key: "leitura",
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-50 dark:bg-blue-950/20",
              border: "border-blue-200 dark:border-blue-800/40",
            },
            {
              emoji: "✏️",
              name: "Escrita",
              score: escritaScore,
              items: escritaItems,
              key: "escrita",
              color: "text-violet-600 dark:text-violet-400",
              bg: "bg-violet-50 dark:bg-violet-950/20",
              border: "border-violet-200 dark:border-violet-800/40",
            },
            {
              emoji: "🔢",
              name: "Aritmética",
              score: aritmeticaScore,
              items: aritmeticaItems,
              key: "aritmetica",
              color: "text-emerald-600 dark:text-emerald-400",
              bg: "bg-emerald-50 dark:bg-emerald-950/20",
              border: "border-emerald-200 dark:border-emerald-800/40",
            },
          ].map((d) => {
            const pct = Math.round((d.score / 16) * 100);
            const classif = getDomainClassification(d.score);
            return (
              <Card key={d.key} className={`border ${d.border} ${d.bg}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{d.emoji}</span>
                      <span className={`text-sm font-bold ${d.color}`}>{d.name}</span>
                    </div>
                    <Badge className={`text-xs font-bold ${d.color} bg-white/60 dark:bg-black/20 border border-current/20`}>
                      {d.score}/16
                    </Badge>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{pct}%</span>
                    <span className="font-medium">{classif}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full item breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Detalhamento Completo dos Itens
          </h3>

          {[
            { emoji: "📖", name: "Leitura", items: leituraItems, key: "leitura", score: leituraScore },
            { emoji: "✏️", name: "Escrita", items: escritaItems, key: "escrita", score: escritaScore },
            { emoji: "🔢", name: "Aritmética", items: aritmeticaItems, key: "aritmetica", score: aritmeticaScore },
          ].map((domain) => (
            <div key={domain.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{domain.emoji}</span>
                <h4 className="text-sm font-semibold text-foreground">{domain.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {domain.score}/16 pts
                </Badge>
              </div>
              <div className="space-y-1.5">
                {domain.items.map((item, i) => {
                  const v = answers[`${domain.key}-${i}`] ?? 0;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${
                        v === 2
                          ? "bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/30"
                          : v === 1
                          ? "bg-amber-50/60 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/30"
                          : "bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-800/30"
                      }`}
                    >
                      <span className="flex-shrink-0 text-sm">
                        {v === 2 ? "✅" : v === 1 ? "🔶" : "❌"}
                      </span>
                      <span className="flex-1 text-foreground">{item.hab}</span>
                      <span
                        className={`flex-shrink-0 font-bold ${
                          v === 2
                            ? "text-emerald-700 dark:text-emerald-400"
                            : v === 1
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        {v} pt{v !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Score legend */}
        <div className="rounded-xl bg-muted/30 border border-card-border p-4 space-y-2">
          <h4 className="text-xs font-semibold text-foreground">Classificação Geral</h4>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { range: "≥ 80%", label: "Adequado", color: "text-emerald-600" },
              { range: "60–79%", label: "Em desenvolvimento", color: "text-amber-600" },
              { range: "40–59%", label: "Abaixo do esperado — investigação", color: "text-orange-600" },
              { range: "< 40%", label: "Significativamente abaixo — encaminhar", color: "text-red-600" },
            ].map((r) => (
              <div key={r.range} className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{r.range}:</span>
                <span className={`font-medium ${r.color}`}>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical report */}
        <ClinicalReport
          scaleName="Testes Acadêmicos (Leitura/Escrita/Aritmética)"
          scaleFullName={`Avaliação por Faixa Etária — ${info.label}`}
          totalScore={totalScore}
          maxScore={maxScore}
          classification={classification.label}
          description={classification.description}
          domainResults={domainResults}
          items={reportItems}
          patientAge={`${info.label} — ${info.description}${childAge ? ` (${childAge} anos)` : ""}`}
        />

        {/* Save to patient */}
        <SaveToPatient
          scaleName="Testes Acadêmicos"
          totalScore={totalScore}
          classification={classification.label}
          answers={answers}
          domainScores={{
            leitura: leituraScore,
            escrita: escritaScore,
            aritmetica: aritmeticaScore,
          }}
          patientAge={info.label}
        />

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
            data-testid="btn-print"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button
            variant="outline"
            onClick={() => setStep(2)}
            className="gap-2"
            data-testid="btn-edit-answers"
          >
            <ChevronLeft className="w-4 h-4" /> Editar Respostas
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 text-muted-foreground"
            data-testid="btn-reset"
          >
            <RotateCcw className="w-4 h-4" /> Nova Avaliação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Testes Acadêmicos</h1>
          <p className="text-xs text-muted-foreground">
            Leitura · Escrita · Aritmética — Faixa etária 5–14 anos
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Identificação" },
          { n: 2, label: "Avaliação" },
          { n: 3, label: "Resultado" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-6 h-px bg-border" />}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                step === s.n
                  ? "bg-primary text-primary-foreground"
                  : step > s.n
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                  step === s.n
                    ? "bg-white/20"
                    : step > s.n
                    ? "bg-emerald-600 text-white"
                    : "bg-muted-foreground/20"
                }`}
              >
                {step > s.n ? "✓" : s.n}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}
