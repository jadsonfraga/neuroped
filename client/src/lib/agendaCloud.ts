import {
  agendaCloudWorkspaceSchema,
  emptyAgendaCloudWorkspace,
  isDemoSafeAgendaWorkspace,
  type AgendaCloudAuditEntry,
  type AgendaCloudSnapshot,
  type AgendaCloudWorkspace,
} from "@shared/agenda-cloud";
import { authFetch } from "@/lib/authClient";
import {
  persistentSecureGet,
  persistentSecureSet,
} from "@/lib/persistentSecureStorage";
import type { AgendaWorkspace } from "@/lib/agendaCore";

const AGENDA_REMOTE_CACHE_KEY = "agenda:remote-cache:v2";

export interface AgendaCloudLoadResult {
  snapshot: AgendaCloudSnapshot;
  offline: boolean;
  source: "remote" | "cache";
}

export class AgendaRevisionConflictError extends Error {
  latest: AgendaCloudSnapshot | null;

  constructor(message: string, latest: AgendaCloudSnapshot | null) {
    super(message);
    this.name = "AgendaRevisionConflictError";
    this.latest = latest;
  }
}

function toCloudWorkspace(workspace: AgendaWorkspace): AgendaCloudWorkspace {
  return {
    version: 2,
    appointments: workspace.appointments.map((item) => ({ ...item })),
    blocks: workspace.blocks.map((item) => ({ ...item })),
    waitlist: workspace.waitlist.map((item) => ({ ...item })),
  };
}

export function fromCloudWorkspace(workspace: AgendaCloudWorkspace): AgendaWorkspace {
  return {
    version: 1,
    appointments: workspace.appointments.map(({ patientId: _patientId, ...item }) => item),
    blocks: workspace.blocks.map((item) => ({ ...item })),
    waitlist: workspace.waitlist.map(({ patientId: _patientId, ...item }) => item),
  };
}

function parseSnapshot(value: unknown): AgendaCloudSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AgendaCloudSnapshot>;
  if (
    (candidate.mode !== "remote-live" && candidate.mode !== "demo-cloud") ||
    !Number.isInteger(candidate.revision) ||
    Number(candidate.revision) < 0 ||
    (candidate.updatedAt !== null && typeof candidate.updatedAt !== "string") ||
    (candidate.updatedByUserId !== null && typeof candidate.updatedByUserId !== "string")
  ) {
    return null;
  }
  const workspace = agendaCloudWorkspaceSchema.safeParse(candidate.workspace);
  if (!workspace.success) return null;
  return {
    workspace: workspace.data,
    revision: Number(candidate.revision),
    mode: candidate.mode,
    updatedAt: candidate.updatedAt ?? null,
    updatedByUserId: candidate.updatedByUserId ?? null,
  };
}

async function rememberSnapshot(snapshot: AgendaCloudSnapshot): Promise<void> {
  await persistentSecureSet(AGENDA_REMOTE_CACHE_KEY, snapshot);
}

export async function loadAgendaCloud(): Promise<AgendaCloudLoadResult> {
  try {
    const response = await authFetch("/api/agenda", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Agenda remota indisponível (${response.status}).`);
    }
    const snapshot = parseSnapshot(await response.json());
    if (!snapshot) throw new Error("Resposta inválida da Agenda Cloud.");
    await rememberSnapshot(snapshot);
    return { snapshot, offline: false, source: "remote" };
  } catch (cause) {
    const cached = parseSnapshot(
      await persistentSecureGet<AgendaCloudSnapshot>(AGENDA_REMOTE_CACHE_KEY),
    );
    if (cached) return { snapshot: cached, offline: true, source: "cache" };
    throw cause;
  }
}

export async function saveAgendaCloud(
  workspace: AgendaWorkspace,
  expectedRevision: number,
): Promise<AgendaCloudSnapshot> {
  const cloudWorkspace = toCloudWorkspace(workspace);
  const parsed = agendaCloudWorkspaceSchema.safeParse(cloudWorkspace);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Agenda inválida para sincronização.");
  }

  const response = await authFetch("/api/agenda", {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ expectedRevision, workspace: parsed.data }),
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 409) {
    throw new AgendaRevisionConflictError(
      body.error || "A agenda foi alterada em outro dispositivo.",
      parseSnapshot(body.latest),
    );
  }
  if (!response.ok) {
    const code = typeof body.code === "string" ? ` (${body.code})` : "";
    throw new Error((body.error || `Falha ao sincronizar a agenda${code}.`) + code);
  }
  const snapshot = parseSnapshot(body);
  if (!snapshot) throw new Error("Resposta inválida após sincronização da agenda.");
  await rememberSnapshot(snapshot);
  return snapshot;
}

export function cloudWorkspaceIsEmpty(snapshot: AgendaCloudSnapshot): boolean {
  return (
    snapshot.workspace.appointments.length === 0 &&
    snapshot.workspace.blocks.length === 0 &&
    snapshot.workspace.waitlist.length === 0
  );
}

export function localWorkspaceIsEmpty(workspace: AgendaWorkspace): boolean {
  return (
    workspace.appointments.length === 0 &&
    workspace.blocks.length === 0 &&
    workspace.waitlist.length === 0
  );
}

export function canImportLocalWorkspace(
  local: AgendaWorkspace,
  snapshot: AgendaCloudSnapshot,
): { allowed: boolean; reason?: string } {
  if (localWorkspaceIsEmpty(local)) return { allowed: false, reason: "Agenda local vazia." };
  const cloudLocal = toCloudWorkspace(local);
  if (snapshot.mode === "demo-cloud" && !isDemoSafeAgendaWorkspace(cloudLocal)) {
    return {
      allowed: false,
      reason: "Importação bloqueada: o Cloudflare desta instalação aceita somente conteúdo fictício DEMO.",
    };
  }
  return { allowed: true };
}

export function mergeLocalWorkspaceIntoCloud(
  local: AgendaWorkspace,
  snapshot: AgendaCloudSnapshot,
): AgendaWorkspace {
  const remote = fromCloudWorkspace(snapshot.workspace);
  const byId = <T extends { id: string }>(remoteItems: T[], localItems: T[]): T[] => {
    const merged = new Map(remoteItems.map((item) => [item.id, item]));
    for (const item of localItems) {
      if (!merged.has(item.id)) merged.set(item.id, item);
    }
    return [...merged.values()];
  };

  const candidate: AgendaWorkspace = {
    version: 1,
    appointments: byId(remote.appointments, local.appointments),
    blocks: byId(remote.blocks, local.blocks),
    waitlist: byId(remote.waitlist, local.waitlist),
  };
  const parsed = agendaCloudWorkspaceSchema.safeParse(toCloudWorkspace(candidate));
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ||
        "A agenda local conflita com a agenda remota e não pode ser importada automaticamente.",
    );
  }
  return candidate;
}

export async function loadAgendaAudit(limit = 30): Promise<AgendaCloudAuditEntry[]> {
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  const response = await authFetch(`/api/agenda/audit?limit=${safeLimit}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const body = await response.json().catch(() => ({}));
  if (!Array.isArray(body.data)) return [];
  return body.data
    .filter(
      (item: unknown): item is AgendaCloudAuditEntry =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as AgendaCloudAuditEntry).id === "string" &&
            typeof (item as AgendaCloudAuditEntry).action === "string" &&
            typeof (item as AgendaCloudAuditEntry).summary === "string" &&
            typeof (item as AgendaCloudAuditEntry).createdAt === "string",
        ),
    )
    .slice(0, safeLimit);
}

export function emptyAgendaCloudSnapshot(mode: AgendaCloudSnapshot["mode"]): AgendaCloudSnapshot {
  return {
    workspace: emptyAgendaCloudWorkspace(),
    revision: 0,
    mode,
    updatedAt: null,
    updatedByUserId: null,
  };
}
