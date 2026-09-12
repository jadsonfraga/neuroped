# Filtro por idade exata e queixa — 12/09/2026

Tracking: #862.
Base: af51551369918bc6d1000e70eb50da8304de2880 (origin/main).
Branch: feat/filter-age-complaint-20260912.

## Delta e limites

Campos de anos completos e meses adicionais, faixa opcional e feedback acessível.
O limite de 216 meses é de navegação pediátrica, não um ponto de corte diagnóstico.
Entrada vazia não é zero. Valores inválidos não são arredondados, limitados ou
substituídos por uma busca ampla. A idade dos campos prevalece; a busca textual
composta é somada corretamente. Uma idade textual incompatível com a faixa
selecionada exige correção. Sem idade pontual, a faixa continua sendo uma busca
por sobreposição, agora com aviso explícito de compatibilidade parcial.

Motor, pódio, recomendações auxiliares, justificativas e metadados de exportação
usam a mesma resolução de idade. A interpretação textual é determinística e
restrita a expressões numéricas de idade; não é interpretação clínica de texto
livre, nem confirmação da idade do paciente. Os campos dedicados são a opção
preferencial para remover ambiguidades.

A busca visual de queixas é independente da busca de instrumentos. Tolera
acentos e prefixos, mantém opções selecionadas visíveis e não as adiciona
sozinho. Inferência de queixas pela busca principal usa termos inteiros, não
substrings: cuidador não gera dor e protocolo não gera TOC. Seleção múltipla
mantém a união de queixas; rastreadores amplos continuam identificados como tal.

A idade exata vive somente na sessão da aba. Payloads antigos continuam válidos.
Novo perfil pelo Fluxograma limpa idade exata e busca anterior para não herdar
uma idade contraditória. A limpeza geral também remove os novos campos.

Nenhum item, escore, norma, idade cadastrada, licença ou aviso de escala foi
editado. Nenhuma dependência nova. Sem alterações em autenticação, banco,
backend clínico ou outras PRs. O FARO-CEFA em PDF não foi convertido em aplicação
nesta alteração: esta entrega é exclusivamente do filtro existente.

## Validação local — saída zero

Windows / Node 24.20.0; node_modules reutilizado de checkout com package-lock
idêntico. Não se declara npm ci local. O CI continua executando instalação limpa.

- npm run check
- npm run lint
- npm run build:client (modo local)
- npm run test:filter: 105 verificações de segurança + 71 IPN-TEA + sessão + 646 novas verificações
- node --import tsx tests/clinical/test-auxiliary-age-band.mjs
- node tests/unit/filter-dom-contract.test.mjs
- node --import tsx scripts/guards/audit-filter-lifecycle.mjs
- npm run test:podium
- npm run test:practical-filter
- npm run validate:safety: metadados preservados em 267 escalas do baseline/extensões
- node tests/e2e/filter-age-complaint.mjs: Chromium real, 390 e 1280 px
- git diff --check

O teste de navegador verifica idade composta, duas queixas, independência das
buscas, recarga com preservação de contexto, persistência de erro sem fallback,
conflito faixa/texto, limpeza, ausência de recomendações auxiliares quando a
idade é inválida, ausência de overflow horizontal e ausência de pageerror.

Na primeira execução, uma asserção estática do guard OPB ainda procurava o nome
antigo selectedQueixas. Foi atualizada para activeQueixas, preservando exatamente
as condições !hasSafeResults e quantidade diferente de um. Os testes comportamentais
novos também verificam o fechamento por idade inválida. Nenhum teste foi removido,
ignorado ou relaxado. Os novos testes estão ligados ao test:filter e ao workflow
filter-spiral, sem reduzir os gates existentes.

O build emitiu avisos de tamanho de chunks. O harness de navegador emitiu aviso
DEP0190 de child_process. Ambos terminaram com código zero; não foram ocultados
ou transformados em exceções de CI. Não foi executado o verify:release completo.

## Risco e publicação

Risco principal: mudança intencional da precedência de idade e da busca por
palavra inteira, além da reconciliação com outras PRs que alteram filtro-engine.
Revalidar o HEAD depois de qualquer resolução de conflito. Metadados/escores
não mudam. As faixas amplas permanecem exploração, não autorização individual
para aplicação. Informantes, finalidade e bloqueios de risco agudo são preservados.

PR para revisão, sem merge, auto-merge ou deploy de produção. Prontidão local
não equivale à prontidão de merge: aguardar checks obrigatórios e revisão do HEAD.

## Rollback

Reverter o commit desta PR em uma nova branch e submeter aos mesmos gates.
Sem migração de dados. Campos opcionais de sessão podem ser ignorados por versões
anteriores; limpar o filtro ao trocar de versão remove contexto transitório.
Arquivos de build gerados durante a validação foram restaurados apenas neste
worktree; não integram a alteração. O checkout preexistente não foi modificado.
