# NeuroPed SDG — implementação da direção visual

Relacionado à issue #849. Base: `f7204448d46a73cc70eaf734ab93fee6b77db433`.

## Implementação

A entrada profissional reutiliza o retrato institucional existente, preservando autenticação, recuperação de senha, cadastro, planos e redirecionamento interno. O controle mostrar/ocultar senha é explícito, não submete o formulário e anuncia seu estado.

O cockpit substitui a grande composição fotográfica por uma abertura compacta com um retrato. Contexto clínico e ações do paciente passam a preceder os recursos auxiliares também na ordem do DOM. Os atalhos e consultas continuam usando as rotas e o backend existentes; não há métricas inventadas, cópia de dados dos mockups ou persistência clínica adicional.

A camada `product-signature.css` reúne navy, bordô, dourado, teal e branco quente, ajustes de superfícies e navegação, foco visível, formulário móvel e claro/escuro. As mudanças cromáticas ficam restritas à mídia screen. Documentos clínicos, modelos PANT, escores, perguntas de escalas, banco e permissões não foram alterados. O retrato vermelho já é utilizado pelo painel familiar existente e permanece preservado.

## Evidência e limites

`node tests/unit/product-signature.test.mjs` verifica os contratos específicos. `node scripts/audit-product-signature.mjs` constrói o perfil authenticated e navega 10 rotas em cinco combinações de viewport/tema. O login é interativo contra API sintética; nenhuma credencial de produção é usada. Cada estado bem preparado gera viewport e página completa. Falhas são reportadas e fazem o comando terminar com código diferente de zero. Relatório e galeria ficam em `artifacts/product-signature/screens`.

O novo workflow é somente de leitura e teste. Não faz deploy e não substitui nem afrouxa os gates existentes. Resultados devem ser conferidos no run do SHA do PR; a existência do script não significa que as capturas passaram.

No Windows, foram preservadas as alterações em worktree separada. O push via terminal não tinha credencial não interativa; a publicação da branch foi feita pelo conector GitHub autenticado. Build e verificação locais pesados foram interrompidos após lentidão, sem aprovação presumida. O gate visual anterior também apresentou erro de navegação na base antes destas alterações. A matriz nova não deve ser confundida com certificação de persistência/backend real.

## Publicação

Entrega em PR draft para revisão. Sem merge automático ou alteração da main. Produção só muda após merge aprovado e workflow oficial. Ainda exige revisão das capturas, testes de regressão, contraste e prova em Safari/iOS antes de afirmar conformidade de loja. Nenhuma nota estética objetiva ou aprovação App Store é garantida por esta entrega.

## Rollback

Antes do merge, descartar a branch sem tocar produção. Depois de eventual merge, reverter o commit do PR em uma nova branch/PR e executar os workflows oficiais. Não há migração, mudança de schema ou remoção de dados a reverter.
