import { readFileSync, writeFileSync } from "node:fs";

const middlewarePath = "functions/api/_middleware.ts";
let middleware = readFileSync(middlewarePath, "utf8");
const publicAnchor = '  "/api/auth/logout",\n]);';
if (!middleware.includes('  "/api/cert",')) {
  if (!middleware.includes(publicAnchor)) throw new Error("PUBLIC_API_PATHS anchor not found");
  middleware = middleware.replace(publicAnchor, '  "/api/auth/logout",\n  "/api/cert",\n]);');
}
writeFileSync(middlewarePath, middleware, "utf8");

const testPath = "tests/unit/cloudflare-auth-middleware.test.ts";
let test = readFileSync(testPath, "utf8");
const oldAssertion = `assert.equal(\n  (await call("/api/cert", { DB: authDb("reader"), NEUROPED_JWT_SECRET: secret }, readerToken)).status,\n  200,\n  "middleware autentica a rota aposentada; o handler sempre responde 410",\n);`;
const newAssertion = `assert.equal(\n  (await call("/api/cert", { DB: authDb("reader"), NEUROPED_JWT_SECRET: secret })).status,\n  200,\n  "middleware deixa a rota aposentada pública para o handler responder 410",\n);\n\nconst retiredCertificateThroughMiddleware = await onRequest({\n  request: new Request("https://neuroped.test/api/cert"),\n  env: { DB: authDb(), NEUROPED_JWT_SECRET: secret },\n  next: async () => certificateHandler({} as never),\n  data: {},\n} as never);\nassert.equal(\n  retiredCertificateThroughMiddleware.status,\n  410,\n  "contrato completo /api/cert deve responder 410 mesmo com D1/auth ativos",\n);\nconst retiredCertificateBody = await retiredCertificateThroughMiddleware.json() as Record<string, unknown>;\nassert.equal(retiredCertificateBody.code, "CERT_ENDPOINT_RETIRED");\nassert.equal("cert" in retiredCertificateBody, false);\nassert.equal("password" in retiredCertificateBody, false);`;
if (!test.includes("retiredCertificateThroughMiddleware")) {
  if (!test.includes(oldAssertion)) throw new Error("certificate middleware assertion anchor not found");
  test = test.replace(oldAssertion, newAssertion);
}
writeFileSync(testPath, test, "utf8");

console.log("/api/cert 410 middleware hotfix applied");
