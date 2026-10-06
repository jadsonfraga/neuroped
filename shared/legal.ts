/**
 * legal.ts — Termos de Uso (assinatura) e Política de Privacidade do NeuroPed,
 * com versão e impressão digital (SHA-256) do texto.
 *
 * ESTADO: RASCUNHO PENDENTE DE REVISÃO JURÍDICA (gate G6,
 * docs/saas/gtm/LEGAL_BRIEFING.md). Os textos abaixo só descrevem o que o
 * produto faz hoje (código e configuração do repositório) e deixam marcado
 * entre colchetes tudo o que depende de decisão jurídica. NÃO são parecer nem
 * contrato final. O texto definitivo é do proprietário e da assessoria jurídica.
 *
 * Regra de versionamento (travada por teste): qualquer mudança no texto de um
 * documento muda o SHA-256 calculado; o teste falha até que `version` e
 * `contentSha256` sejam atualizados juntos. Uma versão nova exige novo aceite.
 */
import {
  CANONICAL_PRICE_CENTS,
  CANONICAL_TRIAL_DAYS,
  PAST_DUE_GRACE_DAYS,
  POST_CANCEL_RETENTION_DAYS,
} from "./billing";

export const legalDocumentKeys = ["saas_terms", "privacy_policy"] as const;
export type LegalDocumentKey = (typeof legalDocumentKeys)[number];

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocument {
  key: LegalDocumentKey;
  title: string;
  path: string;
  version: string;
  /** Data de publicação desta versão (AAAA-MM-DD). */
  publishedAt: string;
  status: "draft_pending_legal_review" | "final";
  /** `sha256:` + SHA-256 hex de `legalDocumentCanonicalText(doc)` (mesmo formato da evidência do agendamento público). */
  contentSha256: string;
  summary: string;
  sections: LegalSection[];
}

// Sem Intl: o texto (e o hash) não pode depender do ICU de quem roda.
const price = `R$ ${(CANONICAL_PRICE_CENTS / 100).toFixed(2).replace(".", ",")}`;

/** Marca usada em todo trecho que depende de decisão jurídica. */
export const LEGAL_PENDING = "[PENDENTE DE REVISÃO JURÍDICA]";

const SAAS_TERMS: LegalDocument = {
  key: "saas_terms",
  title: "Termos de Uso do NeuroPed (assinatura para clínicas)",
  path: "/termos-de-uso",
  version: "2026-10-06-rascunho-1",
  publishedAt: "2026-10-06",
  status: "draft_pending_legal_review",
  contentSha256: "sha256:d577ca408263e6aef154ffdb2c9715c5c45cc5ac7d90cd9bb02418da7332cf0b",
  summary:
    "Regras de uso do NeuroPed como serviço por assinatura para clínicas e profissionais. Texto provisório: descreve o funcionamento atual e marca o que ainda depende da revisão jurídica.",
  sections: [
    {
      title: "1. O que é o NeuroPed",
      paragraphs: [
        "O NeuroPed é um software oferecido pela internet, por assinatura, para clínicas e profissionais que atendem crianças e adolescentes em neurodesenvolvimento. Reúne agenda, pedido de horário pela família, escalas, prontuário, documentos clínicos e gestão da equipe com papéis.",
        "O NeuroPed não emite diagnóstico nem substitui o julgamento do profissional. Toda decisão clínica é do profissional habilitado que atende o paciente.",
      ],
    },
    {
      title: "2. Conta, clínica e equipe",
      paragraphs: [
        "A conta é pessoal e exige e-mail confirmado. Quem cria a conta pode criar uma clínica e convidar membros com papéis (titular, administrador, profissional, assistente e financeiro). Cada papel acessa apenas o que lhe cabe.",
        "Você é responsável por guardar sua senha e por avisar a clínica ou o suporte se suspeitar de uso indevido da sua conta.",
      ],
    },
    {
      title: "3. Assinatura, avaliação e cancelamento",
      paragraphs: [
        `A assinatura custa ${price} por assento (membro ativo da clínica) por mês, com ${CANONICAL_TRIAL_DAYS} dias de avaliação. Pagamento em atraso tem ${PAST_DUE_GRACE_DAYS} dias de carência antes do bloqueio. Após o cancelamento, os dados ficam disponíveis para exportação por ${POST_CANCEL_RETENTION_DAYS} dias.`,
        `Reajuste, multa, reembolso, nota fiscal e demais condições comerciais: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "4. Uso permitido e obrigações da clínica",
      paragraphs: [
        "O sistema deve ser usado por profissionais e equipes da clínica, para a finalidade de atendimento e gestão. É proibido tentar acessar dados de outra clínica, burlar controles de acesso ou usar o serviço para fins ilícitos.",
        `A clínica é responsável pelas informações que registra e por obter, quando necessário, a autorização dos responsáveis legais dos pacientes. Base legal, consentimentos e instruções de tratamento: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "5. Dados pessoais",
      paragraphs: [
        "O tratamento de dados pessoais está descrito na Política de Privacidade, que faz parte destes Termos.",
        `Papéis de controlador e operador (LGPD) entre a clínica e o NeuroPed, e o acordo de tratamento de dados: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "6. Disponibilidade, suporte e responsabilidade",
      paragraphs: [
        "O serviço é mantido com monitoramento e cópias de segurança do banco de dados, mas pode ter interrupções para manutenção ou por falhas de terceiros.",
        `Nível de serviço (SLA), canais e prazos de suporte, limites de responsabilidade e foro: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "7. Alterações destes Termos",
      paragraphs: [
        "Cada versão destes Termos tem identificação e data. Quando houver uma versão nova, ela será apresentada para um novo aceite antes de valer para você. O aceite registra a versão, a data e a impressão digital do texto aceito.",
      ],
    },
  ],
};

const PRIVACY_POLICY: LegalDocument = {
  key: "privacy_policy",
  title: "Política de Privacidade do NeuroPed",
  path: "/privacidade",
  version: "2026-10-06-rascunho-1",
  publishedAt: "2026-10-06",
  status: "draft_pending_legal_review",
  contentSha256: "sha256:d068dd304536e522c917707c892355d18b49b1bca74f9af87254068a207fba9c",
  summary:
    "Como o NeuroPed trata dados pessoais de profissionais, clínicas, responsáveis e pacientes. Texto provisório: descreve o funcionamento atual e marca o que ainda depende da revisão jurídica.",
  sections: [
    {
      title: "1. Quem trata os dados",
      paragraphs: [
        `Identificação do responsável pelo NeuroPed, papéis de controlador e operador e encarregado (DPO) com canal de contato: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "2. Quais dados são tratados",
      paragraphs: [
        "Conta: nome, e-mail e senha (guardada apenas como hash). Clínica e equipe: nome da clínica, membros e papéis.",
        "Agenda: nome da criança e do responsável, telefone e e-mail informados no agendamento, cifrados antes de serem gravados. O formulário público não pede diagnóstico nem informação clínica.",
        "Dados clínicos registrados pela clínica (prontuário, escalas e documentos): cifrados no servidor e isolados por clínica.",
        "Cobrança da assinatura: dados do contratante tratados pelo provedor de pagamento. Registros técnicos e de auditoria: quem fez qual ação e quando, sem copiar conteúdo clínico.",
      ],
    },
    {
      title: "3. Para que os dados são usados",
      paragraphs: [
        "Para prestar o serviço contratado: autenticação, agenda, comunicação operacional com as famílias, registro clínico pela clínica, cobrança da assinatura, segurança e auditoria.",
        `Bases legais de cada tratamento (LGPD, arts. 7º e 11): ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "4. Com quem os dados são compartilhados",
      paragraphs: [
        "Fornecedores que o serviço usa hoje: Cloudflare (hospedagem e banco de dados), Resend (envio de e-mails transacionais), Asaas (cobrança da assinatura) e Google (integração de vídeo com IA, somente se ativada).",
        `Transferência internacional, cláusulas com esses fornecedores e forma de comunicar mudanças: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "5. Segurança",
      paragraphs: [
        "Contatos da agenda e dados clínicos são cifrados em repouso; cada clínica só acessa os próprios dados; ações sensíveis ficam em trilhas de auditoria; senhas são guardadas apenas como hash.",
        `Procedimento e prazos de comunicação de incidentes: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "6. Por quanto tempo",
      paragraphs: [
        `Após o cancelamento da assinatura, os dados da clínica ficam disponíveis para exportação por ${POST_CANCEL_RETENTION_DAYS} dias.`,
        `Prazo legal de guarda do prontuário e exceções à eliminação: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "7. Direitos do titular",
      paragraphs: [
        "O sistema permite à clínica atender pedidos de acesso, correção, exportação e eliminação de dados. Pedidos sobre dados de pacientes devem ser feitos à clínica que realiza o atendimento.",
        `Canal direto com o NeuroPed e prazos de resposta: ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "8. Crianças e adolescentes",
      paragraphs: [
        `Os dados de pacientes menores de idade são registrados pela clínica, no interesse do atendimento. Regras de consentimento dos responsáveis (LGPD, art. 14): ${LEGAL_PENDING}.`,
      ],
    },
    {
      title: "9. Alterações desta Política",
      paragraphs: [
        "Cada versão desta Política tem identificação e data. Quando houver uma versão nova, ela será apresentada para um novo aceite. O aceite registra a versão, a data e a impressão digital do texto aceito.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  saas_terms: SAAS_TERMS,
  privacy_policy: PRIVACY_POLICY,
};

/** Texto canônico de um documento (base do SHA-256). */
export function legalDocumentCanonicalText(doc: Pick<LegalDocument, "title" | "sections">): string {
  return JSON.stringify({ title: doc.title, sections: doc.sections });
}

/** Versões vigentes que o cadastro precisa enviar como aceitas. */
export function currentLegalVersions(): Record<LegalDocumentKey, string> {
  return { saas_terms: SAAS_TERMS.version, privacy_policy: PRIVACY_POLICY.version };
}

export type LegalAcceptanceCheck =
  | { ok: true }
  | { ok: false; code: "LEGAL_ACCEPTANCE_REQUIRED" | "LEGAL_VERSION_OUTDATED"; error: string };

/**
 * Valida o aceite enviado pelo cadastro: `{ saas_terms: "<versão>", privacy_policy: "<versão>" }`.
 * Ausente ou incompleto: aceite obrigatório. Versão diferente da vigente: a tela
 * está desatualizada e precisa recarregar para mostrar o texto atual.
 */
export function checkLegalAcceptance(input: unknown): LegalAcceptanceCheck {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      code: "LEGAL_ACCEPTANCE_REQUIRED",
      error: "É preciso aceitar os Termos de Uso e a Política de Privacidade para criar a conta.",
    };
  }
  const record = input as Record<string, unknown>;
  for (const key of legalDocumentKeys) {
    if (typeof record[key] !== "string" || !record[key]) {
      return {
        ok: false,
        code: "LEGAL_ACCEPTANCE_REQUIRED",
        error: "É preciso aceitar os Termos de Uso e a Política de Privacidade para criar a conta.",
      };
    }
  }
  for (const key of legalDocumentKeys) {
    if (record[key] !== LEGAL_DOCUMENTS[key].version) {
      return {
        ok: false,
        code: "LEGAL_VERSION_OUTDATED",
        error: "Os Termos ou a Política foram atualizados. Recarregue a página para ler e aceitar a versão atual.",
      };
    }
  }
  return { ok: true };
}
