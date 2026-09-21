import type { CommercialFeatureCode } from "./commercial";

/** Modelos organizacionais em branco, sem pontuação, interpretação ou decisão clínica. */
const templates: Partial<Record<CommercialFeatureCode, { title: string; purpose: string; fields: string[] }>> = {
  "form.change_log": {
    title: "Registro organizado de mudanças",
    purpose: "Descrever mudanças e perguntas para revisão pela equipe, sem atribuir causa ou diagnóstico.",
    fields: ["Período observado", "Mudança descrita objetivamente", "Contexto em que ocorreu", "O que permaneceu estável", "Pergunta para a equipe", "Responsável pela revisão e data"],
  },
  "form.school_feedback": {
    title: "Devolutiva escolar estruturada",
    purpose: "Organizar a comunicação da escola com a equipe, sem escore ou conclusão diagnóstica.",
    fields: ["Período e atividade", "Participação observada", "Facilitadores", "Dificuldades descritas", "Apoios já utilizados", "Perguntas e próximos contatos"],
  },
  "form.approved_plan": {
    title: "Plano aprovado em uma página",
    purpose: "Transcrever somente ações já aprovadas pelo profissional responsável. Este modelo não recomenda tratamento.",
    fields: ["Objetivo já aprovado", "Ação combinada", "Responsável pela execução", "Frequência e prazo já definidos", "Como registrar o acompanhamento", "Responsável pela aprovação e data de revisão"],
  },
  "form.routine_log": {
    title: "Registro descritivo da rotina",
    purpose: "Organizar observações de rotina para conversa com a equipe, sem classificação clínica automática.",
    fields: ["Data e período", "Rotina observada: sono, alimentação ou outra", "Descrição do que ocorreu", "Contexto e apoios utilizados", "Mudanças percebidas", "Perguntas para a próxima revisão"],
  },
};

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export function buildCommercialTemplate(feature: CommercialFeatureCode) {
  const template = templates[feature];
  if (!template) throw new Error("Esta entrada é pública e não corresponde a um modelo institucional exclusivo.");
  const boundary = "Modelo organizacional em branco. Não preencher dados identificáveis de pacientes no aplicativo. Não substitui avaliação ou decisão profissional.";
  const text = [template.title.toUpperCase(), "NeuroPed Institucional", "", template.purpose, "", ...template.fields.map((field) => `${field}: ______________________________`), "", boundary].join("\n");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(template.title)}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:24px}h1{font-size:25px}section{margin:22px 0}footer{font-size:12px;border-top:1px solid;padding-top:16px}.blank{min-height:35px;border-bottom:1px solid}@media print{body{margin:0;max-width:none}}</style></head><body><h1>${escape(template.title)}</h1><p>NeuroPed Institucional — modelo em branco</p><p>${escape(template.purpose)}</p>${template.fields.map((field) => `<section><strong>${escape(field)}</strong><div class="blank"></div></section>`).join("")}<footer>${escape(boundary)}</footer></body></html>`;
  return { ...template, text, html, boundary, filename: `neuroped-${feature.split(".")[1]}.html` };
}
