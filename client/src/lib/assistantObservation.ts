export type AssistantObservation = { invitation: string; reaction: string; support: string };

export const emptyAssistantObservation: AssistantObservation = { invitation: "", reaction: "", support: "" };

export function assistantObservationLines({ invitation, reaction, support }: AssistantObservation): string[] {
  return [
    invitation.trim() && "Proposta realizada: " + invitation.trim(),
    reaction.trim() && "Observação direta: " + reaction.trim(),
    support.trim() && "Apoio ou contexto: " + support.trim(),
  ].filter(Boolean);
}
