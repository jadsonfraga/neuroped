type WelcomeProfile = "presencial" | "infantil" | "escolar" | "adolescente";

export function welcomeProfile(ageLabel: string): WelcomeProfile {
  // Apenas rótulos etários dos roteiros existentes. Um formato novo deve falhar
  // para acolhimento presencial, nunca abrir a tela a uma idade indeterminada.
  if (ageLabel === "24–29 meses" || ageLabel === "30–35 meses") return "infantil";
  const match = /^(\d{1,2})(?: a (\d{1,2}))? anos$/.exec(ageLabel);
  if (!match) return "presencial";
  const min = Number(match[1]);
  const max = Number(match[2] ?? match[1]);
  if (min > max) return "presencial";
  if (min >= 2 && max <= 5) return "infantil";
  if (min >= 6 && max <= 11) return "escolar";
  if (min >= 12 && max <= 19) return "adolescente";
  return "presencial";
}
