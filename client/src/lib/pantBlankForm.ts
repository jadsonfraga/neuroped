export interface PantBlankFormScale {
  number: number;
  name: string;
  domain: number;
}

export interface PantBlankFormDomain {
  id: number;
  name: string;
}

/**
 * Gera somente a folha de coleta do PANT. O documento não recebe respostas e
 * não contém cálculo, síntese ou interpretação: cada item oferece as cinco
 * alternativas vazias da régua 0–4 para preenchimento manual.
 */
export function buildPantBlankFormText(
  scales: readonly PantBlankFormScale[],
  domains: readonly PantBlankFormDomain[],
  levelLabels: readonly string[],
): string {
  const lines = [
    "PANT — FORMULÁRIO EM BRANCO",
    "100 Escalas Passivas de Neurodesenvolvimento",
    "",
    "Nome da criança: _________________________________________________",
    "Respondente: __________________________  Data: ____/____/________",
    "",
    "INSTRUÇÕES",
    "Marque uma única alternativa de 0 a 4 em cada item observado.",
    "",
    "RÉGUA DE RESPOSTA",
    ...[0, 1, 2, 3, 4].map(
      (level) => `${level} — ${levelLabels[level] ?? "Opção de resposta"}`,
    ),
    "",
  ];

  for (const domain of domains) {
    lines.push(`MACRODOMÍNIO ${domain.id}: ${domain.name}`, "");
    for (const scale of scales.filter((item) => item.domain === domain.id)) {
      lines.push(
        `${String(scale.number).padStart(2, "0")}. ${scale.name}`,
        "Resposta: ☐ 0   ☐ 1   ☐ 2   ☐ 3   ☐ 4",
        "Observação: ____________________________________________________",
        "",
      );
    }
  }

  return lines.join("\n").trimEnd();
}
