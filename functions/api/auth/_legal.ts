/**
 * _legal.ts — registro do aceite versionado dos Termos de Uso e da Política de
 * Privacidade (migração 0033, textos em shared/legal.ts).
 */
import {
  LEGAL_DOCUMENTS,
  legalDocumentKeys,
  type LegalDocumentKey,
} from "../../../shared/legal";

/**
 * Espelho exato da 0033. O cadastro cria a tabela se a migração ainda não
 * rodou no D1: sem isso, publicar o código antes da migração derrubaria o
 * cadastro com "no such table".
 */
const LEGAL_ACCEPTANCE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS saas_legal_acceptances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document TEXT NOT NULL CHECK (document IN ('saas_terms', 'privacy_policy')),
    version TEXT NOT NULL CHECK (length(version) BETWEEN 1 AND 80),
    content_sha256 TEXT NOT NULL CHECK (content_sha256 LIKE 'sha256:%' AND length(content_sha256) = 71),
    source TEXT NOT NULL CHECK (source IN ('signup', 'invite', 'reacceptance')),
    accepted_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, document, version)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_saas_legal_acceptances_user
    ON saas_legal_acceptances(user_id, document, accepted_at DESC)`,
] as const;

export async function ensureLegalAcceptanceSchema(db: D1Database): Promise<void> {
  await db.batch(LEGAL_ACCEPTANCE_SCHEMA.map((sql) => db.prepare(sql)));
}

/**
 * Uma inserção por documento vigente, condicionada à existência da conta: no
 * mesmo batch do INSERT do usuário, se o usuário não foi criado (e-mail em
 * uso), nenhum aceite é gravado; se um aceite falhar, o usuário também não fica.
 */
export function legalAcceptanceStatements(
  db: D1Database,
  userId: string,
  acceptedAt: string,
  source: "signup",
): D1PreparedStatement[] {
  return legalDocumentKeys.map((key: LegalDocumentKey) => {
    const doc = LEGAL_DOCUMENTS[key];
    return db
      .prepare(
        `INSERT INTO saas_legal_acceptances
           (id, user_id, document, version, content_sha256, source, accepted_at, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE EXISTS (SELECT 1 FROM users WHERE id = ?)`,
      )
      .bind(
        `legal-${crypto.randomUUID()}`,
        userId,
        doc.key,
        doc.version,
        doc.contentSha256,
        source,
        acceptedAt,
        acceptedAt,
        userId,
      );
  });
}
