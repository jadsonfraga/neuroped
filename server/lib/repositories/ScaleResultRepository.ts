/**
 * ScaleResultRepository — acesso a escalas com otimizações
 * Evita N+1, usa índices em escala_name, paciente_id, created_at
 */

import { type ScaleResult, type InsertScaleResult, scaleResults } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import type { BaseRepository, PaginatedResult, PaginationParams } from "./base";
import { calculatePagination } from "./base";

export class ScaleResultRepository implements BaseRepository<ScaleResult, InsertScaleResult> {
  constructor(private db: any) {}

  async findById(id: string): Promise<ScaleResult | null> {
    const result = await this.db
      .select()
      .from(scaleResults)
      .where(eq(scaleResults.id, id))
      .limit(1)
      .execute();
    return result[0] || null;
  }

  async findByPatient(patientId: string, pagination?: PaginationParams): Promise<PaginatedResult<ScaleResult>> {
    const { page, limit, offset } = calculatePagination(pagination?.page, pagination?.limit);

    const results = await this.db
      .select()
      .from(scaleResults)
      .where(eq(scaleResults.patientId, patientId))
      .orderBy(desc(scaleResults.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    const countResult = await this.db
      .select({ count: this.db.fn.count() })
      .from(scaleResults)
      .where(eq(scaleResults.patientId, patientId))
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

  /**
   * Listagem longitudinal: todas escalas de um tipo para um paciente
   * Útil para gráficos de evolução
   */
  async findByPatientAndScale(
    patientId: string,
    scaleName: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ScaleResult>> {
    const { page, limit, offset } = calculatePagination(pagination?.page, pagination?.limit);

    const results = await this.db
      .select()
      .from(scaleResults)
      .where(and(eq(scaleResults.patientId, patientId), eq(scaleResults.scaleName, scaleName)))
      .orderBy(desc(scaleResults.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    const countResult = await this.db
      .select({ count: this.db.fn.count() })
      .from(scaleResults)
      .where(and(eq(scaleResults.patientId, patientId), eq(scaleResults.scaleName, scaleName)))
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

  async findAll(pagination?: PaginationParams): Promise<PaginatedResult<ScaleResult>> {
    const { page, limit, offset } = calculatePagination(pagination?.page, pagination?.limit);

    const results = await this.db
      .select()
      .from(scaleResults)
      .orderBy(desc(scaleResults.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    const countResult = await this.db
      .select({ count: this.db.fn.count() })
      .from(scaleResults)
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

  async create(input: InsertScaleResult): Promise<ScaleResult> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const result = await this.db
      .insert(scaleResults)
      .values({
        id,
        ...input,
        created_at: now,
      } as any)
      .returning()
      .execute();

    return result[0];
  }

  async update(id: string, input: Partial<ScaleResult>): Promise<ScaleResult | null> {
    const result = await this.db
      .update(scaleResults)
      .set(input)
      .where(eq(scaleResults.id, id))
      .returning()
      .execute();

    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(scaleResults)
      .where(eq(scaleResults.id, id))
      .execute();

    return !!result;
  }

  async count(): Promise<number> {
    const result = await this.db
      .select({ count: this.db.fn.count() })
      .from(scaleResults)
      .execute();

    return result[0]?.count || 0;
  }
}
