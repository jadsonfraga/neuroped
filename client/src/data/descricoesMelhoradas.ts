// Descrições Melhoradas com Exemplos Reais de Perguntas
// Mapeamento: escalaId → descrição por extenso com exemplos para pais/professores
//
// Só instrumentos de uso livre. Licenciados (BRIEF-2, Conners 3, SCARED, ECBI, SDQ, SESBI-R,
// M-CHAT-R/F, Bayley-III, ASQ-3, CSHQ) saíram em 17/10/2026: a ficha de referência não reproduz
// perguntas nem regra de corte do original, e usa a descrição curta do catálogo.

export const descricoesMelhoradas: Record<string, string> = {
  // ============ TDAH ============
  "snap": `Avalia desatenção, hiperatividade e impulsividade em crianças 6-18 anos.
Respondentes: Pais (casa) e Professor (escola).

EXEMPLOS DE PERGUNTAS QUE VOCÊ MARCA:
1. DESATENÇÃO — "Seu filho deixa tarefas/lição de casa incompletas?"
   📌 Nunca (não acontece) → Às vezes (1-2x/semana) → Frequentemente (3-4x/semana) → Muito frequentemente (diariamente)
   Exemplo: Começa lição mas abandona, não termina atividade, distrai facilmente

2. DESORGANIZAÇÃO — "Seu filho perde coisas necessárias para tarefas?"
   📌 Exemplo: Esquece mochila, perde uniforme, não encontra material, perdido com suas coisas

3. HIPERATIVIDADE — "Seu filho está sempre em movimento, não consegue ficar parado?"
   📌 Exemplo: Pula da cadeira durante refeições, corre sem motivo em casa, mexe constantemente

4. IMPULSIVIDADE — "Seu filho bloqueia frequentemente durante conversas?"
   📌 Exemplo: Interrompe pessoas, não espera a vez, responde antes de terminar pergunta

PROFESSOR MARCA:
- "O aluno desorganiza sua carteira?"
- "O aluno sai do lugar sem permissão durante aula?"
- "O aluno presta atenção ao que é dito?"
- "O aluno espera sua vez para falar?"

INTERPRETAÇÃO:
Score 10-15: Normal | Score 16-25: Atenção do clínico | Score 26+: Provável TDAH
→ Se escore alto + impacto funcional = encaminhar para psiquiatra/psicólogo`,

  // ============ ANSIEDADE ============

  "rcads": `Ansiedade (generalizada, separação, pânico, social, fobia) + Depressão.
Respondentes: Criança (8+) e Pais (5+). 47 itens. Mais abrangente que SCARED.

EXEMPLOS:
1. ANSIEDADE GENERALIZADA — "Você se preocupa muito?"
   📌 Escala: Nunca (0) → Às vezes (1) → Frequentemente (2) → Sempre (3)

2. TRANSTORNO DE PÂNICO — "Você sente desconforto no peito quando fica nervoso?"
   📌 Exemplo: Palpitações, tremores, falta de ar, tonturas

3. DEPRESSÃO — "Você se sente triste ou infeliz?"
   📌 Exemplo: Apatia, isolamento, perda de interesse, choro

4. FOBIA SOCIAL — "Você tem medo de falar em apresentação?"
   📌 Exemplo: Recusa participar, muito nervoso, quer sair da aula

AUTORRELATO VS PAIS:
Crianças frequentemente mascaram ansiedade em casa (aparentam estar bem)
Autorrelato adolescente é MAIS CONFIÁVEL que relato de pais
→ Compare: Se pais marcam 15 mas criança marca 40 = criança está mascando
→ Confie mais no autorrelato em adolescentes`,

  // ============ PROMIS ============
  "promis-ped-cognitive": `Queixa cognitiva funcional em crianças 8-17 anos: dificuldade de memória, atenção, aprendizagem percebida.
Respondente: AUTOAPLICÁVEL ou PAIS. Rápido (2-3 min).

EXEMPLOS:
- "Você tem dificuldade em lembrar de informações?"
- "Você tem dificuldade em manter atenção?"
- "Você esquece o que aprendeu na aula?"

DIFERENÇA PROMIS vs TDAH:
TDAH = observação de comportamento (diagnóstico)
PROMIS = autopercepção de dificuldade (impacto funcional)
→ Uma criança pode ter TDAH (diagnóstico) MAS baixo PROMIS cognitivo se compensando bem
→ Ou baixo TDAH (comportamento controlado) MAS alto PROMIS (autopercepção de dificuldade)

USO: Monitorização de evolução/resposta a tratamento
Se PROMIS cognitivo melhora = tratamento está funcionando (funcionalidade aumentou)`,
};

// Função para aplicar descrições melhoradas ao escalar
export function aplicarDescricaoMelhorada(escala: any): any {
  if (descricoesMelhoradas[escala.id]) {
    return {
      ...escala,
      description: descricoesMelhoradas[escala.id],
    };
  }
  return escala;
}
