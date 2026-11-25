/**
 * WhatsApp Cloud API transport. Server only. No route, scheduler or automatic
 * invocation is registered by this module. Callers MUST persist a unique
 * dispatch claim before use and treat uncertain sends as non-retryable.
 */
export type DeliveryConfig = {
  enabled: boolean;
  clinicalMediaApproved: boolean;
  graphVersion: string;
  phoneNumberId: string;
  accessToken: string;
  templateName: string;
  language: string;
};

export type DeliveryClaim = {
  clinicId: string;
  patientId: string;
  documentId: string;
  versionId: string;
  recipient: string;
  sha256: string;
  bytes: Uint8Array;
};

export type DeliveryResult =
  | { status: "blocked"; code: string }
  | { status: "failed"; code: string }
  | { status: "uncertain"; code: string }
  | { status: "accepted"; messageId: string };

/** Strict Brazilian mobile number; do not guess missing DDD or digits. */
export function normalizeDeliveryPhone(value: string): string | null {
  if (!/^[+()\d\s.-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  const full = digits.length === 11 ? "55" + digits : digits;
  return /^55[1-9][0-9]9[0-9]{8}$/.test(full) ? full : null;
}

export function deliveryConfigured(c: DeliveryConfig): boolean {
  return c.enabled === true && c.clinicalMediaApproved === true
    && /^v[0-9]+\.[0-9]+$/.test(c.graphVersion)
    && /^[0-9]{5,30}$/.test(c.phoneNumberId)
    && !!c.accessToken.trim() && /^[a-z0-9_]+$/.test(c.templateName)
    && c.language === "pt_BR";
}

type Dependencies = {
  /** Must re-read server-side durable claim, release, exact version, recipient
   * authorization, number and revocation status, scoped to clinic/patient.
   * A client assertion is not authorization. */
  isStillAuthorized: (claim: DeliveryClaim) => Promise<boolean>;
  fetcher?: typeof fetch;
};

export async function sendReleasedPdf(
  config: DeliveryConfig, claim: DeliveryClaim, deps: Dependencies,
): Promise<DeliveryResult> {
  const blocked = (code: string): DeliveryResult => ({ status: "blocked", code });
  if (!deliveryConfigured(config)) return blocked("TRANSPORT_DISABLED_OR_UNAPPROVED");
  const to = normalizeDeliveryPhone(claim.recipient);
  if (!to || to !== claim.recipient) return blocked("RECIPIENT_INVALID");
  if (![claim.clinicId, claim.patientId, claim.documentId, claim.versionId].every(Boolean))
    return blocked("DOCUMENT_SCOPE_MISSING");
  if (!/^[a-f0-9]{64}$/.test(claim.sha256)) return blocked("HASH_INVALID");
  // Snapshot bytes so a later asynchronous mutation cannot change the attachment.
  const bytes = new Uint8Array(claim.bytes);
  if (bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    return blocked("PDF_REQUIRED");
  const digest = await crypto.subtle.digest("SHA-256", bytes.buffer);
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  if (hash !== claim.sha256) return blocked("HASH_MISMATCH");
  const authorized = async () => {
    try { return (await deps.isStillAuthorized(claim)) === true; }
    catch { return false; }
  };
  if (!(await authorized())) return blocked("AUTHORIZATION_REQUIRED");
  const request = deps.fetcher ?? fetch;
  const base = "https://graph.facebook.com/" + config.graphVersion + "/" + config.phoneNumberId;
  const headers = { Authorization: "Bearer " + config.accessToken };
  // Generic filename and static approved template avoid identifiers in text.
  const form = new FormData();
  form.set("messaging_product", "whatsapp");
  form.set("type", "application/pdf");
  form.set("file", new Blob([bytes.buffer], { type: "application/pdf" }), "documento.pdf");
  let mediaId: string;
  try {
    const response = await request(base + "/media", {
      method: "POST", headers, body: form, redirect: "error", signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) return { status: "failed", code: "MEDIA_UPLOAD_REJECTED" };
    const body = await response.json() as { id?: unknown };
    if (typeof body.id !== "string" || !/^[0-9]{1,80}$/.test(body.id))
      return { status: "failed", code: "MEDIA_ID_INVALID" };
    mediaId = body.id;
  } catch {
    return { status: "failed", code: "MEDIA_UPLOAD_UNAVAILABLE" };
  }
  // Check again immediately before the irreversible dispatch. No fallback channel.
  // Uploaded media may require provider-side cleanup; it is never made public.
  if (!(await authorized())) return blocked("AUTHORIZATION_REVOKED");
  try {
    const response = await request(base + "/messages", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", recipient_type: "individual", to,
        type: "template", template: {
          name: config.templateName, language: { code: config.language },
          components: [{ type: "header", parameters: [{
            type: "document", document: { id: mediaId, filename: "documento.pdf" },
          }] }],
        },
      }),
    });
    // Do not automatically retry a dispatch after a possibly accepted request.
    if (!response.ok) return { status: "uncertain", code: "MESSAGE_NOT_CONFIRMED" };
    const body = await response.json() as { messages?: Array<{ id?: unknown }> };
    const id = body.messages?.[0]?.id;
    if (typeof id !== "string" || !/^wamid\.[A-Za-z0-9_+/=-]{1,500}$/.test(id))
      return { status: "uncertain", code: "MESSAGE_ID_INVALID" };
    return { status: "accepted", messageId: id }; // Not a delivery receipt.
  } catch {
    return { status: "uncertain", code: "MESSAGE_NOT_CONFIRMED" };
  }
}
