import type { RecoveredMonitor } from "./recoveredAuthorialMonitors";

const rotaAlerts = [
  "Perda nova ou rápida de habilidades que já estavam consolidadas, sobretudo se acompanhada de alteração motora, linguagem, consciência, comportamento ou controle esfincteriano.",
  "Episódios de fuga, saída sem supervisão, aproximação de rua/trânsito, água, altura ou outros ambientes com risco imediato.",
  "Acesso ou tentativa de acesso a medicamentos, produtos químicos, fogo, objetos perfurocortantes, armas ou outros meios potencialmente perigosos.",
  "Dificuldade importante para comunicar dor, mal-estar, abuso, ameaça, toque inadequado ou situação de exploração - especialmente quando há mudança comportamental sem explicação clara.",
  "Engasgos recorrentes, ingestão de itens não alimentares ou comportamento durante alimentação que gere risco físico.",
  "Ameaça, tentativa ou comportamento de autoagressão; fala de morte; comportamento que coloque a si ou outras pessoas em risco.",
  "Regressão funcional associada a sonolência excessiva, desmaios, quedas novas, fraqueza, crises epilépticas ou outro sintoma neurológico agudo.",
];
export function monitorWithClinicalDetails(d: RecoveredMonitor): RecoveredMonitor {
  return d.id === "rota-aut-18-sdg" ? { ...d, redFlags: rotaAlerts } : d;
}
export const schoolSupportOptions = [
  "Antecipação verbal de mudanças e transições", "Rotina/agenda visual ou sequência por imagens",
  "Instruções curtas, uma etapa por vez", "Tempo adicional para iniciar ou concluir",
  "Pausa programada ou local de regulação", "Redução de ruído, movimento ou estímulos concorrentes",
  "Assento/local com menor distração", "Modelagem ou demonstração prática",
  "Mediação de interação com colegas", "Escolha entre duas alternativas aceitáveis",
  "Comunicação alternativa/visual para pedir ajuda ou pausa", "Divisão da tarefa em blocos menores",
];
export const supportResponseOptions = ["Não testado", "Ajudou muito", "Ajudou parcialmente", "Sem mudança clara", "Piorou", "Informação insuficiente"];
