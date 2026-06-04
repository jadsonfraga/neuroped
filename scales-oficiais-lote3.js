/* NeuroPed SDG — CATÁLOGO OFICIAL · LOTE 3
   Instrumentos padronizados de terceiros amplamente usados em neuropediatria
   (TEA, TDAH, comportamento adaptativo, neuropsicologia, desenvolvimento, humor,
   ansiedade, motor). Pedido: tornar TODOS filtráveis no Filtro de Escalas.

   CONFORMIDADE (idêntica ao lote 1/2): cada item é um CARD pesquisável com nome
   oficial, sigla, finalidade, faixa, respondente, palavras-chave, STATUS
   jurídico/clínico e LINK para a FONTE OFICIAL. NÃO reproduz itens/perguntas
   protegidas por direito autoral. Para os instrumentos de referência, o módulo
   scales-official-questions.js injeta PERGUNTAS-GUIA AUTORAIS NeuroPed (do mesmo
   construto) + proveniência/licença — nunca os itens originais.

   Os genuinamente livres (ex.: SNAP-IV, SCARED) recebem license_status 'livre'
   no mapa de licenças; os proprietários ficam como 'verificar' (checar na fonte
   antes de uso formal), que é o padrão honesto e seguro. */
(function () {
  'use strict';
  if (window.NEUROPED_OFICIAIS_LOTE3_LOADED) return;
  window.NEUROPED_OFICIAIS_LOTE3_LOADED = true;

  var AUD = { familia:'Família', escola:'Escola', autoteste:'Autoteste', clinico:'Clínico', misto:'Múltiplos respondentes' };

  function mk(o){
    return {
      id:'ofc3-' + o.id, title:o.title, short_title:o.sigla || o.title, sigla:o.sigla || '',
      emoji:o.emoji || '📚', audience:o.aud || 'clinico', audience_label:AUD[o.aud || 'clinico'],
      age_band:o.band || 'pediátrico', age_min_months:o.min == null ? 0 : o.min, age_max_months:o.max == null ? 215 : o.max,
      domain:o.area, finalidade:o.fim, status:o.status, official_url:o.url,
      official_catalog:true, applicable:false, nature:'oficial', kind:'fonte oficial',
      symptoms:o.kw.slice(0,5), complaints:o.kw, keywords:o.kw.concat([o.sigla, o.area, 'fonte oficial', 'oficial', 'validado', 'referência']),
      page:'', anchor:'', priority:o.pri || 88,
      plain_questions:[], clinical_use:o.fim,
      differentiator:'Instrumento oficial de terceiros — catalogado com fonte. ' + o.status,
      not_normative_disclaimer:'Instrumento oficial de terceiros. Itens não reproduzidos no app por conformidade de licença. ' + o.status + ' Acesse a fonte oficial para uso conforme os termos.'
    };
  }

  // URLs de fonte oficial (editoras/autores) — estáveis e verificáveis.
  var WPS = 'https://www.wpspublish.com/', PEARSON = 'https://www.pearsonassessments.com/',
      MHS = 'https://mhs.com/', PAR = 'https://www.parinc.com/', ASEBA = 'https://aseba.org/';
  var ST_PROP = 'Instrumento proprietário — uso/aplicação exigem aquisição/licença junto à editora oficial.';
  var ST_FREE = 'Uso clínico gratuito amplamente disponível — atribuição à fonte/autor original.';

  var L3 = [
    /* ===================== TDAH / comportamento ===================== */
    mk({ id:'snap-iv', title:'SNAP-IV (Swanson, Nolan e Pelham) — TDAH e oposição', sigla:'SNAP-IV', emoji:'⚡', aud:'misto',
      band:'6–18 anos', min:72, max:215, area:'TDAH e transtorno opositivo', pri:96,
      fim:'Rastreio de desatenção, hiperatividade/impulsividade e sintomas opositivos por pais e professores (versões 18 e 26 itens).',
      status:ST_FREE, url:'https://www.shared-care.ca/files/Scoring_for_SNAP_IV_Guide.pdf',
      kw:['tdah','desatenção','hiperatividade','impulsividade','oposição','tod','escola','professor'] }),
    mk({ id:'conners', title:'Conners (Conners 4 / Conners 3 / Conners EC) — TDAH e comorbidades', sigla:'Conners', emoji:'📈', aud:'misto',
      band:'2–18 anos', min:24, max:215, area:'TDAH e comorbidades', pri:94,
      fim:'Avaliação multi-informante de TDAH e problemas associados (conduta, aprendizagem, humor) por pais, professores e autorrelato.',
      status:ST_PROP, url:MHS,
      kw:['tdah','desatenção','hiperatividade','conduta','aprendizagem','comorbidade','pais','professor'] }),
    mk({ id:'brief2', title:'BRIEF-2 — Inventário de Funções Executivas', sigla:'BRIEF-2', emoji:'🧩', aud:'misto',
      band:'5–18 anos', min:60, max:215, area:'Funções executivas', pri:90,
      fim:'Avaliação comportamental de funções executivas (inibição, memória de trabalho, planejamento, flexibilidade) por pais, professores e autorrelato.',
      status:ST_PROP, url:PAR,
      kw:['funções executivas','autorregulação','memória de trabalho','organização','planejamento','flexibilidade','inibição'] }),
    mk({ id:'abc-aberrant', title:'ABC — Aberrant Behavior Checklist', sigla:'ABC', emoji:'🌀', aud:'misto',
      band:'pediátrico', min:0, max:215, area:'Comportamento (TEA / deficiência intelectual)', pri:86,
      fim:'Avaliação de comportamentos-problema (irritabilidade, letargia, estereotipias, hiperatividade, fala inadequada), útil em TEA e DI.',
      status:ST_PROP, url:'https://www.slosson.com/',
      kw:['comportamento','irritabilidade','estereotipias','agitação','tea','deficiência intelectual','agressividade'] }),

    /* ===================== TEA ===================== */
    mk({ id:'cars2', title:'CARS-2 — Childhood Autism Rating Scale (2ª ed.)', sigla:'CARS-2', emoji:'🧠', aud:'clinico',
      band:'≥ 2 anos', min:24, max:215, area:'TEA (avaliação clínica)', pri:95,
      fim:'Escala de avaliação clínica da gravidade de características do espectro autista (versões padrão e de alto funcionamento).',
      status:ST_PROP, url:'https://www.wpspublish.com/cars-2-childhood-autism-rating-scale-second-edition',
      kw:['tea','autismo','espectro','gravidade','avaliação clínica','interação social','comportamento'] }),
    mk({ id:'adi-r', title:'ADI-R — Autism Diagnostic Interview-Revised', sigla:'ADI-R', emoji:'🗂️', aud:'clinico',
      band:'idade mental ≥ 2 anos', min:24, max:215, area:'TEA (entrevista diagnóstica)', pri:93,
      fim:'Entrevista semiestruturada com cuidadores para avaliação diagnóstica do autismo (comunicação, interação social, padrões restritos/repetitivos).',
      status:ST_PROP, url:WPS,
      kw:['tea','autismo','entrevista','diagnóstico','interação social','comunicação','comportamentos repetitivos'] }),
    mk({ id:'scq', title:'SCQ — Social Communication Questionnaire', sigla:'SCQ', emoji:'💬', aud:'familia',
      band:'≥ 4 anos', min:48, max:215, area:'TEA (rastreio)', pri:90,
      fim:'Questionário de rastreio de sintomas associados ao espectro autista, respondido por cuidadores (formas "ao longo da vida" e "atual").',
      status:ST_PROP, url:WPS,
      kw:['tea','autismo','rastreio','comunicação social','cuidador','espectro'] }),

    /* ===================== Desenvolvimento / cognição / adaptativo ===================== */
    mk({ id:'vineland3', title:'Vineland-3 — Escalas de Comportamento Adaptativo', sigla:'Vineland-3', emoji:'🌳', aud:'misto',
      band:'0–90 anos', min:0, max:215, area:'Comportamento adaptativo', pri:92,
      fim:'Avaliação do comportamento adaptativo (comunicação, vida diária, socialização, motricidade) por entrevista/questionário com cuidadores e professores.',
      status:ST_PROP, url:PEARSON,
      kw:['comportamento adaptativo','autonomia','vida diária','socialização','comunicação','deficiência intelectual','tea'] }),
    mk({ id:'denver2', title:'Denver II — Triagem do Desenvolvimento', sigla:'Denver II', emoji:'📊', aud:'clinico',
      band:'0–6 anos', min:0, max:72, area:'Triagem do desenvolvimento', pri:88,
      fim:'Triagem do desenvolvimento em quatro áreas (pessoal-social, motor fino-adaptativo, linguagem e motor grosseiro).',
      status:ST_PROP, url:'https://denverii.com/',
      kw:['desenvolvimento','marcos','triagem','motor','linguagem','pessoal-social','primeira infância'] }),
    mk({ id:'bayley4', title:'Bayley-4 — Escalas de Desenvolvimento do Bebê e Criança Pequena', sigla:'Bayley-4', emoji:'🍼', aud:'clinico',
      band:'0–42 meses', min:0, max:42, area:'Desenvolvimento (primeira infância)', pri:88,
      fim:'Avaliação do desenvolvimento cognitivo, linguagem, motor, socioemocional e comportamento adaptativo em bebês e crianças pequenas.',
      status:ST_PROP, url:PEARSON,
      kw:['desenvolvimento','bebê','cognição','linguagem','motor','primeira infância','atraso global'] }),
    mk({ id:'wisc5', title:'WISC-V — Escala de Inteligência Wechsler para Crianças', sigla:'WISC-V', emoji:'🧮', aud:'clinico',
      band:'6–16 anos', min:72, max:200, area:'Inteligência / cognição', pri:88,
      fim:'Avaliação da capacidade intelectual e de domínios cognitivos (compreensão verbal, viso-espacial, raciocínio fluido, memória de trabalho, velocidade).',
      status:ST_PROP, url:PEARSON,
      kw:['inteligência','qi','cognição','memória de trabalho','raciocínio','aprendizagem','avaliação neuropsicológica'] }),
    mk({ id:'nepsy2', title:'NEPSY-II — Avaliação Neuropsicológica do Desenvolvimento', sigla:'NEPSY-II', emoji:'🔬', aud:'clinico',
      band:'3–16 anos', min:36, max:200, area:'Avaliação neuropsicológica', pri:86,
      fim:'Bateria neuropsicológica por domínios (atenção/função executiva, linguagem, memória, sensório-motor, processamento viso-espacial, percepção social).',
      status:ST_PROP, url:PEARSON,
      kw:['neuropsicologia','atenção','memória','linguagem','funções executivas','viso-espacial','aprendizagem'] }),
    mk({ id:'mabc2', title:'MABC-2 — Movement Assessment Battery for Children', sigla:'MABC-2', emoji:'🤸', aud:'clinico',
      band:'3–16 anos', min:36, max:200, area:'Coordenação motora (TDC)', pri:85,
      fim:'Avaliação da coordenação motora (destreza manual, mirar e agarrar, equilíbrio) — apoio à identificação de Transtorno do Desenvolvimento da Coordenação.',
      status:ST_PROP, url:PEARSON,
      kw:['motor','coordenação','tdc','desajeitado','equilíbrio','destreza manual','motricidade'] }),

    /* ===================== Comportamento / emoção (banco ASEBA) ===================== */
    mk({ id:'aseba-cbcl', title:'ASEBA — CBCL / TRF / YSR (Achenbach)', sigla:'CBCL', emoji:'📋', aud:'misto',
      band:'1,5–18 anos', min:18, max:215, area:'Comportamento e emoção (banco ASEBA)', pri:90,
      fim:'Sistema multi-informante de problemas emocionais e comportamentais (pais — CBCL; professores — TRF; autorrelato — YSR), com perfis de síndromes.',
      status:ST_PROP, url:ASEBA,
      kw:['comportamento','emoção','ansiedade','depressão','agressividade','isolamento','multi-informante','síndromes'] }),

    /* ===================== Humor / ansiedade ===================== */
    mk({ id:'scared', title:'SCARED — Screen for Child Anxiety Related Disorders', sigla:'SCARED', emoji:'😟', aud:'misto',
      band:'8–18 anos', min:96, max:215, area:'Ansiedade', pri:89,
      fim:'Rastreio de transtornos de ansiedade (pânico/somático, ansiedade generalizada, separação, fobia social, fobia escolar) — criança e pais.',
      status:ST_FREE, url:'https://www.pediatricbipolar.pitt.edu/resources/instruments',
      kw:['ansiedade','medo','pânico','separação','fobia social','preocupação','escola'] }),
    mk({ id:'cdi2', title:'CDI-2 — Children’s Depression Inventory (2ª ed.)', sigla:'CDI-2', emoji:'🌧️', aud:'misto',
      band:'7–17 anos', min:84, max:215, area:'Humor / depressão', pri:86,
      fim:'Avaliação de sintomas depressivos em crianças e adolescentes (autorrelato, pais e professores).',
      status:ST_PROP, url:MHS,
      kw:['humor','depressão','tristeza','irritabilidade','desânimo','autoestima','adolescente'] })
  ];

  window.NEUROPED_OFICIAIS_LOTE3 = L3;
  var base = Array.isArray(window.NEUROPED_EDITORIAL_SCALES) ? window.NEUROPED_EDITORIAL_SCALES : [];
  var ids = new Set(base.map(function(x){ return x && x.id; }));
  window.NEUROPED_EDITORIAL_SCALES = base.concat(L3.filter(function(x){ return !ids.has(x.id); }));
  var oficiais = Array.isArray(window.NEUROPED_OFICIAIS) ? window.NEUROPED_OFICIAIS : [];
  var ofIds = new Set(oficiais.map(function(x){ return x && x.id; }));
  window.NEUROPED_OFICIAIS = oficiais.concat(L3.filter(function(x){ return !ofIds.has(x.id); }));
  window.NEUROPED_OFICIAIS_LOTE3_COUNT = L3.length;
})();
