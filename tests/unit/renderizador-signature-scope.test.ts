import assert from "node:assert/strict";
import { test } from "node:test";
import { clearStoredSignature, readStoredSignature, storeSignature } from "../../client/src/lib/renderizador/signature-store";

test("não reutiliza imagem do titular após trocar de conta ou clínica no mesmo navegador", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const png = "data:image/png;base64,AAAA";
  const browser = new Map([["neuroped.renderizador.assinatura.v1", png]]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => browser.get(key), setItem: (key: string, v: string) => browser.set(key, v), removeItem: (key: string) => browser.delete(key),
  } });
  try {
    assert.equal(readStoredSignature("owner-a:alpha"), "", "não ler automaticamente uma imagem antiga sem dono");
    assert.ok(storeSignature("owner-a:alpha", png));
    assert.equal(readStoredSignature("owner-a:alpha"), png);
    assert.equal(readStoredSignature("owner-a:beta"), "");
    assert.equal(readStoredSignature("operator:alpha"), "");
    assert.equal(readStoredSignature(""), "");
    assert.equal(storeSignature("", png), false);
    clearStoredSignature("operator:alpha");
    assert.equal(readStoredSignature("owner-a:alpha"), png);
    clearStoredSignature("owner-a:alpha");
    assert.equal(readStoredSignature("owner-a:alpha"), "");
    assert.equal(browser.get("neuroped.renderizador.assinatura.v1"), png, "não apagar o original legado");
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
