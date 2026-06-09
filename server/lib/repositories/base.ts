/**
 * Base Repository — interface comum para todas as repositories
 * Proporciona métodos padrão com paginação, índices e lazy loading
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BaseRepository<T, CreateInput = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findAll(pagination?: PaginationParams): Promise<PaginatedResult<T>>;
  create(input: CreateInput): Promise<T>;
  update(id: string, input: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}

/**
 * Helper para cálculo de paginação
 */
export function calculatePagination(page = 1, limit = 20) {
  return {
    page: Math.max(1, page),
    limit: Math.min(limit, 100), // Cap at 100 per page
    offset: Math.max(0, (page - 1) * limit),
  };
}
