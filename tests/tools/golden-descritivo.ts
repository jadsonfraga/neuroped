// Impressão digital (hash) do que o app COLETA e APLICA: itens, ordem, pseudopalavras, textos, formas A/B,
// tempos e regras de administração. Não contém corte, nível nem classificação. Se mudar, o conteúdo
// aplicado mudou: regenere com `node --import tsx tests/tools/gen-golden-descritivo.ts` e revise o diff.
import { createHash } from "node:crypto";
import { INTEGRATED_BANK, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";
import { estimateBandSeconds, sessionLimitSeconds } from "../../client/src/features/super-neuropad/model";
import { CF, DITADO, DITADO_PSEUDO, FLUENCY_TEXT, PSEUDO, RAN, WORDS } from "../../client/src/features/dyslexia-risk/model";
import { BANDS, withTextForm } from "../../client/src/features/dyslexia-risk/game/bank";
import { ITEMS_PER_WORLD, SESSION_CAP_SECONDS, estimateSessionSeconds } from "../../client/src/features/dyslexia-risk/game/engine";
import { DRAFT_TTL_MS } from "../../client/src/features/dyslexia-risk/localDraft";

const sha = (value: unknown) => createHash("sha1").update(JSON.stringify(value)).digest("hex").slice(0, 16);

export function descritivoGolden() {
  const super_: Record<string, unknown> = {};
  for (const years of YEARS) {
    super_[years] = {
      tempo: [estimateBandSeconds(years).totalSeconds, sessionLimitSeconds(years)],
      mundos: Object.fromEntries(PHASE_ORDER.map((phase) => {
        const items = INTEGRATED_BANK[years][phase];
        return [phase, { n: items.length, ids: items.map((item) => item.id), hash: sha(items) }];
      })),
    };
  }
  const jln = BANDS.map((band) => ({
    faixa: band.band,
    pools: Object.fromEntries((["ditado", "decodificacao", "aritmetica"] as const).map((world) => [world, { n: band[world].length, hash: sha(band[world]) }])),
    fluenciaA: sha(withTextForm(band, "A").fluencia),
    fluenciaB: sha(withTextForm(band, "B").fluencia),
    compreensaoA: sha(withTextForm(band, "A").compreensao),
    compreensaoB: sha(withTextForm(band, "B").compreensao),
    estimativaA: estimateSessionSeconds(band.band, "A"),
    estimativaB: estimateSessionSeconds(band.band, "B"),
  }));
  return {
    superNeuropad: super_,
    jogoLetrasNumeros: { jln, itensPorMundo: ITEMS_PER_WORLD, tetoSessaoSegundos: SESSION_CAP_SECONDS },
    iced: { palavras: sha(WORDS), pseudo: sha(PSEUDO), ditado: sha(DITADO), ditadoPseudo: [...DITADO_PSEUDO], cf: sha(CF), ran: RAN.length, textoFluencia: sha(FLUENCY_TEXT) },
    rascunhoValidadeHoras: DRAFT_TTL_MS / 3_600_000,
  };
}
