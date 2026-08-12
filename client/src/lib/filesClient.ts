/**
 * Cliente para upload/download de arquivos.
 *
 * Fluxo de upload:
 *  1. POST /api/files/sign-upload -> recebe { fileId, key, url, method }
 *  2. PUT diretamente na url assinada com o body do arquivo
 *  3. POST /api/files/:id/confirm com sha256 calculado
 *
 * Fluxo de download:
 *  1. GET /api/files/:id -> recebe metadata + downloadUrl
 *  2. Browser segue downloadUrl (ou window.open)
 */

import { authFetch } from "./authClient";

export interface FileUploadParams {
  file: File;
  category: "laudo" | "receita" | "exame" | "anamnese" | "consentimento" | "imagem-clinica" | "audio-anamnese" | "outros";
  patientId?: string;
  onProgress?: (percent: number) => void;
}

export interface FileMetadata {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256?: string | null;
  category?: string | null;
  patientId?: string | null;
  createdAt: string;
}

async function computeSha256(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload completo: sign -> PUT -> confirm.
 * Retorna o id e metadata do arquivo registrado.
 */
export async function uploadFile(params: FileUploadParams): Promise<FileMetadata> {
  const { file, category, patientId, onProgress } = params;

  // 1. Solicitar URL assinada
  const signResponse = await authFetch("/api/files/sign-upload", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      category,
      patientId,
    }),
  });

  if (!signResponse.ok) {
    const err = await signResponse.json().catch(() => ({}));
    throw new Error(err.error || `Falha ao solicitar URL assinada (${signResponse.status})`);
  }

  const { fileId, url, method } = await signResponse.json();

  // 2. Upload direto via PUT na URL assinada (com progresso opcional)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    if (onProgress) {
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          onProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload falhou: HTTP ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload falhou: erro de rede"));
    xhr.send(file);
  });

  // 3. Confirmar upload + enviar sha256 para integridade
  const sha256 = await computeSha256(file);
  const confirmResponse = await authFetch(`/api/files/${fileId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ sha256 }),
  });

  if (!confirmResponse.ok) {
    const err = await confirmResponse.json().catch(() => ({}));
    throw new Error(err.error || `Falha ao confirmar upload (${confirmResponse.status})`);
  }

  const data = await confirmResponse.json();
  return data.file;
}

/**
 * Lista arquivos do usuario logado, opcionalmente filtrado por paciente.
 */
export async function listFiles(patientId?: string): Promise<FileMetadata[]> {
  const url = patientId ? `/api/files?patientId=${encodeURIComponent(patientId)}` : "/api/files";
  const r = await authFetch(url);
  if (!r.ok) throw new Error("Falha ao listar arquivos");
  const payload = await r.json();
  // API paginada retorna { data, pagination }; aceita array puro por robustez.
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

/**
 * Obtem metadata + URL assinada de download para um arquivo.
 */
export async function getFile(fileId: string): Promise<FileMetadata & { downloadUrl: string; downloadExpiresInSeconds: number }> {
  const r = await authFetch(`/api/files/${fileId}`);
  if (!r.ok) throw new Error("Falha ao obter arquivo");
  return r.json();
}

/**
 * Inicia download do arquivo no browser (abre nova aba).
 */
export async function downloadFile(fileId: string): Promise<void> {
  const meta = await getFile(fileId);
  window.open(meta.downloadUrl, "_blank", "noopener,noreferrer");
}

/**
 * Apaga arquivo (soft-delete).
 */
export async function deleteFile(fileId: string): Promise<void> {
  const r = await authFetch(`/api/files/${fileId}`, { method: "DELETE" });
  if (!r.ok) throw new Error("Falha ao apagar arquivo");
}
