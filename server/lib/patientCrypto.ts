/**
 * Camada que aplica criptografia simetrica de campos sensiveis de pacientes
 * antes de gravar e descriptografa ao ler.
 *
 * Politica:
 *  - Campos sempre criptografados em repouso: name, cpf, notes
 *  - Campos sempre claros (necessarios para indexar/filtrar): birthDate, cid
 *  - cpf gera tambem cpfHash (HMAC determinístico) para busca
 */

import type { Patient, PatientApi } from "@shared/schema";
import { encrypt, decrypt, deterministicHash } from "./crypto.js";

export interface PatientPlaintext {
  id: string;
  name: string;
  birthDate: string | null;
  cpf: string | null;
  cid: string | null;
  cidDescription: string | null;
  notes: string | null;
  isAnonymized: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Recebe payload da API (texto puro) e devolve struct para gravar:
 * campos sensiveis criptografados em base64.
 */
export function patientToStorage(input: PatientApi & { ownerUserId?: string | null }): {
  ownerUserId: string | null;
  nameEncrypted: string | null;
  name: null;
  birthDate: string | null;
  cpfEncrypted: string | null;
  cpfHash: string | null;
  cid: string | null;
  cidDescription: string | null;
  notesEncrypted: string | null;
  notes: null;
} {
  const cpfClean = input.cpf?.replace(/\D/g, "") || null;
  return {
    ownerUserId: input.ownerUserId || null,
    nameEncrypted: encrypt(input.name),
    name: null,
    birthDate: input.birthDate || null,
    cpfEncrypted: encrypt(cpfClean),
    cpfHash: deterministicHash(cpfClean),
    cid: input.cid || null,
    cidDescription: input.cidDescription || null,
    notesEncrypted: encrypt(input.notes || null),
    notes: null,
  };
}

/**
 * Recebe registro do banco e devolve struct legivel ao usuario.
 */
export function patientToPlaintext(row: Patient): PatientPlaintext {
  return {
    id: row.id,
    name: decrypt(row.nameEncrypted) ?? row.name ?? "",
    birthDate: row.birthDate,
    cpf: decrypt(row.cpfEncrypted),
    cid: row.cid,
    cidDescription: row.cidDescription,
    notes: decrypt(row.notesEncrypted) ?? row.notes,
    isAnonymized: row.isAnonymized,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
