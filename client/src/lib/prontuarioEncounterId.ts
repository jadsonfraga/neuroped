const sectionKey = /^(anamnese|marcos|medicacao|terapia|exame):([A-Za-z0-9][A-Za-z0-9_-]{0,99})$/;
const opaqueSection = /^nppr-v1-(anamnese|marcos|medicacao|terapia|exame)-([A-Za-z0-9][A-Za-z0-9_-]{0,99})$/;

export function encodeProntuarioEncounterId(key: string): string {
  if (key === "encounter") return key;
  const match = sectionKey.exec(key);
  if (!match) throw new Error("Chave de seção de prontuário inválida.");
  return "nppr-v1-" + match[1] + "-" + match[2];
}

export function decodeProntuarioEncounterId(value: string): string {
  const match = opaqueSection.exec(value);
  // Restauração legada: não troca o identificador do evento existente;
  // o ID do evento ainda é usado para encadear a correção.
  return match ? match[1] + ":" + match[2] : value;
}

/** Comparação em memória: ignora ordem de chaves e atributos omitidos no JSON. */
export function prontuarioPayloadFingerprint(value: unknown): string | undefined {
  return JSON.stringify(value, (_key, item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  });
}
