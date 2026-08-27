import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const buildRoot = process.env.PERF_BUILD_DIR ? path.resolve(process.env.PERF_BUILD_DIR) : path.resolve("dist");
const budgets = JSON.parse(fs.readFileSync(path.join(root, "performance-budgets.json"), "utf8"));
const reportPath = path.resolve(process.env.PERF_REPORT ?? "artifacts/performance-report.json");
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push({ path: path.relative(buildRoot, full), bytes: fs.statSync(full).size });
  }
}
walk(buildRoot);
if (!files.length) {
  console.log(JSON.stringify({ status: "not_built", buildRoot, message: "Build ausente; execute npm run build:client antes do gate." }));
  process.exit(0);
}
const js = files.filter((file) => file.path.endsWith(".js"));
const fonts = files.filter((file) => /\.(woff2?|ttf|otf)$/.test(file.path));
const images = files.filter((file) => /\.(png|jpe?g|webp|avif|gif|svg)$/.test(file.path));
const total = files.reduce((sum, file) => sum + file.bytes, 0);
const violations = [];
const initialJs = js.filter((file) => /^public\/assets\/index-[^/]*\.js$/.test(file.path) || /^public\/assets\/(App|vendor-react|Layout|AuthContext)-[^/]*\.js$/.test(file.path)).reduce((sum, file) => sum + file.bytes, 0);
if (initialJs > budgets.javascriptInitialBytes) violations.push(`initial JS ${initialJs} > ${budgets.javascriptInitialBytes}`);
for (const file of js) if (file.bytes > budgets.javascriptChunkBytes) violations.push(`chunk ${file.path} ${file.bytes} > ${budgets.javascriptChunkBytes}`);
if (fonts.reduce((sum, file) => sum + file.bytes, 0) > budgets.fontBytes) violations.push(`fonts exceed ${budgets.fontBytes}`);
if (images.reduce((sum, file) => sum + file.bytes, 0) > budgets.imageBytes) violations.push(`images exceed ${budgets.imageBytes}`);
if (total > budgets.totalStaticBytes) violations.push(`static total ${total} > ${budgets.totalStaticBytes}`);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
const report = { status: violations.length ? "failed" : "passed", measuredAt: new Date().toISOString(), buildRoot, budgets, totals: { staticBytes: total, initialJsBytes: initialJs, javascriptBytes: js.reduce((sum, file) => sum + file.bytes, 0), fontBytes: fonts.reduce((sum, file) => sum + file.bytes, 0), imageBytes: images.reduce((sum, file) => sum + file.bytes, 0) }, largest: [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 20), violations };
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
if (violations.length) process.exit(1);
