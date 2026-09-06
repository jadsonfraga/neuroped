/**
 * GET /api/admin/crypto-inventory — quais chaves ainda seguram dado cifrado.
 *
 * POR QUE ESTA ROTA EXISTE
 *
 * O produto tem dois keyrings — o clínico (`CLINICAL_DATA_KEY`) e o
 * operacional (`OPERATIONAL_DATA_KEY`) — e ambos aceitam uma chave anterior
 * para que uma rotação não quebre o que já foi gravado. Só que rotacionar não
 * é o fim: registros antigos continuam presos à chave antiga até serem
 * reescritos. Aposentar a chave anterior antes disso torna esses registros
 * ilegíveis.
 *
 * Sem esta rota, o operador não tem como saber se já pode aposentá-la. Ele
 * descobriria tentando — e a descoberta seria um incidente.
 *
 * O QUE ELA RESPONDE, E O QUE NUNCA RESPONDE
 *
 * Responde CONTAGENS por versão de envelope e por identificador de chave, e um
 * booleano por keyring dizendo se a chave anterior já pode sair. Nada mais.
 *
 * Nunca devolve: ciphertext, trecho de ciphertext, id de registro, id de
 * clínica, valor de segredo, prefixo de segredo, nem comprimento de segredo. O
 * identificador de chave (`k1`, `k2`) é um rótulo público que já vive dentro
 * do envelope — não é material criptográfico e não ajuda quem não tem a chave.
 *
 * COMO ELA LÊ SEM DECIFRAR
 *
 * Os dois envelopes carregam a versão e o identificador da chave em texto
 * claro no prefixo, separados por ponto:
 *
 *   clínico     → `v1.<keyId>.<iv>.<ciphertext>`
 *   operacional → `v2.<keyId>.<iv>.<ciphertext>`
 *   operacional legado → `v1.<iv>.<ciphertext>`   (sem identificador)
 *
 * A contagem é feita em SQL sobre esse prefixo. Nenhuma linha é decifrada,
 * nenhum conteúdo sai do banco — o que também significa que esta rota não
 * consegue e não deve ser usada para ler prontuário.
 *
 * O envelope operacional legado `v1` é o caso desconfortável: ele NÃO diz qual
 * chave o cifrou. Por isso ele é contado à parte e, enquanto existir um único
 * registro assim, `podeAposentarChaveAnterior` é `false` para o keyring
 * operacional — não dá para provar que ele sobrevive à aposentadoria, e a
 * ausência de prova aqui vale como prova de risco.
 *
 * LIMITE DECLARADO: esta rota OBSERVA. Ela não reescreve nada. A ferramenta de
 * re-cifragem em massa (rewrap) é um caminho de ESCRITA sobre dado clínico
 * cifrado, onde um defeito corrompe prontuário sem volta; ela merece revisão
 * dedicada e não entra de carona numa rota de leitura.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";

interface Env {
  DB?: D1Database;
  NEUROPED_JWT_SECRET?: string;
  CLINICAL_DATA_KEY?: string;
  CLINICAL_DATA_KEY_ID?: string;
  CLINICAL_DATA_KEY_PREVIOUS?: string;
  CLINICAL_DATA_KEY_PREVIOUS_ID?: string;
  OPERATIONAL_DATA_KEY?: string;
  OPERATIONAL_DATA_KEY_ID?: string;
  OPERATIONAL_DATA_KEY_PREVIOUS?: string;
  OPERATIONAL_DATA_KEY_PREVIOUS_ID?: string;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * Tabelas cifradas pelo keyring CLÍNICO. Cada entrada aponta a coluna que
 * carrega o envelope. A lista é explícita de propósito: uma tabela nova que
 * cifre dado clínico e não apareça aqui fica invisível para a decisão de
 * aposentar chave, e `tests/unit/crypto-inventory.test.ts` reprova nesse caso.
 */
const TABELAS_CLINICAS: ReadonlyArray<{ tabela: string; coluna: string }> = [
  { tabela: "live_patients", coluna: "profile_encrypted" },
  { tabela: "live_clinical_events", coluna: "payload_encrypted" },
  { tabela: "live_assessments", coluna: "payload_encrypted" },
  { tabela: "live_assessment_responses", coluna: "response_encrypted" },
  { tabela: "live_document_versions", coluna: "content_encrypted" },
  { tabela: "live_intake_submissions", coluna: "payload_encrypted" },
  { tabela: "live_scale_responses", coluna: "answers_encrypted" },
  { tabela: "live_deletion_requests", coluna: "reason_encrypted" },
];

/** Tabelas cifradas pelo keyring OPERACIONAL (PII de responsáveis). */
const TABELAS_OPERACIONAIS: ReadonlyArray<{ tabela: string; coluna: string }> = [
  { tabela: "appointments", coluna: "guardian_name_encrypted" },
  { tabela: "appointments", coluna: "guardian_email_encrypted" },
  { tabela: "appointments", coluna: "guardian_phone_encrypted" },
  { tabela: "appointments", coluna: "patient_name_encrypted" },
  { tabela: "waitlist_entries", coluna: "guardian_name_encrypted" },
  { tabela: "waitlist_entries", coluna: "guardian_email_encrypted" },
  { tabela: "waitlist_entries", coluna: "guardian_phone_encrypted" },
  { tabela: "waitlist_entries", coluna: "patient_name_encrypted" },
  { tabela: "appointment_reviews", coluna: "comment_encrypted" },
  { tabela: "notification_outbox", coluna: "recipient_encrypted" },
  { tabela: "notification_outbox", coluna: "payload_encrypted" },
];

interface Contagem {
  versao: string;
  chave: string;
  total: number;
}

/**
 * Agrupa por prefixo do envelope sem decifrar nada.
 *
 * `versao` = tudo antes do primeiro ponto.
 * `chave`  = tudo entre o primeiro e o segundo ponto.
 *
 * Para o envelope operacional legado (`v1.<iv>.<ct>`) o segundo segmento é o
 * IV, não um identificador de chave. O chamador trata `v1` operacional como
 * "chave desconhecida" e NUNCA usa esse segmento como rótulo — publicá-lo
 * seria vazar o IV, que é público mas não tem razão nenhuma de sair daqui.
 */
function consultaContagem(tabela: string, coluna: string): string {
  return `
    SELECT
      substr(${coluna}, 1, instr(${coluna}, '.') - 1) AS versao,
      substr(
        substr(${coluna}, instr(${coluna}, '.') + 1),
        1,
        instr(substr(${coluna}, instr(${coluna}, '.') + 1), '.') - 1
      ) AS chave,
      COUNT(*) AS total
      FROM ${tabela}
     WHERE ${coluna} IS NOT NULL
       AND instr(${coluna}, '.') > 0
     GROUP BY versao, chave`;
}

async function inventariar(
  db: D1Database,
  alvos: ReadonlyArray<{ tabela: string; coluna: string }>,
  ocultarChave: (versao: string) => boolean,
): Promise<{ porChave: Record<string, number>; naoMarcados: number; ilegiveis: number }> {
  const porChave: Record<string, number> = {};
  let naoMarcados = 0;
  let ilegiveis = 0;

  for (const alvo of alvos) {
    let linhas: Contagem[];
    try {
      const resultado = await db.prepare(consultaContagem(alvo.tabela, alvo.coluna)).all<Contagem>();
      linhas = resultado.results ?? [];
    } catch {
      // Tabela ausente nesta instalação (uma migração ainda não aplicada, por
      // exemplo). Contar como ilegível é a leitura conservadora: o inventário
      // não pode afirmar que é seguro aposentar a chave se ele nem conseguiu
      // olhar em todo lugar.
      ilegiveis += 1;
      continue;
    }

    for (const linha of linhas) {
      const total = Number(linha.total ?? 0);
      if (total <= 0) continue;
      if (ocultarChave(String(linha.versao ?? ""))) {
        naoMarcados += total;
        continue;
      }
      const chave = String(linha.chave ?? "").trim();
      // Um rótulo que não parece identificador de chave não vira chave: some
      // para o balde de não marcados, em vez de virar um rótulo inventado.
      if (!/^[A-Za-z0-9_-]{1,32}$/.test(chave)) {
        naoMarcados += total;
        continue;
      }
      porChave[chave] = (porChave[chave] ?? 0) + total;
    }
  }

  return { porChave, naoMarcados, ilegiveis };
}

function idAtual(valor: string | undefined, padrao: string): string {
  return valor?.trim() || padrao;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const user = getContextUser(context);
  if (!user) {
    return json({ error: "Autenticação obrigatória.", code: "UNAUTHENTICATED" }, 401);
  }
  if (!isAdmin(user)) {
    return json({ error: "Acesso restrito.", code: "FORBIDDEN" }, 403);
  }
  if (!env.DB) {
    return json({ error: "Banco indisponível.", code: "DB_UNAVAILABLE" }, 503);
  }

  const clinicoAtual = idAtual(env.CLINICAL_DATA_KEY_ID, "k1");
  const operacionalAtual = idAtual(env.OPERATIONAL_DATA_KEY_ID, "k1");
  const clinicoTemAnterior = Boolean(env.CLINICAL_DATA_KEY_PREVIOUS?.trim());
  const operacionalTemAnterior = Boolean(env.OPERATIONAL_DATA_KEY_PREVIOUS?.trim());

  // No envelope clínico o segundo segmento SEMPRE é o identificador da chave.
  // No operacional isso só vale a partir de `v2`.
  const clinico = await inventariar(env.DB, TABELAS_CLINICAS, () => false);
  const operacional = await inventariar(env.DB, TABELAS_OPERACIONAIS, (versao) => versao !== "v2");

  const resumo = (
    dados: { porChave: Record<string, number>; naoMarcados: number; ilegiveis: number },
    chaveAtual: string,
    temAnterior: boolean,
  ) => {
    const foraDaChaveAtual = Object.entries(dados.porChave)
      .filter(([chave]) => chave !== chaveAtual)
      .reduce((soma, [, total]) => soma + total, 0);

    // Três condições, todas necessárias. A terceira é a que costuma ser
    // esquecida: se alguma tabela não pôde ser lida, o inventário não sabe o
    // que há nela — e "não sei" nunca pode virar "pode aposentar".
    const podeAposentar =
      foraDaChaveAtual === 0 && dados.naoMarcados === 0 && dados.ilegiveis === 0;

    const motivos: string[] = [];
    if (foraDaChaveAtual > 0) motivos.push("REGISTROS_EM_CHAVE_ANTERIOR");
    if (dados.naoMarcados > 0) motivos.push("REGISTROS_SEM_MARCACAO_DE_CHAVE");
    if (dados.ilegiveis > 0) motivos.push("TABELA_NAO_INSPECIONADA");

    return {
      chaveAtual,
      chaveAnteriorConfigurada: temAnterior,
      registrosPorChave: dados.porChave,
      registrosSemMarcacaoDeChave: dados.naoMarcados,
      tabelasNaoInspecionadas: dados.ilegiveis,
      podeAposentarChaveAnterior: podeAposentar,
      motivos,
    };
  };

  return json(
    {
      clinico: resumo(clinico, clinicoAtual, clinicoTemAnterior),
      operacional: resumo(operacional, operacionalAtual, operacionalTemAnterior),
      nota:
        "Somente contagens e identificadores públicos de chave. Nenhum ciphertext, " +
        "id de registro ou valor de segredo sai por aqui. " +
        "podeAposentarChaveAnterior=false significa PARE: aposentar a chave anterior " +
        "agora tornaria registros ilegíveis. Não existe ferramenta de re-cifragem em " +
        "massa ainda — registros migram para a chave atual ao serem reescritos.",
    },
    200,
  );
};
