import { writeFileSync } from "node:fs";
import { descritivoGolden } from "./golden-descritivo";

writeFileSync(new URL("../fixtures/golden-descritivo.json", import.meta.url), `${JSON.stringify(descritivoGolden(), null, 2)}\n`);
console.log("golden-descritivo.json regenerado");
