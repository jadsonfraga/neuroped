// Pós-build do ESPELHO (Vercel): impede indexação e duplicidade de conteúdo.
// A fonte canônica é https://neuroped.pages.dev (canonical no index.html).
// Sobrescreve robots.txt para bloquear tudo e remove o sitemap.
import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const out = join(process.cwd(), "dist", "public");
writeFileSync(
  join(out, "robots.txt"),
  "# Espelho de homologação — não indexar. Fonte canônica: https://neuroped.pages.dev\nUser-agent: *\nDisallow: /\n",
);
rmSync(join(out, "sitemap.xml"), { force: true });
console.log("mirror-seo: robots.txt = Disallow: / ; sitemap.xml removido");
