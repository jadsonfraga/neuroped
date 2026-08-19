/**
 * Camada abstrata de object storage S3-compatible.
 *
 * Provedores suportados (todos sao S3-compatible):
 *  - Supabase Storage  — preferido para BR/LGPD (regiao sa-east-1 em Sao Paulo)
 *  - Cloudflare R2     — zero egress fees, otimo custo-beneficio
 *  - AWS S3 sa-east-1  — premium, compliance maxima
 *  - Backblaze B2      — alternativa barata
 *  - MinIO             — self-hosted local
 *
 * Configuracao via env:
 *  STORAGE_PROVIDER       supabase|r2|s3|b2|minio
 *  STORAGE_ENDPOINT       URL do endpoint S3 (ex: https://<projeto>.supabase.co/storage/v1/s3)
 *  STORAGE_REGION         regiao (sa-east-1 para BR)
 *  STORAGE_BUCKET         nome do bucket
 *  STORAGE_ACCESS_KEY     access key id
 *  STORAGE_SECRET_KEY     secret access key
 *  STORAGE_PUBLIC_URL     URL publica para download (opcional, fallback para signed URL)
 *  STORAGE_FORCE_PATH_STYLE  "true" para R2 e MinIO, "false" para AWS/Supabase
 *
 * URLs assinadas:
 *  - Upload: 5 min de validade
 *  - Download: 15 min de validade
 *
 * Criptografia at-rest:
 *  Todos os provedores recomendados oferecem cripto at-rest no nivel do disco.
 *  Para criptografia client-side antes do upload, ver `encryptStream()`.
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

export class CloudStorageError extends Error {}
export class CloudStorageConfigError extends CloudStorageError {}

function isStorageNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    candidate.$metadata?.httpStatusCode === 404 ||
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey" ||
    candidate.name === "NoSuchObject"
  );
}

let _client: S3Client | null = null;

function getStorageConfig() {
  const provider = (process.env.STORAGE_PROVIDER || "").toLowerCase();
  const endpoint = process.env.STORAGE_ENDPOINT;
  const region = process.env.STORAGE_REGION || "sa-east-1";
  const bucket = process.env.STORAGE_BUCKET;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE === "true";

  if (!provider) {
    throw new CloudStorageConfigError(
      "STORAGE_PROVIDER nao definido. Configure storage no .env (supabase|r2|s3|b2|minio).",
    );
  }
  if (!bucket) throw new CloudStorageConfigError("STORAGE_BUCKET ausente");
  if (!accessKey || !secretKey) {
    throw new CloudStorageConfigError("STORAGE_ACCESS_KEY ou STORAGE_SECRET_KEY ausentes");
  }

  return { provider, endpoint, region, bucket, accessKey, secretKey, forcePathStyle };
}

function getClient(): S3Client {
  if (_client) return _client;
  const c = getStorageConfig();
  _client = new S3Client({
    region: c.region,
    endpoint: c.endpoint,
    forcePathStyle: c.forcePathStyle,
    credentials: {
      accessKeyId: c.accessKey,
      secretAccessKey: c.secretKey,
    },
  });
  return _client;
}

export interface UploadParams {
  key: string;
  contentType: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface SignedUrl {
  url: string;
  method: "PUT" | "GET";
  expiresInSeconds: number;
  key: string;
}

/**
 * Gera URL assinada para upload direto do cliente ao bucket.
 * O cliente faz PUT na URL retornada com o body do arquivo.
 *
 * @param params.key   Caminho dentro do bucket (ex: "patients/abc123/laudo.pdf")
 * @returns URL assinada valida por 5 minutos
 */
export async function getUploadSignedUrl(params: UploadParams): Promise<SignedUrl> {
  const c = getStorageConfig();
  const client = getClient();

  const cmd = new PutObjectCommand({
    Bucket: c.bucket,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength,
    Metadata: params.metadata,
    ServerSideEncryption: c.provider === "s3" ? "AES256" : undefined,
  });

  const expiresInSeconds = 5 * 60;
  const url = await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });

  return { url, method: "PUT", expiresInSeconds, key: params.key };
}

/**
 * Gera URL assinada para download.
 * @returns URL valida por 15 minutos
 */
export async function getDownloadSignedUrl(key: string, expiresInSeconds = 15 * 60): Promise<SignedUrl> {
  const c = getStorageConfig();
  const client = getClient();

  const cmd = new GetObjectCommand({ Bucket: c.bucket, Key: key });
  const url = await getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });

  return { url, method: "GET", expiresInSeconds, key };
}

/**
 * Apaga objeto do bucket.
 */
export async function deleteObject(key: string): Promise<void> {
  const c = getStorageConfig();
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: c.bucket, Key: key }));
}

/**
 * Verifica se objeto existe e retorna metadata.
 */
export async function headObject(key: string): Promise<{
  contentLength?: number;
  contentType?: string;
  etag?: string;
  metadata?: Record<string, string>;
} | null> {
  const c = getStorageConfig();
  const client = getClient();
  try {
    const r = await client.send(new HeadObjectCommand({ Bucket: c.bucket, Key: key }));
    return {
      contentLength: r.ContentLength,
      contentType: r.ContentType,
      etag: r.ETag,
      metadata: r.Metadata,
    };
  } catch (error) {
    if (isStorageNotFoundError(error)) return null;
    throw new CloudStorageError("Falha ao consultar o objeto no storage.");
  }
}

/**
 * Baixa o objeto e calcula o SHA-256 no servidor.
 * O hash enviado pelo navegador nunca é usado como prova de integridade.
 */
export async function getObjectSha256(key: string): Promise<{
  sha256: string;
  contentLength: number;
  contentType?: string;
} | null> {
  const c = getStorageConfig();
  const client = getClient();
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: c.bucket, Key: key }));
    if (!response.Body) return null;

    const hash = crypto.createHash("sha256");
    let contentLength = 0;
    for await (const chunk of response.Body as AsyncIterable<Uint8Array | string>) {
      const bytes = typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk);
      hash.update(bytes);
      contentLength += bytes.byteLength;
    }

    return {
      sha256: hash.digest("hex"),
      contentLength,
      contentType: response.ContentType,
    };
  } catch (error) {
    if (isStorageNotFoundError(error)) return null;
    throw new CloudStorageError("Falha ao ler o objeto no storage para verificar sua integridade.");
  }
}

/**
 * Gera chave segura (path) para um arquivo.
 * Formato: <category>/<userId>/<yyyy>/<mm>/<uuid>-<filename-sanitized>
 *
 * Ex: laudos/u-abc123/2026/05/x9k2...nf-Avaliacao_Joao.pdf
 */
export function generateStorageKey(params: {
  category: string;
  userId: string;
  filename: string;
}): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const uuid = crypto.randomUUID();
  const sanitized = params.filename
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 80);

  return `${params.category}/${params.userId}/${yyyy}/${mm}/${uuid}-${sanitized}`;
}

/**
 * Provedores S3-compatible com config recomendada.
 * Util como referencia para o operador montar .env.
 */
export const PROVIDER_PRESETS = {
  supabase: {
    name: "Supabase Storage (sa-east-1)",
    forcePathStyle: false,
    endpointTemplate: "https://<PROJECT_REF>.supabase.co/storage/v1/s3",
    region: "sa-east-1",
    notes: "Use service_role key como STORAGE_ACCESS_KEY/SECRET_KEY (par S3-compatible).",
  },
  r2: {
    name: "Cloudflare R2",
    forcePathStyle: true,
    endpointTemplate: "https://<ACCOUNT_ID>.r2.cloudflarestorage.com",
    region: "auto",
    notes: "Zero egress fees. Crie bucket em Cloudflare Dashboard.",
  },
  s3: {
    name: "AWS S3 sa-east-1",
    forcePathStyle: false,
    endpoint: undefined,
    region: "sa-east-1",
    notes: "Server-side encryption AES256 ativada. Configure bucket policy + IAM.",
  },
  b2: {
    name: "Backblaze B2",
    forcePathStyle: true,
    endpointTemplate: "https://s3.<REGION>.backblazeb2.com",
    region: "us-west-002",
    notes: "Alternativa barata. Egress nao tao baixo quanto R2.",
  },
  minio: {
    name: "MinIO self-hosted",
    forcePathStyle: true,
    endpointTemplate: "http://localhost:9000",
    region: "us-east-1",
    notes: "Para desenvolvimento local. Nao usar em producao sem hardening.",
  },
} as const;
