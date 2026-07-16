export interface ViteManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
  assets?: string[];
}

export interface PwaWebManifest {
  shortcuts?: Array<{ url?: string }>;
}

export function resolveOfflineShellRoots(options: {
  appSource: string;
  webManifest: PwaWebManifest;
  buildManifest: Record<string, ViteManifestChunk>;
}): { roots: string[]; shortcutRoutes: string[] };
