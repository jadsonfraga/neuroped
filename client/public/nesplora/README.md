# Nesplora estática

Esta pasta é uma cópia autônoma compilada da Nesplora, publicada pelo próprio deploy do Neuroped em `/nesplora/`. Os arquivos de mídia ficam em `media/`; não há dependência de URLs Manus em runtime. O `sw.js` local é uma ponte de migração que recupera navegadores com cache legado do NeuroPed. Para atualizar a cópia a partir do projeto-fonte, execute `node scripts/sync-nesplora-static.mjs` no repositório do Neuroped.
