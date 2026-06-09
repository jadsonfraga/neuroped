/**
 * Factory para criar instâncias de repositórios
 * Desacopla a criação dos repositórios da instância de banco de dados
 */

import type { IRepositories } from "./index";
import { PatientRepository } from "./PatientRepository";
import { ScaleResultRepository } from "./ScaleResultRepository";
import { UserRepository } from "./UserRepository";

/**
 * Cria todas as repositories com a instância de banco de dados fornecida
 * Funciona com qualquer driver que expor a interface Drizzle
 */
export function createRepositories(db: any): IRepositories {
  return {
    patient: new PatientRepository(db),
    scaleResult: new ScaleResultRepository(db),
    user: new UserRepository(db),
  };
}
