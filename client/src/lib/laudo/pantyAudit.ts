/**
 * Núcleo de auditoria PANT v6 / PANTY.
 * Não gera diagnósticos, não presume evolução e não autoriza emissão automática.
 * Dados clínicos devem permanecer nos serviços protegidos do NeuroPed.
 */
export type EstadoDecisao = "R3" | "R2" | "R1" | "R0" | "RX";
export type EstadoHipotese = "firmado" | "investigacao" | "diferencial";
export type FonteClinica = {
  id: string;
  natureza: "familia" | "escola" | "consulta" | "documento" | "outro";
  data: string;
  relato: string;
};
export type DivergenciaClinica = {
  id: string;
  fonteIds: string[];
  descricao: string;
  resolvida: boolean;
  justificativa?: string;
};
export type HipoteseClinica = {
  id: string;
  descricao: string;
  estado: EstadoHipotese;
  cid10?: string;
  cid11?: string;
  aFavor: string[];
  contra: string[];
};
export type MetaTerapeutica = {
  id: string;
  descricao: string;
  prazoSemanas: number;
  criterioObservavel: string;
  decisao?: EstadoDecisao;
};
export type MedicacaoRevisao = {
  principioAtivo: string;
  apresentacao: string;
  concentracao: string;
  dosePorTomada: string;
  frequencia: string;
  verificacaoMedica: boolean;
};
export type DossiePanty = {
  tipo: "PANT" | "PANTY";
  fontes: FonteClinica[];
  divergencias: DivergenciaClinica[];
  hipoteses: HipoteseClinica[];
  metas: MetaTerapeutica[];
  medicamentos: MedicacaoRevisao[];
  cronologiaRevisada: boolean;
  narrativaRevisada: boolean;
  revisaoCidConfirmada: boolean;
  aceiteMedico: { confirmado: boolean; responsavel?: string; data?: string };
};
export type AchadoAuditoria = {
  codigo: string;
  gravidade: "bloqueante" | "pendencia";
  descricao: string;
};
export type ResultadoAuditoria = { apto: boolean; achados: AchadoAuditoria[] };

export function auditarDossie(dossie: DossiePanty): ResultadoAuditoria {
  const achados: AchadoAuditoria[] = [];
  const bloquear = (codigo: string, descricao: string) =>
    achados.push({ codigo, gravidade: "bloqueante", descricao });
  if (!dossie.fontes.length) bloquear("FONTES", "Inventário de fontes não documentado.");
  if (!dossie.cronologiaRevisada) bloquear("CRONOLOGIA", "Cronologia longitudinal sem revisão médica.");
  if (!dossie.narrativaRevisada) bloquear("NARRATIVA", "Redação clínica ainda não revisada.");
  if (!dossie.revisaoCidConfirmada) bloquear("CID", "Conferência CID-10/CID-11 pendente.");
  const fonteIds = new Set(dossie.fontes.map((fonte) => fonte.id));
  for (const divergencia of dossie.divergencias) {
    if (divergencia.fonteIds.length < 2 || divergencia.fonteIds.some((id) => !fonteIds.has(id))) {
      bloquear("DIVERGENCIA_FONTE", "Divergência sem rastreabilidade a pelo menos duas fontes.");
    }
    // Divergência não resolvida permanece registrada; não se força consenso.
  }
  for (const hipotese of dossie.hipoteses) {
    if (hipotese.estado !== "firmado" && (hipotese.cid10 || hipotese.cid11)) {
      bloquear("CID_HIPOTESE", "CID atribuído a hipótese não firmada.");
    }
    if (hipotese.estado === "firmado" && !hipotese.cid10 && !hipotese.cid11) {
      bloquear("CID_FIRMADO", "Diagnóstico firmado sem classificação documentada.");
    }
  }
  for (const meta of dossie.metas) {
    if (!meta.descricao.trim() || !meta.criterioObservavel.trim() || meta.prazoSemanas < 8 || meta.prazoSemanas > 12) {
      bloquear("META", "Meta sem critério observável ou fora da janela de 8–12 semanas.");
    }
    if (dossie.tipo === "PANTY" && !meta.decisao) bloquear("DECISAO", "Meta PANTY sem decisão R3/R2/R1/R0/RX.");
  }
  for (const med of dossie.medicamentos) {
    if (!med.principioAtivo.trim() || !med.apresentacao.trim() || !med.concentracao.trim() ||
        !med.dosePorTomada.trim() || !med.frequencia.trim() || !med.verificacaoMedica) {
      bloquear("MEDICACAO", "Medicação sem revisão integral de apresentação, concentração, dose e frequência.");
    }
  }
  if (!dossie.aceiteMedico.confirmado || !dossie.aceiteMedico.responsavel?.trim() || !dossie.aceiteMedico.data?.trim()) {
    bloquear("ACEITE", "Aceite médico explícito não registrado.");
  }
  return { apto: achados.length === 0, achados };
}
