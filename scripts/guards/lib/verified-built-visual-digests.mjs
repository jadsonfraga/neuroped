import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const MANIFEST = "recognition-v2/manifest.json";
const SOURCES = new Set([
  "src/pages/teste-reconhecimento-visual.tsx",
  "client/src/pages/teste-reconhecimento-visual.tsx",
]);

function regularFile(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Ativo compilado deve ser arquivo regular local.");
  return readFileSync(path);
}

/** Distinguish public image checksums from credentials only after checking the
 * actual shipped bytes. No file-wide or value-wide secret-scanner exemptions.
 * Parse data records without executing the compiled application. */
export function createBuiltVisualDigestInspector(root) {
  if (!existsSync(join(root, MANIFEST))) return (_path, source) => source;
  const manifest = JSON.parse(regularFile(join(root, MANIFEST)).toString("utf8"));
  if (!Array.isArray(manifest.items) || !manifest.items.length) throw new Error("Manifesto visual compilado sem inventário.");
  const items = new Map();
  for (const item of manifest.items) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) || items.has(item.id) ||
        !/^[a-f0-9]{64}$/.test(item.sha256) || !/^EN\/[^/]+\.svg$/.test(item.sourcePath)) {
      throw new Error("Identidade ou checksum inválido no inventário compilado.");
    }
    const bytes = regularFile(join(root, "recognition-v2", `${item.id}.svg`));
    if (!bytes.toString("utf8").includes("<svg") || createHash("sha256").update(bytes).digest("hex") !== item.sha256) {
      throw new Error(`Imagem compilada não corresponde ao manifesto: ${item.id}`);
    }
    items.set(item.id, item);
  }
  const vite = JSON.parse(regularFile(join(root, ".vite/manifest.json")).toString("utf8"));
  const entries = Object.entries(vite).filter(([key, value]) => SOURCES.has(key) || SOURCES.has(value?.src));
  if (entries.length !== 1) throw new Error("Módulo canônico do reconhecimento ausente ou ambíguo no build.");
  const bundle = entries[0][1].file;
  if (!/^assets\/teste-reconhecimento-visual-[A-Za-z0-9_-]+\.js$/.test(bundle)) {
    throw new Error("Caminho inesperado para o módulo visual compilado.");
  }
  regularFile(join(root, bundle));

  return (relativePath, source) => {
    if (relativePath !== MANIFEST && relativePath !== bundle) return source;
    const parsed = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true,
      relativePath === MANIFEST ? ts.ScriptKind.JSON : ts.ScriptKind.JS);
    if (parsed.parseDiagnostics.length) throw new Error("Não foi possível analisar estruturalmente o inventário visual compilado.");
    function collectRecords(tree) {
      const ranges = [], seen = new Set();
      function literalProperty(node, name) {
        const matches = node.properties.filter(prop => ts.isPropertyAssignment(prop) &&
          (ts.isIdentifier(prop.name) || ts.isStringLiteralLike(prop.name)) && prop.name.text === name);
        // ts.isStringLiteral rejects a NoSubstitutionTemplateLiteral (backtick,
        // no interpolation) — exactly the form this build's minifier emits for
        // these fields. isStringLiteralLike accepts both AST kinds; .text reads
        // identically either way. Without this, every property lookup below
        // silently returns null, no digest is ever recognized as verified, and
        // every legitimate image sha256 leaks through as an unredacted match.
        if (matches.length !== 1 || !ts.isStringLiteralLike(matches[0].initializer)) return null;
        return matches[0].initializer;
      }
      function visit(node) {
        if (ts.isObjectLiteralExpression(node)) {
          const id = literalProperty(node, "id"), origin = literalProperty(node, "sourcePath"), digest = literalProperty(node, "sha256");
          const item = id && items.get(id.text);
          if (item && origin?.text === item.sourcePath && digest?.text === item.sha256) {
            ranges.push([digest.getStart(tree), digest.end, '"VERIFIED_LOCAL_VISUAL_ASSET_DIGEST"']);
            seen.add(item.id);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
      return { ranges, seen };
    }
    function replaceRanges(text, ranges) {
      let inspected = text;
      for (const [start, end, replacement] of ranges.sort((a, b) => b[0] - a[0])) {
        inspected = inspected.slice(0, start) + replacement + inspected.slice(end);
      }
      return inspected;
    }
    const { ranges, seen } = collectRecords(parsed);
    if (relativePath === MANIFEST && (ranges.length !== items.size || seen.size !== items.size)) {
      throw new Error("Estrutura ou campos duplicados no manifesto visual compilado.");
    }
    const decodedSources = [];
    // Vite may serialize large JSON through JSON.parse(string). Inspect the
    // decoded data structurally too, never execute the compiled application.
    // Retain decoded unverified fields for the credential scanner, rather than
    // letting string escaping conceal a credential beside a legitimate digest.
    if (relativePath === bundle) {
      function visitSerialized(node) {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "JSON" &&
            node.expression.name.text === "parse" && node.arguments.length === 1) {
          const literal = node.arguments[0];
          if (ts.isStringLiteral(literal) || ts.isNoSubstitutionTemplateLiteral(literal)) {
            let valid = true;
            try { JSON.parse(literal.text); } catch { valid = false; }
            if (valid) {
              const jsonTree = ts.createSourceFile("serialized.json", literal.text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSON);
              const records = collectRecords(jsonTree);
              const inspectedData = replaceRanges(literal.text, records.ranges);
              decodedSources.push(inspectedData);
              if (records.ranges.length) ranges.push([literal.getStart(parsed), literal.end, JSON.stringify(inspectedData)]);
            }
          }
        }
        ts.forEachChild(node, visitSerialized);
      }
      visitSerialized(parsed);
    }
    return replaceRanges(source, ranges) + (decodedSources.length ? "\n" + decodedSources.join("\n") : "");
  };
}
