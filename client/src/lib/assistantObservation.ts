export type AssistantObservation = { invitation: string; reaction: string; support: string; outcome?: string };

export const emptyAssistantObservation: AssistantObservation = { invitation: "", reaction: "", support: "" };

export function assistantObservationLines({ invitation, reaction, support, outcome }: AssistantObservation): string[] {
  return [
    outcome === "materials-missing" ? "Não aplicado: faltou material." : "",
    invitation.trim() && "Proposta realizada: " + invitation.trim(),
    reaction.trim() && "Observação direta: " + reaction.trim(),
    support.trim() && "Apoio ou contexto: " + support.trim(),
  ].filter(Boolean);
}
