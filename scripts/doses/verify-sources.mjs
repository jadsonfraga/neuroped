// Reconfere, na fonte oficial (openFDA/DailyMed), que cada trecho literal da base de doses
// ainda existe na seção "Dosage and Administration" da bula citada. Precisa de rede.
// Uso: node scripts/doses/verify-sources.mjs
import { readFileSync } from "node:fs";

const base = JSON.parse(readFileSync(new URL("../../client/src/data/doses/referencias-dose.json", import.meta.url), "utf8"));
const norm = (s) => s.replace(/\s+/g, " ").trim();
const porSet = new Map();
let falhas = 0;
for (const e of base.entradas) {
  if (!porSet.has(e.fonte.setId)) {
    const url = `https://api.fda.gov/drug/label.json?search=set_id:${e.fonte.setId}&limit=1`;
    const r = await fetch(url);
    if (!r.ok) { console.error(`FALHA ${e.id}: openFDA HTTP ${r.status}`); falhas++; continue; }
    const d = (await r.json()).results?.[0];
    porSet.set(e.fonte.setId, d ? { texto: norm((d.dosage_and_administration ?? []).join(" ")), versao: String(d.version), efetiva: d.effective_time } : null);
  }
  const lab = porSet.get(e.fonte.setId);
  if (!lab) { console.error(`FALHA ${e.id}: bula não encontrada`); falhas++; continue; }
  if (lab.versao !== e.fonte.versaoSpl) console.warn(`AVISO ${e.id}: versão da bula mudou (${e.fonte.versaoSpl} → ${lab.versao}); reverificar.`);
  for (const l of e.limites) {
    if (!lab.texto.includes(norm(l.trecho))) { console.error(`FALHA ${e.id}: trecho não encontrado (${l.tipo})`); falhas++; }
  }
}
console.log(falhas ? `${falhas} falha(s).` : `OK: ${base.entradas.length} entradas conferidas contra a fonte.`);
process.exit(falhas ? 1 : 0);
