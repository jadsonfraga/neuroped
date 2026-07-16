/**
 * Resolve os módulos que precisam existir numa instalação PWA recém-criada:
 * entrypoint, Home e cada atalho anunciado no manifest.webmanifest.
 */
export function resolveOfflineShellRoots({
  appSource,
  webManifest,
  buildManifest,
}) {
  const componentModules = new Map();
  for (const match of appSource.matchAll(
    /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("@\/pages\/([^"?]+)"\)/g,
  )) {
    componentModules.set(match[1], match[2]);
  }

  const routeComponents = new Map();
  for (const match of appSource.matchAll(
    /<Route\s+path="([^"]+)"\s+component=\{(\w+)\}/g,
  )) {
    routeComponents.set(match[1], match[2]);
  }
  for (const match of appSource.matchAll(
    /<Route\s+path="([^"]+)"[^>]*>([\s\S]*?)<\/Route>/g,
  )) {
    const component = [...match[2].matchAll(/<(\w+)\b/g)]
      .map((candidate) => candidate[1])
      .find((candidate) => componentModules.has(candidate));
    if (component) routeComponents.set(match[1], component);
  }

  const sources = Object.keys(buildManifest);
  const findPageSource = (modulePath) =>
    sources.find((source) =>
      source.endsWith(`src/pages/${modulePath}.tsx`),
    );

  const roots = new Set(
    Object.entries(buildManifest)
      .filter(([source, chunk]) =>
        chunk.isEntry || /(?:^|\/)pages\/home\.tsx$/.test(source),
      )
      .map(([source]) => source),
  );

  const shortcutRoutes = (webManifest.shortcuts || []).map((shortcut) => {
    const rawUrl = String(shortcut.url || "");
    const hash = rawUrl.indexOf("#");
    return hash >= 0 ? rawUrl.slice(hash + 1).split(/[?#]/, 1)[0] || "/" : "/";
  });

  for (const route of shortcutRoutes) {
    const component = routeComponents.get(route);
    const modulePath = component && componentModules.get(component);
    const source = modulePath && findPageSource(modulePath);
    if (!component || !modulePath || !source) {
      throw new Error(
        `Atalho PWA ${route} não pôde ser associado a um módulo lazy publicado.`,
      );
    }
    roots.add(source);
  }

  if (![...roots].some((source) => buildManifest[source]?.isEntry)) {
    throw new Error("Entrypoint principal ausente no manifesto Vite.");
  }
  if (![...roots].some((source) => /(?:^|\/)pages\/home\.tsx$/.test(source))) {
    throw new Error("Chunk lazy da Home ausente no manifesto Vite.");
  }

  return { roots: [...roots], shortcutRoutes };
}
