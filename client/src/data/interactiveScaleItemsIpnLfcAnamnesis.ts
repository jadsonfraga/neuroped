import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnLfcAnamnesisDomains: InteractiveDomainDef[] = [
  {
    name: "Identificação linguística",
    items: [
      { text: "Línguas, dialetos e modalidades de comunicação usadas pela criança.", emoji: "◇", example: "Registrar idade de exposição, parceiros e contextos de cada língua. Aprofundar: Dificuldade verdadeira deve ser analisada em todo o repertório, sem penalizar multilinguismo.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Queixa e prioridade",
    items: [
      { text: "Queixa principal em palavras da família, escola e criança.", emoji: "◇", example: "Separar fala, compreensão, expressão, fluência, voz, pragmática e aprendizagem. Aprofundar: Registrar qual mudança teria maior impacto funcional.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Gestação e período neonatal",
    items: [
      { text: "Intercorrências gestacionais, prematuridade, UTI, infecções, hipóxia e icterícia.", emoji: "◇", example: "Relacionar a fatores de risco sem atribuir causalidade automática. Aprofundar: Incluir exames e idade gestacional quando disponíveis.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Marcos iniciais",
    items: [
      { text: "Balbucio, primeiras palavras, combinações, compreensão e gestos.", emoji: "◇", example: "Registrar trajetória, não apenas idade isolada. Aprofundar: Considerar perda ou estagnação.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Regressão",
    items: [
      { text: "Perda de palavras, compreensão, gestos, fala ou participação previamente adquiridos.", emoji: "◇", example: "Definir início, velocidade, contexto e funções perdidas. Aprofundar: Regressão verdadeira é red flag independente do escore.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Audição",
    items: [
      { text: "Triagens, audiometria, otites, uso de AASI/implante e resposta auditiva funcional.", emoji: "◇", example: "Anexar resultados e adesão aos dispositivos. Aprofundar: Perda auditiva suspeita exige encaminhamento prioritário.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Neurologia e desenvolvimento",
    items: [
      { text: "Crises, eventos paroxísticos, hipotonia, fraqueza, coordenação e outros domínios.", emoji: "◇", example: "Distinguir condição biomédica associada de DLD sem etiologia conhecida. Aprofundar: Registrar neuroimagem, genética e diagnósticos existentes.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Estrutura orofacial",
    items: [
      { text: "Fissura, palato, dentição, frênulo, trauma, cirurgia ou anomalia craniofacial.", emoji: "👄", example: "Descrever impacto funcional e avaliações realizadas. Aprofundar: Alteração estrutural relevante requer equipe específica.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Alimentação e deglutição",
    items: [
      { text: "Engasgos, tosse, seletividade por textura, tempo de refeição e crescimento.", emoji: "◇", example: "Relacionar com motricidade oral e respiração. Aprofundar: Aspiração suspeita e perda ponderal são red flags independentes.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Respiração, sono e voz",
    items: [
      { text: "Ronco, pausas, respiração oral, rouquidão, fadiga vocal e infecções.", emoji: "🎙", example: "Registrar duração e avaliação otorrinolaringológica. Aprofundar: Estridor, dispneia ou perda súbita de voz exigem avaliação urgente.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "História familiar",
    items: [
      { text: "Fala tardia, transtorno de linguagem, leitura, gagueira, deficiência auditiva ou neurodesenvolvimento.", emoji: "◇", example: "Registrar parentesco e trajetória. Aprofundar: História familiar é fator de risco, não diagnóstico.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Ambiente comunicativo",
    items: [
      { text: "Oportunidades de conversa, leitura, brincadeira e acesso a parceiros responsivos.", emoji: "◇", example: "Evitar culpabilização da família. Aprofundar: Identificar facilitadores modificáveis.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Escola e alfabetização",
    items: [
      { text: "Desempenho, instruções, narrativa, leitura, escrita, participação e adaptações.", emoji: "🏫", example: "Solicitar exemplos de produções e relatórios. Aprofundar: Linguagem pode mascarar conhecimento.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Comportamento e emoção",
    items: [
      { text: "Frustração, crises, retraimento, ansiedade, mutismo e bullying associados à comunicação.", emoji: "◇", example: "Distinguir consequência, comorbidade e contexto. Aprofundar: Risco de autoagressão ou violência segue protocolo próprio.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "CAA e acessibilidade",
    items: [
      { text: "Recursos de comunicação existentes, acesso motor, disponibilidade e parceiros treinados.", emoji: "◇", example: "Registrar se o recurso acompanha todos os ambientes. Aprofundar: Ausência de fala não justifica ausência de comunicação.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Intervenções prévias",
    items: [
      { text: "Fonoaudiologia, pedagogia, terapia, frequência, abordagem, metas e resposta.", emoji: "◇", example: "Registrar intensidade e generalização. Aprofundar: Evitar julgar eficácia apenas por tempo de terapia.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Medicações e saúde geral",
    items: [
      { text: "Medicações, sedação, xerostomia, efeitos motores, crises e condições sistêmicas.", emoji: "◇", example: "Relacionar temporalmente com mudanças na comunicação. Aprofundar: Não modificar tratamento sem revisão médica.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Vídeos e amostras",
    items: [
      { text: "Amostras de fala e comunicação em contextos naturais.", emoji: "◇", example: "Registrar data, parceiro e consentimento. Aprofundar: Comparar sessão com vida diária.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Red flags imediatas",
    items: [
      { text: "Piora rápida, regressão, engasgos, dispneia, fraqueza bulbar, nova assimetria ou alteração de consciência.", emoji: "⚠", example: "Definir evento, início e conduta já realizada. Aprofundar: Estes sinais ficam fora de qualquer pontuação.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
  {
    name: "Proteções e forças",
    items: [
      { text: "Interesses, parceiros eficazes, estratégias espontâneas, motivadores e contextos de melhor desempenho.", emoji: "◇", example: "Documentar o que funciona antes de listar déficits. Aprofundar: Plano deve preservar autonomia e dignidade.", responseType: "text", placeholder: "Registre fatos, contexto, curso temporal, fontes e próximo passo.", required: false },
    ],
  },
];
