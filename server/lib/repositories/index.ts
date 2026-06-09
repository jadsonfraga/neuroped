/**
 * BLOCO 1: Camada de acesso a dados abstraída (Repository Pattern)
 * Desacopla lógica de negócio do banco de dados (SQLite vs Postgres)
 *
 * Permite trocar de driver sem reescrever a lógica, apenas as implementations
 * dos repositórios.
 */

export { PatientRepository } from "./PatientRepository";
export { ScaleResultRepository } from "./ScaleResultRepository";
export { UserRepository } from "./UserRepository";
export { createRepositories } from "./factory";

import type { PatientRepository } from "./PatientRepository";
import type { ScaleResultRepository } from "./ScaleResultRepository";
import type { UserRepository } from "./UserRepository";

export interface IRepositories {
  patient: PatientRepository;
  scaleResult: ScaleResultRepository;
  user: UserRepository;
}
