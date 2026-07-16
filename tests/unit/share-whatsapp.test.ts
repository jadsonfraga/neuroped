import assert from "node:assert/strict";
import { shareWhatsAppDocument } from "../../client/src/lib/shareText.ts";

type GlobalName = "navigator" | "window" | "File";

const originalGlobals = new Map<GlobalName, PropertyDescriptor | undefined>();
for (const name of ["navigator", "window", "File"] as const) {
  originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
}

function setGlobal(name: GlobalName, value: unknown) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function restoreGlobals() {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
}

const title = "Escala NeuroPed — respostas completas";
const sentinel =
  "INÍCIO DO RELATÓRIO\n" +
  "pergunta e resposta\n".repeat(250) +
  "FIM-SENTINELA";

try {
  {
    const shared: ShareData[] = [];
    let clipboardCalls = 0;
    let popupCalls = 0;
    setGlobal("navigator", {
      canShare: () => false,
      share: async (data: ShareData) => {
        shared.push(data);
      },
      clipboard: {
        writeText: async () => {
          clipboardCalls += 1;
        },
      },
    });
    setGlobal("window", {
      open: () => {
        popupCalls += 1;
        return {};
      },
      location: { assign: () => undefined },
    });

    const outcome = await shareWhatsAppDocument({
      title,
      text: sentinel,
      filename: "respostas-completas",
    });

    assert.equal(outcome, "shared-text");
    assert.deepEqual(shared, [{ title, text: sentinel }]);
    assert.equal(clipboardCalls, 0, "WhatsApp não deve copiar automaticamente");
    assert.equal(popupCalls, 0, "Web Share de texto deve anteceder wa.me");
  }

  {
    class FakeFile {
      readonly name: string;
      readonly type: string;

      constructor(
        _parts: unknown[],
        name: string,
        options?: { type?: string },
      ) {
        this.name = name;
        this.type = options?.type || "";
      }
    }

    const shared: ShareData[] = [];
    setGlobal("File", FakeFile);
    setGlobal("navigator", {
      canShare: (data: ShareData) => Boolean(data.files?.length),
      share: async (data: ShareData) => {
        shared.push(data);
      },
    });
    setGlobal("window", {
      open: () => {
        throw new Error("wa.me não deveria abrir quando o arquivo é suportado");
      },
      location: { assign: () => undefined },
    });

    const outcome = await shareWhatsAppDocument({
      title,
      text: sentinel,
      filename: "Escala Ágil",
    });

    assert.equal(outcome, "shared-file");
    assert.equal(shared.length, 1);
    assert.equal(shared[0].files?.[0]?.name, "escala-agil.txt");
  }

  {
    let clipboardCalls = 0;
    let openedUrl = "";
    const openedWindow: { opener?: unknown } = { opener: "origin" };
    setGlobal("navigator", {
      clipboard: {
        writeText: async () => {
          clipboardCalls += 1;
        },
      },
    });
    setGlobal("window", {
      open: (url: string) => {
        openedUrl = url;
        return openedWindow;
      },
      location: { assign: () => undefined },
    });

    const outcome = await shareWhatsAppDocument({ title, text: sentinel });

    assert.equal(outcome, "opened-whatsapp");
    assert.ok(openedUrl.startsWith("https://wa.me/?text="));
    assert.equal(
      decodeURIComponent(openedUrl.split("?text=")[1]),
      sentinel,
      "o fallback deve preservar inclusive a cauda do relatório",
    );
    assert.equal(openedWindow.opener, null);
    assert.equal(clipboardCalls, 0, "wa.me não deve copiar automaticamente");
  }

  {
    let nativeShareCalls = 0;
    let openedUrl = "";
    setGlobal("navigator", {
      share: async () => {
        nativeShareCalls += 1;
      },
    });
    setGlobal("window", {
      open: (url: string) => {
        openedUrl = url;
        return {};
      },
      location: { assign: () => undefined },
    });

    const outcome = await shareWhatsAppDocument({
      title,
      text: sentinel,
      phone: "+55 (87) 99999-0000",
    });

    assert.equal(outcome, "opened-whatsapp");
    assert.equal(
      nativeShareCalls,
      0,
      "o destinatário informado deve ser mantido",
    );
    assert.ok(openedUrl.startsWith("https://wa.me/5587999990000?text="));
    assert.equal(decodeURIComponent(openedUrl.split("?text=")[1]), sentinel);
  }

  {
    let popupCalls = 0;
    setGlobal("navigator", {
      canShare: () => false,
      share: async () => {
        throw new DOMException("cancelado pelo usuário", "AbortError");
      },
    });
    setGlobal("window", {
      open: () => {
        popupCalls += 1;
        return {};
      },
      location: { assign: () => undefined },
    });

    const outcome = await shareWhatsAppDocument({ title, text: sentinel });

    assert.equal(outcome, "cancelled");
    assert.equal(
      popupCalls,
      0,
      "cancelar a folha nativa não deve abrir outra tela",
    );
  }

  {
    let assignedUrl = "";
    setGlobal("navigator", {
      canShare: () => false,
      share: async () => {
        throw new TypeError("Web Share indisponível");
      },
    });
    setGlobal("window", {
      open: () => null,
      location: {
        assign: (url: string) => {
          assignedUrl = url;
        },
      },
    });

    const outcome = await shareWhatsAppDocument({ title, text: sentinel });

    assert.equal(outcome, "opened-whatsapp");
    assert.ok(assignedUrl.startsWith("https://wa.me/?text="));
    assert.equal(decodeURIComponent(assignedUrl.split("?text=")[1]), sentinel);
  }
} finally {
  restoreGlobals();
}

console.log(
  "✓ compartilhamento WhatsApp: arquivo, texto e wa.me sem cópia/download",
);
