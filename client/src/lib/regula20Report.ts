import { calculateRegula20, REGULA20_VERSION } from "@/data/regula20";

/** Mesmas linhas são exibidas, exportadas e entregues ao salvamento existente. */
export function regula20ComputedRows(answers: readonly unknown[]): Array<{ question: string; answer: string }> {
  const score = calculateRegula20(answers);
  if (!score.complete) throw new Error("REGULA-20 incompleto: não emitir apuração final.");
  const format = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return [
    {
      question: "Apuração descritiva — cobertura e versão",
      answer: `${score.observed}/20 itens observáveis; ${score.notObserved} N/O; contrato ${REGULA20_VERSION}. N/O não entra no numerador nem no denominador.`,
    },
    ...score.domains.map((domain) => ({
      question: `${domain.name} — média descritiva 0–4`,
      answer: domain.mean === null
        ? `Não calculável: 0/5 itens observáveis; ${domain.notObserved} N/O. Não interpretar como zero.`
        : `${format(domain.mean)}/4 · soma dos observáveis ${domain.sum}; ${domain.observed}/5 itens observáveis; ${domain.notObserved} N/O.`,
    })),
    {
      question: "Média global descritiva 0–4",
      answer: score.globalMean === null
        ? `Não calculável: ${score.observed}/20 itens observáveis; exige pelo menos 16/20. Não interpretar como ausência de dificuldades.`
        : `${format(score.globalMean)}/4 · ${score.observed}/20 itens observáveis. Sem ponto de corte diagnóstico.`,
    },
    {
      question: "Soma aritmética auxiliar — somente com 20/20 observáveis",
      answer: score.rawTotal === null
        ? "Não calculada porque há N/O; não prorratear nem substituir N/O por zero."
        : `${score.rawTotal}/80. Não substitui a leitura das médias e não é classificação de gravidade.`,
    },
    {
      question: "Limites da apuração e comparação longitudinal",
      answer: "Médias maiores descrevem maior repercussão funcional relatada, não diagnóstico. Compare apenas o mesmo instrumento, versão, observador, contexto e conjunto de itens observáveis. Alertas clínicos independem dos valores. Não há limiar validado de mudança clinicamente significativa ou evidência automática de eficácia.",
    },
  ];
}
