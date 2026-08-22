// CBCL — versão abreviada para triagem; não substitui a aplicação ASEBA licenciada.
export const cbclDomains = [
  { name: "Problemas Internalizantes", color: "text-blue-600 dark:text-blue-400", items: ["Queixa-se de solidão", "Chora muito", "Tem medo de certos animais, situações ou lugares", "Tem medo de ir à escola", "Tem medo de pensar ou fazer algo mau", "Acha que tem que ser perfeito(a)", "Sente que ninguém gosta dele(a)", "Sente-se sem valor ou inferior", "É nervoso(a), tenso(a) ou agitado(a)", "É muito medroso(a) ou ansioso(a)", "Sente-se tonto(a) ou com dores de cabeça", "Sente-se muito cansado(a) sem razão", "Tem dores (estômago, cabeça) sem causa médica", "Tem náuseas, sente-se mal", "É muito preocupado(a)"] },
  { name: "Problemas Externalizantes", color: "text-red-600 dark:text-red-400", items: ["É desobediente em casa", "É desobediente na escola", "Não se sente culpado(a) depois de se comportar mal", "Mente ou engana os outros", "Rouba em casa", "Destrói suas próprias coisas", "Destrói coisas dos outros", "Mete-se em muitas brigas", "Agride fisicamente os outros", "Grita muito", "É teimoso(a), irritável", "Tem variações repentinas de humor", "Fala demais", "É provocador(a), irrita os outros", "Exige muita atenção"] },
  { name: "Problemas Sociais e Atenção", color: "text-purple-600 dark:text-purple-400", items: ["É desajeitado(a), descoordenado(a)", "Prefere estar com crianças mais novas", "Não se dá bem com outras crianças", "As outras crianças não gostam dele(a)", "É provocado(a) pelas outras crianças", "Não consegue se concentrar ou prestar atenção", "Não consegue ficar sentado(a), é inquieto(a)", "É confuso(a), parece estar 'no mundo da lua'", "Fica sonhando acordado(a)", "É impulsivo(a), age sem pensar"] },
];

export const cbclLabels = ["Falso", "Às vezes verdadeiro", "Frequentemente verdadeiro"];

export function classifyCbcl(internalizing: number, externalizing: number, social: number) {
  const total = internalizing + externalizing + social;
  const results: Array<{ domain: string; score: number; classification: string; color: string }> = [];
  const add = (domain: string, score: number, normal: number, borderline: number) => {
    results.push({
      domain,
      score,
      classification: score <= normal ? "Normal" : score <= borderline ? "Limítrofe" : "Clínico",
      color: score <= normal ? "emerald" : score <= borderline ? "amber" : "red",
    });
  };
  add("Internalizantes", internalizing, 8, 12);
  add("Externalizantes", externalizing, 10, 15);
  add("Social/Atenção", social, 6, 9);
  return {
    total,
    results,
    description: total <= 24
      ? "Faixa normal global."
      : total <= 36
        ? "Faixa limítrofe — reavaliação recomendada."
        : "Faixa clínica — encaminhamento para avaliação especializada.",
  };
}
