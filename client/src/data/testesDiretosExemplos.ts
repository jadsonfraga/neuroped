/**
 * Testes Diretos com a Criança — Exemplos Lúdicos por Domínio
 * Integração com app legado: 5 mini-testes interativos + 9 sondagens guiadas
 */

export interface DirectTestExample {
  id: string;
  name: string;
  domain: "linguagem" | "social-tea" | "atencao-executiva" | "cognicao" | "sensorial" | "motor" | "pedagogico" | "emocional" | "visual";
  ageMin: number;
  ageMax: number;
  duration: string;
  setup: string;
  instruction: string;
  observacoes: string[];
  exemploResposta: string[];
  interpretacao: string;
  bandeiras: string[];
  linkLegado?: string;
}

// Linguagem, Social/TEA, Atenção, Cognição, Motor, Visual
export const testesDiretosCompletos: DirectTestExample[] = [];

export function getTestesByDomain(domain: string): DirectTestExample[] {
  return testesDiretosCompletos.filter(t => t.domain === domain);
}
