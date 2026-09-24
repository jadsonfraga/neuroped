# Reconciliação do acervo autoral — 12 de setembro de 2026

## Escopo e dependência

Atender à solicitação de inserir instrumentos já criados, sem duplicar os existentes, com seleção adequada à pré-consulta. A reconciliação considera as fontes recuperáveis desta conversa, o catálogo em main, a branch anterior de 10/09 e o PR #860 aberto.

Base deste trabalho: `9b77392e9545e77991ea482d51da316b4682dac4`, do PR #860. O novo PR é empilhado sobre `feat/regula20-filtro-clinico-20260912`; não contém uma segunda implementação do REGULA-20. Não mesclar o PR filho em main contornando a validação do pai. Se o pai mudar, reconciliar e executar novamente os testes.

Não houve busca indiscriminada em prontuários. Foram procurados títulos de instrumentos no acervo conectado e arquivos explicitamente associados à conversa. Dados clínicos reais não foram usados em código, testes, evidências ou commits.

## Inventário reconciliado

| Instrumento | Situação anterior | Decisão |
|---|---|---|
| REGULA-20 | Implementado no PR #860, ainda não necessariamente publicado | Reutilizado, mesma identidade e contrato |
| ADAPTA-18 | Redação autoral operacional completa na branch de 10/09, sem integração | Inserido como revisão operacional v2.0-app, sem afirmar equivalência com PDF não recuperado |
| PORTA-20 | PDF integral disponível e código anterior não integrado | Inserido com itens conferidos e fonte/versão identificadas |
| TICAR-18 | Redação autoral operacional completa na branch de 10/09 | Reutilizada e integrada; PDF original não foi verificado |
| PONTE-16 | Redação autoral operacional completa na branch de 10/09 | Reutilizada e integrada; PDF original não foi verificado |
| ROTA-AUT 18 | PDF integral da conversa, sem integração | Inserido sem reescrever enunciados |
| RITMO-SONO 20 | PDF integral da conversa, sem integração | Inserido sem reescrever enunciados |
| VIGIA-MED 24, NEXO-FAM 24, NEXO-S 24, RITMO-18, TRILHA-20 | Já catalogados no projeto | Não recriados |
| ELO-COM 18 e VIGIA-MED 18 | Apenas anúncio/resumo; fonte integral não recuperada | Visíveis como pendentes, sem aplicação ou pontuação |
| PRONTO-SDG 28, ELO-COM 30 e PASSO-16 | Intake prévio bloqueado por ausência da fonte integral | Bloqueio preservado; não reconstruídos |

Resultado: **seis instrumentos novos no catálogo**, total de **110 enunciados** recuperados; REGULA-20 não duplicado; cinco fontes integrais pendentes. O catálogo passa de 268 para 274 entradas, não de 268 para 275. Contagens de aplicação genérica não são usadas para fingir que componentes dedicados são itens do motor genérico.

## Proveniência verificável

Três PDFs foram lidos integralmente por extração de texto, com inspeção visual das páginas. Os enunciados foram comparados por SHA-256 do array JSON UTF-8 compacto, normalizando somente quebras de linha/espaços. Os demais três foram comparados diretamente ao conteúdo já versionado, também por hash e igualdade do array.

| Instrumento | Integridade da fonte |
|---|---|
| PORTA-20 | `NeuroPed_SDG_PORTA20_Premium_v2_1_2026-09-10.pdf` · `sha256:4686c65cb711a6e09ba5481ae9c63073792b6a8f459eba093bd5677b64005198` |
| ROTA-AUT 18 | `ROTA_AUT_18_SDG_v1_0_11-09-2026.pdf` · `sha256:1bc9ce1fda6ae6b57012621e6a803917169f8f09928ca7db68d5345447161aca` |
| RITMO-SONO 20 | `RITMO_SONO_20_SDG_v1_0_12-09-2026.pdf` · `sha256:e710cf4a8fbc596698e3e41c4d8a9e959927233774309d8d868e7ddceff47e01` |
| ADAPTA/TICAR/PONTE | `client/src/data/interactiveScaleItemsAuthorial20260910.ts` no commit `b7adca686b8dba657b4b1317583f485cede7a0c8` |

Hashes de todos os arrays de enunciados estão congelados em `tests/unit/recovered-authorials.test.ts`. O teste não prova validação psicométrica, apenas fidelidade da redação recuperada. A forma `sha256:` identifica integridade documental, não segredo ou verificador de acesso.

### Divergências tratadas honestamente

- **PORTA:** arquivo diz v2_1, conteúdo/rodapés dizem v2.0. O contrato contém ambos (`2.0-pdf-arquivo-2.1-20260910`). Faixa impressa de 4–10 anos inclui até 10 anos e 11 meses: 48–131 meses, não o limite anterior de 120. A janela é de **14 dias com frequência escolar**, não automaticamente 14 dias corridos.
- **ROTA-AUT:** escore maior significa maior habilidade/autonomia, não maior dificuldade. Não confundir com o PASSO-16 sem fonte.
- **RITMO-SONO:** é diferente de RITMO-18 (fadiga). Questionário completo requer cuidador que observa noites; professor não responde por suposição sobre o sono noturno. Autorrelato paralelo citado no PDF não foi misturado à aplicação do cuidador.
- **ADAPTA/TICAR/PONTE:** fontes de código recuperadas são rotuladas como revisões operacionais; não são apresentadas como PDF conferido. A tela exige ciência dessa origem. Comparações com contratos anteriores exigem novo basal ou revisão explícita, não conversão silenciosa.
- ELO-COM **18** não é ELO-COM **30**; VIGIA-MED **18** não é VIGIA-MED **24**.

## Filtro inteligente, mas não diagnóstico

Acesso pelo **Filtro → Acervo autoral · seleção inteligente** ou por objetivos autorais na pré-consulta. A seleção exige idade exata, respondente, contexto, objetivo, observação suficiente e ausência de urgência atual. Não consulta dados pessoais em URL.

As prioridades são ordenadas pelo próprio usuário; até três podem ser selecionadas. O motor entrega no máximo dois formulários distintos, respeitando teto de 20 ou 40 itens pontuados. Identificação, alertas e contexto demandam tempo adicional, explicitado. Não se inventa uma duração de aplicação não aferida. Escalas já marcadas como aplicadas são excluídas; instrumentos de objetivo sobreposto não entram apenas para preencher posições. REGULA e ADAPTA não são empilhados quando o primeiro já foi selecionado.

Para instrumentos de contexto único, casa/escola/terapia não são combinados. PONTE requer observação direta pela mesma pessoa em pelo menos dois ambientes, como condição operacional conservadora de generalização. Professor precisa informar contexto escolar. PORTA só é liberado para observação escolar direta; RITMO-SONO completo apenas para cuidador em casa. Casos sem opção compatível retornam vazio com explicação; não há resgate por instrumento de outra idade ou informante.

O antigo ranking aditivo da pré-consulta foi substituído por bloqueios prévios: idade fora da faixa, respondente/método incompatíveis, referência sem aplicação, licença restrita e instrumentos de risco agudo não se tornam candidatos apenas porque têm link. O motor clínico canônico é reutilizado, com uma opção principal breve e eventual formulário escolar separado. Não se repete Ouro como Prata. Em ajuste medicamentoso, o objetivo principal é monitorização de efeitos, não uma triagem diagnóstica automática.

## Apuração e retorno à família

Cada definição guarda sua direção e regra, sem transformar todos os instrumentos numa mesma escala:

| Instrumento | Métrica | Cobertura de domínio/global | Direção |
|---|---|---|---|
| ADAPTA-18 | Média 0–3 | 4/6 por domínio; 14/18 global | Maior = maior carga |
| PORTA-20 | Média 0–3 | 4/5 por domínio; 16/20 global | Maior = maior apoio necessário |
| TICAR-18 | Média 0–3 | 4/6 por domínio; 14/18 global | Maior = maior repercussão |
| PONTE-16 | Média 0–3 | 2/4 por domínio; 12/16 global | Maior = maior generalização |
| ROTA-AUT 18 | Percentual funcional descritivo | 3/6 por domínio; total sobre itens observáveis, com cobertura explícita | Maior = maior autonomia |
| RITMO-SONO 20 | Carga percentual observada | Calculada sobre itens observáveis, com cobertura explícita | Maior = maior frequência de dificuldades |

N/O é excluído do numerador e denominador. Nenhum observável gera `null`, nunca zero. O formulário não conclui com itens/alertas obrigatórios em branco. Totais brutos só existem com todos os itens observáveis; não há prorrateamento oculto. Percentuais são **descrições dos itens observados, não percentis, normas ou gravidade**. Valores de versões, informantes, contextos ou conjuntos de itens diferentes não devem ser comparados isoladamente.

As linhas de apuração integram o mesmo conjunto de respostas entregue à tela, exportação e componente de salvamento. Alertas, exemplos, mudanças de contexto, pontos fortes, meta funcional e próximos passos são mantidos por extenso. PORTA também preserva mapa de apoios escolares testados, sem pontuar os apoios.

## Privacidade e segurança

Formulários ficam em memória. Não há envio automático, nova credencial, alteração de permissão, paciente fictício persistido em produção ou rascunho clínico em browser storage. Trocar de aba preserva o painel; voltar e limpar uma aplicação exige confirmação. Recarregar ou sair da rota perde uma aplicação não salva, como informado na tela. O botão de vincular ao prontuário é reservado ao fluxo explícito da equipe e reutiliza as proteções existentes do aplicativo.

Red flags permanecem fora dos cálculos e exigem respostas próprias. Presente ou incerteza solicita avaliação da equipe; não é descartado por escore favorável. A orientação em urgência não transforma o questionário em protocolo emergencial. Referência institucional: Ministério da Saúde, SAMU 192, `https://www.gov.br/saude/pt-br/composicao/saes/samu-192`.

## QA e reprodução

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run lint
node --import tsx tests/unit/recovered-authorials.test.ts
node --import tsx tests/unit/regula20.test.ts
node --import tsx tests/unit/regula20-report.test.ts
npm run validate:safety
npm run validate:catalog
git diff --exit-code -- docs/PROVENIENCIA_CLINICA.md
npm run audit:access
npm run audit:inventory
npm run validate:public
npm run test:filter
node tests/unit/live-previsit-persistence-guard.test.mjs
npm run build:client
node tests/e2e/recovered-authorials.mjs
node tests/e2e/regula20-previsit.mjs
```

E2E: seis aplicações completas em bundle real, mobile/desktop, fonte operacional explicitada, N/O, apuração exportada, alertas, retenção entre abas, limpeza da aplicação e navegação pela pré-consulta. Usa servidor efêmero em 127.0.0.1, identidade sintética e endpoints de leitura simulados. **Não comprova gravação clínica no backend de produção.** Evidências em `artifacts/recovered-authorials/`. Falhas de setup do teste foram corrigidas sem remover assertivas de console, privacidade ou completude.

## Publicação e reversão

Não houve merge ou deploy de produção nesta implementação. Antes da liberação, concluir checks do PR e revisão clínica dos contratos operacionais; esta integração não é validação psicométrica.

Reversão: reverter o merge deste PR filho, mantendo o PR #860 e suas regras do REGULA. Nenhuma migração de banco é necessária. Preservar registros por extenso eventualmente já salvos sob suas versões; não converter para instrumentos parecidos nem apagá-los. Revalidar filtro geral, REGULA, pré-consulta e inventário após rollback.
