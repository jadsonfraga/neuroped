import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Baby, RotateCcw, Info } from "lucide-react";
import { celebrate } from "@/lib/confetti";
import { softTick, softSuccess } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";

// New Ballard Score (Ballard JL et al., J Pediatr 1991) — estimativa da idade
// gestacional por maturidade neuromuscular + física. Cada item pontua de -1 a 5.
// Conversão oficial do escore total → semanas: linear, IG = 24 + 0,4 × total
// (−10→20 sem … 0→24 … 50→44 sem), conforme a tabela do escoresheet.

interface BallardItem {
  name: string;
  /** Descritores por grau (-1..5), quando textuais. Vazio = item postural (consultar diagrama). */
  grades?: Record<number, string>;
}

const NEUROMUSCULAR: BallardItem[] = [
  { name: "Postura" },
  { name: "Janela quadrada (punho)" },
  { name: "Recuo do braço (arm recoil)" },
  { name: "Ângulo poplíteo" },
  { name: "Sinal do cachecol (scarf sign)" },
  { name: "Calcanhar–orelha" },
];

const PHYSICAL: BallardItem[] = [
  { name: "Pele", grades: {
    [-1]: "Pegajosa, friável, transparente", 0: "Gelatinosa, vermelha, translúcida", 1: "Lisa, rosada, veias visíveis",
    2: "Descamação superficial e/ou rash, poucas veias", 3: "Rachaduras, áreas pálidas, veias raras",
    4: "Tipo pergaminho, rachaduras profundas, sem vasos", 5: "Tipo couro, rachada, enrugada" } },
  { name: "Lanugo", grades: {
    [-1]: "Ausente", 0: "Esparso", 1: "Abundante", 2: "Afinando", 3: "Áreas calvas", 4: "Predominantemente calvo" } },
  { name: "Superfície plantar", grades: {
    [-1]: "Calcanhar-artelho 40–50 mm (−1) / <40 mm (−2)", 0: ">50 mm, sem prega", 1: "Marcas vermelhas discretas",
    2: "Apenas prega transversal anterior", 3: "Pregas nos 2/3 anteriores", 4: "Pregas em toda a sola" } },
  { name: "Mama", grades: {
    [-1]: "Imperceptível", 0: "Quase imperceptível", 1: "Aréola plana, sem broto", 2: "Aréola pontilhada, broto de 1–2 mm",
    3: "Aréola elevada, broto de 3–4 mm", 4: "Aréola completa, broto de 5–10 mm" } },
  { name: "Olho/Orelha", grades: {
    [-1]: "Pálpebras fundidas: frouxamente (−1) / firmemente (−2)", 0: "Pálpebras abertas, pavilhão plano, permanece dobrado",
    1: "Pavilhão levemente curvo, mole, recuo lento", 2: "Pavilhão bem curvo, mole mas com recuo pronto",
    3: "Formado e firme, recuo instantâneo", 4: "Cartilagem espessa, orelha rígida" } },
  { name: "Genitais (masc./fem.)", grades: {
    [-1]: "M: escroto liso, plano · F: clitóris proeminente, lábios planos",
    0: "M: escroto vazio, rugas discretas · F: clitóris proeminente, pequenos lábios menores",
    1: "M: testículos no canal superior, rugas raras · F: clitóris proeminente, lábios menores aumentando",
    2: "M: testículos descendo, poucas rugas · F: lábios maiores e menores igualmente proeminentes",
    3: "M: testículos descidos, boas rugas · F: lábios maiores grandes, menores pequenos",
    4: "M: testículos pendulares, rugas profundas · F: lábios maiores cobrem clitóris e menores" } },
];

const GRADES = [-1, 0, 1, 2, 3, 4, 5];

function gaWeeks(total: number): number {
  // IG (semanas) = 24 + 0,4 × escore total (tabela oficial linear).
  return Math.round((24 + 0.4 * total) * 10) / 10;
}

export default function BallardPage() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const all = useMemo(() => [...NEUROMUSCULAR.map((it) => ({ ...it, g: "nm" })), ...PHYSICAL.map((it) => ({ ...it, g: "ph" }))], []);
  const answered = Object.keys(scores).length;
  const complete = answered === all.length;
  const total = Object.values(scores).reduce((s, v) => s + v, 0);
  const ga = gaWeeks(total);

  function set(key: string, val: number) {
    softTick();
    haptic.select();
    setScores((c) => ({ ...c, [key]: val }));
  }
  function reset() {
    haptic.tap();
    setScores({});
  }

  const renderGroup = (label: string, items: BallardItem[], prefix: string) => (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      {items.map((it, i) => {
        const key = `${prefix}-${i}`;
        const sel = scores[key];
        return (
          <Card key={key} className="border-card-border">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">{it.name}</p>
              {!it.grades && (
                <p className="text-[11px] text-muted-foreground">Item postural — atribua o grau conforme o diagrama do escoresheet à beira-leito.</p>
              )}
              {it.grades && sel !== undefined && it.grades[sel] && (
                <p className="text-[11px] text-muted-foreground leading-relaxed">{it.grades[sel]}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => set(key, g)}
                    aria-pressed={sel === g}
                    data-testid={`${key}-g${g}`}
                    className={`min-h-[40px] min-w-[40px] rounded-lg border px-2 text-xs font-semibold transition-all ${
                      sel === g ? "border-teal-500 bg-teal-500 text-white" : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md">
          <Baby className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-xl text-foreground leading-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
            New Ballard Score
          </h1>
          <p className="text-xs text-muted-foreground italic">Estimativa da idade gestacional por maturidade — recém-nascido</p>
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Instruções:</strong> pontue cada item de −1 a 5. Some os 12 itens (maturidade neuromuscular + física); o escore total é convertido em idade gestacional estimada (−10 → 20 semanas … 0 → 24 … 50 → 44). Aplicar idealmente nas primeiras 12–24 h de vida.
        </p>
      </div>

      <div className="sticky top-0 z-20 -mx-1 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{answered}/{all.length} itens · escore {total}</span>
          <span className="font-semibold text-foreground">{complete ? `≈ ${ga} semanas` : "—"}</span>
        </div>
      </div>

      {renderGroup("Maturidade Neuromuscular", NEUROMUSCULAR, "nm")}
      {renderGroup("Maturidade Física", PHYSICAL, "ph")}

      {complete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.normal, ease: easing.smooth }}
          onAnimationStart={() => { softSuccess(); haptic.success(); celebrate(); }}
        >
          <Card className="border-card-border overflow-hidden">
            <div className="p-6 text-center space-y-1 bg-gradient-to-br from-sky-500 to-blue-600">
              <div className="text-5xl font-bold text-white">{ga}</div>
              <p className="text-sm text-white/90">semanas de idade gestacional (estimativa)</p>
              <p className="text-xs text-white/80">Escore total: {total}</p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Idade gestacional estimada de <strong>≈ {ga} semanas</strong> pela maturidade neuromuscular e física. Correlacione com a idade gestacional obstétrica (DUM/ultrassonografia) e o exame clínico; o New Ballard é mais preciso entre 20 e 44 semanas.
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    Conversão oficial (semanas): −10→20 · −5→22 · 0→24 · 5→26 · 10→28 · 15→30 · 20→32 · 25→34 · 30→36 · 35→38 · 40→40 · 45→42 · 50→44. Fonte: ballardscore.com.
                  </p>
                </div>
              </div>
              <button type="button" onClick={reset} data-testid="button-reset" className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-muted">
                <RotateCcw className="h-4 w-4" /> Nova avaliação
              </button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
