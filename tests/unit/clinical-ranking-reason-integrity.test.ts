import assert from "node:assert/strict";
import { clinicalRanking } from "../../client/src/data/clinicalRanking.ts";
import { allScalesComFichas } from "../../client/src/data/scaleFilter.ts";

// Auditoria semanal do filtro (P2): o racional curado explicava a escolha
// citando instrumento que NÃO estava no pódio (ex.: "o foco é Vineland-3"
// numa regra cujo ouro é EFDI; "SIPS/SOPS estrutura o risco" com ouro
// PRIME). Este gate trava o drift: nome de escala do catálogo só aparece num
// `reason` se corresponder a uma medalha da própria regra (inclusive por
// família — "CDI-2" cobre a menção "CDI") ou como referência explícita de
// CONSTRUTO ("construto X"), que descreve o domínio medido, não a escolha.

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

// nome (minúsculo) → ids que o usam (nomes colidem: EDI ↔ EDI-NEXUS).
const idsByName = new Map<string, Set<string>>();
for (const scale of allScalesComFichas) {
  const name = scale.name.trim().toLowerCase();
  if (name.length < 3) continue;
  if (!idsByName.has(name)) idsByName.set(name, new Set());
  idsByName.get(name)!.add(scale.id);
}
const namesByLength = [...idsByName.keys()].sort((a, b) => b.length - a.length);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Fronteira unicode-aware com hífen como caractere de palavra: "pedi" não
// casa em "pediátrica" nem em "PEDI-CAT"; "ASQ" não casa dentro de "ASQ-3".
const namePattern = (name: string) =>
  new RegExp(
    String.raw`(construto\s+)?(?<![\p{L}\p{N}-])${escapeRegExp(name)}(?![\p{L}\p{N}-])`,
    "giu",
  );

interface Span { start: number; end: number; name: string; construct: boolean }

const violations: string[] = [];
for (const rule of clinicalRanking) {
  const reason = (rule.reason ?? "").toLowerCase();
  if (!reason) continue;
  const medals = [rule.ouro, rule.prata, rule.bronze].filter(Boolean) as string[];
  const medalSet = new Set(medals);
  const medalNorms = medals.map(normalize);

  // Coleta spans, nome mais longo primeiro; um nome contido no span de um
  // nome mais longo é a mesma menção ("GAD-7" dentro de "GAD-7 Pediátrico").
  const spans: Span[] = [];
  for (const name of namesByLength) {
    for (const m of reason.matchAll(namePattern(name))) {
      const start = m.index! + (m[1]?.length ?? 0);
      const end = start + name.length;
      if (spans.some((s) => start >= s.start && end <= s.end)) continue;
      spans.push({ start, end, name, construct: Boolean(m[1]) });
    }
  }

  for (const span of spans) {
    if (span.construct) continue;
    const ids = idsByName.get(span.name)!;
    if ([...ids].some((id) => medalSet.has(id))) continue;
    // Família: "CDI" cobre a medalha cdi2; "TDE" cobre tde2-adaptado.
    const nameNorm = normalize(span.name);
    const family = medalNorms.some(
      (medal) => medal.startsWith(nameNorm) || nameNorm.startsWith(medal),
    );
    if (family) continue;
    violations.push(
      `${rule.queixa} ${rule.ageMin}-${rule.ageMax}m: reason cita "${span.name}" que não é medalha [${medals.join(", ")}]`,
    );
  }
}

assert.deepEqual(
  violations,
  [],
  "racional curado citando instrumento fora do pódio — corrija o texto ou a regra",
);

console.log(
  `✓ ${clinicalRanking.length} regras curadas: nenhum racional cita instrumento fora do próprio pódio`,
);
