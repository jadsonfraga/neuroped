import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const dock = read("client/src/components/MobilePrimaryDock.tsx");
const booking = read("client/src/pages/agendar.tsx");
const dailySync = read(".github/workflows/daily-authorial-static-sync.yml");

for (const path of ["/familia", "/agendar", "/pre-consulta", "/pre-retorno", "/efeitos-colaterais"]) {
  assert.match(dock, new RegExp(path.replace("/", "\\/")), `dock clínico deve ocultar ${path}`);
}
assert.match(dock, /\bz-40\b/, "dock deve permanecer abaixo de dialogs/paleta");
assert.doesNotMatch(dock, /z-\[99970\]/, "dock não pode dominar a pilha global de overlays");

assert.match(booking, /function dateInTimeZone\(/, "agendamento deve conhecer o fuso do profissional");
assert.match(booking, /setDate\(dateInTimeZone\(data\.timezone\)\)/, "data inicial deve usar o fuso retornado pelo perfil");
assert.match(booking, /const providerToday = profile \? dateInTimeZone\(profile\.timezone\) : todayLocal\(\)/, "limite mínimo deve acompanhar o fuso da agenda");
assert.match(booking, /min=\{providerToday\}/, "input date deve bloquear datas anteriores no fuso do profissional");
assert.doesNotMatch(booking, /min=\{todayLocal\(\)\}/, "input date não pode depender do fuso do visitante");

assert.match(dailySync, /outputs:\s*\n\s*deploy_sha: \$\{\{ steps\.revision\.outputs\.sha \}\}/, "Cloudflare deve expor o SHA efetivamente fixado");
assert.match(dailySync, /A sincronização diária não pode promover uma revisão diferente da solicitada/, "drift entre expected_commit e main deve falhar fechado");
assert.match(dailySync, /ref: \$\{\{ needs\.cloudflare\.outputs\.deploy_sha \}\}/, "Vercel deve usar exatamente o SHA promovido no Cloudflare");
assert.match(dailySync, /TARGET_COMMIT: \$\{\{ needs\.cloudflare\.outputs\.deploy_sha \}\}/, "Vercel deve verificar o SHA recebido do backend canônico");
assert.doesNotMatch(dailySync, /será publicada a revisão mais recente/, "sincronização diária não pode promover main diferente por conveniência");

console.log("[deep-audit] ✓ fronteira pública, stacking, fuso da agenda e promoção exata de SHA aprovados.");
