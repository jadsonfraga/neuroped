// ============================================================================
// client/src/lib/laudo/laudoPrompt.ts — montagem do prompt para o Claude
// ----------------------------------------------------------------------------
// Monta a mensagem (system + user) que alimenta a API /api/laudo-gerar.
// A doutrina do template PANT (CID-10/CID-11 em paralelo, sem perfumaria de
// IA, sem escore inventado, seções essenciais) é INJETADA no system prompt,
// e o resultado gerado passa pelo QA de doutrina.ts antes de ser exibido.
// A identidade do médico emissor NÃO é fixa: o call site passa o issuer
// (fonte única client/src/lib/issuer.ts) e o prompt é interpolado com ela.
// Sem identidade configurada, o prompt instrui a NÃO inserir credenciais.
// ============================================================================

import { UNCONFIGURED_CREDENTIALS_NOTICE } from "@/lib/issuer";

export interface DadosLaudoInput {
  /** Dados de identificação */
  paciente: string;
  dataNascimento: string;      // AAAA-MM-DD
  idade: string;               // idade cronológica por extenso
  sexo: string;                // masculino/feminino
  cidade: string;
  dataAvaliacao: string;       // AAAA-MM-DD
  protocolo: string;           // nº do protocolo/laudo

  /** Conteúdo clínico (texto livre do médico) */
  motivoAvaliacao: string;
  historiaClinica: string;
  historiaNeurodesenvolvimento: string;
  gestacaoPartoPuerperio: string;
  exameClinico: string;
  exameNeurologico: string;
  exameComportamental: string;
  escalasInstrumentos: string;
  escalasResultado: string;
  documentosAnalisados: string;
  hipoteseDiagnostica: string;
  cid10: string;
  cid11: string;
  conduta: string;
  recomendacoes: string;
}

export const SECTIONS = [
  "motivoAvaliacao",
  "historiaClinica",
  "historiaNeurodesenvolvimento",
  "gestacaoPartoPuerperio",
  "exameClinico",
  "exameNeurologico",
  "exameComportamental",
  "escalasInstrumentos",
  "escalasResultado",
  "documentosAnalisados",
  "hipoteseDiagnostica",
  "cid10",
  "cid11",
  "conduta",
  "recomendacoes",
] as const;

export const SECTION_LABELS: Record<string, string> = {
  motivoAvaliacao: "Motivo da avaliação",
  historiaClinica: "História clínica",
  historiaNeurodesenvolvimento: "História do neurodesenvolvimento",
  gestacaoPartoPuerperio: "Gestação, parto e puerpério",
  exameClinico: "Exame clínico",
  exameNeurologico: "Exame neurológico",
  exameComportamental: "Exame comportamental / mental",
  escalasInstrumentos: "Escalas e instrumentos aplicados",
  escalasResultado: "Resultado das escalas (escores e classificação)",
  documentosAnalisados: "Documentos analisados",
  hipoteseDiagnostica: "Impressão / hipótese diagnóstica",
  cid10: "CID-10",
  cid11: "CID-11",
  conduta: "Conduta",
  recomendacoes: "Recomendações",
};

export function isNonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Monta o texto do usuário com apenas os campos preenchidos. */
export function buildUserMessage(d: DadosLaudoInput): string {
  const blocos: string[] = [];

  // ── Cabeçalho de identificação ──
  const id: string[] = [];
  if (isNonEmpty(d.paciente)) id.push(`Paciente: ${d.paciente}`);
  if (isNonEmpty(d.dataNascimento)) id.push(`Data de nascimento: ${d.dataNascimento}`);
  if (isNonEmpty(d.idade)) id.push(`Idade: ${d.idade}`);
  if (isNonEmpty(d.sexo)) id.push(`Sexo: ${d.sexo}`);
  if (isNonEmpty(d.cidade)) id.push(`Cidade: ${d.cidade}`);
  if (isNonEmpty(d.dataAvaliacao)) id.push(`Data da avaliação: ${d.dataAvaliacao}`);
  if (isNonEmpty(d.protocolo)) id.push(`Protocolo: ${d.protocolo}`);
  if (id.length > 0) blocos.push(id.join("\n"));

  // ── Seções clínicas ──
  for (const key of SECTIONS) {
    const v = (d as unknown as Record<string, unknown>)[key];
    if (!isNonEmpty(v)) continue;
    // CID é enviado como campo próprio abaixo; aqui só o texto
    if (key === "cid10" || key === "cid11") continue;
    blocos.push(`${SECTION_LABELS[key]}\n${v.trim()}`);
  }

  // CID-10/CID-11 em paralelo, sempre juntos
  if (isNonEmpty(d.cid10) || isNonEmpty(d.cid11)) {
    blocos.push(
      `Classificação CID\n- CID-10: ${d.cid10.trim() || "não informado"}\n- CID-11: ${d.cid11.trim() || "não informado"}`,
    );
  }

  return blocos.join("\n\n");
}

/** Identidade do médico emissor injetada no system prompt (vem do issuer). */
export interface EmissorPrompt {
  doctorName: string;
  credentialsLine: string;
  specialty: string;
  cidadeUf?: string;
}

export function buildSystemPrompt(emissor: EmissorPrompt): string {
  const identidadeConfigurada = Boolean(emissor.doctorName && emissor.credentialsLine);
  const especialidade = emissor.specialty || "medicina";
  const identificacao = identidadeConfigurada
    ? `(${[emissor.doctorName, emissor.credentialsLine, emissor.cidadeUf].filter(Boolean).join(", ")})`
    : "(identidade profissional ainda não configurada no perfil da plataforma)";
  const fechamento = identidadeConfigurada
    ? `"${emissor.cidadeUf || "[Cidade/UF]"}, ____/____/______." seguido de: ${[emissor.doctorName, emissor.specialty, emissor.credentialsLine].filter(Boolean).join(" / ")}.`
    : `"[Cidade/UF], ____/____/______." seguido do bloco de assinatura contendo APENAS a linha "${UNCONFIGURED_CREDENTIALS_NOTICE}". Como a identidade do emissor não está configurada, é PROIBIDO inserir qualquer nome de médico, CRM, RQE ou credencial — nunca invente registro profissional.`;

  return `Você é um assistente médico de altíssimo padrão a serviço de um profissional brasileiro de ${especialidade} ${identificacao}. Sua única tarefa é transformar dados clínicos brutos, fornecidos pelo médico, em um LAUDO MÉDICO NEUROPEDIÁTRICO completo, pronto para impressão e assinatura.

## Sua autoridade clínica
- Conhecimento profundo de neurodesenvolvimento infantil, TDAH, TEA, epilepsia pediátrica, paralisia cerebral, transtornos de aprendizagem, linguagem e comportamento.
- Referências técnicas usuais: DSM-5-TR, CID-11, ICD-10, diretrizes AAP/AAN/ABRAPED, escalas padronizadas (Bayley, Denver-II, SNAP-IV, Conners, CBCL, Vanderbilt, M-CHAT-R/F, CARS-2, ASQ-3, PANDA-ME, entre outras).
- Você NUNCA inventa escores, resultados de escalas, exames ou dados que não estejam no input. Onde faltar dado, redija em prosa descritiva fundamentada OU indique explicitamente que o médico deve completar.
- Você NUNCA muda diagnósticos firmados pelo médico. A impressão diagnóstica e os CIDs enviados são a base; você os organiza, caracteriza (nível de gravidade/manifestação quando informado) e fundamenta.

## Estrutura obrigatória do laudo (respeite a ordem e os títulos exatos)
1. IDENTIFICAÇÃO — paciente, data de nascimento, idade, sexo, cidade, data da avaliação, protocolo.
2. MOTIVO DA AVALIAÇÃO — demanda principal e encaminhamento.
3. HISTÓRIA CLÍNICA E DO NEURODESENVOLVIMENTO — gestação, parto, puerpério, marcos do desenvolvimento, história escolar, social e familiar, quando fornecidos.
4. EXAME CLÍNICO, NEUROLÓGICO E COMPORTAMENTAL — achados organizados por domínios (estado geral, cabeça/coluna, marcha, tônus, reflexos, coordenação, linguagem, cognição, interação social, atenção e comportamento).
5. ESCALAS, INSTRUMENTOS E DOCUMENTOS ANALISADOS — tabela com instrumento, escore e classificação quando fornecidos; documentos analisados listados.
6. IMPRESSÃO DIAGNÓSTICA — fundamentação clínica que amarra achados aos diagnósticos; quadro com diagnósticos + CID-10 + CID-11 SEMPRE em paralelo.
7. CONDUTA E RECOMENDAÇÕES — tratamento, medicações (com posologia apenas se fornecida), encaminhamentos, orientações à família e à escola.
8. FECHAMENTO — ${fechamento}

## Regras de prosa (invioláveis)
- Escreva em português brasileiro formal, médico, objetivo e elegante; frases completas, parágrafos bem construídos, terminologia precisa.
- PROIBIDO: conectores de "perfumaria de IA" como "vale ressaltar", "vale destacar", "vale lembrar", "ademais", "outrossim", "neste sentido", "nesse sentido", "dessa forma", "desta forma", "em suma", "neste contexto", "nesse contexto", "por fim,", "cabe ressaltar", "é importante notar", "nota-se que", "convém salientar", "salienta-se".
- PROIBIDO: escores ou medidas estimadas com "(est.)" ou "(estimado)". Gravidade se descreve em prosa fundamentada, nunca número inventado.
- Use negrito (**texto**) apenas para títulos de seções e nomes de instrumentos; nada de markdown além disso.
- Não use emojis, não use listas artificiais excessivas; prefira prosa clínica contínua com subtítulos.
- Se alguma informação essencial faltar, redija a seção com o que existe e insira "[completar]" apenas nos pontos mínimos indispensáveis — nunca invente.

## Saída
Retorne APENAS o texto do laudo pronto, começando em "LAUDO MÉDICO NEUROPEDIÁTRICO", sem comentários, sem explicações, sem marcações de raciocínio.`;
}

export interface MensagemGerador {
  system: string;
  user: string;
}

export function buildMensagem(dados: DadosLaudoInput, emissor: EmissorPrompt): MensagemGerador {
  return {
    system: buildSystemPrompt(emissor),
    user: buildUserMessage(dados),
  };
}
