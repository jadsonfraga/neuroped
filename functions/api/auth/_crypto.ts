/**
 * _crypto.ts — Primitivas de auth compatíveis com Cloudflare Workers (Web Crypto).
 *
 * Sem dependências de Node (bcrypt não roda em Workers). Hash de senha via
 * PBKDF2-SHA256 e tokens JWT HS256, ambos com Web Crypto (`crypto.subtle`),
 * disponível tanto no runtime do Workers quanto no Node 18+ (testes via tsx).
 *
 * Arquivo começa com "_" → o Cloudflare Pages NÃO o expõe como rota; é módulo
 * compartilhado pelas functions de auth.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const KEY_BITS = 256;

// Hash sintaticamente válido, mas que não corresponde a nenhuma credencial real.
// É usado somente para executar o mesmo PBKDF2 quando o e-mail não existe,
// reduzindo enumeração por diferença grosseira de tempo de resposta.
export const DUMMY_PASSWORD_HASH =
  "pbkdf2$sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

// ── base64 / base64url ────────────────────────────────────────────────────
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function toB64Url(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return b64ToBytes(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}
function strToB64Url(s: string): string {
  return toB64Url(enc.encode(s));
}
function b64UrlToStr(s: string): string {
  return dec.decode(fromB64Url(s));
}

// Comparação de tempo constante (evita timing attack na verificação).
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ── Hash de senha (PBKDF2) ────────────────────────────────────────────────
// Formato armazenado: pbkdf2$sha256$<iter>$<saltB64>$<hashB64>
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(plaintext), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    key,
    KEY_BITS,
  );
  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${bytesToB64(salt)}$${bytesToB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(plaintext: string, stored: string | null | undefined): Promise<boolean> {
  if (!plaintext || !stored) return false;
  try {
    const parts = stored.split("$");
    if (parts.length !== 5 || parts[0] !== "pbkdf2") return false;
    const iterations = Number.parseInt(parts[2], 10);
    const salt = b64ToBytes(parts[3]);
    const expected = b64ToBytes(parts[4]);
    const key = await crypto.subtle.importKey("raw", enc.encode(plaintext), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(
      await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations, hash: PBKDF2_HASH },
        key,
        expected.length * 8,
      ),
    );
    return timingSafeEqual(bits, expected);
  } catch {
    return false;
  }
}

// ── JWT HS256 ─────────────────────────────────────────────────────────────
async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toB64Url(new Uint8Array(sig));
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  type: "access" | "refresh";
  /** Identificador estável da família/sessão autenticada. */
  sid?: string;
  /** Identificador único do refresh token; ausente em access tokens. */
  jti?: string;
  iat?: number;
  exp?: number;
}

/** Hash unidirecional usado para nunca persistir refresh tokens em claro. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresInSec: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = strToB64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = strToB64Url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  const data = `${header}.${body}`;
  const sig = await hmacSign(data, secret);
  return `${data}.${sig}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = await hmacSign(`${header}.${body}`, secret);
    if (!timingSafeEqual(enc.encode(sig), enc.encode(expected))) return null;
    const payload = JSON.parse(b64UrlToStr(body)) as JwtPayload;
    if (typeof payload.exp === "number" && Math.floor(Date.now() / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
