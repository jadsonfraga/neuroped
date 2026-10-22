import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { isPublicRoute } from "../../client/src/lib/publicRoutes";
import { decideRouteAccess } from "../../client/src/security/routeGuardPolicy";
import { isKnownRoute } from "../../client/src/security/knownRoutes";
import {
  HOJE_INDICE_CHAVE,
  HOJE_JANELA_DIAS,
  HOJE_MAX_OCORRENCIA,
  alternarOpcao,
  chaveDoDia,
  datasAntigas,
  datasDaJanela,
  indiceComData,
  isIsoDate,
  normalizarIndice,
  sanitizeCheckin,
  shiftIsoDate,
  ultimosDias,
  type CheckinHoje,
} from "../../client/src/lib/hojeCheckin";

const read = (relative: string) => readFileSync(resolve(process.cwd(), relative), "utf8");

test("datas ISO inválidas são rejeitadas, inclusive as que não existem", () => {
  assert.equal(isIsoDate("2026-10-22"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("2026-13-01"), false);
  assert.equal(isIsoDate("hoje"), false);
  assert.equal(isIsoDate(undefined), false);
});

test("sanitização descarta registros com data ou opções inválidas", () => {
  assert.equal(sanitizeCheckin({ data: "2026-02-30", sono: "bem" }), null);
  assert.equal(sanitizeCheckin({ sono: "bem" }), null);
  assert.equal(sanitizeCheckin(null), null);
  assert.equal(sanitizeCheckin("lixo"), null);
  assert.deepEqual(
    sanitizeCheckin({ data: "2026-10-20", sono: "ótimo", humor: "alegre", ocorrencia: " ok " }),
    { data: "2026-10-20", humor: "alegre", ocorrencia: "ok" },
  );
});

test("ocorrência é limitada por caractere, sem partir emoji", () => {
  const longo = "🙂".repeat(HOJE_MAX_OCORRENCIA + 50);
  const entry = sanitizeCheckin({ data: "2026-10-22", ocorrencia: longo });
  assert.ok(entry);
  assert.equal(Array.from(entry.ocorrencia).length, HOJE_MAX_OCORRENCIA);
});

test("cada dia tem a própria chave, com prefixo persistente do cofre", () => {
  assert.equal(chaveDoDia("2026-10-22"), "diario:hoje:v1:2026-10-22");
  assert.notEqual(chaveDoDia("2026-10-21"), chaveDoDia("2026-10-22"));
});

test("alternarOpcao desfaz a escolha ao tocar de novo", () => {
  assert.equal(alternarOpcao(undefined, "bem"), "bem");
  assert.equal(alternarOpcao("bem", "bem"), undefined);
  assert.equal(alternarOpcao("bem", "mal"), "mal");
});

test("deslocamento de datas atravessa fronteiras de mês, ano e fevereiro bissexto", () => {
  assert.equal(shiftIsoDate("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftIsoDate("2027-01-01", -1), "2026-12-31");
  assert.equal(shiftIsoDate("2028-03-01", -1), "2028-02-29");
});

test("janela de 7 dias termina em hoje, em ordem crescente, sem preencher dias vazios", () => {
  const entries: CheckinHoje[] = [{ data: "2026-10-20", sono: "bem", ocorrencia: "" }];
  const janela = ultimosDias(entries, "2026-10-22");
  assert.deepEqual(janela.map((dia) => dia.data), [
    "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22",
  ]);
  assert.equal(janela.filter((dia) => dia.registro).length, 1);
  assert.equal(janela[4].registro?.sono, "bem");
  assert.equal("registro" in janela[0], false);
});

test("retenção é a janela: datas do índice fora dos 7 dias são as que saem", () => {
  const indice = ["2026-10-10", "2026-10-16", "2026-10-17", "2026-10-22"];
  // Janela de hoje (22/10): 16/10 a 22/10. Só 10/10 sai, mesmo que o app fique fechado por semanas.
  assert.deepEqual(datasAntigas(indice, "2026-10-22"), ["2026-10-10"]);
});

test("registros de dias antigos são apagados mesmo com mais de 30 dias sem abrir a tela", () => {
  const indice = ["2026-10-10"];
  assert.deepEqual(datasAntigas(indice, "2026-11-10"), ["2026-10-10"]);
});

test("índice inválido vira lista vazia; datas repetidas são removidas e a ordem é cronológica", () => {
  assert.deepEqual(normalizarIndice("lixo"), []);
  assert.deepEqual(normalizarIndice(null), []);
  assert.deepEqual(normalizarIndice(["2026-10-22", "2026-02-30", "2026-10-20", "2026-10-22"]), ["2026-10-20", "2026-10-22"]);
});

test("indiceComData acrescenta a data uma única vez", () => {
  assert.deepEqual(indiceComData(["2026-10-20"], "2026-10-22"), ["2026-10-20", "2026-10-22"]);
  assert.deepEqual(indiceComData(["2026-10-22"], "2026-10-22"), ["2026-10-22"]);
});

test("a chave do índice fica no mesmo prefixo persistente dos registros", () => {
  assert.ok(HOJE_INDICE_CHAVE.startsWith("diario:"));
  assert.notEqual(HOJE_INDICE_CHAVE, chaveDoDia("2026-10-22"));
  assert.equal(datasDaJanela("2026-10-22").length, HOJE_JANELA_DIAS);
});

test("o check-in continua fora das rotas públicas e exige login sem sessão remota", () => {
  assert.equal(isPublicRoute("/hoje"), false);
  assert.equal(
    decideRouteAccess({ path: "/hoje", accessMode: "remote", isAuthenticated: false, isLoading: false, userRole: null }),
    "login",
  );
});

test("o check-in é rota conhecida: sem isso o RouteGuard libera a tela sem login", () => {
  assert.equal(isKnownRoute("/hoje"), true);
});

test("a página do check-in não faz rede nem registra conteúdo no console", () => {
  const source = read("client/src/pages/hoje.tsx");
  assert.doesNotMatch(source, /\bfetch\(|apiRequest|XMLHttpRequest|sendBeacon|WebSocket/);
  assert.doesNotMatch(source, /console\./);
});

test("a página do check-in grava só a chave do dia e não reescreve o cofre inteiro", () => {
  const source = read("client/src/pages/hoje.tsx");
  assert.match(source, /secureSet\(chaveDoDia\(hojeIso\), registro\)/);
  assert.doesNotMatch(source, /secureSet\(STORAGE_KEY/);
});

test("a rota e o item de navegação do check-in estão registrados", () => {
  assert.match(read("client/src/App.tsx"), /<Route path="\/hoje" component=\{HojePage\} \/>/);
  assert.match(read("client/src/data/navigation.ts"), /href: "\/hoje"/);
});
