import { readFile } from "node:fs/promises";
import { parseQwenJsonText } from "../../client/src/lib/laudo/qwenContract.ts";

const file = process.argv[2];
if (!file) {
  console.error("Uso: npm run validate:qwen-draft -- caminho/para/laudo.json");
  process.exit(2);
}

try {
  const result = parseQwenJsonText(await readFile(file, "utf8"));
  console.log(
    JSON.stringify(
      {
        ok: true,
        canPreview: result.canPreview,
        canExport: result.canExport,
        patientLabel: result.entrada.nome,
        warnings: result.warnings,
      },
      null,
      2,
    ),
  );
  process.exit(result.canExport ? 0 : 3);
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : "JSON Qwen inválido",
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
