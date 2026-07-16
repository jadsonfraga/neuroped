import assert from "node:assert/strict";
import {
  buildWhatsAppShareUrl,
  shareScaleViaWhatsApp,
  shareTextDocument,
} from "../../client/src/lib/shareText";

type ShareSpy = (data: ShareData) => Promise<void>;

function installBrowser(options: {
  share?: ShareSpy;
  canShare?: (data: ShareData) => boolean;
  open?: (url?: string | URL) => Window | null;
  assign?: (url: string | URL) => void;
  clipboard?: (text: string) => Promise<void>;
}) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      share: options.share,
      canShare: options.canShare,
      clipboard: options.clipboard
        ? { writeText: options.clipboard }
        : undefined,
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      open: options.open ?? (() => null),
      location: { assign: options.assign ?? (() => undefined) },
    },
  });
}

const longReport = [
  "ESCALA NEUROPED — RESPOSTAS COMPLETAS",
  ...Array.from(
    { length: 120 },
    (_, index) =>
      `${index + 1}. Pergunta clínica extensa ${index + 1}?\nResposta entregue: resposta íntegra ${index + 1}.`,
  ),
].join("\n\n");
assert.ok(encodeURIComponent(longReport).length > 1_800);

// Navegador que compartilha texto, mas não arquivos: deve abrir a folha nativa
// com o relatório integral, sem clipboard nem download silencioso.
let nativePayload: ShareData | undefined;
let clipboardCalls = 0;
installBrowser({
  canShare: () => false,
  share: async (data) => {
    nativePayload = data;
  },
  clipboard: async () => {
    clipboardCalls += 1;
  },
});
assert.equal(
  await shareTextDocument({ title: "Escala extensa", text: longReport }),
  "shared",
);
assert.equal(nativePayload?.text, longReport);
assert.equal(nativePayload?.files, undefined);
assert.equal(clipboardCalls, 0);

// Com suporte real a arquivos, o .txt deve conter tudo e usar MIME compatível.
nativePayload = undefined;
installBrowser({
  canShare: (data) => Boolean(data.files?.length),
  share: async (data) => {
    nativePayload = data;
  },
});
assert.equal(
  await shareScaleViaWhatsApp({
    title: "Escala extensa",
    text: longReport,
    filename: "escala-extensa",
  }),
  "shared",
);
const sharedFile = nativePayload?.files?.[0];
assert.ok(sharedFile);
assert.equal(sharedFile.type, "text/plain");
assert.equal(await sharedFile.text(), longReport);

// Com telefone informado, inclusive em relatório muito longo, deve abrir a
// conversa no número correto e nunca desviar para copiar/baixar.
let openedUrl = "";
let nativeShareCalls = 0;
clipboardCalls = 0;
installBrowser({
  share: async () => {
    nativeShareCalls += 1;
  },
  canShare: () => false,
  open: (url) => {
    openedUrl = String(url);
    return { opener: {} } as Window;
  },
  clipboard: async () => {
    clipboardCalls += 1;
  },
});
assert.equal(
  await shareScaleViaWhatsApp({
    title: "Escala extensa",
    text: longReport,
    phone: "55 (87) 99109-7371",
  }),
  "opened",
);
const parsedUrl = new URL(openedUrl);
assert.equal(parsedUrl.origin, "https://wa.me");
assert.equal(parsedUrl.pathname, "/5587991097371");
assert.equal(parsedUrl.searchParams.get("text"), longReport);
assert.equal(nativeShareCalls, 0);
assert.equal(clipboardCalls, 0);

// Popup bloqueado: navegação na própria aba mantém o envio acionável.
let assignedUrl = "";
installBrowser({
  open: () => null,
  assign: (url) => {
    assignedUrl = String(url);
  },
});
assert.equal(
  await shareScaleViaWhatsApp({ title: "Escala", text: longReport }),
  "navigated",
);
assert.equal(new URL(assignedUrl).searchParams.get("text"), longReport);

// Cancelar a folha nativa não pode abrir WhatsApp nem produzir falso sucesso.
let fallbackOpenCalls = 0;
installBrowser({
  canShare: () => false,
  share: async () => {
    throw new DOMException("cancelado", "AbortError");
  },
  open: () => {
    fallbackOpenCalls += 1;
    return null;
  },
});
assert.equal(
  await shareScaleViaWhatsApp({ title: "Escala", text: longReport }),
  "cancelled",
);
assert.equal(fallbackOpenCalls, 0);

assert.equal(buildWhatsAppShareUrl("   "), null);
console.log(
  "✓ envio de escalas abre compartilhamento/WhatsApp com conteúdo integral e sem clipboard silencioso",
);
