export interface GeneratedScalePdfModule {
  id: string;
  expectedItems: number;
  ageMin: number;
  ageMax: number;
  respondent: "pais" | "professor" | "autoaplicavel" | "clinico";
}

export interface GeneratedScalePdfManifest {
  slug: string;
  title: string;
  sourcePdf: string;
  version: string;
  generatedAt: string;
  totalOperationalItems: number;
  modules: GeneratedScalePdfModule[];
}

/**
 * Registro obrigatório dos PDFs autorais convertidos em ferramentas do app.
 * Um PDF só é considerado integrado quando todos os módulos abaixo existem,
 * abrem como aplicação completa e passam pelos contratos de contagem e filtro.
 */
export const generatedScalePdfRegistry: GeneratedScalePdfManifest[] = [
  {
    slug: "ipn-tea-200",
    title: "IPN-TEA 200",
    sourcePdf: "IPN_TEA_200_Pre_Consulta_NeuroPed_30-07-2026.pdf",
    version: "1.0",
    generatedAt: "2026-07-30",
    totalOperationalItems: 380,
    modules: [
      { id: "ipn-tea-familia-100", expectedItems: 100, ageMin: 18, ageMax: 215, respondent: "pais" },
      { id: "ipn-tea-escola-100", expectedItems: 100, ageMin: 24, ageMax: 215, respondent: "professor" },
      { id: "ipn-tea-adolescente-60", expectedItems: 60, ageMin: 144, ageMax: 215, respondent: "autoaplicavel" },
      { id: "ipn-tea-observacao-60", expectedItems: 60, ageMin: 18, ageMax: 215, respondent: "clinico" },
      { id: "ipn-tea-18-30m", expectedItems: 10, ageMin: 18, ageMax: 30, respondent: "clinico" },
      { id: "ipn-tea-31-47m", expectedItems: 10, ageMin: 31, ageMax: 47, respondent: "clinico" },
      { id: "ipn-tea-4-5a", expectedItems: 10, ageMin: 48, ageMax: 71, respondent: "clinico" },
      { id: "ipn-tea-6-8a", expectedItems: 10, ageMin: 72, ageMax: 107, respondent: "clinico" },
      { id: "ipn-tea-9-12a", expectedItems: 10, ageMin: 108, ageMax: 155, respondent: "clinico" },
      { id: "ipn-tea-13-17a", expectedItems: 10, ageMin: 156, ageMax: 215, respondent: "clinico" },
    ],
  },
  {
    slug: "ipn-tdah-fe-200",
    title: "IPN-TDAH/FE 200",
    sourcePdf: "2026-07-31 - TDAH e Funcoes Executivas - NeuroPed.pdf",
    version: "1.0",
    generatedAt: "2026-07-31",
    totalOperationalItems: 173,
    modules: [
      { id: "ipn-tdah-fe-familia-48", expectedItems: 48, ageMin: 48, ageMax: 215, respondent: "pais" },
      { id: "ipn-tdah-fe-escola-32", expectedItems: 32, ageMin: 48, ageMax: 215, respondent: "professor" },
      { id: "ipn-tdah-fe-adolescente-20", expectedItems: 20, ageMin: 144, ageMax: 215, respondent: "autoaplicavel" },
      { id: "ipn-tdah-fe-observacao-10", expectedItems: 10, ageMin: 48, ageMax: 215, respondent: "clinico" },
      { id: "ipn-tdah-fe-executivo-10", expectedItems: 10, ageMin: 48, ageMax: 215, respondent: "clinico" },
      { id: "ipn-tdah-fe-anamnese-18", expectedItems: 18, ageMin: 48, ageMax: 215, respondent: "clinico" },
      { id: "ipn-tdah-fe-diferenciais-20", expectedItems: 20, ageMin: 48, ageMax: 215, respondent: "clinico" },
      { id: "ipn-tdah-fe-sintese-15", expectedItems: 15, ageMin: 48, ageMax: 215, respondent: "clinico" },
    ],
  },
];
