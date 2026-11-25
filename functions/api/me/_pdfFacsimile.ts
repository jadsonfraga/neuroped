const MAX_BYTES = 480_000;
const MAX_JPEG_BYTES = 120_000;
export type FacsimileMedia = "image/png" | "image/jpeg";
export const FACSIMILE_MAX_SEGMENTS = 16;

export function ownerFacsimileEligible(input: {
  userId: string; clinicId: string; clinicRole: string; clinicStatus: string;
  expectedUser: string; expectedClinic: string; passwordChangeRequired: boolean;
}): boolean {
  return Boolean(input.expectedUser && input.expectedClinic
    && input.userId === input.expectedUser && input.clinicId === input.expectedClinic
    && input.clinicRole === "owner" && input.clinicStatus === "active" && !input.passwordChangeRequired);
}

export function acceptableFacsimileSize(size: number): boolean {
  return Number.isInteger(size) && size >= 8 && size <= MAX_BYTES;
}

export async function verifyFacsimileObject(bytes: Uint8Array, expected: string, media: FacsimileMedia = "image/jpeg"): Promise<boolean> {
  return /^[a-f0-9]{64}$/.test(expected) && hasFacsimileShape(bytes, media) && await facsimileDigest(bytes) === expected;
}

export const FACSIMILE_SEGMENT_SIZE = 30_000;
export function jpegFacsimileShape(bytes: Uint8Array): boolean {
  return bytes.length <= MAX_JPEG_BYTES && acceptableFacsimileSize(bytes.length) && bytes[0] === 0xff && bytes[1] === 0xd8 &&
    bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
}

export function hasFacsimileShape(bytes: Uint8Array, media: FacsimileMedia): boolean {
  if (media === "image/jpeg") return jpegFacsimileShape(bytes);
  if (bytes.length < 45 || bytes.length > MAX_BYTES) return false;
  const header = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
  const tail = [0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130];
  if (!header.every((v, i) => bytes[i] === v) || !tail.every((v, i) => bytes[bytes.length - tail.length + i] === v)) return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const w = view.getUint32(16), h = view.getUint32(20);
  return w > 0 && h > 0 && w <= 4096 && h <= 4096 && w * h <= 5_000_000;
}

export async function facsimileDigest(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes)));
  return Array.from(digest, value => value.toString(16).padStart(2, "0")).join("");
}

export async function readBoundedFacsimile(request: Request): Promise<{ bytes: Uint8Array; media: FacsimileMedia } | null> {
  if (!request.body || !request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  const reader = request.body.getReader();
  const buffer = new Uint8Array(Math.ceil(MAX_BYTES * 4 / 3) + 64);
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength + size > buffer.length) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      buffer.set(value, size);
      size += value.byteLength;
    }
    const input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, size))) as { png?: unknown; jpeg?: unknown } | null;
    if (!input || Object.keys(input).length !== 1) return null;
    const media: FacsimileMedia = typeof input.png === "string" ? "image/png" : "image/jpeg";
    const raw = media === "image/png" ? input.png : input.jpeg;
    const limit = media === "image/png" ? MAX_BYTES : MAX_JPEG_BYTES;
    if (typeof raw !== "string" || raw.length % 4 !== 0 || raw.length > Math.ceil(limit * 4 / 3) || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return null;
    const decoded = atob(raw);
    return { media, bytes: Uint8Array.from(decoded, char => char.charCodeAt(0)) };
  } catch { return null;
  } finally {
    reader.releaseLock();
  }
}
