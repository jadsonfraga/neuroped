// ============================================================
// CURADORIA CLÍNICA — Escalas autorais J26 liberadas para o filtro.
//
// Das 257 escalas autorais com itens interativos, apenas as listadas
// aqui passaram na curadoria e aparecem no catálogo/filtro. Critério
// aplicado (régua CONSERVADORA): somente instrumentos de MARCOS do
// neurodesenvolvimento (saída qualitativa "adequado/vigiar/encaminhar")
// de risco clínico BAIXO ou MÉDIO.
//
// Ficaram FORA (até validação clínica do Dr. Jadson):
//   • todas as escalas de SEVERIDADE (cutoff heurístico de intensidade);
//   • TODAS as de ALTO risco (suicídio, psicose, epilepsia, depressão, dor).
//
// Para liberar mais escalas: adicione o id aqui após validar o conteúdo.
// Gerado por scripts/audit-scales-classify.mts em 2026-06-13.
// ============================================================
export const escalasAutoraisAprovadas: ReadonlySet<string> = new Set([
  "j26-001", // Triagem Motora 0-6 Meses
  "j26-002", // Triagem Motora 6-12 Meses
  "j26-003", // Marcos de Linguagem 0-24 Meses
  "j26-004", // Cognição Precoce 0-18 Meses
  "j26-005", // Regulação Sensorial Neonatal
  "j26-007", // Desenvolvimento Socioemocional 0-3 Anos
  "j26-008", // Motor Fino 12-36 Meses
  "j26-009", // Atenção Conjunta Precoce
  "j26-010", // Triagem Global 24-36 Meses
  "j26-011", // Triagem Global 36-60 Meses
  "j26-012", // Portage Adaptado NE
  "j26-013", // Triagem Auditiva Funcional
  "j26-014", // Triagem Visual Funcional
  "j26-015", // Autonomia e Autocuidado 2-5 Anos
  "j26-020", // Linguagem Pragmática TEA
  "j26-021", // Atenção Conjunta TEA
  "j26-022", // Teoria da Mente TEA
  "j26-026", // Habilidades de Brincar TEA
  "j26-027", // Comunicação Alternativa TEA
  "j26-030", // Evolução Clínica TEA
  "j26-051", // Flexibilidade Comportamental
  "j26-082", // Linguagem Pragmática Escolar
  "j26-083", // Narrativa Oral Infantil
  "j26-084", // Consciência Fonológica Expandida
  "j26-085", // Vocabulário em Profundidade
  "j26-086", // Fluência Verbal Criança
  "j26-089", // CAA Necessidades
  "j26-090", // Compreensão Oral Complexa
  "j26-091", // Triagem Linguagem 18-36 Meses
  "j26-092", // Discurso e Linguagem Escolar
  "j26-093", // Prosódia e Entonação
  "j26-094", // Fluência de Leitura
  "j26-097", // Expressão Escrita
  "j26-098", // Habilidades de Estudo
  "j26-101", // Discalculia Triagem
  "j26-102", // Dificuldade de Cópia e Ditado
  "j26-104", // Inclusão Escolar TEA/TDAH
  "j26-106", // Motor Fino Escolar
  "j26-107", // Marco Motor Grosso 1-5 Anos
  "j26-108", // Integração Visomotora
  "j26-109", // Apraxia e Praxia Motora
  "j26-111", // Motor PC Funcional
  "j26-112", // Equilíbrio e Marcha Infantil
  "j26-113", // Escrita Manual Avançado
  "j26-115", // Habilidades Esportivas Motor
  "j26-117", // Motor Prematuro Follow-Up
  "j26-126", // Dieta Sensorial Eficácia
  "j26-130", // Higiene do Sono Infantil
  "j26-136", // Resposta Melatonina
  "j26-137", // Rotina Noturna
  "j26-146", // Autonomia Alimentar
  "j26-176", // Resiliência Infantil
  "j26-180", // AVDs Infantis
  "j26-181", // Participação Social Criança
  "j26-184", // Satisfação Tratamento
  "j26-185", // Engajamento Terapias
  "j26-186", // Inclusão Escolar Efetiva
  "j26-187", // Autonomia Adolescente Especial
  "j26-189", // Funcionalidade PC GMFCS
  "j26-191", // Prontidão Alimentar Prematuro
  "j26-192", // Método Canguru Follow-Up
  "j26-194", // Alta UTIN Prontidão
  "j26-195", // Prematuro Follow-Up 2 Anos
  "j26-201", // Adesão Medicação Criança
  "j26-203", // Comunicação Social 3-7 Anos
  "j26-205", // Cognição Social TEA
  "j26-208", // Habilidades de Vida Independente
  "j26-209", // Saúde Sexual Adolescente NEE
  "j26-210", // Avaliação Pós-Terapia Trimestral
  "j26-211", // Evolução de Comunicação Social TEA
  "j26-213", // Habilidades Adaptativas TEA Trimestral
  "j26-216", // Contato Visual e Atenção Conjunta TEA
  "j26-217", // Brincadeira Funcional e Simbólica TEA
  "j26-218", // Impressão Global dos Pais TEA
  "j26-220", // Funções Executivas TDAH Cotidiano
  "j26-221", // Desempenho Escolar TDAH Trimestral
  "j26-223", // Regulação Emocional TDAH Evolução
  "j26-225", // Feedback do Professor TDAH Sala
  "j26-226", // Impressão Global Melhora TDAH CGI
  "j26-233", // Evolução Vocabulário Expressivo Trimestral
  "j26-234", // Inteligibilidade de Fala Monitorização
  "j26-235", // Linguagem Pragmática Acompanhamento
  "j26-237", // Marcos de Comunicação Atingidos
  "j26-238", // GMFCS Reclassificação Anual
  "j26-239", // Amplitude de Movimento Pós-Fisioterapia
  "j26-240", // Função Manual MACS Evolutivo
  "j26-242", // Postura e Marcha Acompanhamento
  "j26-243", // Toxina Botulínica Antes e Depois
  "j26-244", // Leitura Fluência e Compreensão Trimestral
  "j26-245", // Escrita Amostras Comparativas
  "j26-246", // Matemática Pós-Psicopedagogia
  "j26-247", // Adaptação Curricular Feedback Escolar
  "j26-248", // Metas PEI Plano Educacional
  "j26-260", // Laboratorial Rotina por Medicação
]);
