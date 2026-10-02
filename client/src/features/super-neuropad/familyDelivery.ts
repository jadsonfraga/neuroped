/**
 * Encaminhamento automático do resultado à família — Super NeuroPad Game (OBS-10,
 * Sonda 10, Reconhecimento Visual, Avaliação Cognitiva Infantil).
 *
 * Na 1ª página do teste a aplicadora cadastra (opcional) e-mail e/ou WhatsApp
 * da família. Ao encerrar a partida, o mecanismo dispara automaticamente:
 *
 *  - PDF em linguagem acessível, gerado pelo construtor clínico compartilhado
 *    (`buildDocumentPdf`), com carimbo de hora e aviso LGPD;
 *  - WhatsApp com resumo em texto (o PDF fica disponível no botão de baixar);
 *  - rascunho de e-mail com o mesmo resumo e o PDF já baixado para anexar.
 *
 * Nenhum dado sai do dispositivo sem o gesto de envio do cliente (wa.me /
 * mailto / anexo local): o app não tem endpoint de envio e o cadastro fica
 * somente em memória. Sem norma, percentil ou diagnóstico — a leitura é do
 * médico, e o texto da família diz exatamente isso.
 */
import type { DocLine, DocSpec } from "@/lib/documentPdf";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import {
  STATUS_LABELS,
  SUPER_NEUROPAD_NATURE,
  SUPER_NEUROPAD_TITLE,
  SUPER_NEUROPAD_VERSION,
  formatDuration,
  interpret,
  phaseStatusText,
  sessionWallSeconds,
  summarize,
  type GameSession,
  type Level,
} from "./model";
import type { IssuerLines } from "./pdf";

const LGPD_NOTICE =
  "Este relatório contém dados de saúde da criança (LGPD, lei 13.709/2018). " +
  "Envie apenas para o e-mail/WhatsApp da família responsável e não o publique em redes sociais.";

const FAMILY_DISCLAIMER =
  "O Super NeuroPad Game é uma triagem lúdica de pré-consulta. Ele NÃO dá diagnóstico, " +
  "não compara com percentis e não substitui avaliação profissional. O resultado completo, " +
  "com cada resposta registrada, fica com a equipe; a conclusão é do médico(a) na consulta.";

const LEVEL_FOR_FAMILY: Record<Level, string> = {
  esperado: "desempenho dentro do esperado para a idade no jogo",
  observar: "alguns pontos para observar com atenção na consulta",
  alerta: "pontos que merecem prioridade na conversa com o médico(a)",
};

/** E-mail simples e validado no cliente; nada é enviado a servidor algum. */
export function isValidFamilyEmail(value: string): boolean {
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  return /^[^\s@,;:<>()[\]"]+@[^\s@,;:<>()[\]"]+\.[A-Za-z]{2,}$/.test(email);
}

export type FamilyContact = {
  email: string;
  phone: string;
};

export function parseFamilyContact(raw: string | null | undefined): FamilyContact | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FamilyContact>;
    const email = String(parsed.email ?? "").trim();
    const phone = String(parsed.phone ?? "").trim();
    if (!email && !phone) return null;
    return { email, phone };
  } catch {
    return null;
  }
}

export function serializeFamilyContact(contact: FamilyContact): string {
  return JSON.stringify({ email: contact.email.trim(), phone: contact.phone.trim() });
}

/**
 * Resumo em texto para WhatsApp/e-mail: sistemático (mesma ordem sempre) e
 * recorrente (mesmo formato em toda partida), sem jargão clínico.
 */
export function buildFamilySummary(session: GameSession, contact: FamilyContact, date = new Date()): string {
  const summary = summarize(session);
  const when = formatClinicalDateTime(date);
  const greeting = contact.email && contact.phone
    ? "Este resumo foi preparado para enviar por e-mail e WhatsApp."
    : contact.email ? "Este resumo foi preparado para enviar por e-mail." : "Este resumo foi preparado para enviar por WhatsApp.";
  const lines: Array<string | null> = [
    `${SUPER_NEUROPAD_TITLE} — resumo da aventura da criança`,
    when,
    greeting,
    "",
    `Idade: ${session.ageYears} anos · Herói escolhido: ${summary.character.name}`,
    summary.complete
      ? `Aventura completa: ${summary.hits} de ${summary.total} desafios certos.`
      : `Aventura encerrada antes do fim: ${session.answers.length} de ${summary.total} desafios registrados. Sem classificação geral neste caso.`,
    summary.level !== null ? `Leitura do jogo: ${LEVEL_FOR_FAMILY[summary.level]}.` : null,
    "",
    "Desempenho por mundo (acertos / desafios):",
    ...summary.phases.map((phase) => `• ${phase.phase.name}: ${phaseStatusText(phase, summary.complete)}`),
    "",
    FAMILY_DISCLAIMER,
    "",
    `Se a família tiver dúvidas sobre algum mundo, a aba "${SUPER_NEUROPAD_TITLE}" mostra o que foi testado. Proveniência: ${SUPER_NEUROPAD_NATURE}`,
    `Versão do jogo: ${SUPER_NEUROPAD_VERSION}`,
  ];
  return lines.filter((line): line is string => line !== null).join("\n");
}

/**
 * PDF para a família: mesmos dados objetivos da versão clínica, em linguagem
 * acessível, com rodapé LGPD e carimbo de hora do encaminhamento.
 */
export function buildFamilyDocSpec(
  session: GameSession,
  issuer: IssuerLines,
  appliedAt: string,
  deliveryAt = new Date(),
): DocSpec {
  const summary = summarize(session);
  const reading = interpret(session);
  const wall = sessionWallSeconds(session);
  const skipped = summary.phases.filter((phase) => phase.skipReason);
  const worldsRich: DocLine[] = summary.phases.flatMap((phase) => {
    const lines: DocLine[] = [
      { text: `${phase.phase.name}: ${phaseStatusText(phase, summary.complete)}`, bold: true },
      { text: `   O que este mundo testa: ${phase.phase.domain}` },
    ];
    if (phase.level !== null) {
      lines.push({ text: `   Leitura: ${LEVEL_FOR_FAMILY[phase.level]}` });
    }
    if (phase.skipReason) lines.push({ text: `   Motivo de não ter sido aplicado: ${phase.skipReason}`, tone: "neutral" });
    return lines;
  });
  const missed = reading ? reading.missed : [];
  const sections: DocSpec["sections"] = [
    {
      heading: "Como ler este relatório",
      body: `${FAMILY_DISCLAIMER} Os "mundos" são as partes do jogo; cada um exercita uma habilidade diferente. "Acertos" são os desafios cumpridos com o critério da tela.`,
    },
    {
      heading: "Como foi a aventura",
      body: [
        `Data e hora da aplicação: ${appliedAt}`,
        `Duração: ${wall !== null ? formatDuration(wall) : "não disponível"} (tempo somado nas tarefas: ${formatDuration(summary.durationSeconds)})`,
        `Idade: ${session.ageYears} anos · Herói: ${summary.character.name}`,
        summary.complete
          ? `Aventura completa: ${summary.hits} de ${summary.total} desafios certos. Leitura do jogo: ${summary.level !== null ? LEVEL_FOR_FAMILY[summary.level] : "sem classificação"}.`
          : `Aventura encerrada antes do fim: ${session.answers.length} de ${summary.total} desafios registrados. Neste caso o jogo não dá classificação geral.`,
        skipped.length > 0
          ? `Mundos não aplicados: ${skipped.map((phase) => `${phase.phase.name} (${phase.skipReason})`).join("; ")}.`
          : "Mundos não aplicados: nenhum.",
        `Pausas: ${session.pauseCount ?? 0} (${formatDuration(session.pausedSeconds ?? 0)} em pausa).`,
      ].join("\n"),
    },
    { heading: "Desempenho por mundo", body: worldsRich.map((line) => line.text).join("\n"), rich: worldsRich },
  ];
  if (missed.length > 0) {
    const missedRich: DocLine[] = missed.map((answer) => ({
      text: `• ${answer.prompt}: ${STATUS_LABELS[answer.status].toLowerCase()} — pode ser retreinado em casa com brincadeiras, se o médico(a) indicar.`,
    }));
    sections.push({
      heading: "Desafios para praticar em casa (se o médico indicar)",
      body: missedRich.map((line) => line.text).join("\n"),
      rich: missedRich,
    });
  }
  sections.push({
    heading: "Próximos passos",
    body: "Leve este relatório na próxima consulta. Ele é um retrato lúdico do dia da aplicação: cansaço, timidez ou desatenção do momento podem mudar o resultado. Qualquer dúvida, fale com a equipe.",
  });
  return {
    title: `${SUPER_NEUROPAD_TITLE} — Relatório para a família`,
    subtitle: `Encaminhado automaticamente ao fim da partida · ${formatClinicalDateTime(deliveryAt)}`,
    credentials: [
      issuer.doctorName,
      issuer.specialty,
      issuer.credentials,
      issuer.clinicName,
    ].filter(Boolean),
    sections,
    footer: LGPD_NOTICE,
  };
}
