import { getAccessToken } from "@/lib/authClient";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";

const DIARY_PREFIX = "diario:";

function assertDiaryKey(key: string): void {
  if (!key.startsWith(DIARY_PREFIX)) {
    throw new Error("secureDiaryStorage aceita apenas chaves diario:*");
  }
}

/**
 * Defesa em profundidade para o modo clínico LIVE.
 *
 * A UI também bloqueia os diários em sessão remota autenticada, mas esta camada
 * existe para que uma tela futura não consiga criar silenciosamente um prontuário
 * paralelo no dispositivo caso esqueça o guard visual.
 *
 * A presença do token é intencionalmente mais conservadora que o estado React:
 * assim que existem credenciais remotas, leitura/escrita de diário local falha
 * fechada. O logout global continua usando secureClearAll() diretamente e pode
 * destruir o cofre local conforme a política de segurança já existente.
 */
export function isRemoteDiaryPersistenceBlocked(): boolean {
  return (
    import.meta.env?.VITE_AUTH_MODE === "remote" &&
    Boolean(getAccessToken())
  );
}

export async function secureDiaryGet<T>(key: string): Promise<T | null> {
  assertDiaryKey(key);
  if (isRemoteDiaryPersistenceBlocked()) return null;
  return secureGet<T>(key);
}

export async function secureDiarySet<T>(key: string, value: T): Promise<boolean> {
  assertDiaryKey(key);
  if (isRemoteDiaryPersistenceBlocked()) return false;
  return secureSet(key, value);
}

export async function secureDiaryClear(key: string): Promise<void> {
  assertDiaryKey(key);
  if (isRemoteDiaryPersistenceBlocked()) return;
  await secureClear(key);
}
