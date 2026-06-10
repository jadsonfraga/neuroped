/**
 * Efeitos Colaterais de Medicações — Monitoramento Clínico
 * Descrição detalhada de efeitos adversos esperados por classe medicamentosa
 * Integra-se à escala EUSM-10 (satisfação com medicação) e pré-consulta
 */

export interface EfeitoColateral {
  id: string;
  medicacao: string;
  classe: string;
  efeito: string;
  frequencia: "muito_comum" | "comum" | "incomum" | "raro";
  gravidade: "leve" | "moderado" | "grave";
  tempo_inicio: string;
  descricao_pais: string;
  exemplos_observacao: string[];
  quando_procurar_medico: string[];
  manejo: string;
  idade_minima?: number;
}

// Estimulantes, Não-estimulantes, Antipsicóticos, Antidepressivos
export const efeitosColateraisCompletos: EfeitoColateral[] = [];

export function getEfeitosByMedicacao(medicacao: string): EfeitoColateral[] {
  return efeitosColateraisCompletos.filter(e =>
    e.medicacao.toLowerCase().includes(medicacao.toLowerCase())
  );
}

export function getEfeitosByClasse(classe: string): EfeitoColateral[] {
  return efeitosColateraisCompletos.filter(e => e.classe === classe);
}

export function getEfeitosByGravidade(gravidade: string): EfeitoColateral[] {
  return efeitosColateraisCompletos.filter(e => e.gravidade === gravidade);
}
