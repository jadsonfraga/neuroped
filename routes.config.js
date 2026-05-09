/* NeuroPed EDJ — Central Route Registry
   Fonte única para rotas públicas, familiares, protegidas e médicas.
   Não contém dados clínicos. */
window.NEUROPED_ROUTES = [
  { label:'Início', href:'./index.html#/', type:'publico', requiresPin:false, icon:'🏠', order:10 },
  { label:'Central de Atalhos', href:'./central-atalhos.html', type:'publico', requiresPin:false, icon:'🧭', order:20 },
  { label:'Portal da Família', href:'./portal-familia-livre.html', type:'familiar', requiresPin:false, icon:'🌿', order:30 },
  { label:'Área do Filho', href:'./area-filho.html', type:'familiar', requiresPin:false, icon:'👶', order:40 },
  { label:'CAA Gratuita', href:'./comunicacao-alternativa.html', type:'familiar', requiresPin:false, icon:'💬', order:50 },
  { label:'Diário Escola e Terapias', href:'./diario-escola-terapias-v2.html', type:'familiar', requiresPin:false, icon:'📝', order:60 },
  { label:'Mapa de Instrumentos', href:'./mapa-escalas.html', type:'publico', requiresPin:false, icon:'🧭', order:70 },
  { label:'Filtro de Escalas', href:'./filtro-escalas.html', type:'publico', requiresPin:false, icon:'🔎', order:80 },
  { label:'Banco de Escalas', href:'./escalas.html', type:'publico', requiresPin:false, icon:'📚', order:90 },
  { label:'Consulta', href:'./consulta.html', type:'medico', requiresPin:true, icon:'🩺', order:100 },
  { label:'Secretaria', href:'./secretaria.html', type:'protegido', requiresPin:true, icon:'🏥', order:110 },
  { label:'Prontuário', href:'./index.html#/prontuario', type:'protegido', requiresPin:true, icon:'📋', order:120 },
  { label:'Prescrições', href:'./index.html#/prescricoes', type:'medico', requiresPin:true, icon:'💊', order:130 },
  { label:'Laudos', href:'./index.html#/laudos', type:'medico', requiresPin:true, icon:'📄', order:140 },
  { label:'Documentos', href:'./index.html#/portal-documentos', type:'protegido', requiresPin:true, icon:'🗂️', order:150 },
  { label:'Verificar App', href:'./verificar-app.html', type:'publico', requiresPin:false, icon:'✅', order:900 },
  { label:'Auditoria Operacional', href:'./auditoria-operacional.html', type:'publico', requiresPin:false, icon:'🧪', order:910 },
  { label:'Qualidade NeuroPed', href:'./qualidade-neuroped.html', type:'publico', requiresPin:false, icon:'📊', order:920 }
];
window.NEUROPED_ROUTE_TYPES = {
  publico: 'Conteúdo público/educativo',
  familiar: 'Ferramentas familiares não sensíveis',
  protegido: 'Área protegida por PIN/interface',
  medico: 'Área médica protegida por PIN/interface'
};
