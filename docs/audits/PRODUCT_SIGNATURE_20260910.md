# NeuroPed SDG — implementação da direção visual

Relacionado à issue #849. Implementação original integrada à `main` em 11/09/2026; acabamento App Store realizado em branch posterior sobre o merge de produção.

## Implementação

A entrada profissional reutiliza o retrato institucional existente, preservando autenticação, recuperação de senha, cadastro, planos e redirecionamento interno. O controle mostrar/ocultar senha é explícito, não submete o formulário e anuncia seu estado.

O cockpit substitui a grande composição fotográfica por uma abertura compacta com um retrato. Contexto clínico e ações do paciente precedem os recursos auxiliares também na ordem do DOM. Os atalhos e consultas continuam usando rotas e backend existentes; não há métricas inventadas, cópia de dados dos conceitos visuais ou persistência clínica adicional.

A camada `product-signature.css` reúne navy, bordô, dourado, teal e branco quente. A camada posterior `app-store-finish.css` faz apenas acabamento de tela: troca o retrato da navegação pelo brasão cerebral já versionado, reduz ornamentação nas rotas clínicas, organiza superfícies, cria barra utilitária de busca no desktop e dock móvel com Início, Pacientes, Agenda, Avaliar e Documentos. O dock só é renderizado em contexto profissional; rotas públicas permanecem sem chrome clínico, exceto o filtro explicitamente público quando aberto dentro de sessão profissional.

Documentos clínicos, modelos PANT, escores, perguntas de escalas, banco, permissões e fluxos de autenticação não são alterados pelo acabamento. Não foi introduzido transporte, Storage, cache ou duplicação de PHI.

## Evidência e limites

`node tests/unit/product-signature.test.mjs` verifica identidade, sessão, navegação, ausência de persistência no chrome e contratos clínicos preservados. `node scripts/audit-product-signature.mjs` constrói o perfil authenticated e navega 10 rotas em cinco combinações de viewport/tema. Além de overflow, imagens e runtime, a matriz exige dock móvel nas rotas clínicas, ausência dele no login/portal familiar e barra utilitária no cockpit desktop.

O login é interativo contra API sintética; nenhuma credencial de produção é usada. Cada estado bem preparado gera viewport e página completa. Falhas fazem o comando terminar com código diferente de zero. Relatório e galeria ficam em `artifacts/product-signature/screens`.

O workflow visual é somente leitura e teste. Não substitui nem afrouxa os gates de release, isolamento de tenant, persistência LIVE, autenticação, lint, TypeScript ou build.

## Publicação

A publicação só ocorre após PR, checks obrigatórios e merge na `main`. Cloudflare e Vercel continuam sendo publicados pelos workflows oficiais, com sentinela de SHA e smoke autenticado. O acabamento não implica aprovação da App Store nem substitui validação em Safari/iOS real.

## Rollback

Antes do merge, descartar a branch sem tocar produção. Depois de eventual merge, reverter o commit do PR em nova branch/PR e executar os workflows oficiais. Não há migração, mudança de schema ou remoção de dados a reverter.
