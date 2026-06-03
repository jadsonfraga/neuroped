/* NeuroPed EDJ — CATÁLOGO de instrumentos oficiais de terceiros.
   CONFORMIDADE: NÃO reproduz itens/perguntas protegidas no app público.
   Cada item é um CARD pesquisável (nome, sigla, finalidade, faixa, respondente,
   palavras-chave, STATUS jurídico/clínico e link para a FONTE OFICIAL).
   Não são contabilizados como instrumentos autorais aplicáveis. */
(function () {
  'use strict';
  if (window.NEUROPED_OFICIAIS_LOADED) return;
  window.NEUROPED_OFICIAIS_LOADED = true;

  var AUD = { familia:'Família', escola:'Escola', autoteste:'Autoteste', clinico:'Clínico', misto:'Múltiplos respondentes' };

  function mk(o){
    return {
      id:'ofc-' + o.id, title:o.title, short_title:o.sigla || o.title, sigla:o.sigla || '',
      emoji:o.emoji || '📚', audience:o.aud || 'clinico', audience_label:AUD[o.aud || 'clinico'],
      age_band:o.band || 'pediátrico', age_min_months:o.min == null ? 0 : o.min, age_max_months:o.max == null ? 215 : o.max,
      domain:o.area, finalidade:o.fim, status:o.status, official_url:o.url,
      official_catalog:true, applicable:false, nature:'oficial', kind:'fonte oficial',
      symptoms:o.kw.slice(0,5), complaints:o.kw, keywords:o.kw.concat([o.sigla, o.area, 'fonte oficial', 'oficial', 'validado']),
      page:'', anchor:'', priority:o.pri || 90,
      plain_questions:[], clinical_use:o.fim,
      differentiator:'Instrumento oficial de terceiros — catalogado com fonte. ' + o.status,
      not_normative_disclaimer:'Instrumento oficial de terceiros. Itens não reproduzidos no app por conformidade de licença. ' + o.status + ' Acesse a fonte oficial para uso conforme os termos.'
    };
  }

  var OFC = [
    mk({ id:'psc', title:'Pediatric Symptom Checklist (PSC / Y-PSC / PSC-17)', sigla:'PSC', emoji:'🧠', aud:'familia',
      band:'4–16 anos', min:48, max:200, area:'Saúde mental global', pri:96,
      fim:'Rastreio psicossocial amplo (emocional, comportamental e atencional). Variantes PSC-35, Y-PSC, PSC-17 e Y-PSC-17. Versão Portuguese (Brazilian-American).',
      status:'Fonte oficial — integração clínica privada futura.',
      url:'https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist',
      kw:['comportamento','humor','ansiedade','atenção','dificuldade escolar','sofrimento emocional','psicossocial'] }),
    mk({ id:'crafft', title:'CRAFFT 2.1 / 2.1+N — uso de substâncias', sigla:'CRAFFT', emoji:'🚬', aud:'autoteste',
      band:'12–21 anos', min:144, max:252, area:'Substâncias (adolescente)', pri:92,
      fim:'Rastreio de álcool, drogas, nicotina e vaping no adolescente. Versões 2.1 e 2.1+N, PT-BR oficial.',
      status:'Integração condicionada à autorização formal da equipe CRAFFT.',
      url:'https://crafft.org/get-the-crafft/',
      kw:['álcool','drogas','substâncias','nicotina','vape','vaping','adolescência','comportamento de risco'] }),
    mk({ id:'asq', title:'Ask Suicide-Screening Questions (ASQ Toolkit)', sigla:'ASQ', emoji:'🆘', aud:'clinico',
      band:'≥ 8 anos', min:96, max:215, area:'Segurança / risco de suicídio', pri:98,
      fim:'Triagem breve de segurança para necessidade de avaliação imediata de risco. Uso em ambiente clínico.',
      status:'Exige fluxo profissional de segurança — sem aplicação pública aberta.',
      url:'https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials',
      kw:['segurança','risco','suicídio','autolesão','crise','humor grave','adolescente'] }),
    mk({ id:'cssrs', title:'Columbia Suicide Severity Rating Scale (C-SSRS)', sigla:'C-SSRS', emoji:'🛟', aud:'clinico',
      band:'pediátrico/adolescente', min:60, max:215, area:'Segurança / risco de suicídio', pri:98,
      fim:'Avaliação de ideação e comportamento suicida (Columbia Protocol). Orienta condutas de segurança.',
      status:'Exige fluxo profissional de segurança — sem preenchimento público.',
      url:'https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/about-the-scale/',
      kw:['segurança','risco','suicídio','autolesão','crise','ideação','humor grave'] }),
    mk({ id:'mchat', title:'M-CHAT-R/F — rastreio de autismo (16–30 meses)', sigla:'M-CHAT-R/F', emoji:'🌱', aud:'familia',
      band:'16–30 meses', min:16, max:30, area:'TEA precoce', pri:97,
      fim:'Rastreio de probabilidade de TEA em crianças pequenas, com etapa de seguimento.',
      status:'Somente fonte oficial no app público — não republicar itens sem licença.',
      url:'https://www.mchatscreen.com/',
      kw:['tea','autismo','linguagem','comunicação social','brincar','criança pequena','rastreio'] }),
    mk({ id:'sdq', title:'Strengths and Difficulties Questionnaire (SDQ)', sigla:'SDQ', emoji:'🧩', aud:'misto',
      band:'2–17 anos', min:24, max:215, area:'Comportamento / saúde mental', pri:95,
      fim:'Triagem de sintomas emocionais, conduta, hiperatividade, relações com pares e pró-social. Pais, professores e autorrelato.',
      status:'Somente fonte oficial — não criar versão preenchível sem autorização.',
      url:'https://www.sdqinfo.org/',
      kw:['comportamento','hiperatividade','tdah','emoção','escola','pares','pró-social','conduta'] }),
    mk({ id:'phq-gad', title:'PHQ-9 / PHQ-A / GAD-7 — humor e ansiedade', sigla:'PHQ/GAD', emoji:'🌧️', aud:'autoteste',
      band:'≥ 11 anos', min:132, max:215, area:'Depressão e ansiedade (adolescente)', pri:94,
      fim:'Triagem de sintomas depressivos (PHQ-9/PHQ-A) e ansiosos (GAD-7) no adolescente.',
      status:'Termos de integração eletrônica a confirmar — catálogo e fonte por enquanto.',
      url:'https://www.phqscreeners.com/',
      kw:['humor','depressão','ansiedade','preocupação','adolescente','phq','gad'] }),
    mk({ id:'rcads', title:'Revised Child Anxiety and Depression Scale (RCADS)', sigla:'RCADS', emoji:'😟', aud:'misto',
      band:'criança/adolescente', min:72, max:215, area:'Ansiedade e humor', pri:90,
      fim:'Sintomas ansiosos e depressivos, incluindo diferentes manifestações de ansiedade. Versões criança e pais.',
      status:'Termos de integração eletrônica a confirmar.',
      url:'https://www.childfirst.ucla.edu/resources/',
      kw:['ansiedade','humor','depressão','medo','fobia','ansiedade de separação'] }),
    mk({ id:'pswqc', title:'Penn State Worry Questionnaire for Children (PSWQ-C)', sigla:'PSWQ-C', emoji:'🌀', aud:'autoteste',
      band:'criança/adolescente', min:72, max:215, area:'Ansiedade / preocupação', pri:88,
      fim:'Avaliação de preocupação excessiva e persistente em crianças e adolescentes.',
      status:'Termos de integração eletrônica a confirmar.',
      url:'https://www.childfirst.ucla.edu/resources/',
      kw:['ansiedade','preocupação','ruminação','medo'] }),
    mk({ id:'mtt', title:'My Thoughts about Therapy (Youth / Caregiver)', sigla:'MTT', emoji:'💭', aud:'misto',
      band:'criança/adolescente + cuidador', min:72, max:215, area:'Seguimento terapêutico', pri:80,
      fim:'Monitora percepção e engajamento do paciente/cuidador no processo terapêutico. Não é instrumento diagnóstico.',
      status:'Termos de integração eletrônica a confirmar.',
      url:'https://www.childfirst.ucla.edu/resources/',
      kw:['terapia','adesão','engajamento','acompanhamento'] }),
    mk({ id:'swyc', title:'Survey of Well-being of Young Children (SWYC / PPSC / POSI / BPSC)', sigla:'SWYC', emoji:'👶', aud:'familia',
      band:'primeira infância', min:0, max:65, area:'Desenvolvimento (primeira infância)', pri:93,
      fim:'Triagem ampla de desenvolvimento, comportamento e indicadores precoces de comunicação social. Inclui PPSC, POSI e BPSC.',
      status:'Termos de redistribuição eletrônica e tradução PT a confirmar.',
      url:'https://www.theswyc.org/',
      kw:['atraso do desenvolvimento','atraso de fala','comportamento','tea precoce','lactente','pré-escolar','posi'] }),
    mk({ id:'vanderbilt', title:'NICHQ Vanderbilt Assessment Scales (TDAH)', sigla:'NICHQ Vanderbilt', emoji:'⚡', aud:'misto',
      band:'6–12 anos', min:72, max:155, area:'TDAH', pri:95,
      fim:'Avaliação estruturada de desatenção, hiperatividade/impulsividade, prejuízo funcional e comorbidades. Pais e professores.',
      status:'Termos de integração eletrônica e versão PT a confirmar.',
      url:'https://nichq.org/resource/nichq-vanderbilt-assessment-scales',
      kw:['tdah','desatenção','hiperatividade','impulsividade','escola','oposição'] }),
    mk({ id:'gmfcs', title:'GMFCS-E&R — função motora grossa (paralisia cerebral)', sigla:'GMFCS-E&R', emoji:'🦽', aud:'clinico',
      band:'criança/adolescente', min:24, max:215, area:'Paralisia cerebral / motor', pri:90,
      fim:'Classifica a função motora grossa na PC (mobilidade, marcha, transferências, dispositivos). Não é escala diagnóstica.',
      status:'Acesso técnico oficial — classificação funcional.',
      url:'https://www.canchild.ca/en/resources/42-gross-motor-function-classification-system-expanded-revised-gmfcs-e-r',
      kw:['paralisia cerebral','motor','mobilidade','marcha','cadeira de rodas','gmfcs'] }),
    mk({ id:'macs', title:'MACS — Manual Ability Classification System (PC)', sigla:'MACS', emoji:'✋', aud:'clinico',
      band:'4–18 anos', min:48, max:215, area:'Paralisia cerebral / habilidade manual', pri:88,
      fim:'Classifica como crianças com PC usam as mãos para manusear objetos no cotidiano.',
      status:'Acesso técnico oficial — classificação funcional.',
      url:'https://macs.nu/',
      kw:['paralisia cerebral','mão','habilidade manual','manipulação','motor fino'] }),
    mk({ id:'minimacs', title:'Mini-MACS — habilidade manual na primeira infância (PC)', sigla:'Mini-MACS', emoji:'🤏', aud:'clinico',
      band:'1–4 anos', min:12, max:59, area:'Paralisia cerebral / habilidade manual', pri:86,
      fim:'Classifica habilidade manual funcional em crianças pequenas com PC. Versão brasileira disponível na fonte.',
      status:'Acesso técnico oficial — classificação funcional.',
      url:'https://macs.nu/',
      kw:['paralisia cerebral','criança pequena','função manual','motor fino'] }),
    mk({ id:'cdc-milestones', title:'Marcos do Desenvolvimento — CDC "Learn the Signs. Act Early."', sigla:'CDC Milestones', emoji:'🗓️', aud:'familia',
      band:'0–5 anos', min:0, max:71, area:'Vigilância do desenvolvimento', pri:92,
      fim:'Apoia a vigilância de marcos (comunicação, cognição, socialização, motor). Ferramenta educativa de vigilância, não teste diagnóstico.',
      status:'Acesso educativo oficial (CDC).',
      url:'https://www.cdc.gov/ncbddd/actearly/milestones/index.html',
      kw:['atraso do desenvolvimento','marcos','atraso de fala','motor','interação social','vigilância'] })
  ];

  window.NEUROPED_OFICIAIS = OFC;
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function(x){ return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = base.concat(OFC.filter(function(x){ return !ids.has(x.id); }));
  window.NEUROPED_OFICIAIS_COUNT = OFC.length;
})();

/* Expansão oficial lote 2: carregada antes da curadoria nos módulos de Filtro e Mapa.
   O uso de document.write aqui ocorre apenas durante a análise inicial das páginas estáticas,
   garantindo que o catálogo adicional esteja disponível antes de scales-curate.js. */
if (!window.NEUROPED_OFICIAIS_LOTE2_LOADED && document.readyState === 'loading') {
  document.write('<script src="./scales-oficiais-lote2.js"><\/script>');
}