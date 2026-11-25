import { authFetch, getAccessToken, getAuthSessionEpoch, getStoredUser } from "@/lib/authClient";

function activeClinic(): string {
  try { return sessionStorage.getItem("neuroped:active-clinic-id") ?? ""; }
  catch { return ""; }
}

export function captureOwnerPdfScope(): () => void {
  const epoch = getAuthSessionEpoch();
  const clinic = activeClinic();
  const authenticated = Boolean(getAccessToken());
  return () => {
    if (getAuthSessionEpoch() !== epoch || activeClinic() !== clinic || Boolean(getAccessToken()) !== authenticated) {
      throw new Error("A sessão ou a clínica mudou. Gere o documento novamente.");
    }
  };
}

export type OwnerFacsimileImage = { bytes: ArrayBuffer; media: "image/png" | "image/jpeg" };
export async function loadOwnerPdfFacsimile(): Promise<OwnerFacsimileImage | null> {
  if (!getAccessToken()) return null;
  const role = getStoredUser()?.role;
  // Estes perfis não emitem como titular. Não obstrua seus relatórios com
  // chamada a uma rota de configuração que o middleware pode vedar.
  if (role === "visitor" || role === "operator" || role === "reader") return null;
  const assertSameScope = captureOwnerPdfScope();
  const response = await authFetch("/api/me/pdf-facsimile", { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  assertSameScope();
  if (response.status === 204) return null;
  const media = response.headers.get("content-type");
  if (!response.ok || (media !== "image/jpeg" && media !== "image/png")) {
    const failure: { code?: string } = await response.json().catch(() => ({}));
    assertSameScope();
    if (failure.code === "PDF_FACSIMILE_NOT_REGISTERED") throw new Error("Cadastre a imagem em Configurações › Perfil antes de gerar o PDF.");
    throw new Error("Não foi possível carregar a imagem manuscrita. O PDF não foi gerado.");
  }
  const bytes = await response.arrayBuffer();
  assertSameScope();
  if (bytes.byteLength < 8 || bytes.byteLength > (media === "image/png" ? 480_000 : 120_000)) throw new Error("Imagem manuscrita inválida.");
  return { bytes, media };
}

export async function loadOwnerFacsimileDataUrl(): Promise<string | null> {
  const image = await loadOwnerPdfFacsimile();
  if (!image) return null;
  return "data:" + image.media + ";base64," + ownerImageBase64(image.bytes);
}

export function ownerImageBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let start = 0; start < view.length; start += 8192) {
    binary += String.fromCharCode(...view.subarray(start, start + 8192));
  }
  return btoa(binary);
}

/** User-supplied markup is never accepted; only a literal image data URI passes. */
export function ownerFacsimilePrintMarkup(image?: string | null): string {
  if (!image) return "";
  if (!/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(image) || image.length > 640_050) {
    throw new Error("Imagem manuscrita inválida.");
  }
  return '<div style="text-align:center;margin:8pt 0;break-inside:avoid" data-owner-facsimile>' +
    '<img src="' + image + '" alt="Imagem manuscrita do titular" style="display:block;margin:0 auto 3pt;max-width:46mm;max-height:12mm;object-fit:contain">' +
    '<div style="font:7pt Arial,sans-serif">Imagem manuscrita · não é assinatura digital</div></div>';
}

export async function waitForOwnerFacsimileImage(document: Document): Promise<void> {
  const stamp = document.querySelector<HTMLImageElement>("[data-owner-facsimile] img");
  if (!stamp) return;
  await stamp.decode();
  if (!stamp.naturalWidth) throw new Error("A imagem não pôde ser incluída. O PDF não foi gerado.");
}
