from pathlib import Path

entry = Path("tests/unit/deploy-entrypoints.test.mjs")
text = entry.read_text()
anchor = '''const ignoredDirectories = new Set([\n  ".git",\n  "node_modules",\n  "dist",\n  "coverage",\n  "tests",\n]);\n'''
replacement = anchor + '''const workflowOwnedMutators = new Set([\n  "scripts/finalize-clinical-encryption-release.sh",\n]);\n'''
if "workflowOwnedMutators" not in text:
    if anchor not in text:
        raise SystemExit("ignoredDirectories anchor missing")
    text = text.replace(anchor, replacement, 1)

old_loop = '''for (const absolute of walk(root)) {\n  const content = readFileSync(absolute, "utf8");\n  for (const pattern of forbiddenMutations) {\n'''
new_loop = '''for (const absolute of walk(root)) {\n  const relativePath = relative(root, absolute);\n  if (workflowOwnedMutators.has(relativePath)) continue;\n  const content = readFileSync(absolute, "utf8");\n  for (const pattern of forbiddenMutations) {\n'''
if old_loop in text:
    text = text.replace(old_loop, new_loop, 1)
elif new_loop not in text:
    raise SystemExit("walk loop anchor missing")

assert_anchor = '''assert.deepEqual(\n  violations,\n  [],\n  `scripts fora dos workflows não podem publicar ou alterar provedores:\\n${violations.join("\\n")}`,\n);\n'''
extra = assert_anchor + '''\nconst clinicalFinalizer = read("scripts/finalize-clinical-encryption-release.sh");\nassert.match(clinicalFinalizer, /GITHUB_ACTIONS[^\\n]*true/);\nassert.match(clinicalFinalizer, /GITHUB_REF[^\\n]*refs\\/heads\\/main/);\nassert.match(clinicalFinalizer, /GITHUB_WORKFLOW[^\\n]*Deploy Cloudflare Pages/);\nassert.match(clinicalFinalizer, /wrangler@4 pages deploy dist\\/public --project-name \\"?\\$PROJECT\\"? --branch main/);\nassert.match(\n  read(".github/workflows/deploy-cloudflare.yml"),\n  /run: bash scripts\\/finalize-clinical-encryption-release\\.sh/,\n  "o único helper mutador permitido deve ser invocado pelo workflow oficial",\n);\n'''
if "const clinicalFinalizer" not in text:
    if assert_anchor not in text:
        raise SystemExit("violation assertion anchor missing")
    text = text.replace(assert_anchor, extra, 1)
entry.write_text(text)

gov = Path("tests/unit/workflow-governance.test.mjs")
gtext = gov.read_text()
gtext = gtext.replace(
    "/Backend canônico, D1, CORS e autenticação confirmados\\./",
    "/Backend canônico, D1, auth e criptografia strict confirmados\\./",
)
gov.write_text(gtext)
print("deploy governance patched")
