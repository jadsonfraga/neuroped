/* NeuroPed EDJ — Central Route Registry
   Fonte única para rotas públicas, familiares, protegidas e médicas.
   Não contém dados clínicos. */
window.NEUROPED_ROUTES = [
  { label:'App (hub dinâmico)', href:'./app-shell.html', type:'publico', requiresPin:false, icon:'📱', order:5 },
  { label:'Início', href:'./index.html#/', type:'publico', requiresPin:false, icon:'🏠', order:10 },
  { label:'Central de Atalhos', href:'./central-atalhos.html', type:'publico', requiresPin:false, icon:'🧭', order:20 },
  { label:'NeuroPed Master', href:'./neuroped-master-vitrine.html', type:'publico', requiresPin:false, icon:'📖', order:25 },
  { label:'Biblioteca NeuroPed Master', href:'./neuroped-master-biblioteca.html', type:'publico', requiresPin:false, icon:'📚', order:27 },
  { label:'Gerador de Cards', href:'./gerador-cards.html', type:'publico', requiresPin:false, icon:'🪪', order:28 },
  { label:'Solicitar E-book', href:'./solicitar-neuroped-master.html', type:'publico', requiresPin:false, icon:'✉️', order:26 },
  { label:'Portal da Família', href:'./portal-familia-livre.html', type:'familiar', requiresPin:false, icon:'🌿', order:30 },
  { label:'Área do Filho', href:'./area-filho.html', type:'familiar', requiresPin:false, icon:'👶', order:40 },
  { label:'CAA Gratuita', href:'./comunicacao-alternativa.html', type:'familiar', requiresPin:false, icon:'💬', order:50 },
  { label:'Diário Escola e Terapias', href:'./diario-escola-terapias-v2.html', type:'familiar', requiresPin:false, icon:'📝', order:60 },
  { label:'Mapa de Instrumentos', href:'./mapa-escalas.html', type:'publico', requiresPin:false, icon:'🧭', order:70 },
  { label:'Filtro de Escalas', href:'./filtro-escalas.html', type:'publico', requiresPin:false, icon:'🔎', order:80 },
  { label:'Banco de Escalas', href:'./escalas.html', type:'publico', requiresPin:false, icon:'📚', order:90 },
  { label:'Consulta', href:'./consulta.html', type:'medico', requiresPin:true, icon:'🩺', order:100 },
  { label:'Secretaria', href:'./secretaria.html', type:'protegido', requiresPin:true, icon:'🏥', order:110 },
  { label:'Prontuário (demonstração)', href:'./index.html#/prontuario', type:'demo', requiresPin:true, demo:true, icon:'📋', order:120, note:'Área demonstrativa do app SPA — opera com dados fictícios, sem persistência clínica real.' },
  { label:'Prescrições (demonstração)', href:'./index.html#/prescricoes', type:'demo', requiresPin:true, demo:true, icon:'💊', order:130, note:'Área demonstrativa do app SPA — opera com dados fictícios, sem persistência clínica real.' },
  { label:'Laudos (demonstração)', href:'./index.html#/laudos', type:'demo', requiresPin:true, demo:true, icon:'📄', order:140, note:'Área demonstrativa do app SPA — opera com dados fictícios, sem persistência clínica real.' },
  { label:'Documentos (demonstração)', href:'./index.html#/portal-documentos', type:'demo', requiresPin:true, demo:true, icon:'🗂️', order:150, note:'Área demonstrativa do app SPA — opera com dados fictícios, sem persistência clínica real.' },
  { label:'Verificar App', href:'./verificar-app.html', type:'publico', requiresPin:false, icon:'✅', order:900 },
  { label:'Auditoria Operacional', href:'./auditoria-operacional.html', type:'publico', requiresPin:false, icon:'🧪', order:910 },
  { label:'Qualidade NeuroPed', href:'./qualidade-neuroped.html', type:'publico', requiresPin:false, icon:'📊', order:920 }
];
window.NEUROPED_ROUTE_TYPES = {
  publico: 'Conteúdo público/educativo',
  familiar: 'Ferramentas familiares não sensíveis',
  protegido: 'Área protegida por PIN/interface',
  medico: 'Área médica protegida por PIN/interface',
  demo: 'Área demonstrativa (dados fictícios, sem persistência real)'
};
