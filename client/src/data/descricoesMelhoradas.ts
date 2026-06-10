// Descrições Melhoradas com Exemplos Reais de Perguntas
// Mapeamento: escalaId → descrição por extenso com exemplos para pais/professores

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

  "brief2": `Avalia função executiva: planejamento, organização, inibição, memória de trabalho.
Respondentes: Pais (casa) e Professor (escola). 63 itens.

EXEMPLOS PARA PAIS:
1. INIBIÇÃO — "Seu filho fala na hora errada ou em situações inadequadas?"
   📌 Exemplo: Grita na rua, fala coisa inapropriada, não consegue esperar em fila

2. MEMÓRIA DE TRABALHO — "Seu filho esquece instruções simples?"
   📌 Exemplo: Você diz "pegue a mochila, coloque o lanche, va para a porta" e ele fica perdido

3. PLANEJAMENTO — "Seu filho tem dificuldade em organizar atividades?"
   📌 Exemplo: Não consegue planejar o dia, começa 10 coisas, não termina nenhuma

4. ORGANIZAÇÃO DE MATERIAIS — "Seu filho perde/mistura seus materiais?"
   📌 Exemplo: Mochila é bagunça, não encontra lápis, esquece o que levou

PROFESSOR MARCA:
- "O aluno segue instruções de múltiplos passos?"
- "O aluno consegue organizar o tempo em aula?"
- "O aluno controla seus impulsos?"

COMBINAÇÃO TDAH:
Se SNAP alto (desatenção) + BRIEF2 alto (execução) = TDAH clássico com déficit executivo`,

  "conners": `Comportamento, desatenção, hiperatividade-impulsividade, problemas de aprendizagem, problemas psicossomáticos.
Respondentes: Pais e Professor. Versão de 27 ou 39 itens.

EXEMPLOS:
1. DESATENÇÃO — "Seu filho tem dificuldade em concentração?"
   📌 Distrai-se facilmente, não consegue manter atenção em lições

2. HIPERATIVIDADE — "Seu filho é impulsivo e age sem pensar?"
   📌 Pula na frente de fila, bate sem avisar, toma decisões precipitadas

3. PROBLEMAS DE APRENDIZAGEM — "Seu filho tem dificuldade em aprender?"
   📌 Não acompanha na aula, esquece o que aprendeu, precisa repetir

VANTAGEM: Score geral único (mais simples que SNAP-IV)`,

  // ============ ANSIEDADE ============
  "scared": `Ansiedade infantil: separação, generalizada, pânico, social, fobia específica.
Respondentes: Criança (8+) e Pais. 41 itens.

EXEMPLOS PARA PAIS:
1. SEPARAÇÃO — "Seu filho sente medo/pânico quando você sai de perto?"
   📌 Não (0) → Um pouco (1) → Muito (2)
   📌 Exemplo: Chora ao ir para escola, liga várias vezes, dorme com pais, não consegue dormir sozinho

2. PREOCUPAÇÃO GENERALIZADA — "Seu filho se preocupa muito com coisas ruins?"
   📌 Exemplo: Medo de acidente de carro, medo de morte de pais, preocupação com saúde (sem motivo real)

3. FOBIA SOCIAL — "Seu filho fica nervoso com pessoas desconhecidas?"
   📌 Exemplo: Recusa fazer apresentação, evita ir em festas, não participa em aula, silencioso com estranhos

4. ANSIEDADE SOMÁTICA — "Seu filho sente dor de barriga/cabeça quando ansioso?"
   📌 Exemplo: Dor no dia de prova, dor ao pensar em evento social, tremores

PARA AUTORRELATO (8+):
"Você se preocupa com coisas ruins que podem acontecer?"
"Você tem dificuldade em dormir porque está preocupado?"
"Você fica nervoso em situações sociais?"

INTERPRETAÇÃO:
Score 0-24: Normal | 25-29: Leve | 30+: Moderado-Severo
→ Score 30+ = referir para psicólogo/psiquiatra`,

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

  // ============ COMPORTAMENTO EM CASA ============
  "ecbi": `Comportamento disruptivo em CASA: agressão, desafio, birra, desobediência.
Respondente: PAIS (criança 2-12 anos). 36 itens.

EXEMPLOS PARA MARCAR EM CASA:
1. AGRESSÃO FÍSICA — "Seu filho bate, chuta ou agride?"
   📌 Nunca (1) → Às vezes (3) → Frequentemente (5) → Sempre (7)
   📌 Exemplo: Bate em irmão, agride pais quando contrariado, chuta parede

2. DESAFIO/DESOBEDIÊNCIA — "Seu filho desobedece suas ordens?"
   📌 Exemplo: Recusa fazer lição, não quer ir dormir, ignora quando chama, faz o oposto

3. TEMPERAMENTO/BIRRA — "Seu filho chora, grita ou faz birra?"
   📌 Exemplo: Grita quando não consegue o que quer, choro por qualquer coisa, enraivecido facilmente

4. DESTRUTIVIDADE — "Seu filho quebra ou danifica coisas intencionalmente?"
   📌 Exemplo: Quebra brinquedo, rasga livro, joga coisas no chão, escreve na parede

MARCAÇÃO:
Primeiro: Intensidade (1-7)
Depois: Marca SIM se é PROBLEMA em casa

PADRÃO NORMAL:
- 2-4 anos: Algumas birras, desafio leve (esperado)
- 6+ anos: Birra rara, desobediência ocasional (normal)

PADRÃO PREOCUPANTE:
- Qualquer idade: Agressão física frequente, desobediência extrema, comportamento destrutivo
→ Escore >140 em intensidade = avaliar TOD, trauma, ou estrutura familiar`,

  // ============ COMPORTAMENTO EM ESCOLA ============
  "sdq": `Problemas emocionais, comportamentais, de relacionamento e hiperatividade EM ESCOLA.
Respondente: PROFESSOR (criança 4-16 anos). 25 itens. Rápido e validado mundialmente.

PROFESSOR MARCA:
1. SINTOMAS EMOCIONAIS — "O aluno é nervoso ou tímido?"
   📌 Exemplo: Criança se preocupa frequentemente, tem medo de novas situações, fica ansiosa

2. PROBLEMAS DE CONDUTA — "O aluno é desobediente?"
   📌 Exemplo: Não segue regras, bate em colegas, quebra coisas propositalmente

3. HIPERATIVIDADE — "O aluno é inquieto ou impulsivo?"
   📌 Exemplo: Não consegue ficar parado, sai da cadeira, fala na aula

4. PROBLEMAS DE RELACIONAMENTO — "O aluno é rejeitado pelos colegas?"
   📌 Exemplo: Ninguém quer brincar, é bullizado, não tem amigos, isolado

5. COMPORTAMENTO PRÓ-SOCIAL — "O aluno é prestativo?"
   📌 Exemplo: Ajuda, compartilha, é gentil, considera sentimentos dos outros

INTERPRETAÇÃO:
Escore baixo (0-11): Normal
Escore 12-15: Borderline
Escore 16+: Anormal (preocupante)

VANTAGEM: Respondente PROFESSOR ve o comportamento na escola (diferente de casa)
LIMITAÇÃO: Não diagnóstico, apenas triagem de problemas comportamentais`,

  // ============ COMPORTAMENTO EM ESCOLA (Diagnóstico) ============
  "sesbi-r": `Comportamento disruptivo EM ESCOLA: desobediência, agressão, hiperatividade, desafio.
Respondente: PROFESSOR (criança 2-12 anos em contexto escolar). 38 itens.

PROFESSOR MARCA:
1. DESOBEDIÊNCIA/DESAFIO — "O aluno desobedece em sala de aula?"
   📌 Exemplo: Recusa fazer atividade, ignora instruções, faz o contrário do pedido

2. AGRESSÃO — "O aluno agride colegas ou adultos na escola?"
   📌 Exemplo: Bate em colegas, chuta, empurra, morde

3. HIPERATIVIDADE/IMPULSIVIDADE — "O aluno sai da carteira sem permissão?"
   📌 Exemplo: Levanta frequentemente, corre na sala, não consegue ficar sentado

4. PROBLEMAS DE ATENÇÃO — "O aluno não presta atenção nas aulas?"
   📌 Exemplo: Distrai-se, olha para outro lado, não segue instruções

MARCAÇÃO:
Frequência: 0-7 (Nunca a Sempre)
Problema: Sim/Não (é problema em sala?)

VANTAGEM: Versão escolar específica do ECBI (que é casa)
DIFERENÇA CASA vs ESCOLA:
- Criança pode ter escore alto em ECBI (casa) mas baixo em SESBI-R (escola) ou vice-versa
- Diferença significa: padrão situacional, limite diferente de pais vs professor`,

  // ============ AUTISMO ============
  "mchat": `Triagem de AUTISMO em lactentes/toddlers 16-30 meses.
Respondente: PAIS. 20 perguntas. Se positivo → referir para ADOS-2.

PERGUNTAS IMPORTANTES:
1. APOINTAR/COMPARTILHAR — "Seu filho aponta para coisas interessantes?"
   📌 Exemplo: Aponta para avião, diz "olha!", mostra algo que achou

2. IMITAÇÃO — "Seu filho imita você?" (som, gesto, brinquedo)
   📌 Exemplo: Bate palmas quando você bate, faz som de carro, levanta os braços

3. BRINCADEIRA SIMBÓLICA/FAZ-DE-CONTA — "Seu filho brinca de faz-de-conta?"
   📌 Exemplo: Alimenta boneca com colher, telefone ao ouvido, coloca sapato em boneca

4. CONTATO OCULAR — "Seu filho mantém contato ocular com você?"
   📌 Exemplo: Olha para seu rosto quando fala, responde ao seu nome virando

5. RESPOSTA A "NÃO" — "Seu filho compreende quando você diz 'não'?"
   📌 Exemplo: Para a ação, olha para seu rosto quando diz não

INTERPRETAÇÃO:
Score 0-2: BAIXO RISCO (desenvolvimento típico)
Score 3+: RISCO AUMENTADO (precisa ADOS-2 diagnóstica urgentemente!)

SINAIS DE ALERTA EM M-CHAT POSITIVO:
- Falta de contato ocular
- Não faz apointar/compartilhamento
- Não imita simples
- Não faz brincadeira simbólica
- Comportamentos repetitivos (alinha brinquedos, gira, flapping)

FOLLOW-UP:
Se positivo: Agendar ADOS-2 em até 1 mês
Se negativo: Monitorar e reavalie em 3-6 meses`,

  // ============ DESENVOLVIMENTO ============
  "bayley": `Padrão-ouro para desenvolvimento infantil 1-42 meses.
Clínico avalia: Cognitivo, Linguagem (receptiva/expressiva), Motor (fino/grosso).

O QUE OS PAIS OBSERVAM EM CADA DOMÍNIO:

COGNITIVO (Como aprende e pensa):
- 6 meses: Segura objetos, leva à boca, bate em brinquedos?
- 12 meses: Aponta para objetos, imitação simples, procura objeto escondido (permanência)?
- 18 meses: Empilha 2-3 blocos, aponta figuras em livro?
- 24 meses: Identifica cores, segue instruções de 2 passos?

LINGUAGEM RECEPTIVA (Compreensão):
- 6 meses: Vira para sons, responde ao nome?
- 12 meses: Entende "não", segue comando como "tchau"?
- 18 meses: Aponta partes do corpo quando pergunta?
- 24 meses: Segue instruções de 2-3 passos ("Pegue a boneca e sente")?

LINGUAGEM EXPRESSIVA (Fala):
- 6 meses: Balbucio com sons duplicados ("ba-ba", "da-da")?
- 12 meses: Primeira palavra com significado ("mamã", "papá")?
- 18 meses: 10-20 palavras isoladas?
- 24 meses: 2+ palavras juntas ("mamã água")?

MOTOR FINO (Mãos):
- 3 meses: Segura objeto por segundos?
- 6 meses: Pega objetos com toda mão (palmar)?
- 12 meses: Pinça com polegar+índice (superior)?
- 18 meses: Scribble espontâneo?
- 24 meses: Vira páginas de livro?

MOTOR GROSSO (Corpo):
- 2 meses: Levanta cabeça quando prono?
- 4 meses: Rola ventral-dorsal?
- 6 meses: Senta com apoio?
- 9 meses: Senta sem apoio?
- 12 meses: De pé com apoio, alguns passos?
- 18 meses: Anda sem apoio, sobe escada?
- 24 meses: Corre, sobe/desce móvel?

SINAIS DE ALERTA PARA REFERÊNCIA:
- 6 meses: Não segura objetos, não responde a sons
- 12 meses: Sem balbucio, não senta
- 18 meses: <10 palavras, não anda
- 24 meses: <50 palavras, não segue comandos, atraso motor
→ Qualquer dúvida = referir para Bayley-III formal`,

  "asq3": `Triagem de desenvolvimento em 5 domínios (comunicação, motor grosso, motor fino, resolução de problema, socio-pessoal).
Respondente: PAIS. 30 itens. Rápido, confiável, por correspondência.

EXEMPLOS POR DOMÍNIO:
1. COMUNICAÇÃO — "Seu filho fala 50+ palavras?"
   📌 16-18 meses: 10-50 palavras esperado

2. MOTOR GROSSO — "Seu filho sobe escada?"
   📌 18-24 meses: Deve subir escada com apoio

3. MOTOR FINO — "Seu filho faz desenhos?"
   📌 24-30 meses: Deve fazer scribble

4. RESOLUÇÃO PROBLEMA — "Seu filho coloca blocos em caixa?"
   📌 Compreensão de ação-propósito

5. SOCIO-PESSOAL — "Seu filho brinca de esconde-esconde?"
   📌 Interação social e diversão compartilhada

INTERPRETAÇÃO:
Escore >score de corte por idade = desenvolvimento normal
Escore <corte = encaminhamento para avaliação diagnóstica
Zona cinzenta = reavalie em 4-6 semanas

VANTAGEM: Acessível, respondido pelos pais, não requer clínico`,

  // ============ SONO ============
  "cshq": `Hábitos e problemas de sono infantil. Respondente: PAIS (4-10 anos). 33 itens.

ÁREAS AVALIADAS:

INSÔNIA (Dificuldade adormecer/manter sono):
- "Seu filho tem dificuldade em adormecer?"
  📌 Raramente (1) → Às vezes (2) → Frequentemente (3)
  📌 Exemplo: Leva >30 min para dormir, acorda muitas vezes, não volta a dormir

- "Seu filho resiste a ir para cama?"
  📌 Exemplo: Nega, faz birra, traz desculpas, chora

APNEIA (Ronco/pausas respiratórias - PREOCUPANTE):
- "Seu filho ronca durante o sono?"
- "Seu filho faz pausas ao respirar?" ⚠️ REFERIR ORL URGENTE
- "Seu filho dorme com boca aberta?"

SONOLÊNCIA (Cansaço excessivo):
- "Seu filho dorme muito durante o dia?"
- "Seu filho fica sonolento na escola?"
- "Dificuldade em acordar pela manhã?"

PARASONIAS (Comportamentos anormais):
- "Seu filho fala durante o sono?" (normal)
- "Seu filho anda durante o sono?" (preocupante, referir neurologista)
- "Seu filho grita ou chora à noite?" (terror noturno)

COMPORTAMENTO ASSOCIADO:
- "Seu filho insiste em dormir com pais?"
- "Seu filho tem dificuldade em separar de pais?"

INTERPRETAÇÃO:
Escore baixo: Sono normal
Escore médio-alto: Distúrbio de sono significativo
Ronco FREQUENTE + sonolência = APNEIA PROVÁVEL → Referir pediatra/ORL

PADRÃO ESPERADO:
- 4-6 anos: Pode ter resistência, pesadelos ocasionais (normal)
- 6-10 anos: Dorme 9-10h, acordar raro (normal)`,

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
