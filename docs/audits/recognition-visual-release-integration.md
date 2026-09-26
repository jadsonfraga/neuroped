# Reconhecimento visual: integração de release

## Problema reproduzido

A varredura antiga de `dist/public` tratava todo literal hexadecimal de 64 caracteres como possível verificador de PIN. O banco visual contém SHA-256 públicos para conferir imagens. Um inventário sintético com SVG real e digest calculado reproduziu a falsa detecção tanto no JSON quanto no módulo JavaScript. A correção da varredura das fontes, isoladamente, não corrigia a varredura do pacote compilado.

## Correção e fronteira de segurança

`verified-built-visual-digests.mjs` confere os bytes dos SVGs efetivamente empacotados, verifica IDs, caminhos, duplicações e arquivos regulares, e encontra o módulo da rota visual pelo manifesto do Vite. Só distingue o campo `sha256` de um registro que também tenha ID e origem correspondentes ao inventário verificado. A análise usa a árvore sintática, sem executar o aplicativo compilado. A serialização de JSON pelo bundler também é analisada, e campos não verificados permanecem sob inspeção, inclusive depois de decodificados.

Os padrões originais de detecção de PIN permanecem ativos. Não existe dispensa de arquivo inteiro, diretório inteiro ou de um valor em qualquer posição. Um digest legítimo copiado para campo de credencial, comentário, string não estrutural ou outro módulo continua sendo sinalizado. Arquivo modificado, imagem ausente, travessia de diretório, symlink, duplicação de campos ou módulo canônico ambíguo bloqueiam a conferência.

## Evidência e regressões

`tests/unit/verified-built-visual-digests.test.mjs` reproduz o falso positivo e verifica exemplos válidos, JSON serializado, campos de credenciais adjacentes, contexto incorreto, corrupção, ausência, duplicação, caminhos inseguros e symlinks. As três famílias de testes passaram no ambiente local sintético antes da integração. A CI da feature executa também a varredura do build real, além da suíte de release global. Nenhum baseline foi elevado e nenhum teste obrigatório foi desabilitado.

A paleta permanece no arquivo canônico `client/src/styles/tokens.css`, sem mudar os pigmentos das figuras. As cores efetivamente renderizadas são conferidas pelo teste de navegador. As guardas de layout móvel preservam legibilidade e simetria das alternativas.

## Escopo e publicação

Esta alteração não muda o protocolo clínico, o banco de dados, a autenticação, os resultados nem a persistência. É uma distinção de proveniência no auditor de release. Os arquivos do usuário e as exportações clínicas não são usados como fixtures.

A aplicação segue observacional e não normatizada. Fonte e capturas da consolidação estão no run `35936858804`; o artefato declara seu SHA testado internamente. O estado final da liberação deve ser consultado no HEAD da PR #939 e no workflow canônico de publicação. Merge isolado não é comprovação de deploy. A publicação exige sentinela com SHA mesclado e verificação de saúde/autenticação. Rollback por reversão do merge em PR, com os mesmos gates.
