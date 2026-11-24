import assert from "node:assert/strict";
import {
  SIGNATURE_PADDING,
  dataUrlBytes,
  hasTransparency,
  inkBounds,
  paddedCrop,
  scaledSize,
} from "../../client/src/lib/renderizador/signature-image.mjs";

// Imagem sintética 40x20 RGBA: traço opaco no retângulo x 10..19, y 5..9; resto transparente.
const W = 40;
const H = 20;
const rgba = new Uint8ClampedArray(W * H * 4);
for (let y = 5; y <= 9; y++) for (let x = 10; x <= 19; x++) rgba.set([20, 20, 20, 255], (y * W + x) * 4);

assert.deepEqual(inkBounds(rgba, W, H), { x: 10, y: 5, w: 10, h: 5 }, "caixa exata do traço");
assert.equal(inkBounds(new Uint8ClampedArray(W * H * 4), W, H), null, "imagem transparente não tem traço");
const faint = new Uint8ClampedArray(W * H * 4);
faint.set([0, 0, 0, 8], 3 * 4 + 3);
assert.equal(inkBounds(faint, W, H), null, "ruído quase invisível não conta como traço");

assert.deepEqual(paddedCrop({ x: 10, y: 5, w: 10, h: 5 }, W, H, 2), { x: 8, y: 3, w: 14, h: 9 }, "folga ao redor do traço");
assert.deepEqual(paddedCrop({ x: 0, y: 0, w: 10, h: 5 }, W, H, SIGNATURE_PADDING), { x: 0, y: 0, w: 16, h: 11 }, "folga não sai da imagem");
assert.deepEqual(paddedCrop({ x: 30, y: 15, w: 10, h: 5 }, W, H, 4), { x: 26, y: 11, w: 14, h: 9 }, "folga limitada à borda direita e inferior");

assert.deepEqual(scaledSize(800, 200, 1600), { w: 800, h: 200 }, "nunca amplia");
assert.deepEqual(scaledSize(3200, 800, 1600), { w: 1600, h: 400 }, "reduz mantendo a proporção");
assert.deepEqual(scaledSize(3000, 1, 1500), { w: 1500, h: 1 }, "altura mínima de 1 px");

assert.equal(hasTransparency(rgba), true);
assert.equal(hasTransparency(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255])), false, "fundo opaco é detectado");

const png = "data:image/png;base64," + Buffer.alloc(300).toString("base64");
assert.equal(dataUrlBytes(png), 300, "bytes reais do PNG na data URL");
assert.equal(dataUrlBytes("data:image/png;base64," + Buffer.alloc(301).toString("base64")), 301);
console.log("Preparo da imagem da assinatura (recorte, folga, redução, fundo opaco): OK");
