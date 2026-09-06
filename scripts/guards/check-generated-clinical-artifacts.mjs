/**
 * Confere que os artefatos clínicos DERIVADOS versionados no repositório
 * correspondem ao que seus geradores produzem a partir do catálogo atual.
 *
 * Por que isso é uma catraca e não uma formalidade: os geradores rodam como
 * `prebuild`, então a PRODUÇÃO sempre serve o artefato fresco. O que fica no
 * git é o que a REVISÃO lê e o que os testes importam. Quando os dois divergem,
 * o CI passa contra um catálogo que não é o publicado, e o documento de
 * proveniência — o que declara fonte e status de validação de cada instrumento —
 * passa a subdeclarar quantos instrumentos ainda aguardam validação
 * psicométrica. Subdeclarar incerteza clínica é pior que não declarar nada.
 *
 * O guard não escreve nada de forma persistente: gera, compara e restaura o
 * estado original em disco mesmo quando o gerador falha depois de escrever.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** Artefatos derivados e o comando que os regenera. */
const ARTEFATOS = [
  {
    arquivo: "docs/PROVENIENCIA_CLINICA.md",
    gerador: [
      "node",
      ["--import", "tsx", "scripts/guards/validate-catalog.mjs"],
    ],
    conserto: "npm run validate:catalog",
  },
];

const falhas = [];

for (const { arquivo, gerador, conserto } of ARTEFATOS) {
  const caminho = resolve(repoRoot, arquivo);
  let antes;
  try {
    antes = readFileSync(caminho, "utf8");
  } catch {
    falhas.push(`${arquivo}: ausente do repositório (rode ${conserto})`);
    continue;
  }

  const [cmd, args] = gerador;
  let depois;
  let geradorFalhou = false;

  try {
    execFileSync(cmd, args, { cwd: repoRoot, stdio: "pipe" });
    depois = readFileSync(caminho, "utf8");
  } catch (error) {
    // Um gerador que não roda é falha do guard, não licença para passar.
    falhas.push(
      `${arquivo}: o gerador falhou (${error.status ?? "erro"}); rode ${conserto}`,
    );
    geradorFalhou = true;
  } finally {
    // O gerador pode escrever o artefato e só depois descobrir uma falha
    // estrutural. A restauração precisa ocorrer também nesse caminho de erro.
    try {
      let atual;
      try {
        atual = readFileSync(caminho, "utf8");
      } catch {
        atual = null;
      }
      if (atual !== antes) writeFileSync(caminho, antes, "utf8");
    } catch (error) {
      falhas.push(
        `${arquivo}: falha ao restaurar o artefato após a conferência (${error.code ?? "erro"})`,
      );
      geradorFalhou = true;
    }
  }

  if (geradorFalhou || depois === undefined) continue;

  if (depois !== antes) {
    const conta = (texto, rotulo) => {
      const m = texto.match(new RegExp(`\\*\\*${rotulo}:\\*\\* (\\d+)`));
      return m ? m[1] : "?";
    };
    falhas.push(
      `${arquivo}: versionado declara ${conta(antes, "Total de instrumentos")} instrumentos ` +
        `(${conta(antes, "Aguardando validação psicométrica publicada")} aguardando validação), ` +
        `mas o catálogo atual produz ${conta(depois, "Total de instrumentos")} ` +
        `(${conta(depois, "Aguardando validação psicométrica publicada")} aguardando validação). ` +
        `Rode ${conserto} e versione o resultado.`,
    );
  }
}

if (falhas.length) {
  console.error(
    "❌ artefatos clínicos derivados fora de sincronia com o catálogo:",
  );
  for (const f of falhas) console.error(`   - ${f}`);
  process.exit(1);
}

console.log(
  `✅ artefatos clínicos derivados: ${ARTEFATOS.length} em sincronia com o catálogo.`,
);
