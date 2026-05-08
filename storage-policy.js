/* NeuroPed EDJ — Storage Policy
   Camada declarativa para reduzir risco de armazenamento indevido.
   Controle de interface. Não substitui criptografia/backend para produção. */
window.NEUROPED_STORAGE_POLICY = {
  mode: 'homologacao-estatica',
  productionReady: false,
  categories: {
    publicStorage: {
      allowed: true,
      description: 'Preferências visuais, rotas públicas, cache de assets e conteúdos educativos.'
    },
    draftStorage: {
      allowed: true,
      warning: 'Rascunhos locais devem ser considerados temporários. Não usar com dados reais sem criptografia/backend.'
    },
    sensitiveStorage: {
      allowed: false,
      warning: 'Dados clínicos reais, documentos, laudos, prescrições e mensagens exigem backend seguro, autenticação, logs, RLS e criptografia.'
    }
  },
  semanticSearchStatus: 'not_configured',
  pinFrontendNotice: 'PIN frontend é controle de interface, não segurança real de produção.'
};
window.NeuroPedStoragePolicy = {
  canStore: function(category){ return !!(window.NEUROPED_STORAGE_POLICY.categories[category] && window.NEUROPED_STORAGE_POLICY.categories[category].allowed); },
  explain: function(category){ return window.NEUROPED_STORAGE_POLICY.categories[category] || null; },
  status: function(){ return window.NEUROPED_STORAGE_POLICY; }
};
