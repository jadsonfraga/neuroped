/**
 * UserRepository — acesso a usuários com otimizações
 * Índices em email, role
 */

import { count, eq } from "drizzle-orm";
import { type InsertUser, type User, users } from "@shared/schema";
import type { BaseRepository, PaginatedResult, PaginationParams } from "./base";
import { calculatePagination } from "./base";

type CreateUserInput = Omit<InsertUser, "isActive" | "emailVerifiedAt" | "mustChangePassword"> &
  Partial<Pick<InsertUser, "isActive" | "emailVerifiedAt" | "mustChangePassword">>;

export class UserRepository implements BaseRepository<User, CreateUserInput> {
  constructor(private db: any) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .execute();

    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1)
      .execute();

    return result[0] || null;
  }

  async findAll(pagination?: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit, offset } = calculatePagination(pagination?.page, pagination?.limit);
    const data = await this.db
      .select()
      .from(users)
      .orderBy(users.createdAt)
      .limit(limit)
      .offset(offset)
      .execute();
    const total = await this.count();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date().toISOString();
    const result = await this.db
      .insert(users)
      .values({
        ...input,
        email: input.email.trim().toLowerCase(),
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .execute();

    return result[0] ?? null;
  }

  async update(id: string, input: Partial<User>): Promise<User | null> {
    const nextInput = { ...input };
    if (nextInput.email) nextInput.email = nextInput.email.trim().toLowerCase();

    const result = await this.db
      .update(users)
      .set({
        ...nextInput,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning()
      .execute();

    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id })
      .execute();

    return result.length > 0;
  }

  async count(): Promise<number> {
    const result = await this.db
      .select({ value: count() })
      .from(users)
      .execute();

    return Number(result[0]?.value || 0);
  }
}
