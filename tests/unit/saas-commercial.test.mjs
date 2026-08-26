import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const app = read("client/src/App.tsx");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const routePolicy = read("client/src/security/routeGuardPolicy.ts");
const main = read("client/src/main.tsx");
const login = read("client/src/pages/login.tsx");
const pricing = read("client/src/pages/planos.tsx");
const subscription = read("client/src/pages/assinatura.tsx");
const invitation = read("client/src/pages/convite.tsx");
const client = read("client/src/lib/saasClient.ts");
const billingMe = read("functions/api/billing/me.ts");

assert.match(app, /const PlanosPage = lazy\(\(\) => import\("@\/pages\/planos"\)\)/);
assert.match(app, /const ConvitePage = lazy\(\(\) => import\("@\/pages\/convite"\)\)/);
assert.match(app, /const AssinaturaPage = lazy\(\(\) => import\("@\/pages\/assinatura"\)\)/);
assert.match(app, /<Route path="\/assinatura">[\s\S]*<RouteGuard roles=\{\["admin", "professional"\]\}>/);
assert.match(publicRoutes, /"\/planos"/);
assert.match(publicRoutes, /"\/invite"/);
assert.doesNotMatch(publicRoutes, /"\/convite"/);
assert.match(routePolicy, /"\/assinatura"/);
assert.match(main, /pathname === "\/invite" \|\| pathname === "\/planos"/);
assert.match(main, /window\.location\.hash = `#\$\{pathname\}\$\{window\.location\.search\}`/);
assert.match(login, /resolveLoginDestination\(window\.location\.href\)/);
assert.match(login, /stripLoginNextParameter\(window\.location\.href\)/);
assert.doesNotMatch(login, /requestedNextPath/);
assert.match(pricing, /CANONICAL_PRICE_CENTS/);
assert.match(pricing, /CANONICAL_TRIAL_DAYS/);
assert.match(pricing, /\/login\?next=\/assinatura/);
assert.match(subscription, /getBillingSnapshot\(activeClinicId\)/);
assert.match(subscription, /startCheckout\(activeClinicId, seats\)/);
assert.match(subscription, /createInvitation\(\{ clinicId: activeClinicId/);
assert.match(subscription, /listInvitations\(activeClinicId\)/);
assert.match(invitation, /acceptInvitation\(token, name\.trim\(\), password\)/);
assert.match(client, /authFetch\("\/api\/billing\/checkout"/);
assert.match(client, /authFetch\("\/api\/billing\/accept"/);
assert.doesNotMatch(client, /(^|\n)\s*fetch\(/);
assert.match(billingMe, /clinicIdFromRequest/);
assert.match(billingMe, /cm\.clinic_id = \?/);
assert.match(billingMe, /TENANT_FORBIDDEN/);

console.log("SaaS commercial UI and tenant-aware billing contracts passed.");
