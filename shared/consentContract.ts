/**
 * Fonte única do contrato de consentimento LGPD da PLATAFORMA (termo de uso,
 * política de privacidade e tratamento de dados de saúde).
 *
 * Consumida pelos três lados que precisam coincidir byte a byte: a UI
 * (`client/src/pages/lgpd-consent.tsx`), a API canônica
 * (`functions/api/consents.ts`) e o espelho Express
 * (`server/lib/consentContract.ts`). O servidor recusa qualquer lote cujo
 * texto, versão, base legal ou finalidade divirja do publicado aqui.
 *
 * S23 / LEG-06 / AUTHZ-P2-19 (docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md):
 * o termo é da PLATAFORMA e vale para todo usuário de toda clínica. Ele não
 * pode nomear uma pessoa física, um CRM ou uma clínica específica como
 * responsável — o cliente zero é um tenant como qualquer outro. Cada clínica
 * é a controladora dos dados que registra; a plataforma é a operadora.
 *
 * Mudar qualquer texto exige nova versão (data + sufixo). Versões antigas
 * permanecem no histórico do usuário exatamente como foram aceitas.
 */

export const REQUIRED_CONSENT_TYPES = [
  "termo_uso",
  "politica_privacidade",
  "tratamento_dados_saude",
] as const;

export type RequiredConsentType = (typeof REQUIRED_CONSENT_TYPES)[number];

export const CURRENT_CONSENT_VERSION = "2026-09-27-v2";

export interface CanonicalConsent {
  consentText: string;
  legalBasis: string;
  purpose: string;
}

export const CANONICAL_CONSENTS: Readonly<Record<RequiredConsentType, CanonicalConsent>> =
  Object.freeze({
    termo_uso: {
      consentText:
        "O NeuroPed é uma plataforma clínica de apoio destinada a profissionais de saúde habilitados e às clínicas que os organizam. Cada clínica é responsável pelos dados que registra e pelos profissionais que autoriza; a plataforma não substitui o julgamento clínico nem a responsabilidade profissional de quem a utiliza.",
      legalBasis: "Art. 7º, V — execução de contrato",
      purpose: "Disponibilização da plataforma para uso profissional",
    },
    politica_privacidade: {
      consentText:
        "Dados clínicos e respostas de escalas devem ser tratados com sigilo, controle de acesso e finalidade definida. Quando houver backend disponível, os registros seguem o fluxo seguro da plataforma.",
      legalBasis: "Art. 7º, II — obrigação legal / Art. 7º, V",
      purpose: "Operação do serviço e direitos do titular",
    },
    tratamento_dados_saude: {
      consentText:
        "O tratamento de dados de saúde deve ocorrer apenas para avaliação, acompanhamento, prescrição, documentação clínica e suporte assistencial, sob responsabilidade profissional.",
      legalBasis: "Art. 11, II, f — proteção da saúde por profissional habilitado",
      purpose: "Cuidado clínico individualizado",
    },
  });
