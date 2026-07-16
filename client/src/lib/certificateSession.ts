const LEGACY_DB_NAME = "neuroped-icp";

/**
 * Remove o cache legado que persistia certificado A1 e senha em texto claro.
 * Certificados passam a existir somente na memória da aba atual.
 */
export async function purgeLegacyCertificateCache(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(LEGACY_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}
