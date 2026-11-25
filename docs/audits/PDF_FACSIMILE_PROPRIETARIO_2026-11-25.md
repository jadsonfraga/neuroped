# Fac-símile do proprietário: inventário e primeiro recorte local

Os caminhos de emissão não compartilham um renderizador único. O recorte local liga a leitura protegida e o rodapé aos caminhos de PDF do compositor e de impressão nos módulos Laudo NeuroPed e Laudo Super. Antes de abrir ou publicar um PR de cobertura completa, verificar cada botão e pipeline separadamente; não considerar estes dois opt-ins prova universal.

| Superfície | Gerador | Regra de integração |
|---|---|---|
| Laudo NeuroPed e Laudo Super, compositor e impressão | `documentPdf.ts` e HTML de impressão | Candidato local: acrescentar no final do conteúdo antes do hash/assinatura. |
| Renderizador e outros fluxos PANT/PANTY | `renderizador/document.mjs` e impressão/PDF conforme a rota | Resolver o mesmo emissor privado antes de renderizar. Preservar aceite ligado aos bytes, QA e manifesto. A imagem que o Renderizador guarda neste aparelho não prova identidade do proprietário. |
| Documentos, modelos e impressões | Geradores PDF, HTML de visualização e `printDocument.ts`; há também `window.print()` | Revisar laudos/atestados, relatórios, resultados de escala, pré-consulta e pré-retorno, inventários, Escuta Clínica, observações, recepção e outras saídas. Diferenciar documentos atribuídos ao titular de relatórios operacionais e revisões. |
| Receita C1 e C1 Express, e integrações oficiais | Renderização própria ou documento do provedor | Não alterar modelo oficial, versão já assinada ou PDF do fornecedor. Onde existir campo gráfico permitido, incluir antes da assinatura qualificada e validar o resultado final. |
| Outros chamadores de `buildDocumentPdf` | Escalas, perfil, relatório clínico, jogos, filtros | Conferir autor e artefato por botão antes de optar pela imagem. Não assinar automaticamente formulário de terceiro, material em branco ou resultado não revisado. |

O JPEG do titular fornecido no chat foi conferido apenas no ambiente privado e **não** está na branch, bundle ou testes. O servidor local exige identidade nominal configurada, clínica exata e membership de proprietário ativa, com sessão autenticada pelo middleware. O armazenamento privado escolhido é D1, sem dependência ou fallback de bucket. A imagem é segmentada e cifrada por clínica/conta, com SHA-256 integral, resposta sem cache e interrupção quando a imagem exigida não está disponível ou íntegra. As provas usam uma figura geométrica fictícia. A parametrização e a carga da imagem real não foram feitas em produção. Um ativo legado não referenciado no checkout não foi utilizado.

O fac-símile não comprova autoria ou integridade, nem substitui a assinatura eletrônica. Não estampar arquivo já assinado ou mudar caminho de aceite médico. [ITI: assinatura digitalizada](https://www.gov.br/iti/pt-br/acesso-a-informacao/perguntas-frequentes/certificacao-digital) · [Anvisa: modelos eletrônicos](https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-eletr-onico).

O ensaio de impressão usa Chromium com API de teste controlada. Confirma texto, imagem geométrica fictícia carregada, PDF de impressão sem assinatura e painel ICP preservado. A rota de acesso à imagem foi verificada separadamente com Worker e D1 locais.

## Continuação verificada no Renderizador PANT

A imagem do titular é consultada só na liberação explícita da versão definitiva. O rascunho não solicita a imagem privada. A assinatura visual privada não vai para localStorage. O cadastro manual permanece disponível para a própria conta e clínica neste navegador; a imagem histórica sem dono não é lida automaticamente após troca nem apagada. Se necessário, o profissional recadastra a própria imagem. A geração definitiva e as impressões abortam se o escopo mudar durante o processamento. O manifesto incorpora a origem visual e o SHA‑256 da imagem serializada, além do hash do PDF. Isso não autentica certificado e não modifica os gates de revisão.

No Chromium, em perfil sintético novo: caso manual com confirmação negativa sem imagem e cadastro local escopado; caso proprietário com PNG transparente fictício privado, um único aceite de revisão, nenhum armazenamento local da imagem, PDF e manifesto compatíveis. O serviço real foi separado em teste Worker/D1. A saída PDF Premium de resultados de escala já se liga ao mesmo gerador protegido; a homologação no aplicativo e a verificação completa de todas as saídas ainda estão pendentes.


## Cadastro privado e operação

- A migração 0043 só cria o esquema; é idempotente. As duas tabelas precisam existir antes de publicar as funções. Ativar somente com a clínica e o identificador estável do proprietário confirmados na configuração privada do serviço (`NEUROPED_PDF_FACSIMILE_CLINIC_ID`, `NEUROPED_PDF_FACSIMILE_USER_ID`). Não enviar senha, arquivo nem identificadores por GitHub; não configurar em tenant não homologado.
- Depois de ativado, em **Configurações › Perfil**, na clínica autorizada, o titular autenticado seleciona PNG de até 480 KB ou JPEG de até 120 KB e confirma **Cadastrar imagem privada**. Selecionar não transmite o arquivo. A rota aceita somente JSON limitado, sem exceções na política global de conteúdo; a cifra ocorre antes da gravação. Substituição é atômica; a saída recuperada confere SHA-256, ordem, contagem e contexto criptográfico. O PDF final continua a exigir revisão quando aplicável.
- Os fragmentos são pequenos para evitar que uma única instrução de importação SQL de backup ultrapasse o limite documentado. Uma restauração real do cadastro e a cobertura dos demais emissores não foram homologadas em produção. [Cloudflare D1, limites](https://developers.cloudflare.com/d1/platform/limits/). Logout/troca de clínica não reaproveitam a imagem. Revogação de membership ou suspensão bloqueia uso; revogar configuração e tratar retenção segundo a governança da clínica.

O PNG transparente mantém sua mídia e bytes no cadastro. Testado também PNG sintético maior que 120 KB, em múltiplos segmentos; reconstrução e SHA-256 coincidiram. No PDF, a imagem e o QR coexistem. Nenhum arquivo real foi cadastrado ou enviado para ambiente externo.

## Cobertura ampliada e persistência após novo login

O construtor compartilhado de PDFs recém-gerados passou a usar a imagem privada por padrão: cobre seus consumidores de laudos, prontuário, escalas, bateria e relatórios de jogos. Perfis visitante, recepção e leitura não consultam a imagem. A impressão de texto e as impressões clínicas próprias do app reutilizam a mesma consulta protegida e o rodapé temporário. O acesso é testado com um novo contexto de navegador autenticado, sem reutilizar estado local da primeira sessão.

Os PDFs próprios ainda não assinados dos compositores C1 e C1 Express foram verificados sobre duas vias sintéticas: imagem dentro do quadro existente, QR preservado e nenhuma declaração de que já foi assinado. Não alteram os passos de assinatura do médico nem validam a receita para dispensação. Não carimbar os modelos oficiais de papel em A/B e C1, recursos de estímulo OBS‑10, arquivos importados ou assinados, nem PDFs baixados de terceiros. Impressão pelo menu nativo do navegador não é um gerador controlado pelo NeuroPed.

Os testes novos provam a leitura no perfil autorizado, a saída binária de dois compositores C1 e as proteções de erro, fechamento da janela e limpeza do rodapé na saída genérica. Não representam verificação visual página a página de cada tela nem validação de receita, identidade clínica ou dispensação em produção.

A Escuta Clínica permanece sem imagem no PDF: sua saída é rascunho e este release não altera processamento de áudio ou integrações clínicas.
