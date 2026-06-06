# TESTE-ESTRESSE-V10 — camada de diferenciais do filtro

> Escopo honesto: este documento **traça deterministicamente** a saída da camada
> de diferenciais (`DIFFERENTIALS` em `filtro-escalas.html`) para cada persona. É
> verificável lendo o mapa no código — não é um claim de ranking psicométrico.
> A ordenação Ouro/Prata/Bronze depende do catálogo em runtime e não foi
> executada em harness headless nesta rodada (limitação declarada).

## Regra da camada

Para as queixas selecionadas, o painel mostra os quadros que **mimetizam ou
coexistem** e ainda **não** foram marcados pelo médico — no máximo 4, rotulados
como "cruzar com a avaliação". Nunca fecha diagnóstico.

## Traços por persona

| Persona | Queixa(s) | Diferenciais surgidos | Defensável? |
|---|---|---|---|
| TEA não-verbal | `tea` + `fala` | TDAH (sobreposição atenção/social), Autonomia/AVDs (perfil adaptativo) | ✅ — atraso de linguagem isolado × TEA é diferencial clássico |
| TEA verbal | `tea` | Atraso de fala, TDAH, Autonomia | ✅ |
| TDAH | `tdah` | Ansiedade, Sono, Suspeita de TEA, Dificuldade escolar | ✅ — privação de sono e ansiedade mimetizam desatenção |
| TOD / opositor | `comportamento` | Ansiedade, Humor/tristeza, Desatenção/TDAH | ✅ — oposição pode mascarar ansiedade/humor |
| Ansiedade | `ansiedade` | Humor/tristeza, Dificuldade escolar (recusa), TDAH | ✅ |
| Sofrimento escolar | `escola` | TDAH, Ansiedade, Atraso de fala (linguagem) | ✅ — dislexia/TEL subjacentes à leitura |
| Risco suicida | `risco` | Humor, Ansiedade | ✅ — rastrear humor/ansiedade; segurança é prioridade |
| Pré-escolar opositor | `comportamento` (idade<72m) | Ansiedade, Humor, TDAH | ✅ |
| Regressão / atraso global | `motor` + `autonomia` | Epilepsia (quedas × crise atônica), TEA | ✅ |
| Adolescente mascarado | `tea` + `humor` | TDAH, Autonomia, Ansiedade, Risco | ✅ — burnout/masking exige rastrear humor e risco |

## Casos onde a camada **não** dispara (correto)

- Queixa única `medicacao` (acompanhamento pós-fármaco) → sem diferencial: é
  seguimento longitudinal, não triagem diagnóstica.
- Quando todos os diferenciais já estão selecionados pelo médico → painel só
  mostra fenótipo + construtos (nada redundante).

## O que continua fora de alcance honesto

- **Confiança da inferência (%)**, **falso-positivo quantificado**,
  **conflito diagnóstico graduado**: exigem `evidence-registry.json` curado.
  Sem isso, qualquer número seria inventado — não foi implementado de propósito.

— Validação: `node scripts/test-static.mjs` → 661 OK, 0 falhas.
