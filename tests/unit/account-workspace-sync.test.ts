// Prova comportamental do workspace da conta: concorrência otimista + mesclagem
// em três vias. Servidor falso com o mesmo contrato de functions/api/me/workspace.ts
// (versão por gravação, PUT condicionado a baseVersion, 409 em divergência).
import assert from "node:assert/strict";
import { createWorkspaceSync } from "../../client/src/lib/workspaceSync";
import { MERGE_REFUSED, mergeRecordLists, mergeWorkspaceValues } from "../../client/src/lib/workspaceMerge";

class ConflictError extends Error {}

function fakeServer() {
  const rows = new Map<string, { data: unknown; version: string }>();
  let counter = 0;
  let failReads = 0;
  const transport = {
    async getItem<T>(key: string) {
      if (failReads > 0) {
        failReads -= 1;
        throw new Error("rede indisponível");
      }
      const row = rows.get(key);
      return row ? { data: structuredClone(row.data) as T, version: row.version } : null;
    },
    async putItem<T>(key: string, data: T, _expiresAt: string | null, baseVersion: string | null) {
      const current = rows.get(key)?.version ?? null;
      if (current !== baseVersion) throw new ConflictError("409");
      counter += 1;
      const version = `version-token-${String(counter).padStart(8, "0")}`;
      rows.set(key, { data: structuredClone(data), version });
      return { version };
    },
    async deleteItem(key: string) {
      rows.delete(key);
    },
    isConflict: (error: unknown) => error instanceof ConflictError,
  };
  return {
    transport,
    rows,
    failNextReads(count: number) { failReads = count; },
  };
}

const persistent = { expiresAt: null, ephemeral: false, maxBytes: 1_400_000 };
const draft = { expiresAt: "2999-01-01T00:00:00.000Z", ephemeral: true, maxBytes: 1_400_000 };
const session = (id: string, extra: Record<string, unknown> = {}) => ({ id, taskId: "stroop", ...extra });

// 1) Achado P1 (Codex): leitura que falha NÃO pode apagar o histórico salvo.
{
  const server = fakeServer();
  const tabA = createWorkspaceSync(server.transport);
  assert.equal(await tabA.set("cognitive-lab:sessions:v2", [session("s1"), session("s2")], persistent), true);

  const tabB = createWorkspaceSync(server.transport);
  server.failNextReads(1);
  const read = await tabB.get<unknown[]>("cognitive-lab:sessions:v2");
  assert.equal(read, null, "contrato preservado: falha de leitura retorna null");
  // O módulo chamador monta a lista a partir do vazio e salva a sessão nova.
  assert.equal(await tabB.set("cognitive-lab:sessions:v2", [session("s3")], persistent), true);
  const ids = (server.rows.get("cognitive-lab:sessions:v2")!.data as Array<{ id: string }>).map((item) => item.id).sort();
  assert.deepEqual(ids, ["s1", "s2", "s3"], "a gravação após falha de leitura une, nunca sobrescreve");
}

// 2) Duas abas com base comum: inclusões e exclusões dos dois lados sobrevivem.
{
  const server = fakeServer();
  const seed = createWorkspaceSync(server.transport);
  await seed.set("diario:sono", [session("a"), session("b"), session("c")], persistent);

  const tabA = createWorkspaceSync(server.transport);
  const tabB = createWorkspaceSync(server.transport);
  const baseA = (await tabA.get<Array<{ id: string }>>("diario:sono"))!;
  const baseB = (await tabB.get<Array<{ id: string }>>("diario:sono"))!;

  // A exclui "b" e inclui "d"; B edita "c" e inclui "e" sem ver o que A fez.
  assert.equal(await tabA.set("diario:sono", [...baseA.filter((item) => item.id !== "b"), session("d")], persistent), true);
  assert.equal(await tabB.set("diario:sono", [
    ...baseB.map((item) => item.id === "c" ? { ...item, nota: "editado em B" } : item),
    session("e"),
  ], persistent), true);

  const final = server.rows.get("diario:sono")!.data as Array<{ id: string; nota?: string }>;
  assert.deepEqual(final.map((item) => item.id).sort(), ["a", "c", "d", "e"], "exclusão de A e inclusões de A e B preservadas");
  assert.equal(final.find((item) => item.id === "c")?.nota, "editado em B", "edição de B preservada");
}

// 3) Edição vence exclusão: nenhum registro clínico editado some em silêncio.
{
  const base = [session("x", { v: 1 })];
  const local = [session("x", { v: 2 })];
  const server: typeof base = [];
  assert.deepEqual(mergeRecordLists(base, local, server).map((item) => item.v), [2]);
  assert.deepEqual(mergeRecordLists(base, server, local).map((item) => item.v), [2]);
}

// 4) Objeto sem base confiável é recusado: preserva o que já está salvo.
{
  const server = fakeServer();
  const tabA = createWorkspaceSync(server.transport);
  await tabA.set("caa:workspace:v3", { board: ["sim", "não"], favs: ["água"] }, persistent);
  const tabB = createWorkspaceSync(server.transport);
  server.failNextReads(1);
  assert.equal(await tabB.get("caa:workspace:v3"), null);
  const warn = console.warn;
  console.warn = () => undefined;
  try {
    assert.equal(await tabB.set("caa:workspace:v3", { board: [], favs: [] }, persistent), false);
  } finally {
    console.warn = warn;
  }
  assert.deepEqual(server.rows.get("caa:workspace:v3")!.data, { board: ["sim", "não"], favs: ["água"] });
}

// 5) Objeto com base: mescla por chave (cada aba mudou um campo diferente).
{
  const server = fakeServer();
  const seed = createWorkspaceSync(server.transport);
  await seed.set("caa:workspace:v3", { board: ["sim"], favs: ["água"] }, persistent);
  const tabA = createWorkspaceSync(server.transport);
  const tabB = createWorkspaceSync(server.transport);
  const a = (await tabA.get<Record<string, string[]>>("caa:workspace:v3"))!;
  const b = (await tabB.get<Record<string, string[]>>("caa:workspace:v3"))!;
  await tabA.set("caa:workspace:v3", { ...a, board: ["sim", "não"] }, persistent);
  await tabB.set("caa:workspace:v3", { ...b, favs: ["água", "banheiro"] }, persistent);
  assert.deepEqual(server.rows.get("caa:workspace:v3")!.data, { board: ["sim", "não"], favs: ["água", "banheiro"] });
}

// 6) Rascunho efêmero: a edição mais recente da aba vence (sem recusa).
{
  const server = fakeServer();
  const tabA = createWorkspaceSync(server.transport);
  const tabB = createWorkspaceSync(server.transport);
  await tabA.set("scale-draft:snap", { respostas: [1] }, draft);
  assert.equal(await tabB.set("scale-draft:snap", { respostas: [2, 3] }, draft), true);
  assert.deepEqual(server.rows.get("scale-draft:snap")!.data, { respostas: [2, 3] });
}

// 7) Gravações rápidas na mesma aba são serializadas e não geram conflito falso.
{
  const server = fakeServer();
  const tab = createWorkspaceSync(server.transport);
  const results = await Promise.all([1, 2, 3, 4].map((n) =>
    tab.set("diario:escola", Array.from({ length: n }, (_, index) => session(`r${index}`)), persistent)));
  assert.deepEqual(results, [true, true, true, true]);
  assert.equal((server.rows.get("diario:escola")!.data as unknown[]).length, 4, "a última gravação da fila prevalece");
}

// 8) Limite de tamanho e falha de rede na gravação retornam false sem lançar.
{
  const server = fakeServer();
  const tab = createWorkspaceSync(server.transport);
  assert.equal(await tab.set("diario:grande", "x".repeat(1_500_000), persistent), false);
  const failing = createWorkspaceSync({
    ...server.transport,
    putItem: async () => { throw new Error("offline"); },
  });
  assert.equal(await failing.set("diario:offline", [session("z")], persistent), false);
}

// 9) Sem mudança real de nenhum lado, a mesclagem é estável.
assert.deepEqual(mergeWorkspaceValues([session("k")], [session("k")], [session("k")], false), [session("k")]);
assert.equal(mergeWorkspaceValues(undefined, "texto local", "texto servidor", false), MERGE_REFUSED);

console.log("✓ workspace da conta: concorrência otimista e mesclagem em três vias sem perda de dados");
