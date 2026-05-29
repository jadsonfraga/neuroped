/* NeuroPed EDJ — Catálogo de instrumentos oficiais com acesso sem custo.
 * Revisado: 2026-05-29.
 * Regra: gratuito para consulta/uso clínico não significa livre para reprodução em app público.
 * Este arquivo contém metadados e links oficiais; não reproduz itens protegidos.
 */
window.NP_OFFICIAL_FREE_INSTRUMENTS = {
  updatedAt: '2026-05-29',
  notice: 'Catálogo de instrumentos oficiais gratuitos ou com acesso sem custo. Use os links oficiais; a incorporação integral no app depende de permissão documental e ambiente clínico seguro.',
  statuses: {
    link_official: 'Acesso oficial — link seguro, sem reprodução de itens no app.',
    private_integration_ready: 'Pode evoluir para integração privada após validação técnica, jurídica e clínica.',
    official_link_only: 'Somente fonte oficial — versão eletrônica pública não autorizada ou não confirmada.',
    safety_pathway: 'Uso clínico exige plano de resposta e ambiente profissional seguro.',
    terms_to_verify: 'Acesso localizado; confirmar termos eletrônicos antes de qualquer integração.'
  },
  items: [
    {id:'psc',name:'Pediatric Symptom Checklist',variants:'PSC-35 · Y-PSC · PSC-17 · Y-PSC-17',group:'Psiquiatria infantil',domain:'Saúde mental global',source:'Massachusetts General Hospital',officialUrl:'https://www.massgeneral.org/psychiatry/treatments-and-services/pediatric-symptom-checklist',language:'Português brasileiro-americano disponível na fonte',status:'link_official',use:'Rastreio psicossocial amplo; não estabelece diagnóstico.',permission:'A fonte disponibiliza formulários, instruções de escore e informa administração eletrônica em contextos assistenciais.'},
    {id:'crafft',name:'CRAFFT',variants:'CRAFFT 2.1 · CRAFFT 2.1+N',group:'Psiquiatria do adolescente',domain:'Álcool, drogas, nicotina e vaping',source:'Boston Children’s Hospital',officialUrl:'https://crafft.org/',language:'Traduções disponíveis na fonte',status:'private_integration_ready',use:'Rastreio validado de uso de substâncias em adolescentes de 12–21 anos.',permission:'A fonte declara uso gratuito e reprodução em papel ou integração à prática/EMR.'},
    {id:'asq',name:'Ask Suicide-Screening Questions Toolkit',variants:'Youth · PHQ-A/ASQ · vias clínicas',group:'Segurança em saúde mental',domain:'Triagem de segurança',source:'National Institute of Mental Health',officialUrl:'https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials',language:'Múltiplos idiomas na fonte',status:'safety_pathway',use:'Uso clínico somente em ambiente com protocolo de manejo e encaminhamento.',permission:'O NIMH informa que o toolkit é gratuito para contextos médicos.'},
    {id:'cssrs',name:'Columbia Protocol',variants:'C-SSRS screener e versões de triagem',group:'Segurança em saúde mental',domain:'Triagem de segurança',source:'Columbia Lighthouse Project',officialUrl:'https://cssrs.columbia.edu/the-columbia-scale-c-ssrs/about-the-scale/',language:'Múltiplos idiomas na fonte',status:'safety_pathway',use:'Instrumento de risco que demanda fluxo profissional de resposta.',permission:'A fonte informa protocolo e treinamento gratuitos para saúde e comunidade.'},
    {id:'mchat',name:'Modified Checklist for Autism in Toddlers, Revised with Follow-Up',variants:'M-CHAT-R/F',group:'Neuropediatria',domain:'TEA em crianças pequenas',source:'M-CHAT Official',officialUrl:'https://www.mchatscreen.com/',language:'Traduções oficiais na fonte',status:'official_link_only',use:'Rastreio de probabilidade de TEA em dois estágios.',permission:'Download é gratuito, mas disponibilização em software/site público requer licença.'},
    {id:'sdq',name:'Strengths and Difficulties Questionnaire',variants:'Pais · Professores · Autorrelato',group:'Psiquiatria infantil',domain:'Comportamento e saúde mental',source:'Youthinmind',officialUrl:'https://www.sdqinfo.org/',language:'Traduções oficiais',status:'official_link_only',use:'Triagem de dificuldades e pontos fortes.',permission:'Versões em papel podem ter uso gratuito em condições definidas; versões eletrônicas exigem autorização.'},
    {id:'rcads',name:'Revised Child Anxiety and Depression Scale',variants:'Criança/adolescente · cuidador',group:'Psiquiatria infantil',domain:'Ansiedade e humor',source:'UCLA Child FIRST / RCADS',officialUrl:'https://www.childfirst.ucla.edu/resources/',language:'Consultar fonte oficial',status:'terms_to_verify',use:'Instrumento de ansiedade e sintomas depressivos.',permission:'Confirmar termos atuais da fonte antes de integração eletrônica.'},
    {id:'pswqc',name:'Penn State Worry Questionnaire for Children',variants:'PSWQ-C',group:'Psiquiatria infantil',domain:'Preocupação e ansiedade',source:'UCLA Child FIRST',officialUrl:'https://www.childfirst.ucla.edu/resources/',language:'Consultar fonte oficial',status:'terms_to_verify',use:'Avaliação de preocupação em crianças.',permission:'Confirmar termos atuais da fonte antes de integração eletrônica.'},
    {id:'mtt',name:'My Thoughts about Therapy',variants:'Youth · Caregiver',group:'Seguimento terapêutico',domain:'Engajamento terapêutico',source:'UCLA Child FIRST',officialUrl:'https://www.childfirst.ucla.edu/resources/',language:'Consultar fonte oficial',status:'terms_to_verify',use:'Monitoramento de percepção e engajamento no tratamento.',permission:'Confirmar termos atuais da fonte antes de integração eletrônica.'}
  ]
};
