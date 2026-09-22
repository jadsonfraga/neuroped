# Sonda Dez — auditoria de confiabilidade e uso clínico

Issue: #921. Base auditada: `74abe8efcb95735fc28b17a1bc968179fe6d38d2`.
Versão digital: `2026-09-22.1`. Escopo: Sonda; OBS-10, navegação prioritária, APIs, banco, permissões e contratos comerciais inalterados.

## Matriz de achados e correções

| Área | Falha demonstrada no código anterior | Correção / evidência de regressão |
|---|---|---|
| Contagens presenciais | Campo vazio renderizado como zero; zero numérico podia ser descrito como habilidade não demonstrada | Entrada vazia, zero explícito, NA e limpar; validação por tipo; casos unitários e browser |
| Idade presencial | Default de três anos, clamp silencioso e idade preservada ao trocar de criança | Idade inteira explícita 12–215 meses, sem clamp; reset completo; fronteiras das seis faixas testadas |
| Completude presencial | Relatório sem distinção segura entre preenchido e parcial; ausência de edição | Cobertura documental, contexto obrigatório para NA/P, revisão por missão sem reiniciar dados; síntese suspensa quando incompleto |
| Saída | Digital cobria unload, não SPA; presencial não protegia saída | Hook isolado para clique, hash, histórico e unload; cancelamento preserva registro; redirects obrigatórios de autenticação não bloqueados |
| Proveniência presencial | Cabeçalho podia usar a versão da adaptação digital | Exportação deriva de SONDA_DEZ_VERSION, a mesma fonte canônica do guia presencial |
| Relógio presencial | Contagem dependia de ticks de um segundo; aba oculta continuava e retorno a missão zerava seu relógio | Delta monotônico, frações em milissegundos preservadas em ref e contabilizadas no cleanup; pausa ao ocultar, pausa/retomada explícita e tempos por missão; término da referência de dez minutos visível |
| Duração do estímulo digital | Tempo entre conclusão da série/grade e fechamento do modal entrava na duração da apresentação | Congelamento da duração no evento final; sair depois da conclusão não reclassifica série concluída como interrompida |
| Prova de apresentação | Cardinalidade de índices não demonstrava quais estímulos foram apresentados; seleção final malformada era normalizada | Ordem, índices, janela temporal e evento final de sequência validados; índices inválidos/repetidos de grade rejeitados sem fabricar zero |
| Autoria | Toque eletrônico não identificava quem tocou | Origem estruturada por missão; obrigatória para apresentações concluídas; operação compartilhada exige discriminação nas notas |
| Reapresentação/NA | Substituição de status/motivo podia perder a decisão anterior | Confirmação de reapresentação e histórico de tentativas; decisão de NA preserva status, motivo e eventos anteriores; motivo de outra etapa é limpo na navegação |
| Entrega médica | Síntese prática misturada a dezenas de eventos e instruções | Resumo factual separado, com contexto, ajuda, lacunas, NA, autoria, alertas, início e duração; log completo continua exportável e auditável |
| Exportação presencial | Falha de clipboard sem tratamento e sem alternativa | Tratamento de erro, texto selecionável e download TXT; conteúdo conferido no browser |
| Preparação repetitiva | Ensaio precisava ser refeito para cada criança mesmo com a mesma aplicadora | Opção explícita de reusar somente treino da aplicadora identificada nesta aba; dados infantis apagados e preparação/som obrigatoriamente reconferidos; trocar aplicadora invalida treino |
| Banco visual | Chuva anunciada mostrava outra cena; legendas entregavam inferência; séries simultâneas; rotina já resolvida | Cena de chuva correta; legendas explicativas fora da tela infantil; cartões sequenciais manuais, sem equivalência à série digital; rotina sem horários-resposta e segunda condição revelada no momento escolhido |
| Banco e faixa | Banco abria por default em faixa independente da criança | Inicialização acompanha a faixa presencial selecionada, mantendo seleção manual explícita do banco |
| Acessibilidade | Contadores apenas +/− sem entrada/nome acessível | Inputs nomeados, campos de autoria com radio/fieldset/legend, feedback de estado e controles de retomada; suíte Axe e telas móveis existentes preservadas |

## Verificação e limites

`npm run test:sonda`: 36 testes unitários (8 de consolidação, 16 digitais, 12 de qualidade), incluindo múltiplos casos de borda em cada teste. `npm run check`, lint dos arquivos alterados e `npm run build:client`: aprovados na revisão local. O navegador local retornou `ERR_BLOCKED_BY_ADMINISTRATOR` para o servidor de teste; nenhuma política foi alterada. A evidência browser vem da execução do workflow Sonda Dez digital no GitHub Actions, com screenshots e relatórios exclusivamente sintéticos.

A suíte browser mantém as seis trilhas, 42 missões e 76 etapas existentes e acrescenta autoria, resumo factual, recusa de saída SPA, treino reutilizado/troca de aplicadora e fluxo presencial de idade/zero/NA/revisão/exportação/reset. Não substitui componentes da Sonda por mocks. Não remove assertivas nem reduz travas para obter checks verdes.

## Limites clínicos não eliminados por esta entrega

Permanece um registro observacional piloto, sem validação psicométrica, sensibilidade/especificidade, normas ou diagnóstico. Contagem de missões revisadas é **cobertura documental**, não escore nem quantidade de habilidades demonstradas. NA é não avaliável, não déficit. Autoria, ajuda, fonte do relato e contexto dependem do registro fidedigno da aplicadora. Cartões manuais do banco não são a série digital cronometrada, e observação digital não equivale à manipulação presencial ou exame neurológico. Homologação supervisionada com a equipe continua necessária antes de afirmar benefício clínico ou ausência absoluta de falhas.

## Publicação e rollback

Merge requer todos os checks obrigatórios, além do fluxo browser Sonda. Nenhuma escrita direta ou force-push em main. Produção canônica é Cloudflare; Vercel somente espelho do mesmo SHA. Deploy só pode ser declarado publicado após confirmação do SHA e saúde/rota, não apenas por disparo de workflow. Bloqueios externos devem ser registrados sem retirar guardas ou substituir a autoridade de produção.

Rollback: revert desta PR por nova PR, testes e deploy do SHA aprovado. Sem migração ou mutação de dados clínicos. O bootstrap isolado para transportar fonte/dependências e aplicar patch revisado é removido antes da PR final; não integra o runtime do produto.
