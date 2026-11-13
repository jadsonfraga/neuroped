/**
 * Mesclagem em três vias (base, local, servidor) para o workspace da conta.
 *
 * Usada só quando o servidor recusa uma gravação por versão (409): outra aba ou
 * aparelho gravou depois da nossa leitura. Em vez de sobrescrever (perda do que
 * o outro salvou) ou desistir (perda do que o usuário acabou de fazer), compara
 * cada lado com a base lida, como o git faz com arquivos:
 *
 * - listas de registros com `id` string são mescladas por id: inclusões dos dois
 *   lados permanecem, exclusões só valem se o outro lado não editou o registro
 *   (edição vence exclusão: nenhum dado clínico some em silêncio);
 * - objetos simples são mesclados chave a chave contra a base;
 * - sem base confiável (a leitura anterior falhou), listas de registros viram
 *   união por id, que nunca apaga nada; qualquer outro formato é recusado e a
 *   gravação não acontece, preservando o que já está salvo.
 *
 * Tudo acontece em memória. Nada aqui grava no navegador.
 */

export const MERGE_REFUSED: unique symbol = Symbol("workspace-merge-refused");
export type MergeOutcome = unknown | typeof MERGE_REFUSED;

type RecordWithId = { id: string } & Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function isRecordList(value: unknown): value is RecordWithId[] {
  if (!Array.isArray(value)) return false;
  const seen = new Set<string>();
  for (const item of value) {
    if (!isPlainObject(item) || typeof item.id !== "string" || item.id.length === 0) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
  }
  return true;
}

/** Serialização estável (chaves ordenadas) para comparar valores vindos do JSON. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

export function sameValue(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function indexById(list: RecordWithId[]): Map<string, RecordWithId> {
  return new Map(list.map((item) => [item.id, item]));
}

/**
 * Mescla listas de registros por id. `base` ausente = união segura (sem exclusões).
 * A ordem segue a lista local (a que o usuário está vendo) e acrescenta, ao final,
 * os registros que só existem no servidor.
 */
export function mergeRecordLists(
  base: RecordWithId[] | undefined,
  local: RecordWithId[],
  server: RecordWithId[],
): RecordWithId[] {
  const baseById = base ? indexById(base) : null;
  const serverById = indexById(server);
  const localIds = new Set(local.map((item) => item.id));
  const merged: RecordWithId[] = [];

  for (const mine of local) {
    const theirs = serverById.get(mine.id);
    const original = baseById?.get(mine.id);
    if (theirs) {
      // Só o servidor mudou este registro: fica a versão do servidor.
      if (original && sameValue(mine, original)) merged.push(theirs);
      else merged.push(mine);
      continue;
    }
    // Não existe no servidor: ou é novo aqui, ou foi excluído lá.
    if (original && sameValue(mine, original)) continue; // excluído lá, intocado aqui
    merged.push(mine); // novo aqui, ou editado aqui (edição vence exclusão)
  }

  for (const theirs of server) {
    if (localIds.has(theirs.id)) continue;
    const original = baseById?.get(theirs.id);
    if (original && sameValue(theirs, original)) continue; // excluído aqui, intocado lá
    merged.push(theirs); // novo lá, editado lá, ou base desconhecida (união)
  }
  return merged;
}

function mergeObjects(
  base: Record<string, unknown>,
  local: Record<string, unknown>,
  server: Record<string, unknown>,
): Record<string, unknown> | typeof MERGE_REFUSED {
  const merged: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(server)]);
  for (const key of keys) {
    const original = base[key];
    const mine = local[key];
    const theirs = server[key];
    let value: unknown;
    if (sameValue(mine, original)) value = theirs;
    else if (sameValue(theirs, original) || sameValue(mine, theirs)) value = mine;
    else if (isRecordList(mine) && isRecordList(theirs)) {
      value = mergeRecordLists(isRecordList(original) ? original : undefined, mine, theirs);
    } else {
      // Os dois lados mudaram o mesmo campo: prevalece a ação mais recente
      // (a deste dispositivo), como em editores colaborativos por propriedade.
      value = mine;
    }
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}

/**
 * @param base    valor lido do servidor antes da edição (`undefined` = desconhecido)
 * @param local   valor que o usuário quer gravar
 * @param server  valor atual do servidor, que recusou a gravação por versão
 * @param ephemeral rascunho de aba (TTL): a edição mais recente desta aba vence
 */
export function mergeWorkspaceValues(
  base: unknown,
  local: unknown,
  server: unknown,
  ephemeral: boolean,
): MergeOutcome {
  if (sameValue(local, server)) return local;
  if (ephemeral) return local;
  const hasBase = base !== undefined;
  if (hasBase && sameValue(server, base)) return local;
  if (hasBase && sameValue(local, base)) return server;

  if (isRecordList(local) && isRecordList(server)) {
    return mergeRecordLists(hasBase && isRecordList(base) ? base : undefined, local, server);
  }
  if (hasBase && isPlainObject(base) && isPlainObject(local) && isPlainObject(server)) {
    return mergeObjects(base, local, server);
  }
  return MERGE_REFUSED;
}
