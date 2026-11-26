export type AssistantObservation = { invitation: string; reaction: string; support: string; outcome?: string };

export const emptyAssistantObservation: AssistantObservation = { invitation: "", reaction: "", support: "" };

export const participationOutcomes = {
  stopped: "Preferiu parar.",
  "no-opportunity": "Sem oportunidade de observar.",
} as const;

export function assistantObservationLines({ invitation, reaction, support, outcome }: AssistantObservation): string[] {
  return [
    outcome === "materials-missing" ? "Não aplicado: faltou material."
      : outcome === "stopped" || outcome === "no-opportunity" ? participationOutcomes[outcome] : "",
    invitation.trim() && "Proposta realizada: " + invitation.trim(),
    reaction.trim() && "Observação direta: " + reaction.trim(),
    support.trim() && "Apoio ou contexto: " + support.trim(),
  ].filter(Boolean);
}
