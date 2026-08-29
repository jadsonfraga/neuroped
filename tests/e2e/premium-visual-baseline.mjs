import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const captureDir = path.resolve(
  root,
  process.env.PREMIUM_PROOF_DIR || "artifacts/premium-v13",
);
const baselinePath = path.resolve(
  root,
  "tests/visual-baselines/premium-v13-dhash.json",
);
const reportPath = path.join(captureDir, "visual-baseline-report.json");
const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

assert.equal(
  baseline.algorithm,
  "dhash-9x8-nearest",
  "Algoritmo de baseline visual desconhecido",
);
assert.ok(
  Number.isInteger(baseline.maxHammingDistance) &&
    baseline.maxHammingDistance >= 0 &&
    baseline.maxHammingDistance < 32,
  "Limiar visual deve ser explícito e estrito",
);

function hammingHex(a, b) {
  let value = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (value) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const browser = await chromium.launch(
  executablePath
    ? {
        executablePath,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }
    : undefined,
);
const page = await browser.newPage({ viewport: { width: 320, height: 240 } });

async function dHash(buffer) {
  const base64 = buffer.toString("base64");
  return page.evaluate(async (payload) => {
    const img = new Image();
    img.src = `data:image/png;base64,${payload}`;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas 2D indisponível");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 9, 8);

    const rgba = ctx.getImageData(0, 0, 9, 8).data;
    const gray = (index) =>
      0.299 * rgba[index] + 0.587 * rgba[index + 1] + 0.114 * rgba[index + 2];

    let bits = "";
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const left = (y * 9 + x) * 4;
        const right = left + 4;
        bits += gray(left) > gray(right) ? "1" : "0";
      }
    }

    let hex = "";
    for (let index = 0; index < bits.length; index += 4) {
      hex += Number.parseInt(bits.slice(index, index + 4), 2).toString(16);
    }
    return hex.padStart(16, "0");
  }, base64);
}

const results = [];
let failed = false;

try {
  for (const [filename, expected] of Object.entries(baseline.captures)) {
    const file = path.join(captureDir, filename);
    assert.ok(fs.existsSync(file), `Captura obrigatória ausente: ${filename}`);
    const actual = await dHash(fs.readFileSync(file));
    const distance = hammingHex(actual, expected);
    const passed = distance <= baseline.maxHammingDistance;
    results.push({ filename, expected, actual, distance, passed });
    failed ||= !passed;
    console.log(
      `[visual-baseline] ${passed ? "✓" : "✗"} ${filename}: ${distance}/${baseline.maxHammingDistance}`,
    );
  }
} finally {
  await browser.close();
}

fs.writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      algorithm: baseline.algorithm,
      maxHammingDistance: baseline.maxHammingDistance,
      approvedFromCommit: baseline.approvedFromCommit,
      results,
    },
    null,
    2,
  )}\n`,
);

assert.equal(
  failed,
  false,
  "Regressão perceptual detectada: uma ou mais capturas excederam o baseline aprovado",
);
console.log("[visual-baseline] ✓ composição premium dentro do baseline versionado.");
