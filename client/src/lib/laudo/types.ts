// ============================================================================
// client/src/lib/laudo/types.ts — modelo tipado do laudo (padrão PANT/FUSÃO)
// ----------------------------------------------------------------------------
// Porta a ESTRUTURA do template PANT (capa + 9 seções, CID-10 e CID-11 sempre
// em paralelo) para o app React. A doutrina de prosa é validada em doutrina.ts.
// ============================================================================

/** Um diagnóstico firmado, com CID-10 e CID-11 SEMPRE em paralelo (obrigatório). */
export interface LaudoDiagnostico {
  dx: string;
  caracterizacao: string;
  cid10: string;
  cid11: string;
}

/** Capa / identificação do laudo. */
export interface LaudoCapa {
  eyebrow: string;                 // linha-fina do projeto
  tituloLinhas: string[];          // título grande (1–2 linhas)
  subtituloDestacado: string;      // subtítulo em ouro
  pacienteLinhas: string[];        // nome "herói" (1–2 linhas)
  paciente: string;                // nome completo
  meta: string;                    // idade · sexo · cidade · data (+ antropometria se houver)
  diagnostico: string;            // diagnósticos da capa (texto)
  cid10: string;                   // CID-10 (obrigatório, em paralelo)
  cid11: string;                   // CID-11 (obrigatório, em paralelo)
  protocolo: string;               // protocolo do documento
}

/** Tipos de bloco de conteúdo dentro de uma seção (espelham os helpers de L). */
export type LaudoBloco =
  | { tipo: "abertura"; inicial: string; texto: string }          // capitular
  | { tipo: "p"; texto: string }                                  // parágrafo (**negrito** permitido)
  | { tipo: "sub"; texto: string }                                // subtítulo curto
  | { tipo: "tabela"; cabec: string[]; linhas: string[][]; larguras?: string[] }
  | { tipo: "diagnosticos"; itens: LaudoDiagnostico[] }
  | { tipo: "assinatura"; localData: string }
  | { tipo: "referencias"; texto: string };

export interface LaudoSecao {
  numero: number;
  titulo: string;
  blocos: LaudoBloco[];
}

export interface Laudo {
  capa: LaudoCapa;
  corpo: LaudoSecao[];
  localData: string;               // local e data da assinatura
}
