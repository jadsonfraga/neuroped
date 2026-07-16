/**
 * Normalize an application route before comparing it with a registered route.
 * Query strings and hash fragments are not part of the router path contract.
 */
export function normalizeRoutePath(value) {
  if (typeof value !== "string" || value.trim() === "") return "/";

  const pathname = value.trim().split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return withLeadingSlash === "/" ? "/" : withLeadingSlash.replace(/\/+$/, "");
}

/**
 * Match a concrete path against the route syntax used by wouter in App.tsx.
 * Named segments (for example `:id`) consume exactly one non-empty segment;
 * `*` consumes the remaining segments.
 */
export function routePatternMatches(routePattern, concretePath) {
  const pattern = normalizeRoutePath(routePattern);
  const concrete = normalizeRoutePath(concretePath);

  if (pattern === concrete) return true;

  const patternSegments = pattern.split("/").filter(Boolean);
  const concreteSegments = concrete.split("/").filter(Boolean);
  const wildcardIndex = patternSegments.indexOf("*");

  if (wildcardIndex === -1 && patternSegments.length !== concreteSegments.length) {
    return false;
  }
  if (wildcardIndex !== -1 && concreteSegments.length < wildcardIndex) {
    return false;
  }

  for (let index = 0; index < patternSegments.length; index += 1) {
    const expected = patternSegments[index];
    const received = concreteSegments[index];

    if (expected === "*") return true;
    if (expected.startsWith(":")) {
      if (!received) return false;
      continue;
    }
    if (expected !== received) return false;
  }

  return patternSegments.length === concreteSegments.length;
}

export function hasRegisteredRoute(routePatterns, concretePath) {
  return routePatterns.some((pattern) => routePatternMatches(pattern, concretePath));
}
