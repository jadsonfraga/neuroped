# NeuroPed Fluxo Desktop 1.1.0

Interface nativa para o mesmo núcleo Python da issue #791 / PR #794. Não é um novo motor PANT, nem alteração do app Cloudflare. Não precisa de servidor HTTP, navegador ou conta online. A distribuição Windows é portátil; sua produção só está comprovada quando o workflow concluir e o executável passar o teste nativo.

## O que entrega

Abrir e salvar cópia de caso JSON; importar texto rotulado ou exportação Notes; ver pendências; compilar cinco rascunhos; exportar pasta de conferência; processar uma pasta de JSONs e observar essa pasta enquanto a janela permanece aberta. Saídas são vinculadas ao conteúdo e verificadas por checksum; reprocessar o mesmo caso reutiliza a pasta somente se ela não foi alterada. Originais não são movidos ou substituídos.

## Abrir

Extraia o pacote Windows e abra `NeuroPedFluxo.exe`. Não é necessário instalar Python para a versão empacotada. Comece por Demonstração fictícia. Para executar o fonte: `python desktop.py` dentro de `tools/pant_intake` em instalação com Tkinter.

Na primeira aba, edite o contrato JSON ou importe o caso estruturado. Na segunda, escolha a fonte e cole `dominio: texto`, por exemplo `queixa: relato da família`. Cada trecho importado começa pendente. A terceira aba valida e prepara rascunhos; a quarta processa arquivos de uma pasta explicitamente escolhida.

A conferência de campos complexos ainda exige editar o JSON. Não existe extração semântica de texto livre, gravação de microfone, integração Heidi, consulta automática ao Consensus ou assinatura médica neste executável. A versão nativa não inclui o painel econômico nem briefing de agenda da interface web experimental anterior.

## Segurança e limites

Use apenas exemplos fictícios ou dados previamente anonimizados até a homologação clínica e de proteção de dados. Arquivos exportados são texto local NÃO criptografado; não escolher uma pasta sincronizada ou pública para dados de saúde. O programa não detecta nem anonimiza universalmente texto identificável. Não faz upload, não abre portas de rede, não lê credenciais, não instala serviços nem tarefas agendadas e não altera a inicialização do Windows.

PRONTO significa preenchimento/consistência do contrato, não qualidade clínica, dose adequada ou diagnóstico confirmado. Os rascunhos são somente compilações para revisão. O motor PANT canônico, seu QA, a aprovação médica do texto e a emissão final continuam separados. Nenhum PDF ou receita assinada é emitido aqui.

O executável não tem certificado comercial de assinatura de código. Não desative SmartScreen, antivírus ou políticas administrativas para executá-lo; uma exigência de assinatura deve ser tratada pela administração autorizada do computador.

## Testes

`python -m unittest discover -s tests -v` inclui o núcleo e 30 testes novos da entrega desktop (97 no total nesta versão). `python desktop.py --smoke-gui evidencia_nova.json` abre a interface real, valida caso fictício, compila cinco rascunhos e verifica sua exportação. O workflow Windows repete o teste no executável empacotado, sem o Python do runner no PATH. Resultado efetivo precisa ser conferido nos artefatos e logs do run.

## Instalação e rollback

Distribuição portátil: não muda registro, main, D1, Cloudflare ou Vercel. Fechar a janela encerra também a observação. Remover a pasta do programa reverte sua disponibilização, sem apagar pastas de saída escolhidas pelo usuário. Não há acesso remoto ao PCDRJADSON enquanto o conector retornar zero dispositivos. Executável construído/testado em CI não equivale a instalação no consultório.
