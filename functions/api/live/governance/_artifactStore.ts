/**
 * _artifactStore.ts — adapter R2 para os artefatos de exportação LGPD.
 *
 * O executor de exportação já existia e recebia um `PrivateArtifactStore`
 * abstrato, mas nenhuma implementação real estava conectada: só o duplo de
 * teste. Este arquivo é o adapter.
 *
 * O que o storage recebe é SEMPRE ciphertext — a cifra acontece antes, no
 * executor, com o keyring canônico do Clinical LIVE. O bucket nunca vê dado
 * clínico legível, então uma leitura indevida do bucket não é vazamento de
 * PHI.
 *
 * Sem binding, `resolvePrivateArtifactStore` devolve null e o chamador falha
 * fechado. Não existe fallback para storage público, para disco local nem para
 * "guardar no D1 por enquanto": exportação sem destino privado é uma operação
 * que não deve acontecer, e não uma que deve acontecer de outro jeito.
 */
import type { PrivateArtifactStore } from "./_worker-executor";

export interface ArtifactStoreEnv {
  /** Bucket R2 privado dos artefatos LGPD. Provisionado pelo operador. */
  LGPD_EXPORT_BUCKET?: R2Bucket;
}

class R2PrivateArtifactStore implements PrivateArtifactStore {
  constructor(private readonly bucket: R2Bucket) {}

  async put(key: string, value: Uint8Array): Promise<void> {
    await this.bucket.put(key, value, {
      httpMetadata: {
        contentType: "application/octet-stream",
        // O artefato nunca deve ser servido de cache: o acesso é sempre
        // mediado por uma checagem de autorização no backend.
        cacheControl: "no-store",
      },
    });
  }

  async get(key: string): Promise<Uint8Array | null> {
    const object = await this.bucket.get(key);
    if (!object) return null;
    return new Uint8Array(await object.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}

/**
 * Devolve o store privado, ou null quando o bucket não está provisionado.
 * Chamadores devem tratar null como "não executar", nunca como "executar de
 * outro jeito".
 */
export function resolvePrivateArtifactStore(
  env: ArtifactStoreEnv,
): PrivateArtifactStore | null {
  const bucket = env.LGPD_EXPORT_BUCKET;
  if (!bucket || typeof bucket.put !== "function") return null;
  return new R2PrivateArtifactStore(bucket);
}
