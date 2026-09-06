import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export const PROJECT_ID = "prj_8gsXbaQoOZHgbhjnqiMPR9A5jg5b";
export function verifiedOwner(project) {
  assert.equal(project?.id, PROJECT_ID, "VERCEL_PROJECT_IDENTITY_MISMATCH");
  assert.equal(project.link?.type, "github", "VERCEL_REPOSITORY_LINK_REQUIRED");
  assert.equal(project.link?.org, "jadsonfraga", "VERCEL_REPOSITORY_OWNER_MISMATCH");
  assert.equal(project.link?.repo, "neuroped", "VERCEL_REPOSITORY_MISMATCH");
  assert.equal(project.link?.repoId, 1231255433, "VERCEL_REPOSITORY_ID_MISMATCH");
  assert(/^[A-Za-z0-9_-]{8,128}$/.test(project.accountId || ""), "VERCEL_OWNER_ID_MISSING");
  return project.accountId;
}
export async function resolveOwner(token, configuredScope, fetcher = fetch) {
  assert(token?.trim(), "VERCEL_CREDENTIAL_MISSING");
  // A personal ID is not a valid teamId query. Default scope is authenticated personal scope.
  const suffix = configuredScope?.startsWith("team_") ? `?teamId=${encodeURIComponent(configuredScope)}` : "";
  const response = await fetcher(`https://api.vercel.com/v9/projects/${PROJECT_ID}${suffix}`, {headers: {Authorization: `Bearer ${token.trim()}`}, signal: AbortSignal.timeout(20000)});
  if (!response.ok) throw new Error(`VERCEL_CANONICAL_PROJECT_HTTP_${response.status}`);
  return verifiedOwner(await response.json());
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // stdout is consumed by the caller as VERCEL_ORG_ID, not printed as a credential.
  process.stdout.write(await resolveOwner(process.env.VERCEL_TOKEN, process.env.VERCEL_ORG_ID));
}
