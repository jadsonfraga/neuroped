import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const members = readFileSync(
  new URL("../../functions/api/tenants/[id]/members.ts", import.meta.url),
  "utf8",
);

assert.match(members, /ON CONFLICT\(clinic_id, user_id\) DO UPDATE SET[\s\S]*?WHERE clinic_memberships\.role <> 'owner'/);
assert.match(members, /excluded\.role = 'owner'/);
assert.match(members, /\? = 'owner'[\s\S]*?other\.role = 'owner'[\s\S]*?other\.active = 1/);
assert.match(members, /Somente owner pode rebaixar outro owner/);
assert.match(members, /LAST_OWNER_PROTECTED/);
assert.match(members, /UPDATE clinic_memberships[\s\S]*?role <> 'owner'[\s\S]*?EXISTS/);
assert.doesNotMatch(members, /SELECT COUNT\(\*\) AS total/);

console.log("saas owner membership race regression ok");
