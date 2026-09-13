# Sonda Dez — segunda rodada: aplicação por iniciante

Data: 2026-09-13. Modalidade digital autoral v2026-09-13.2.
Escopo: PR #870, issue #869, repositório `jadsonfraga/neuroped`.
Base examinada: `0c9dfa2886edfbee0096d82383777a9339263b77`.

## Pergunta de aceite

Uma aplicadora que nunca usou a Sonda encontra no próprio aplicativo os estímulos, a fala, a ação, o registro e a orientação para ler a observação? O percurso também precisa explicar o que fazer quando não há resposta válida, há ajuda, interrupção ou erro de operação.

O teste técnico não certifica competência de uma pessoa real. Não houve criança ou aplicadora real nesta rodada. Todos os registros, contas de teste e interações são sintéticos. A modalidade permanece observacional piloto, sem equivalência psicométrica com manipulação presencial.

## Lacunas encontradas e correções

| Achado | Consequência para iniciante | Correção e prova |
|---|---|---|
| Familiarização da criança era citada sem acesso durante a aplicação | Aplicadora precisava improvisar o treino do controle | Acesso aos três ensaios neutros, com cronômetro pausado e registro de que houve familiarização; toques de treino não entram nas respostas |
| Treino de grade aceitava duas marcações sem desmarcar | Confirmação não demonstrava o controle solicitado | Exige evento efetivo de desmarcação |
| Espera livre podia ser concluída antes do tempo | Exploração de 20/30 segundos podia virar observação quase instantânea | Botão aguarda o tempo previsto; interrupção segue disponível; validação rejeita duração insuficiente |
| Todas as etapas NA ainda aceitavam valores com uma nota livre | Possível registro de zero sem oportunidade | Campos de missão inteiramente não avaliável devem continuar NA |
| Código P não exigia descrição da ajuda | Resultado não dizia qual pista foi usada | Revisão bloqueada sem a nota da ajuda |
| Orientação silenciosa aparecia sob “Diga exatamente” | Aplicadora poderia ler uma instrução interna à criança | Orientações de espera/chamada recebem título próprio e não são apresentadas como fala entre aspas |
| Contagens tinham instruções genéricas | Omissão, comissão, perseveração e autocorreção poderiam ser confundidas | Definições e exemplos nos campos; referência da regra por estímulo; leitura das seleções finais da grade em português |
| Cartões verbais não permitiam registrar respostas durante a série | Aplicadora precisava lembrar a série inteira | Botões privados registram a resposta ou ausência observada por cartão; resposta não marcada continua ausente, não vira erro |
| Etapa NA não podia ser reaberta | Erro de operação exigia reiniciar a sessão | Reabertura preserva histórico e exige retomar, reler e revisar os campos |
| Barra móvel e confirmação em largura estreita | Cabeçalho sobrepunha barra; botões disputavam espaço | Barra abaixo do cabeçalho móvel, botões com quebra de linha |
| Rótulo da observação mudava depois de preencher e reabrir a etapa | Identificação acessível instável impedia localizar o campo pela mesma descrição | Nome acessível explícito e estável; cenário de edição repetida após reabrir NA |
| Cinco cores SVG tinham luminosidade HSL sem unidade | Alguns objetos podiam assumir preenchimento preto | Unidades corrigidas; navegador verifica validade CSS de preenchimentos e contornos apresentados |
| Teste geral procurava BANDS como array no arquivo antigo | Dois jobs gerais da PR falharam após extração do protocolo | Teste verifica a importação real, seis faixas exatas e sete missões em cada uma; nenhuma regra de validação removida |

Foi acrescentado um guia acessível durante preparação, ensaio e aplicação: acolhimento, posição da tela, fala versus silêncio, oportunidade de resposta, ajuda, NA, revisão, exportação e entrega ao médico. Os botões bloqueados de preparação/ensaio informam o que falta.

## Matriz de ponta a ponta

| Parte | Verificação |
|---|---|
| Entrada | Login sintético, rota canônica, idade inválida, preparação incompleta, acionamento real da API de áudio e opção sem som |
| Formação | Três controles praticados, cinco casos E/I/P/0/NA; resposta errada impede iniciar |
| Cobertura | Seis trilhas, 42 missões, 76 etapas; componentes e regras usados pela aplicação real |
| Materiais | Objetos SVG, caixa, recipientes, imitação, cenas, sequência, grade, painel e planejamento |
| Temporalidade | Relógio do Playwright executa os ticks; salto de relógio só no cenário deliberado de suspensão; tempos de espera respeitados |
| Contagens | Resposta de alvo conhecida, seleções finais da grade conhecidas, botões verbais por cartão; métricas conferidas na UI e exportação |
| Interrupção | Escape, série atrasada, retomada, histórico de tentativa anterior, reabertura de NA |
| Dados ausentes | Registro incompleto, NA sem motivo, todas as etapas NA com valor indevido, P sem ajuda descrita |
| Entrega | Seis downloads iguais byte a byte ao texto da tela; cancelamento de nova sessão preserva relatório; falha de clipboard não informa sucesso |
| Interpretação | Registro parcial não produz síntese; zero é distinto de NA; quantidade não vira escore ou diagnóstico |
| Polimento | Larguras 320, 390 e 1440 px; temas claro/escuro; varreduras axe por fase e tipo de atividade; capturas visuais |

## Resultado da execução

**Rodada final aprovada tecnicamente, exit 0. Autonomia de uma iniciante real: requer validação supervisionada.**

| Comando | Resultado |
|---|---|
| `npm run test:e2e:sonda` | 6 trilhas, 42 missões, 76 etapas; 6 downloads conferidos byte a byte; cenários negativos aprovados |
| `npm run test:sonda` | 24 testes: 8 contratos anteriores + 16 da modalidade digital |
| `npm run test:cognitive` | Cognitive Lab e Sonda aprovados |
| `npm run test:scale-responses` | Contratos gerais de respostas aprovados; falha anterior da CI corrigida |
| `npm run check` | Exit 0 |
| `npm run lint` | Exit 0, sem avisos do ESLint |
| `npm run build:client` | Exit 0; permanecem avisos preexistentes de chunks grandes |
| `npm run audit:design` | 210 cores cruas, dentro da catraca de 212 |
| `npm run test:podium` | 518.878 verificações; teto de 100 preservado |

Navegador: Chromium 153.0.8010.0, Linux, execução local do build. Os testes de acessibilidade têm escopo nos componentes da Sonda, não certificam o aplicativo inteiro. Foram registradas 15 varreduras axe sem violações, além das verificações iniciais já existentes. As larguras móveis são simuladas, não testes em aparelhos físicos. O teste usa o relógio virtual para executar todos os ticks; não estima duração real de uma consulta.

Provas versionadas:

- [Recibo com hashes dos arquivos testados](sonda-dez-testes-iniciante-20260913/recibo.json) e [log da execução final](sonda-dez-testes-iniciante-20260913/execucao-e2e.log).
- [Resultados de acessibilidade](sonda-dez-testes-iniciante-20260913/a11y.json).
- Capturas: [aplicação móvel](sonda-dez-testes-iniciante-20260913/aplicacao-mobile.png), [estímulo da criança](sonda-dez-testes-iniciante-20260913/objetos-mobile.png), [revisão desktop](sonda-dez-testes-iniciante-20260913/revisao-desktop.png), [revisão em tema escuro](sonda-dez-testes-iniciante-20260913/revisao-dark-mobile.png).
- Registros sintéticos: [12–23 meses](sonda-dez-testes-iniciante-20260913/registro-12-23m.txt), [24–35 meses](sonda-dez-testes-iniciante-20260913/registro-24-35m.txt), [3–4 anos](sonda-dez-testes-iniciante-20260913/registro-3-4a.txt), [5–7 anos](sonda-dez-testes-iniciante-20260913/registro-5-7a.txt), [8–11 anos](sonda-dez-testes-iniciante-20260913/registro-8-11a.txt), [12–17 anos](sonda-dez-testes-iniciante-20260913/registro-12-17a.txt).

Reprodução: `npm ci`, `npx playwright install chromium`, `npm run build:client`, `npm run test:sonda`, `npm run test:e2e:sonda`. Neste ambiente foi usado o executável local indicado no recibo, pois o download habitual do navegador havia falhado. Nenhuma dependência do aplicativo foi acrescentada.

O contraste do tema escuro é verificado depois de acionar o botão real de tema e concluir as transições CSS. Uma execução intermediária mediu a troca de cores antes de ela terminar; a conferência isolada do estado final passou. A regra de contraste permanece ativa, com zero violações exigidas.

## Limites de aceite

- O navegador confirma geração e conclusão do som, mas não o volume ou a audibilidade do alto-falante do consultório. A confirmação humana permanece na preparação.
- A aplicadora continua observando fala, gesto, olhar, palmas, conforto e ajuda. O aplicativo não usa microfone/câmera nem transforma toques automaticamente em inferência clínica.
- Manipulação real, brincar com objetos reais e exame motor não são substituídos pela tela. Campos correspondentes permanecem explicitamente não avaliáveis nesta modalidade.
- Não foi realizada avaliação de usabilidade com uma secretária real sem experiência. Para esse aceite, observar uma primeira aplicação supervisionada, incluindo um caso com ajuda e uma interrupção, conferindo o registro com o médico.
- O registro permanece na memória da tela; precisa ser copiado ou baixado antes de sair. Esta rodada não introduz persistência clínica.
- Sem merge, publicação em homologação ou deploy de produção nesta rodada.

## Rollback

Reverter somente o commit desta rodada retorna à v2026-09-13.1 da mesma PR. Não há alteração de banco, migração, dependência, credencial ou infraestrutura.
