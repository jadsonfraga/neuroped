import { writeFileSync } from "node:fs";
import { gameFingerprint, icedFingerprint, superFingerprint } from "./golden-pendencias";
const out = { _nota: "Fixture de congelamento. Regerar só com justificativa clínica/técnica registrada no PR.", super: superFingerprint(), iced: icedFingerprint(), game: gameFingerprint() };
writeFileSync(new URL("../fixtures/golden-pendencias.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
console.log("ok", Object.keys(out.super.levels).length);
