import { readFileSync, writeFileSync } from "node:fs";

const path = "client/src/pages/receita-c1-express.tsx";
let text = readFileSync(path, "utf8");

const oldImport = 'import signatureImageUrl from "@/assets/images/jadson-signature.jpg";';
const newImport = `${oldImport}\nimport { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";`;
if (!text.includes("drJadsonMasterShieldLogo")) {
  if (!text.includes(oldImport)) throw new Error("anchor de import não encontrado");
  text = text.replace(oldImport, newImport);
}

const oldEmbed = "  const signatureImage = await pdf.embedJpg(signatureImageBytes);";
const newEmbed = `${oldEmbed}\n  const logoImage = await pdf.embedJpg(drJadsonMasterShieldLogo.split(\",\")[1] ?? \"\");`;
if (!text.includes("const logoImage = await pdf.embedJpg")) {
  if (!text.includes(oldEmbed)) throw new Error("anchor de embed não encontrado");
  text = text.replace(oldEmbed, newEmbed);
}

const oldHeader = `    page.drawText(CLINIC_NAME, { x: m + 8, y: top - 39, size: 11, font: serif, color: rgb(1, 1, 1) });
    page.drawText("NEUROPEDIATRIA - NEURODESENVOLVIMENTO", { x: m + 8, y: top - 48, size: 4.4, font: bold, color: rgb(0.85, 0.88, 1) });`;
const newHeader = `    const logoDims = logoImage.scaleToFit(24, 24);
    page.drawImage(logoImage, {
      x: m + 6,
      y: top - 51 + (24 - logoDims.height) / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
    page.drawText(CLINIC_NAME, { x: m + 36, y: top - 39, size: 11, font: serif, color: rgb(1, 1, 1) });
    page.drawText("NEUROPEDIATRIA - NEURODESENVOLVIMENTO", { x: m + 36, y: top - 48, size: 4.4, font: bold, color: rgb(0.85, 0.88, 1) });`;
if (!text.includes("const logoDims = logoImage.scaleToFit")) {
  if (!text.includes(oldHeader)) throw new Error("anchor do cabeçalho não encontrado");
  text = text.replace(oldHeader, newHeader);
}

writeFileSync(path, text, "utf8");
console.log("C1 Express logo hotfix aplicado.");
