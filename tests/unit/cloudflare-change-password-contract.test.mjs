import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const route = read("functions/api/auth/change-password.ts");
const passwordPolicy = read("functions/api/auth/_passwordPolicy.ts");
const session = read("functions/api/auth/_passwordChangeSession.ts");
const middleware = read("functions/api/_middleware.ts");
const authClient = read("client/src/lib/authClient.ts");
const preferences = read("client/src/components/PreferencesPanel.tsx");

assert.match(route, /verifyPassword\(currentPassword, user\.password_hash\)/);
assert.match(route, /verifyPassword\(newPassword, user\.password_hash\)/);
assert.match(route, /passwordPolicyError\(newPassword, ["']A nova senha["']\)/);
assert.match(passwordPolicy, /PASSWORD_MIN = 12/);
assert.match(passwordPolicy, /PASSWORD_MAX = 128/);
assert.match(passwordPolicy, /\[A-Z\]/);
assert.match(passwordPolicy, /\[a-z\]/);
assert.match(passwordPolicy, /\[0-9\]/);
assert.match(passwordPolicy, /\[\^A-Za-z0-9\]/);
assert.match(route, /UPDATE auth_refresh_sessions[\s\S]*revoke_reason = 'password_changed'/);
assert.match(route, /preparePasswordChangeSession/);
assert.match(route, /env\.DB\.batch\(/);
assert.match(route, /auth\.password\.change/);
assert.doesNotMatch(route, /JSON\.stringify\([^)]*(currentPassword|newPassword)/);
assert.doesNotMatch(route, /console\.(?:log|info|warn)\([^\n]*(currentPassword|newPassword)/);

assert.match(session, /INSERT INTO auth_refresh_sessions/);
assert.match(session, /password_hash = \?/);
assert.match(session, /signJwt/);
assert.match(session, /sha256Hex\(refreshToken\)/);

assert.match(middleware, /"\/api\/auth\/change-password"/);
assert.match(middleware, /PASSWORD_CHANGE_REQUIRED/);
assert.match(
  middleware,
  /passwordChangeFailure\(request, user\) \?\? roleFailure\(request, user\)/,
  "must_change_password deve bloquear APIs clínicas antes do RBAC comum",
);

assert.match(authClient, /export async function changePasswordRequest/);
assert.match(authClient, /"\/api\/auth\/change-password"/);
assert.match(authClient, /replaceAuthSession\(data\)/);
assert.doesNotMatch(authClient, /writeToken\([^\n]*(currentPassword|newPassword)/);

assert.match(preferences, /changePasswordRequest/);
assert.match(preferences, /user\?\.mustChangePassword/);
assert.match(preferences, /if \(passwordChangeRequired\) setOpen\(true\)/);
assert.match(preferences, /if \(passwordChangeRequired && !nextOpen\) return/);
assert.match(preferences, /data-testid="remote-password-change-form"/);
assert.match(preferences, /autoComplete="current-password"/);
assert.match(preferences, /autoComplete="new-password"/);
assert.match(preferences, /window\.location\.reload\(\)/);
assert.doesNotMatch(preferences, /localStorage\.setItem\([^\n]*password/i);
assert.doesNotMatch(preferences, /sessionStorage\.setItem\([^\n]*password/i);

console.log("✓ Cloudflare change-password: política canônica, revogação, sessão nova, middleware e UX permanecem acoplados");
