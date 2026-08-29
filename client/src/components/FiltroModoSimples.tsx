import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  faixasEtarias,
  queixas,
  type QueixaCategory,
} from "@/data/scaleFilter";
import { softTap, softTick } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";

/**
 * Assistente "Modo Simples" do Filtro Clínico.
 *
 * Três perguntas, uma por vez, em linguagem de família e com alvos de toque
 * grandes — desenhado para que qualquer pessoa, mesmo sem familiaridade com o
 * app ou com termos clínicos, chegue às melhores escalas por respondente,
 * idade e queixa. O assistente NÃO substitui o modo completo: ele só preenche
 * os mesmos filtros e devolve o controle à tela.
 */

export type RespondenteSimples =
  | "pais"
  | "professor"
  | "autoaplicavel"
  | "clinico"
  | "teste_direto_crianca";

export interface ModoSimplesResultado {
  respondente: RespondenteSimples | null;
  age: string | null;
  queixas: string[];
}

interface FiltroModoSimplesProps {
  onApply: (resultado: ModoSimplesResultado) => void;
  onDismiss: () => void;
}

const RESPONDENTE_OPCOES: Array<{
  id: RespondenteSimples | "nao-sei";
  emoji: string;
  titulo: string;
  ajuda: string;
}> = [
  { id: "pais", emoji: "👨‍👩‍👧", titulo: "Pai, mãe ou cuidador", ajuda: "Quem convive com a criança responde as perguntas" },
  { id: "professor", emoji: "🏫", titulo: "Professor(a)", ajuda: "A escola responde sobre o comportamento em sala" },
  { id: "autoaplicavel", emoji: "🧑", titulo: "A própria criança ou adolescente", ajuda: "Ela mesma responde (geralmente a partir dos 8 anos)" },
  { id: "clinico", emoji: "🩺", titulo: "Profissional de saúde", ajuda: "Você aplica e observa durante a consulta" },
  { id: "nao-sei", emoji: "🤷", titulo: "Não sei ainda", ajuda: "Sem problema — mostramos as melhores opções de todas" },
];

const FAIXA_EMOJI: Record<string, string> = {
  "0-6m": "🍼",
  "6-12m": "👶",
  "1-2a": "🚼",
  "2-4a": "🧒",
  "4-6a": "🎨",
  "6-12a": "🎒",
  "12-18a": "🧑",
};

// As queixas mais buscadas primeiro — reduz a rolagem para o caso comum.
const QUEIXAS_POPULARES = [
  "atraso",
  "tea",
  "tdah",
  "comportamento",
  "ansiedade",
  "linguagem",
  "sono",
  "aprendizagem",
  "depressao",
  "epilepsia",
];

function ordenarQueixas(lista: QueixaCategory[]): QueixaCategory[] {
  const rank = new Map(QUEIXAS_POPULARES.map((id, i) => [id, i]));
  return [...lista].sort((a, b) => {
    const ra = rank.get(a.id) ?? 99;
    const rb = rank.get(b.id) ?? 99;
    if (ra !== rb) return ra - rb;
    return a.label.localeCompare(b.label);
  });
}

const PASSOS = [
  { rotulo: "Quem responde", pergunta: "Quem vai responder as perguntas?" },
  { rotulo: "Idade", pergunta: "Qual a idade da criança?" },
  { rotulo: "Preocupação", pergunta: "O que mais preocupa hoje?" },
] as const;

export function FiltroModoSimples({ onApply, onDismiss }: FiltroModoSimplesProps) {
  const [passo, setPasso] = useState(0);
  const [respondente, setRespondente] = useState<RespondenteSimples | null>(null);
  const [respondenteEscolhido, setRespondenteEscolhido] = useState(false);
  const [age, setAge] = useState<string | null>(null);
  const [queixasSel, setQueixasSel] = useState<string[]>([]);
  const queixasOrdenadas = useMemo(() => ordenarQueixas(queixas), []);
  const [mostrarTodasQueixas, setMostrarTodasQueixas] = useState(false);
  const queixasVisiveis = mostrarTodasQueixas
    ? queixasOrdenadas
    : queixasOrdenadas.slice(0, 10);

  function avancar() {
    softTick();
    haptic.tap();
    setPasso((p) => Math.min(p + 1, PASSOS.length - 1));
  }

  function voltar() {
    softTap();
    setPasso((p) => Math.max(p - 1, 0));
  }

  function alternarQueixa(id: string) {
    softTap();
    haptic.tap();
    setQueixasSel((atual) =>
      atual.includes(id)
        ? atual.filter((q) => q !== id)
        : atual.length >= 3
          ? atual
          : [...atual, id],
    );
  }

  function concluir() {
    softTick();
    haptic.success?.();
    onApply({ respondente, age, queixas: queixasSel });
  }

  const podeAvancar =
    passo === 0 ? respondenteEscolhido : passo === 1 ? true : queixasSel.length > 0;

  return (
    <section
      aria-label="Assistente simples do filtro"
      data-testid="filtro-modo-simples"
      className="relative overflow-hidden rounded-[1.75rem] border-2 border-primary/25 bg-gradient-to-br from-primary/[0.07] via-card to-card p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-primary">
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          Assistente simples — 3 perguntas e pronto
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
          data-testid="button-modo-completo"
        >
          Prefiro os filtros completos
        </button>
      </div>

      {/* Indicador de passos — grande e nomeado */}
      <ol className="mb-5 flex items-center gap-1.5 sm:gap-2" aria-label="Progresso do assistente">
        {PASSOS.map((p, i) => (
          <li key={p.rotulo} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span
              aria-current={i === passo ? "step" : undefined}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition sm:h-8 sm:w-8 ${
                i < passo
                  ? "bg-primary text-primary-foreground"
                  : i === passo
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < passo ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={`hidden text-[11px] font-bold sm:block ${i === passo ? "text-foreground" : "text-muted-foreground"}`}
            >
              {p.rotulo}
            </span>
            {i < PASSOS.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <h2 className="mb-4 text-lg font-black leading-tight text-foreground sm:text-xl">
        {PASSOS[passo].pergunta}
      </h2>

      {passo === 0 && (
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Quem vai responder">
          {RESPONDENTE_OPCOES.map((op) => {
            const ativo = respondenteEscolhido &&
              (op.id === "nao-sei" ? respondente === null : respondente === op.id);
            return (
              <button
                key={op.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                data-testid={`simples-respondente-${op.id}`}
                onClick={() => {
                  softTap();
                  haptic.tap();
                  setRespondente(op.id === "nao-sei" ? null : op.id);
                  setRespondenteEscolhido(true);
                }}
                className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] ${
                  ativo
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">{op.emoji}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{op.titulo}</span>
                  <span className="block text-xs leading-snug text-muted-foreground">{op.ajuda}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {passo === 1 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Faixa etária">
          {faixasEtarias.map((f) => {
            const ativo = age === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={ativo}
                data-testid={`simples-idade-${f.id}`}
                onClick={() => {
                  softTap();
                  haptic.tap();
                  setAge(ativo ? null : f.id);
                }}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-2 transition active:scale-[0.98] ${
                  ativo
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className="text-2xl" aria-hidden="true">{FAIXA_EMOJI[f.id] ?? "🧒"}</span>
                <span className="text-sm font-bold text-foreground">{f.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={age === null}
            data-testid="simples-idade-nao-sei"
            onClick={() => {
              softTap();
              setAge(null);
            }}
            className={`col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 p-2 text-sm font-bold transition active:scale-[0.98] sm:col-span-4 ${
              age === null
                ? "border-primary/60 bg-primary/5 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
          >
            🤷 Não sei / prefiro não informar
          </button>
        </div>
      )}

      {passo === 2 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">
            Toque em até 3 opções. Cada cartão explica com exemplos do dia a dia.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {queixasVisiveis.map((q) => {
              const ativo = queixasSel.includes(q.id);
              const bloqueado = !ativo && queixasSel.length >= 3;
              return (
                <button
                  key={q.id}
                  type="button"
                  aria-pressed={ativo}
                  disabled={bloqueado}
                  data-testid={`simples-queixa-${q.id}`}
                  onClick={() => alternarQueixa(q.id)}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
                    ativo
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">{q.emoji ?? "🩺"}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-foreground">{q.label}</span>
                    {q.parentHint && (
                      <span className="block text-xs leading-snug text-muted-foreground">
                        {q.parentHint}
                      </span>
                    )}
                  </span>
                  {ativo && (
                    <Check className="ml-auto h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
          {!mostrarTodasQueixas && queixasOrdenadas.length > queixasVisiveis.length && (
            <button
              type="button"
              onClick={() => {
                softTap();
                setMostrarTodasQueixas(true);
              }}
              className="w-full rounded-xl border border-dashed border-border py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              data-testid="simples-ver-todas-queixas"
            >
              Ver todas as {queixasOrdenadas.length} preocupações
            </button>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        {passo > 0 ? (
          <Button variant="outline" onClick={voltar} className="gap-2" data-testid="simples-voltar">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}
        {passo < PASSOS.length - 1 ? (
          <Button
            onClick={avancar}
            disabled={!podeAvancar}
            className="min-h-11 gap-2 px-5 text-sm font-black"
            data-testid="simples-avancar"
          >
            Continuar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            onClick={concluir}
            disabled={!podeAvancar}
            className="min-h-11 gap-2 px-5 text-sm font-black"
            data-testid="simples-concluir"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Ver as melhores escalas
          </Button>
        )}
      </div>
    </section>
  );
}
