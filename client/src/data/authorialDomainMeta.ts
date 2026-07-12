// Tipos e rótulos dos domínios autorais.
export type DomainKey = "development" | "language" | "social" | "attention" | "executive" | "learning" | "behavior" | "emotion" | "sensory" | "sleep" | "epilepsy" | "motor" | "functionality" | "family";

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  "development": "Desenvolvimento e autonomia",
  "language": "Linguagem e comunicação",
  "social": "Interação social",
  "attention": "Atenção e controle inibitório",
  "executive": "Funções executivas",
  "learning": "Cognição e aprendizagem",
  "behavior": "Comportamento e autorregulação",
  "emotion": "Sofrimento emocional",
  "sensory": "Sensorialidade e alimentação",
  "sleep": "Sono e ritmo biológico",
  "epilepsy": "Epilepsia e eventos paroxísticos",
  "motor": "Motricidade e integração visuomotora",
  "functionality": "Funcionalidade global",
  "family": "Família, escola e participação"
};
