export type IntegrationSurface = "internal-route" | "local-microsite";
export type IntegrationId =
  | "secretaria"
  | "missao"
  | "nesplora"
  | "video-eeg"
  | "institucional";

export interface IntegratedExperience {
  id: IntegrationId;
  label: string;
  shortLabel: string;
  href: string;
  description: string;
  note: string;
  surface: IntegrationSurface;
  status: "incorporated";
  owner: "NeuroPed";
  persistence: "versioned-code" | "versioned-static-assets";
}

/**
 * Registro único das experiências que podem aparecer como abas no hub.
 * Todas as URLs desta lista são locais; links externos oficiais ficam fora
 * desta coleção e são tratados como referências ou protocolos de contato.
 */
export const integratedExperiences: readonly IntegratedExperience[] = [
  {
    id: "secretaria",
    label: "Secretaria IA",
    shortLabel: "Secretaria",
    href: "/#/marcacao",
    description:
      "Encaminhamento administrativo e acesso à agenda pública integrada ao NeuroPed.",
    note: "A Secretaria IA foi incorporada ao NeuroPed. Ela não coleta informações clínicas nesta etapa.",
    surface: "internal-route",
    status: "incorporated",
    owner: "NeuroPed",
    persistence: "versioned-code",
  },
  {
    id: "missao",
    label: "Missão Saúde",
    shortLabel: "Jogo",
    href: "/#/missao-saude",
    description:
      "Circuito educativo infantil com três estações sobre cuidados de saúde.",
    note: "A Missão Saúde foi incorporada ao NeuroPed. O progresso existe somente nesta sessão e não altera pacientes, agenda ou prontuários.",
    surface: "internal-route",
    status: "incorporated",
    owner: "NeuroPed",
    persistence: "versioned-code",
  },
  {
    id: "nesplora",
    label: "Nesplora incorporada",
    shortLabel: "Nesplora",
    href: "/nesplora/",
    description:
      "Experiência Nesplora publicada como microsite estático dentro do deploy do NeuroPed.",
    note: "Interface, scripts e mídias estão versionados em client/public/nesplora; a experiência não depende de um domínio Manus em runtime.",
    surface: "local-microsite",
    status: "incorporated",
    owner: "NeuroPed",
    persistence: "versioned-static-assets",
  },
  {
    id: "video-eeg",
    label: "Vídeo-EEG domiciliar",
    shortLabel: "Vídeo-EEG",
    href: "/#/eletroencefalograma",
    description:
      "Orientação interna do serviço, preparação da família e encaminhamento para solicitação.",
    note: "Esta é uma página de serviço do NeuroPed. Indicação, preparação e interpretação devem ser definidas pela equipe responsável.",
    surface: "internal-route",
    status: "incorporated",
    owner: "NeuroPed",
    persistence: "versioned-code",
  },
  {
    id: "institucional",
    label: "Página institucional",
    shortLabel: "Institucional",
    href: "/#/sobre-neuroped",
    description:
      "Página pública institucional do Dr. Jadson Fraga, servida pela rota do próprio NeuroPed.",
    note: "A aba usa a página institucional versionada no app; não há fallback para domínio Manus.",
    surface: "internal-route",
    status: "incorporated",
    owner: "NeuroPed",
    persistence: "versioned-code",
  },
];

export const integratedExperienceById = Object.fromEntries(
  integratedExperiences.map((experience) => [experience.id, experience]),
) as Record<IntegrationId, IntegratedExperience>;
