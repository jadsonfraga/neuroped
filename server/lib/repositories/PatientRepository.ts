/**
 * PatientRepository — acesso a dados de pacientes com otimizações
 * Implementação genérica que funciona com SQLite e Postgres via Drizzle
 */

import { type Patient, patients } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { BaseRepository, PaginatedResult, PaginationParams } from "./base";
import { calculatePagination } from "./base";

export class PatientRepository implements BaseRepository<Patient, Omit<Patient, "id" | "created_at" | "updated_at">> {
  constructor(private db: any) {}

  async findById(id: string): Promise<Patient | null> {
    const result = await this.db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1)
      .execute();
    return result[0] || null;
  }

  async findByOwner(ownerUserId: string, pagination?: PaginationParams): Promise<PaginatedResult<Patient>> {
    const { page, limit, offset } = calculatePagination(pagination?.page, pagination?.limit);

    const results = await this.db
      .select()
      .from(patients)
      .where(eq(patients.owner_user_id, ownerUserId))
      .orderBy(patients.created_at)
      .limit(limit)
      .offset(offset)
      .execute();

    const countResult = await this.db
      .select({ count: this.db.fn.count() })
      .from(patients)
      .where(eq(patients.owner_user_id, ownerUserId))
      .execute();

    const total = countResult[0]?.count || 0;

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAll(pagination?: PaginationParams): Promise<PaginatedResult<Patient>> {
    const { page, limit, offset } = calculatePagination(pagination?.page, pagination?.limit);

    const results = await this.db
      .select()
      .from(patients)
      .orderBy(patients.created_at)
      .limit(limit)
      .offset(offset)
      .execute();

    const countResult = await this.db
      .select({ count: this.db.fn.count() })
      .from(patients)
      .execute();

    const total = countResult[0]?.count || 0;

    return {
      data: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(input: Omit<Patient, "id" | "created_at" | "updated_at">): Promise<Patient> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = await this.db
      .insert(patients)
      .values({
        id,
        ...input,
        created_at: now,
        updated_at: now,
      } as any)
      .returning()
      .execute();

    return result[0];
  }

  async update(id: string, input: Partial<Patient>): Promise<Patient | null> {
    const now = new Date().toISOString();

    const result = await this.db
      .update(patients)
      .set({
        ...input,
        updated_at: now,
      })
      .where(eq(patients.id, id))
      .returning()
      .execute();

    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(patients)
      .where(eq(patients.id, id))
      .execute();

    return !!result;
  }

  async count(): Promise<number> {
    const result = await this.db
      .select({ count: this.db.fn.count() })
      .from(patients)
      .execute();

    return result[0]?.count || 0;
  }
}
