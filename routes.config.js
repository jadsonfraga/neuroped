/* NeuroPed EDJ — Central Route Registry (MODO PÚBLICO)
   Apenas rotas PÚBLICAS/FAMILIARES (educacionais, sem senha). As áreas
   sensíveis (médica, secretaria, demos clínicas, dev) foram REMOVIDAS deste
   registro e ficam ocultas no público — ver public-mode.js e
   docs/PUBLICO-O-QUE-FICA-OCULTO.md. Não contém dados clínicos. */
window.NEUROPED_ROUTES = [
  { label:'App (hub dinâmico)', href:'./app-shell.html', type:'publico', requiresPin:false, icon:'📱', order:5 },
  { label:'Início', href:'./index.html#/', type:'publico', requiresPin:false, icon:'🏠', order:10 },
  { label:'Central de Atalhos', href:'./central-atalhos.html', type:'publico', requiresPin:false, icon:'🧭', order:20 },
  { label:'Biblioteca NeuroPed', href:'./neuroped-master-biblioteca.html', type:'publico', requiresPin:false, icon:'📚', order:27 },
  { label:'Gerador de Cards', href:'./gerador-cards.html', type:'publico', requiresPin:false, icon:'🪪', order:28 },
  { label:'Educativo / Psicoeducação', href:'./portal-familia-livre.html', type:'familiar', requiresPin:false, icon:'📚', order:30 },
  { label:'Área do Filho', href:'./area-filho.html', type:'familiar', requiresPin:false, icon:'👶', order:40 },
  { label:'CAA Gratuita', href:'./comunicacao-alternativa.html', type:'familiar', requiresPin:false, icon:'💬', order:50 },
  { label:'Diário Escola e Terapias', href:'./diario-escola-terapias-v2.html', type:'familiar', requiresPin:false, icon:'📝', order:60 },
  { label:'Mapa de Instrumentos', href:'./mapa-escalas.html', type:'publico', requiresPin:false, icon:'🧭', order:70 },
  { label:'Filtro de Escalas', href:'./filtro-escalas.html', type:'publico', requiresPin:false, icon:'🔎', order:80 },
  { label:'Banco de Escalas', href:'./escalas.html', type:'publico', requiresPin:false, icon:'📚', order:90 },
  { label:'Qualidade NeuroPed', href:'./qualidade-neuroped.html', type:'publico', requiresPin:false, icon:'📊', order:920 }
];
window.NEUROPED_ROUTE_TYPES = {
  publico: 'Conteúdo público/educativo',
  familiar: 'Ferramentas familiares não sensíveis'
};
