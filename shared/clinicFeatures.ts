/**
 * Catálogo central de feature flags POR CLÍNICA.
 *
 * Diferença para `shared/entitlements.ts` (capacidade por PLANO): ali o
 * produto decide o que o plano contratado permite; aqui a própria clínica
 * decide, dentro do que o plano permite, o que quer manter ligado. Um
 * recurso só está efetivamente disponível quando o plano o concede E a
 * clínica não o desligou.
 *
 * Regras:
 * - toda flag nasce aqui, com padrão explícito; código nunca consulta uma
 *   chave que não esteja no catálogo (fail-closed: chave desconhecida = off);
 * - o padrão de toda flag existente é LIGADA, porque cada uma representa um
 *   recurso que já operava antes de existir o interruptor — ausência de
 *   linha no banco preserva o comportamento atual;
 * - desligar uma flag é decisão de gestão da clínica (`organization.manage`)
 *   e fica na trilha de auditoria do tenant.
 */
export interface ClinicFeatureDefinition {
  key: ClinicFeatureKey;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export const clinicFeatureKeys = ["remote_intake", "remote_scales"] as const;

export type ClinicFeatureKey = (typeof clinicFeatureKeys)[number];

export const clinicFeatureCatalog: ReadonlyArray<ClinicFeatureDefinition> = Object.freeze([
  Object.freeze({
    key: "remote_intake",
    label: "Pré-consulta remota",
    description:
      "Permite gerar links para a família responder a pré-consulta em casa. Desligado, nenhum link novo é emitido e os já enviados param de aceitar respostas.",
    defaultEnabled: true,
  }),
  Object.freeze({
    key: "remote_scales",
    label: "Questionários remotos",
    description:
      "Permite encaminhar questionários de registro para a família responder fora da clínica. Desligado, nenhum link novo é emitido e os já enviados param de aceitar respostas.",
    defaultEnabled: true,
  }),
]);

const KEY_SET = new Set<string>(clinicFeatureKeys);

export function isClinicFeatureKey(value: unknown): value is ClinicFeatureKey {
  return typeof value === "string" && KEY_SET.has(value);
}

/** Padrão do catálogo; chave desconhecida nunca está ligada. */
export function clinicFeatureDefault(key: unknown): boolean {
  if (!isClinicFeatureKey(key)) return false;
  return clinicFeatureCatalog.find((entry) => entry.key === key)?.defaultEnabled ?? false;
}

export interface ClinicFeatureState {
  key: ClinicFeatureKey;
  label: string;
  description: string;
  enabled: boolean;
  /** "default" = sem decisão gravada; "clinic" = a clínica gravou uma decisão. */
  source: "default" | "clinic";
  updatedAt: string | null;
}

export interface StoredClinicFeature {
  key: string;
  enabled: boolean;
  updatedAt: string | null;
}

/**
 * Resolve o estado efetivo de todas as flags a partir das linhas gravadas.
 * Linha com chave fora do catálogo é ignorada (nunca "liga" algo que o código
 * não conhece); flag sem linha usa o padrão do catálogo.
 */
export function resolveClinicFeatures(stored: ReadonlyArray<StoredClinicFeature>): ClinicFeatureState[] {
  const byKey = new Map<string, StoredClinicFeature>();
  for (const row of stored) {
    if (isClinicFeatureKey(row.key)) byKey.set(row.key, row);
  }
  return clinicFeatureCatalog.map((entry) => {
    const row = byKey.get(entry.key);
    return {
      key: entry.key,
      label: entry.label,
      description: entry.description,
      enabled: row ? row.enabled : entry.defaultEnabled,
      source: row ? "clinic" : "default",
      updatedAt: row?.updatedAt ?? null,
    };
  });
}
