import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { isPublicRoute } from "../../client/src/lib/publicRoutes";
import { decideRouteAccess } from "../../client/src/security/routeGuardPolicy";
import {
  HOJE_MAX_OCORRENCIA,
  alternarOpcao,
  isIsoDate,
  sanitizeCheckins,
  shiftIsoDate,
  ultimosDias,
  upsertCheckin,
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

test("sanitização descarta registros com datas ou opções inválidas", () => {
  const out = sanitizeCheckins([
    { data: "2026-10-20", sono: "ótimo", humor: "alegre", ocorrencia: " ok " },
    { data: "2026-02-30", sono: "bem" },
    { sono: "bem" },
    null,
    "lixo",
  ]);
  assert.deepEqual(out, [{ data: "2026-10-20", humor: "alegre", ocorrencia: "ok" }]);
});

test("sanitização mantém um registro por data, o último, e ordena por data", () => {
  const out = sanitizeCheckins([
    { data: "2026-10-22", sono: "mal", ocorrencia: "" },
    { data: "2026-10-20", sono: "bem", ocorrencia: "" },
    { data: "2026-10-22", sono: "bem", ocorrencia: "" },
  ]);
  assert.deepEqual(out.map((entry) => entry.data), ["2026-10-20", "2026-10-22"]);
  assert.equal(out[1].sono, "bem");
});

test("ocorrência é limitada por caractere, sem partir emoji", () => {
  const longo = "🙂".repeat(HOJE_MAX_OCORRENCIA + 50);
  const [entry] = sanitizeCheckins([{ data: "2026-10-22", ocorrencia: longo }]);
  assert.equal(Array.from(entry.ocorrencia).length, HOJE_MAX_OCORRENCIA);
});

test("upsert substitui o registro do mesmo dia e preserva os demais", () => {
  const base: CheckinHoje[] = [
    { data: "2026-10-21", sono: "regular", ocorrencia: "" },
    { data: "2026-10-22", sono: "mal", ocorrencia: "" },
  ];
  const out = upsertCheckin(base, { data: "2026-10-22", sono: "bem", ocorrencia: "" });
  assert.equal(out.length, 2);
  assert.equal(out[1].sono, "bem");
  assert.equal(out[0].sono, "regular");
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

test("o check-in continua fora das rotas públicas, atrás do gate", () => {
  assert.equal(isPublicRoute("/hoje"), false);
});

test("sem sessão remota, o check-in exige login, como os diários", () => {
  assert.equal(
    decideRouteAccess({ path: "/hoje", accessMode: "remote", isAuthenticated: false, isLoading: false, userRole: null }),
    "login",
  );
  assert.equal(
    decideRouteAccess({ path: "/diario-sono", accessMode: "remote", isAuthenticated: false, isLoading: false, userRole: null }),
    "login",
  );
});

test("a página do check-in não faz rede nem registra conteúdo no console", () => {
  const source = read("client/src/pages/hoje.tsx");
  assert.doesNotMatch(source, /\bfetch\(|apiRequest|XMLHttpRequest|sendBeacon|WebSocket/);
  assert.doesNotMatch(source, /console\./);
});

test("a rota e o item de navegação do check-in estão registrados", () => {
  assert.match(read("client/src/App.tsx"), /<Route path="\/hoje" component=\{HojePage\} \/>/);
  assert.match(read("client/src/data/navigation.ts"), /href: "\/hoje"/);
});
