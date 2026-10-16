// ============================================================================
// laudoUmClique/promptIA.ts — prompt pseudonimizado para refinar o laudo
// ----------------------------------------------------------------------------
// O app não chama IA externa por conta própria. Este módulo monta um pacote
// SOMENTE com marcadores (PACIENTE_1, [DATA_1] …) para o médico colar numa IA
// da sua escolha; o texto devolvido volta pela reidentificação local.
// A trava `garantirPseudonimizado` impede copiar um prompt com identificador.
// ============================================================================
import { gerarLaudoUmClique } from "./gerador";
import { garantirPseudonimizado, pseudonimizar, type MapaPseudonimos, type OpcoesPseudonimizacao } from "./pseudonimizar";
import type { EntradaLaudoUmClique } from "./tipos";

const REGRAS_RESUMIDAS = `Você revisa a prosa de um laudo neuropediátrico escrito por um médico. Regras:
- Fidelidade: nunca invente dado, cena, fala, número, dose, data, exame ou nome. Lacuna vira pergunta ao médico, fora do laudo.
- Mantenha diagnósticos, CID-10 e CID-11 (em paralelo), doses e condutas exatamente como estão.
- Voz impessoal, sem primeira pessoa; sem menção a ferramenta, IA, ficha ou sistema no corpo.
- Frases com no máximo 45 palavras, ao menos 90% abaixo de 30; preferir uma vírgula; sem travessão; sem "não X, mas Y".
- Sem lista com marcadores; sem negrito ou CID em título; manter a declaração de fonte ("sem verificação direta nesta consulta").
- Nomes de escala, escore e percentil ficam só no Anexo técnico.
- Mantenha os marcadores (PACIENTE_1, RESPONSAVEL_1, [DATA_1], [CPF_1] …) exatamente como estão.
- Devolva: A) perguntas e lacunas ao médico; B) laudo revisado.`;

export function opcoesDe(e: EntradaLaudoUmClique): OpcoesPseudonimizacao {
  return { paciente: e.paciente, responsaveis: e.responsaveis, outros: [e.cidade].filter((c) => c.trim()) };
}

export interface PacotePseudonimizado {
  prompt: string;
  mapa: MapaPseudonimos;
  contagem: Record<string, number>;
}

/** Gera o laudo local, pseudonimiza e monta o prompt. Lança se restar identificador. */
export function montarPacoteIA(e: EntradaLaudoUmClique): PacotePseudonimizado {
  const { laudo } = gerarLaudoUmClique(e);
  const opcoes = opcoesDe(e);
  const r = pseudonimizar(laudo.texto, opcoes);
  const prompt = `${REGRAS_RESUMIDAS}\n\n--- LAUDO (pseudonimizado) ---\n${r.texto}`;
  garantirPseudonimizado(prompt, opcoes);
  return { prompt, mapa: r.mapa, contagem: r.contagem };
}
