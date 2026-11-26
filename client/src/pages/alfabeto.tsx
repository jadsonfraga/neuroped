import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import "./alfabeto.css";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function shuffledLetters(previous?: string[]) {
  const letters = [...ALPHABET];
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const previousOrder = previous?.join("");
  while (letters.join("") === ALPHABET || letters.join("") === previousOrder) {
    letters.push(letters.shift()!);
  }
  return letters;
}

export default function Alfabeto() {
  const [letters, setLetters] = useState(shuffledLetters);
  const [cursive, setCursive] = useState<Set<string>>(() => new Set());
  const [fontState, setFontState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    document.fonts.load('400 48px "NeuroPed Cursiva"', ALPHABET).then(
      faces => { if (active) setFontState(faces.length ? "ready" : "error"); },
      () => { if (active) setFontState("error"); },
    );
    return () => { active = false; };
  }, []);

  function toggleLetter(letter: string) {
    setCursive(current => {
      const next = new Set(current);
      if (next.has(letter)) next.delete(letter);
      else next.add(letter);
      return next;
    });
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5 p-3 sm:p-6" aria-labelledby="alphabet-heading">
      <header className="space-y-2">
        <h1 id="alphabet-heading" className="text-2xl font-bold sm:text-3xl">Alfabeto</h1>
        <p className="text-muted-foreground">
          Toque em uma letra para vê-la em cursiva maiúscula. Toque de novo para voltar à letra bastão.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => {
            setLetters(shuffledLetters(letters));
            setCursive(new Set());
          }}
        >
          <Shuffle className="h-4 w-4" aria-hidden="true" />
          Embaralhar letras
        </button>
        <p className="text-sm text-muted-foreground">Ao embaralhar, todas voltam ao estilo bastão.</p>
      </div>

      {fontState !== "ready" && (
        <p role="status" className="text-sm text-muted-foreground">
          {fontState === "loading" ? "Carregando a escrita cursiva…" : "A escrita cursiva não carregou. Recarregue esta página para tentar novamente."}
        </p>
      )}

      <div role="group" aria-label="Letras do alfabeto" className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 lg:grid-cols-8">
        {letters.map(letter => {
          const isCursive = cursive.has(letter);
          return (
            <button
              key={letter}
              type="button"
              aria-label={`Letra ${letter}`}
              aria-pressed={isCursive}
              disabled={fontState !== "ready"}
              onClick={() => toggleLetter(letter)}
              className={`grid h-16 min-w-0 place-items-center rounded-xl border text-3xl leading-none focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-24 sm:text-5xl ${isCursive ? "border-primary bg-primary/10" : "bg-card hover:border-primary"}`}
            >
              <span aria-hidden="true" style={{ fontFamily: isCursive ? '"NeuroPed Cursiva"' : 'Arial, sans-serif', fontWeight: isCursive ? 400 : 700 }}>{letter}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Atividade de reconhecimento visual. Não registra respostas nem gera pontuação.</p>
    </section>
  );
}
