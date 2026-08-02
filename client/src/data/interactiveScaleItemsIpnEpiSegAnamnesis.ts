import type { InteractiveDomainDef } from "./interactiveScaleItems";

export const ipnEpiSegAnamnesisDomains: InteractiveDomainDef[] = [
  {
    name: "Anamnese e red flags",
    items: [
      { text: "Descrição do primeiro evento e idade de início.", example: "Registrar fonte, contexto, sequência, duração e recuperação. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Tipos de evento atuais e número de padrões distintos.", example: "Separar eventos habituais, atípicos e ainda não esclarecidos. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Frequência, duração, clusters e última ocorrência.", example: "Usar calendário e definir período de referência. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Estado de vigília/sono e distribuição horária.", example: "Relacionar despertar, adormecer e horários recorrentes. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Febre, infecção, trauma, intoxicação ou causa aguda no evento inicial.", example: "Distinguir provocados de não provocados sem conclusão automática. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "História gestacional, perinatal, desenvolvimento e regressão.", example: "Incluir prematuridade, insultos e perdas de habilidades. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "História familiar de epilepsia, convulsão febril, síncope ou morte súbita.", example: "Registrar grau de parentesco e idade. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Exames prévios: EEG, vídeo-EEG, RM, genética, metabólico e cardiológico.", example: "Documentar data, qualidade e achados relevantes. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Medicações atuais e anteriores, resposta e efeitos adversos.", example: "Dose, concentração, horários, adesão e motivo de troca. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Plano de resgate, uso prévio e resposta.", example: "Dose, via, tempo de administração e necessidade de emergência. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Lesões, afogamento, queimaduras, status epiléptico ou internações.", example: "Red flags independentes de escore. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Sono, ronco, privação, rotina e eventos noturnos.", example: "Incluir impacto sobre família e sonolência diurna. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Escola, aprendizagem, comportamento e participação.", example: "Mudanças temporais com crises ou tratamento. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Saúde mental, estigma, autonomia e qualidade de vida.", example: "Incluir voz da criança/adolescente. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
      { text: "Red flags atuais e nível de urgência.", example: "Crise prolongada, repetição sem recuperação, déficit focal novo, dificuldade respiratória, trauma grave, suspeita de meningite ou intoxicação. Registrar fatos, fontes, datas e incertezas.", responseType: "text", placeholder: "Registre fatos, fontes, datas, exemplos e incertezas...", required: false },
    ],
  },
];
