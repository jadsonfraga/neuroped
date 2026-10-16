// ============================================================================
// laudoUmClique/pseudonimizar.ts — pseudonimização local, reversível
// ----------------------------------------------------------------------------
// REGRA: nada que identifique paciente, família ou serviço sai do navegador
// para uma IA externa. Esta função troca identificadores por marcadores
// estáveis (PACIENTE_1, RESPONSAVEL_1, [CPF] …) e devolve um mapa que fica
// SOMENTE na memória local, usado para reidentificar o texto devolvido.
// `garantirPseudonimizado` é a trava: lança erro se ainda houver identificador.
// ============================================================================

export interface MapaPseudonimos {
  /** marcador → valor original (nunca enviado). */
  porMarcador: Record<string, string>;
}

export interface ResultadoPseudonimizacao {
  texto: string;
  mapa: MapaPseudonimos;
  /** Quantidade de substituições por tipo (para auditoria na tela). */
  contagem: Record<string, number>;
}

const PADROES: { tipo: string; rotulo: string; re: RegExp }[] = [
  { tipo: "cpf", rotulo: "[CPF]", re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { tipo: "cns", rotulo: "[CNS]", re: /\b[12789]\d{14}\b/g },
  { tipo: "email", rotulo: "[EMAIL]", re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  { tipo: "url", rotulo: "[LINK]", re: /\bhttps?:\/\/\S+/gi },
  { tipo: "telefone", rotulo: "[TELEFONE]", re: /(?:\+?55\s?)?\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/g },
  { tipo: "cep", rotulo: "[CEP]", re: /\b\d{5}-\d{3}\b/g },
  { tipo: "rg", rotulo: "[RG]", re: /\b(?:RG|R\.G\.|identidade)\s*(?:n[º°.]?\s*)?[\dxX.-]{6,14}/gi },
  {
    tipo: "endereco",
    rotulo: "[ENDEREÇO]",
    re: /\b(?:Rua|R\.|Av\.?|Avenida|Travessa|Alameda|Rodovia|Estrada|Praça|Quadra)\s+[^,.;\n]{2,60}(?:,?\s*(?:n[º°.]?\s*)?\d+[A-Za-z]?)?/g,
  },
  { tipo: "data", rotulo: "[DATA]", re: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g },
  { tipo: "data", rotulo: "[DATA]", re: /\b\d{4}-\d{2}-\d{2}\b/g },
];

function escReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function partesNome(nome: string): string[] {
  // Nome completo, e cada token com 3+ letras fora de partículas comuns.
  const particulas = new Set(["de", "da", "do", "das", "dos", "e"]);
  const tokens = nome
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !particulas.has(t.toLowerCase()));
  return [nome.trim(), ...tokens].filter(Boolean);
}

export interface OpcoesPseudonimizacao {
  paciente: string;
  responsaveis?: string[];
  /** Escola, clínica, terapeutas, cidade: qualquer nome próprio a ocultar. */
  outros?: string[];
}

/**
 * Pseudonimiza `texto`. Para reaproveitar o mesmo mapa em vários campos
 * (marcadores estáveis), passe `mapaExistente`.
 */
export function pseudonimizar(
  texto: string,
  opcoes: OpcoesPseudonimizacao,
  mapaExistente?: MapaPseudonimos,
): ResultadoPseudonimizacao {
  const mapa: MapaPseudonimos = mapaExistente ?? { porMarcador: {} };
  const contagem: Record<string, number> = {};
  let saida = texto;

  const marcadorPara = (prefixo: string, original: string): string => {
    for (const [m, v] of Object.entries(mapa.porMarcador)) {
      if (v.toLowerCase() === original.toLowerCase() && m.startsWith(prefixo)) return m;
    }
    const n = Object.keys(mapa.porMarcador).filter((m) => m.startsWith(prefixo)).length + 1;
    const marcador = `${prefixo}_${n}`;
    mapa.porMarcador[marcador] = original;
    return marcador;
  };

  const trocarNomes = (nomes: string[], prefixo: string, tipo: string) => {
    for (const nome of nomes) {
      const grupo = partesNome(nome).sort((a, b) => b.length - a.length);
      if (grupo.length === 0) continue;
      // Cada forma (nome completo, primeiro nome, sobrenome) tem marcador próprio:
      // a reidentificação devolve exatamente o que estava no texto.
      for (const parte of grupo) {
        const marcador = marcadorPara(prefixo, parte);
        const re = new RegExp(`(?<![\\p{L}\\d_])${escReg(parte)}(?![\\p{L}\\d_])`, "giu");
        saida = saida.replace(re, () => {
          contagem[tipo] = (contagem[tipo] ?? 0) + 1;
          return marcador;
        });
      }
    }
  };

  trocarNomes([opcoes.paciente].filter((n) => n && n.trim()), "PACIENTE", "paciente");
  trocarNomes((opcoes.responsaveis ?? []).filter((n) => n && n.trim()), "RESPONSAVEL", "responsavel");
  trocarNomes((opcoes.outros ?? []).filter((n) => n && n.trim()), "SERVICO", "nome-proprio");

  for (const p of PADROES) {
    saida = saida.replace(p.re, (casou) => {
      contagem[p.tipo] = (contagem[p.tipo] ?? 0) + 1;
      // Datas e documentos são guardados para reidentificação ponta a ponta.
      const marcador = marcadorPara(p.rotulo.replace(/[[\]]/g, "").replace(/Ç/g, "C"), casou);
      return `[${marcador}]`;
    });
  }

  return { texto: saida, mapa, contagem };
}

/** Restaura os valores originais em um texto devolvido por IA externa. */
export function reidentificar(texto: string, mapa: MapaPseudonimos): string {
  let saida = texto;
  // Do marcador mais longo ao mais curto, para PACIENTE_10 não ser lido como PACIENTE_1.
  const marcadores = Object.keys(mapa.porMarcador).sort((a, b) => b.length - a.length);
  for (const m of marcadores) {
    saida = saida.split(`[${m}]`).join(mapa.porMarcador[m]);
    saida = saida.replace(new RegExp(`(?<![\\w])${escReg(m)}(?![\\w])`, "g"), mapa.porMarcador[m]);
  }
  return saida;
}

const MARCADOR_OK = /^(?:PACIENTE|RESPONSAVEL|SERVICO)_\d+$/;

/**
 * Trava de saída. Lança se o texto contiver identificador conhecido (nome,
 * parte de nome) ou padrão de documento/contato. Deve ser chamada imediatamente
 * antes de copiar o prompt ou de qualquer envio a IA externa.
 */
export function garantirPseudonimizado(texto: string, opcoes: OpcoesPseudonimizacao): void {
  const achados: string[] = [];
  const nomes = [opcoes.paciente, ...(opcoes.responsaveis ?? []), ...(opcoes.outros ?? [])]
    .filter((n) => n && n.trim())
    .flatMap(partesNome);
  for (const nome of nomes) {
    const re = new RegExp(`(?<![\\p{L}\\d_])${escReg(nome)}(?![\\p{L}\\d_])`, "iu");
    if (re.test(texto)) achados.push("nome");
  }
  for (const p of PADROES) {
    const re = new RegExp(p.re.source, p.re.flags.replace("g", ""));
    // Marcadores como [DATA_1] não casam nenhum padrão; só valores reais.
    if (re.test(texto)) achados.push(p.tipo);
  }
  if (achados.length > 0) {
    throw new Error(
      `Texto ainda contém identificadores (${[...new Set(achados)].join(", ")}). Envio a IA externa bloqueado.`,
    );
  }
}

export function marcadorValido(m: string): boolean {
  return MARCADOR_OK.test(m);
}
