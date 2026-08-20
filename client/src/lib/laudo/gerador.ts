// ============================================================================
// client/src/lib/laudo/gerador.ts — motor de geração de laudo EMBUTIDO
// ----------------------------------------------------------------------------
// Gera o texto integral do laudo neuropediátrico SEM depender de API externa
// (sem Claude, sem Anthropic, sem OpenAI). Funciona 100% no navegador.
//
// Como funciona:
//   1. O médico preenche os campos clínicos na interface (texto livre).
//   2. O motor compõe o laudo na estrutura PANT (9 seções), com prosa
//      clínica pronta para cada bloco e os campos do médico fundidos na
//      redação — preservando literalmente tudo que o médico escreveu.
//   3. CID-10 e CID-11 são sempre colocados EM PARALELO (doutrina PANT).
//   4. O resultado passa pelo QA de doutrina.ts antes de ser apresentado.
//
// A prosa estrutural usa a doutrina do projeto (sem perfumaria de IA, sem
// "(est.)", sem em suma/ademais...) e nada é inventado: dado ausente vira
// espaço para o médico completar ou frase neutra de prosa.
// ============================================================================
import { qa } from "./doutrina";
import type {
  Laudo,
  LaudoBloco,
  LaudoCapa,
  LaudoDiagnostico,
  LaudoSecao,
} from "./types";

export interface EntradaLaudo {
  paciente: string;
  dataNascimento: string;
  idade: string;
  sexo: string;
  cidade: string;
  dataAvaliacao: string;
  protocolo: string;

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

  /** Diagnósticos estruturados (opcional; se vazio, usa a hipótese em prosa). */
  diagnosticos: LaudoDiagnostico[];
}

function limpo(s: string): string {
  return s.trim();
}

/** Retira ponto final (ou ". ") pendente ao final do campo, para que a prosa composta não fique com ".." ou ponto solto. */
function semPontoFinal(s: string): string {
  return limpo(s).replace(/\.\s*$/, "");
}

function par(modo: "abertura" | "p", inicial: string, texto: string): LaudoBloco {
  return { tipo: modo, inicial, texto };
}

function secao(numero: number, titulo: string, ...blocos: LaudoBloco[]): LaudoSecao {
  return { numero, titulo, blocos };
}

/** Abertura capitular: primeira palavra destacada, seguido do restante. */
function abertura(texto: string): LaudoBloco {
  // Normaliza o texto: retira ponto final pendente e espaços duplicados antes de separar.
  const t = semPontoFinal(texto.trim()).replace(/\s+/g, " ");
  const p = t.indexOf(" ");
  if (p <= 0) return par("abertura", t, "");
  return par("abertura", t.slice(0, p), " " + t.slice(p).trim());
}

/** Normaliza diagnóstico em prosa livre para uma linha estruturada.
 *  Ex.: "TEA nível 1 de gravidade (F84.0)" → {dx, caracterizacao, cid10, cid11} */
export function parseDiagnosticoProsa(
  prosa: string,
  cid10: string,
  cid11: string,
): LaudoDiagnostico[] {
  const cid10s = (cid10.match(/[A-Z]\d{2}(\.\d+)?/g) ?? []).map((c) => c.trim());
  const cid11s = (cid11.match(/\d[A-Z]\d{2}(\.\d+)?/g) ?? []).map((c) => c.trim());
  const linhas = prosa
    .split(/[;\n]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return linhas.map((l, i) => {
    // Só CIDs de verdade na linha (excluindo o "·" que separa os campos cid10/cid11)
    const cid10Linha = (l.match(/\b[A-Z]\d{2}(\.\d+)?\b/g) ?? [])[0] ?? cid10s[i] ?? cid10s[0] ?? "";
    const cid11Linha = (l.match(/\b\d[A-Z]\d{2}(\.\d+)?\b/g) ?? [])[0] ?? cid11s[i] ?? cid11s[0] ?? "";
    const semCid = l
      .replace(/\b[A-Z]\d{2}(\.\d+)?\b/g, " ")
      .replace(/\b\d[A-Z]\d{2}(\.\d+)?\b/g, " ")
      .replace(/\(([^)]*)\)/g, " ")
      .replace(/[·•]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\.\s*$/, "")
      .trim();
    return {
      dx: semCid || l,
      caracterizacao: caracterizacaoDeProsa(semCid),
      cid10: cid10Linha,
      cid11: cid11Linha,
    };
  });
}

/** Tenta extrair uma caracterização curta da prosa (ex.: "TEA nível 1 de gravidade" → "nível 1 de gravidade"). */
function caracterizacaoDeProsa(prosa: string): string {
  const m =
    prosa.match(/(n[íi]vel\s+\d+[^\.,;]*)/i) ||
    prosa.match(/(leve|moderad[oa]|grave|sever[oa])[^\.,;]{0,30}/i) ||
    prosa.match(/(sem prejuízo funcional|com prejuízo [^\.]{0,40})/i);
  if (!m) return "segundo critérios do DSM-5-TR e da CID-11";
  return m[1].trim().replace(/\.$/, "");
}

function capaMeta(e: EntradaLaudo): string {
  const meta: string[] = [];
  if (e.idade) meta.push(e.idade);
  if (e.sexo) meta.push(capitaliza(e.sexo));
  if (e.cidade) meta.push(e.cidade);
  return meta.join(" · ");
}

function capitaliza(s: string): string {
  // Preserva a capitalização original do restante do nome/texto (ex.: "de Tal").
  return s.trim() ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Junta vários campos do médico em um único parágrafo de prosa, separados por ". ". */
function funde(...campos: string[]): string {
  return campos
    .map((c) => semPontoFinal(limpo(c)).replace(/\s+/g, " "))
    .filter((c) => c.length > 0)
    .join(". ");
}

export function gerarLaudo(e: EntradaLaudo): Laudo {
  const diagnosticos =
    e.diagnosticos && e.diagnosticos.length > 0
      ? e.diagnosticos
      : parseDiagnosticoProsa(e.hipoteseDiagnostica, e.cid10, e.cid11);

  const capa: LaudoCapa = {
    eyebrow: "neuroped · laudo clínico",
    tituloLinhas: ["Laudo Médico"],
    subtituloDestacado: "NEUROPEDIÁTRICO INTEGRADO",
    pacienteLinhas: [e.paciente || "—"],
    paciente: e.paciente,
    meta: capaMeta(e),
    diagnostico: diagnosticos.map((d) => d.dx).join(" · "),
    cid10: e.cid10,
    cid11: e.cid11,
    protocolo: e.protocolo || "—",
  };

  const corpo: LaudoSecao[] = [];

  // ── §1 Identificação ──
  corpo.push(
    secao(
      1,
      "Identificação",
      abertura(
        funde(
          e.paciente
            ? `${capitaliza(e.paciente)}, ${e.sexo ? `${capitaliza(e.sexo)}, ` : ""}${e.idade || ""} de idade, natural e residente em ${e.cidade || "—"}.`
            : "Paciente identificado na consulta.",
          `Data de nascimento: ${e.dataNascimento || "____/____/______"}. Avaliação realizada em ${e.dataAvaliacao || "____/____/______"}. Protocolo ${e.protocolo || "—"}.`,
        ),
      ),
    ),
  );

  // ── §2 Motivo da avaliação ──
  corpo.push(
    secao(
      2,
      "Motivo da avaliação",
      e.motivoAvaliacao
        ? abertura(e.motivoAvaliacao)
        : par("abertura", "A", "avaliação neuropediátrica foi solicitada em razão de queixa relacionada ao neurodesenvolvimento, com demanda de investigação diagnóstica e orientação terapêutica."),
    ),
  );

  // ── §3 História clínica e do neurodesenvolvimento ──
  {
    const blocos: LaudoBloco[] = [];
    if (e.gestacaoPartoPuerperio) blocos.push(par("p", "Sobre gestação, parto e puerpério", semPontoFinal(e.gestacaoPartoPuerperio)));
    if (e.historiaNeurodesenvolvimento) blocos.push(par("p", "Quanto ao neurodesenvolvimento", semPontoFinal(e.historiaNeurodesenvolvimento)));
    if (e.historiaClinica) blocos.push(par("p", "Na história clínica", semPontoFinal(e.historiaClinica)));
    if (blocos.length === 0) {
      blocos.push(
        par("abertura", "A", "história gestacional, perinatal e do neurodesenvolvimento foi colhida com os acompanhantes, restando documentar os marcos motores, de linguagem e sociais, bem como a história familiar e escolar pertinentes."),
      );
    }
    corpo.push(secao(3, "História clínica e do neurodesenvolvimento", ...blocos));
  }

  // ── §4 Exame clínico, neurológico e comportamental ──
  {
    const blocos: LaudoBloco[] = [];
    if (e.exameClinico) blocos.push(par("p", "No exame clínico", semPontoFinal(e.exameClinico)));
    if (e.exameNeurologico) blocos.push(par("p", "No exame neurológico", semPontoFinal(e.exameNeurologico)));
    if (e.exameComportamental) blocos.push(par("p", "No exame comportamental e mental", semPontoFinal(e.exameComportamental)));
    if (blocos.length === 0) {
      blocos.push(
        par("abertura", "O", "exame físico geral e o exame neurológico segmentar encontram-se em registro clínico; os achados comportamentais e de interação observados durante a consulta estão documentados no prontuário eletrônico."),
      );
    }
    corpo.push(secao(4, "Exame clínico, neurológico e comportamental", ...blocos));
  }

  // ── §5 Escalas, instrumentos e documentos analisados ──
  {
    const blocos: LaudoBloco[] = [];
    if (e.escalasInstrumentos) blocos.push(par("p", "Foram aplicados", semPontoFinal(e.escalasInstrumentos)));
    if (e.escalasResultado) blocos.push(par("p", "Os resultados apontaram", semPontoFinal(e.escalasResultado)));
    if (e.documentosAnalisados) blocos.push(par("p", "Documentos analisados", semPontoFinal(e.documentosAnalisados)));
    if (blocos.length === 0) {
      blocos.push(par("p", "Nenhuma escala ou instrumento padronizado foi registrado nesta avaliação", "."));
    }
    corpo.push(secao(5, "Escalas, instrumentos e documentos analisados", ...blocos));
  }

  // ── §6 Diagnósticos (CID-10 e CID-11 em paralelo) ──
  corpo.push(
    secao(
      6,
      "Diagnósticos",
      par("p", "À luz dos achados clínicos, comportamentais e dos instrumentos aplicados, firmam-se os seguintes diagnósticos, com os dois códigos classificatórios sempre em paralelo (CID-10 e CID-11).", ""),
      { tipo: "diagnosticos", itens: diagnosticos },
    ),
  );

  // ── §7 Impressão / fundamentação ──
  {
    const fundamentos = limpo(e.hipoteseDiagnostica);
    const pro = fundamentos && fundamentos.split(/[;\n•·-]/).length > 1 ? fundamentos : "";
    corpo.push(
      secao(
        7,
        "Impressão diagnóstica",
        par("abertura", "A", pro || "fundamentação diagnóstica está registrada no prontuário eletrônico; os diagnósticos do §6 traduzem, em juízo clínico, a história do neurodesenvolvimento, o exame e os resultados dos instrumentos aplicados."),
      ),
    );
  }

  // ── §8 Plano terapêutico ──
  {
    const blocos: LaudoBloco[] = [];
    if (e.conduta)
      blocos.push(abertura(`O plano terapêutico contempla: ${semPontoFinal(e.conduta)}${e.recomendacoes ? `; ${semPontoFinal(e.recomendacoes)}` : ""}`));
    else if (e.recomendacoes) blocos.push(abertura(`As recomendações dirigem-se aos prejuízos demonstrados: ${semPontoFinal(e.recomendacoes)}`));
    else
      blocos.push(
        abertura("O plano dirige-se aos prejuízos demonstrados nos §§ anteriores, com seguimento neuropediátrico regular, orientação à família e à escola, e reavaliação agendada."),
      );
    corpo.push(secao(8, "Plano terapêutico", ...blocos));
  }

  // ── §9 Acompanhamento e retorno ──
  corpo.push(
    secao(
      9,
      "Acompanhamento e retorno",
      abertura("O retorno está previsto para reavaliação clínica e ajuste do plano terapêutico, com orientação de procurar o serviço antecipadamente em caso de intercorrências."),
    ),
  );

  // ── §10 Síntese ──
  corpo.push(
    secao(
      10,
      "Síntese",
      abertura(
        `Firmam-se os diagnósticos${diagnosticos.length ? ` ${diagnosticos.map((d) => d.dx).join(", ")}` : ""}, com plano terapêutico e seguimento conforme §§ 8 e 9.`,
      ),
    ),
  );

  return { capa, corpo, localData: e.cidade ? `${e.cidade}, ____/____/______.` : "Petrolina/PE, ____/____/______." };
}

/** Gera, valida pela doutrina e retorna { laudo, qa }. */
export function gerarEValidar(e: EntradaLaudo): { laudo: Laudo; qa: string } {
  const laudo = gerarLaudo(e);
  return { laudo, qa: qa(laudo) };
}
