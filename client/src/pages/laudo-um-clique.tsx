import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCopy, FileText, Plus, Printer, ShieldCheck, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/PageHero";
import { escapeHtml } from "@/lib/htmlEscape";
import { issuerCredentials, useIssuer } from "@/lib/issuer";
import { apiRequest } from "@/lib/queryClient";
import { loadAllPatientResults } from "@/lib/patientResultsPagination";
import { readRouteParam } from "@/lib/routeQuery";
import {
  entradaVazia,
  escalasDeResultados,
  gerarLaudoUmClique,
  montarPacoteIA,
  reidentificar,
  type DiagnosticoEntrada,
  type EntradaLaudoUmClique,
  type MapaPseudonimos,
} from "@/lib/laudoUmClique";
import { AVISO_REVISAO_MEDICA } from "@/lib/laudoUmClique/tipos";

/* ────────────────────────────────────────────────────────────
   Laudo em um clique — dossiê de redação clínica (Lei v9.5 + R1–R12)
   · Texto clínico é do médico; o app organiza, confere e declara fontes.
   · Escalas entram pontuadas, só no Anexo técnico, nunca com escore inventado.
   · Nada identificável sai do navegador: o prompt para IA é pseudonimizado.
──────────────────────────────────────────────────────────── */

type CampoTexto =
  | "quemE" | "historia" | "historiaFonte" | "familia" | "escola" | "escolaFonte" | "terapias" | "terapiasFonte"
  | "exames" | "examesFonte" | "exameNeuro" | "leitura" | "conduta" | "escolaOrienta" | "retorno"
  | "motivoResumo" | "decisaoHoje" | "proximosPassos";

const BLOCOS: { key: CampoTexto; label: string; ajuda: string; fonte?: CampoTexto; linhas?: number }[] = [
  { key: "quemE", label: "I. Quem é a criança", ajuda: "A criança antes do problema; ao menos uma força concreta." },
  { key: "historia", label: "II. Como chegou até aqui", ajuda: "Gestação, marcos, tratamentos anteriores, em ordem de tempo.", fonte: "historiaFonte" },
  { key: "familia", label: "III. O que a família contou", ajuda: "Anamnese: o que mãe e pai contaram, negaram e perguntaram.", linhas: 5 },
  { key: "escola", label: "IV. O que a escola descreve", ajuda: "Só o que a escola disse; a fonte é obrigatória.", fonte: "escolaFonte" },
  { key: "terapias", label: "V. O que as terapias registram", ajuda: "Por serviço, com início e carga.", fonte: "terapiasFonte" },
  { key: "exames", label: "VI. Avaliação neuropsicológica e exames", ajuda: "Resultado como consta no documento, sem sigla de escala.", fonte: "examesFonte" },
  { key: "exameNeuro", label: "VII. Exame neurológico e estado mental", ajuda: "O que se viu hoje (a marcha saiu simétrica…)." },
  { key: "leitura", label: "VIII. O que os achados significam juntos", ajuda: "Leitura integrada, escrita por você." },
  { key: "conduta", label: "X. O que fazer a partir de agora", ajuda: "Cada conduta com porquê, responsável, prazo e sinal." },
  { key: "escolaOrienta", label: "XI. O que a escola precisa saber", ajuda: "Medidas práticas." },
  { key: "retorno", label: "XII. Quando nos revemos", ajuda: "Data por extenso ou sinal que antecipa." },
];

function buildPrintHtml(texto: string, cabecalho: string, assinatura: string): string {
  const esc = escapeHtml;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Laudo</title>
<style>@page{size:A4;margin:16mm}body{font-family:Carlito,Arial,sans-serif;font-size:11pt;line-height:1.6;color:#222}
h1{font-size:14pt;margin:0 0 4mm}pre{white-space:pre-wrap;font-family:inherit}.sig{margin-top:14mm;border-top:1px solid #333;padding-top:3mm;font-size:10pt}</style></head>
<body><h1>${esc(cabecalho)}</h1><pre>${esc(texto)}</pre><div class="sig">${esc(assinatura)}</div></body></html>`;
}

export default function LaudoUmCliquePage() {
  const { issuer } = useIssuer();
  const patientId = readRouteParam("patientId") || null;
  const [e, setE] = useState<EntradaLaudoUmClique>(() => ({ ...entradaVazia(), dataConsulta: new Date().toISOString().slice(0, 10) }));
  const [gerado, setGerado] = useState<ReturnType<typeof gerarLaudoUmClique> | null>(null);
  const [revisado, setRevisado] = useState(false);
  const [pacote, setPacote] = useState<{ prompt: string; mapa: MapaPseudonimos; contagem: Record<string, number> } | null>(null);
  const [erroIA, setErroIA] = useState("");
  const [devolvido, setDevolvido] = useState("");
  const [reid, setReid] = useState("");
  const [carga, setCarga] = useState("");
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    if (!patientId) return;
    let cancelado = false;
    setCarga("Carregando paciente e escalas…");
    (async () => {
      try {
        const resp = await apiRequest("GET", `/api/patients/${encodeURIComponent(patientId)}`);
        const payload = await resp.json();
        const p = payload?.patient ?? payload?.data ?? payload;
        let resultados: unknown[] = [];
        try { resultados = await loadAllPatientResults(patientId); } catch { /* sem escalas: segue manual */ }
        if (cancelado) return;
        setE((cur) => ({
          ...cur,
          paciente: cur.paciente || p?.name || "",
          dataNascimento: cur.dataNascimento || p?.birthDate || "",
          responsaveis: cur.responsaveis.length ? cur.responsaveis : [p?.guardianName].filter(Boolean),
          escalas: cur.escalas.length ? cur.escalas : escalasDeResultados(resultados),
        }));
        setCarga("");
      } catch {
        if (!cancelado) setCarga("Paciente não carregado; preencha à mão.");
      }
    })();
    return () => { cancelado = true; };
  }, [patientId]);

  const set = <K extends keyof EntradaLaudoUmClique>(k: K, v: EntradaLaudoUmClique[K]) => {
    setE((c) => ({ ...c, [k]: v }));
    setGerado(null);
    setRevisado(false);
    setPacote(null);
  };

  const pronto = e.paciente.trim().length > 1;
  const bloqueado = gerado ? !gerado.controle.estilo.aprovado : true;
  const podeEmitir = Boolean(gerado) && !bloqueado && revisado;

  const gerar = () => { setGerado(gerarLaudoUmClique(e)); setRevisado(false); setPacote(null); };

  const copiar = async (rotulo: string, texto: string) => {
    try { await navigator.clipboard.writeText(texto); setCopiado(rotulo); setTimeout(() => setCopiado(""), 2000); } catch { /* clipboard indisponível */ }
  };

  const gerarPrompt = () => {
    setErroIA("");
    try { setPacote(montarPacoteIA(e)); } catch (err) { setPacote(null); setErroIA(err instanceof Error ? err.message : "Falha na pseudonimização."); }
  };

  const imprimir = () => {
    if (!gerado || !podeEmitir) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.opener = null;
    win.document.write(buildPrintHtml(gerado.laudo.texto, "Laudo Médico Neuropediátrico", [issuer.doctorName, issuerCredentials(issuer)].filter(Boolean).join(" · ")));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const dxSet = (i: number, patch: Partial<DiagnosticoEntrada>) =>
    set("diagnosticos", e.diagnosticos.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  const textoReid = useMemo(() => (pacote && devolvido ? reidentificar(devolvido, pacote.mapa) : ""), [pacote, devolvido]);
  useEffect(() => { setReid(textoReid); }, [textoReid]);

  return (
    <div className="space-y-5 pb-8" data-testid="page-laudo-um-clique">
      <PageHero
        icon={Wand2}
        eyebrow="documento clínico"
        title="Laudo em um clique"
        subtitle="Organiza o que você escreveu no padrão do dossiê de redação clínica, declara as fontes, confere a prosa e anexa as escalas já pontuadas."
        gradient="from-primary to-chart-2"
      />

      <div role="note" data-testid="aviso-revisao" className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{AVISO_REVISAO_MEDICA} Nenhum dado identificável é enviado a IA externa: o prompt opcional usa apenas marcadores.</p>
      </div>
      {carga && <p className="text-xs text-muted-foreground" data-testid="carga-paciente">{carga}</p>}

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6">
        <h2 className="text-sm font-bold">1 · Identificação</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["paciente", "Nome do paciente", "text"], ["dataNascimento", "Nascimento", "date"], ["dataConsulta", "Data da consulta", "date"],
            ["serie", "Série escolar", "text"], ["moraCom", "Mora com", "text"], ["cidade", "Cidade/UF", "text"],
          ] as const).map(([k, label, type]) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`luc-${k}`} className="text-xs">{label}</Label>
              <Input id={`luc-${k}`} type={type} value={e[k] as string} onChange={(ev) => set(k, ev.target.value)} data-testid={`luc-${k}`} />
            </div>
          ))}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="luc-responsaveis" className="text-xs">Nomes de responsáveis, escola e serviços (um por linha; só para pseudonimizar)</Label>
            <Textarea id="luc-responsaveis" rows={2} value={e.responsaveis.join("\n")} onChange={(ev) => set("responsaveis", ev.target.value.split("\n"))} data-testid="luc-responsaveis" />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6">
        <h2 className="text-sm font-bold">2 · Conteúdo clínico (suas palavras)</h2>
        {BLOCOS.map((b) => (
          <div key={b.key} className="space-y-1">
            <Label htmlFor={`luc-${b.key}`} className="text-xs">{b.label}<span className="ml-2 font-normal text-muted-foreground">{b.ajuda}</span></Label>
            <Textarea id={`luc-${b.key}`} rows={b.linhas ?? 3} value={e[b.key]} onChange={(ev) => set(b.key, ev.target.value)} data-testid={`luc-${b.key}`} />
            {b.fonte && (
              <Input aria-label={`Fonte: ${b.label}`} placeholder="Fonte e data (ex.: relatório da escola, de setembro de 2026)" value={e[b.fonte]} onChange={(ev) => set(b.fonte!, ev.target.value)} data-testid={`luc-${b.fonte}`} />
            )}
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">3 · Diagnósticos (CID-10 e CID-11 em paralelo)</h2>
          <Button size="sm" variant="outline" className="gap-1" data-testid="luc-add-dx" onClick={() => set("diagnosticos", [...e.diagnosticos, { nome: "", camada: "firmado", cid10: "", cid11: "" }])}>
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>
        {e.diagnosticos.map((d, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]" data-testid={`luc-dx-${i}`}>
            <Input aria-label="Diagnóstico" placeholder="Diagnóstico" value={d.nome} onChange={(ev) => dxSet(i, { nome: ev.target.value })} data-testid={`luc-dx-nome-${i}`} />
            <select aria-label="Camada" className="rounded-md border bg-background px-2 text-sm" value={d.camada} onChange={(ev) => dxSet(i, { camada: ev.target.value as DiagnosticoEntrada["camada"] })} data-testid={`luc-dx-camada-${i}`}>
              <option value="firmado">Firmado</option><option value="investigacao">Em investigação</option><option value="suspeita">Suspeita</option>
            </select>
            <Input aria-label="CID-10" placeholder="CID-10" value={d.cid10 ?? ""} onChange={(ev) => dxSet(i, { cid10: ev.target.value })} data-testid={`luc-dx-cid10-${i}`} />
            <Input aria-label="CID-11" placeholder="CID-11" value={d.cid11 ?? ""} onChange={(ev) => dxSet(i, { cid11: ev.target.value })} data-testid={`luc-dx-cid11-${i}`} />
            <Button size="icon" variant="ghost" aria-label="Remover diagnóstico" onClick={() => set("diagnosticos", e.diagnosticos.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6" data-testid="luc-escalas">
        <h2 className="text-sm font-bold">4 · Escalas pontuadas (Anexo técnico)</h2>
        <p className="text-xs text-muted-foreground">Os escores vêm dos resultados salvos do paciente. O corpo do laudo nunca cita escala; o anexo só sai se você marcar abaixo. Sem escore salvo, nenhum número é inventado.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.incluirAnexoTecnico} onChange={(ev) => set("incluirAnexoTecnico", ev.target.checked)} data-testid="luc-anexo" /> Incluir Anexo técnico</label>
        {e.escalas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma escala encontrada para este paciente.</p>}
        {e.escalas.map((s, i) => (
          <div key={s.id} className="grid gap-2 rounded-lg border p-2 sm:grid-cols-[auto_2fr_1fr_2fr]" data-testid={`luc-escala-${i}`}>
            <input type="checkbox" aria-label={`Incluir ${s.nome}`} checked={s.incluir} onChange={(ev) => set("escalas", e.escalas.map((x, idx) => (idx === i ? { ...x, incluir: ev.target.checked } : x)))} />
            <span className="text-sm">{s.nome}<span className="block text-xs text-muted-foreground">{s.escore !== null ? `escore ${s.escore}` : "sem escore salvo"}{s.classificacao ? ` · ${s.classificacao}` : ""}{s.origem === "derivado" ? " (classificação derivada do corte oficial)" : ""}</span></span>
            <Input aria-label={`Respondente de ${s.nome}`} placeholder="Respondente" value={s.respondente} onChange={(ev) => set("escalas", e.escalas.map((x, idx) => (idx === i ? { ...x, respondente: ev.target.value } : x)))} />
            <Input aria-label={`Leitura de ${s.nome}`} placeholder="Leitura em uma linha" value={s.leitura} onChange={(ev) => set("escalas", e.escalas.map((x, idx) => (idx === i ? { ...x, leitura: ev.target.value } : x)))} />
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6">
        <h2 className="text-sm font-bold">5 · Quadro “Em uma página” (opcional) e risco</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["motivoResumo", "decisaoHoje", "proximosPassos"] as const).map((k) => (
            <div key={k} className="space-y-1"><Label className="text-xs" htmlFor={`luc-${k}`}>{k === "motivoResumo" ? "Motivo" : k === "decisaoHoje" ? "Decisão de hoje" : "Próximos passos"}</Label>
              <Textarea id={`luc-${k}`} rows={2} value={e[k]} onChange={(ev) => set(k, ev.target.value)} data-testid={`luc-${k}`} /></div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.altoRisco} onChange={(ev) => set("altoRisco", ev.target.checked)} data-testid="luc-alto-risco" /> Caso de alto risco (epilepsia, fármaco controlado, uso pericial): pedir segunda leitura</label>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button onClick={gerar} disabled={!pronto} className="gap-2" data-testid="luc-gerar"><Wand2 className="h-4 w-4" /> Gerar laudo</Button>
      </div>

      {gerado && (
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6" data-testid="luc-resultado">
          <div className="flex items-center gap-2 text-sm font-bold"><FileText className="h-4 w-4" /> Laudo gerado</div>
          <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm leading-relaxed" data-testid="luc-laudo-texto">{gerado.laudo.texto}</pre>

          <div data-testid="luc-controle" className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4" /> Controle (fora do laudo)</h3>
            <p className="text-xs" data-testid="luc-estilo-status">
              {gerado.controle.estilo.aprovado ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Prosa aprovada nas regras de bloqueio.</span> : <span className="text-red-700">Há bloqueios de estilo: corrija antes de emitir.</span>}
              {" "}{gerado.controle.estilo.metricas.palavras} palavras · {gerado.controle.estilo.metricas.frases} frases · média {gerado.controle.estilo.metricas.mediaPalavrasFrase} · {gerado.controle.estilo.metricas.pctAbaixo30}% abaixo de 30 · {gerado.controle.estilo.metricas.declaracoesFonte} declaração(ões) de fonte
            </p>
            <ul className="space-y-1 text-xs" data-testid="luc-checklist">
              {gerado.controle.estilo.itens.filter((i) => !i.ok).map((i) => (
                <li key={i.id} className={i.nivel === "bloqueio" ? "text-red-700" : "text-amber-700"}>{i.nivel === "bloqueio" ? "Bloqueio" : "Alerta"}: {i.mensagem}</li>
              ))}
            </ul>
            {gerado.controle.lacunas.length > 0 && (
              <div data-testid="luc-lacunas"><p className="text-xs font-semibold">Lacunas e perguntas ao médico</p>
                <ul className="list-disc pl-5 text-xs">{gerado.controle.lacunas.map((l, i) => <li key={i}>{l}</li>)}</ul></div>
            )}
            {gerado.controle.segundaLeitura.length > 0 && (
              <div data-testid="luc-segunda-leitura"><p className="text-xs font-semibold">Segunda leitura (alto risco)</p>
                <ol className="list-decimal pl-5 text-xs">{gerado.controle.segundaLeitura.map((l, i) => <li key={i}>{l}</li>)}</ol></div>
            )}
            <p className="text-xs"><span className="font-semibold">Linha sugerida para o prontuário:</span> {gerado.controle.linhaProntuarioIA}</p>
          </div>

          <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={revisado} onChange={(ev) => setRevisado(ev.target.checked)} data-testid="luc-revisado" />
            <span>Li, editei e assumo este texto como médico responsável.</span></label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" disabled={!podeEmitir} onClick={() => copiar("laudo", gerado.laudo.texto)} data-testid="luc-copiar"><ClipboardCopy className="h-4 w-4" /> {copiado === "laudo" ? "Copiado" : "Copiar laudo"}</Button>
            <Button className="gap-2" disabled={!podeEmitir} onClick={imprimir} data-testid="luc-imprimir"><Printer className="h-4 w-4" /> Imprimir / PDF</Button>
            <Button variant="secondary" className="gap-2" onClick={gerarPrompt} data-testid="luc-prompt-ia"><ShieldCheck className="h-4 w-4" /> Prompt pseudonimizado para IA</Button>
          </div>

          {erroIA && <p role="alert" className="text-xs text-red-700" data-testid="luc-erro-ia">{erroIA}</p>}
          {pacote && (
            <div className="space-y-2" data-testid="luc-pacote-ia">
              <p className="text-xs text-muted-foreground">Identificadores trocados por marcadores: {Object.entries(pacote.contagem).map(([k, v]) => `${k} ${v}`).join(" · ") || "nenhum"}. O mapa fica só nesta tela.</p>
              <Textarea readOnly rows={8} value={pacote.prompt} data-testid="luc-prompt-texto" aria-label="Prompt pseudonimizado" />
              <Button size="sm" variant="outline" onClick={() => copiar("prompt", pacote.prompt)} data-testid="luc-copiar-prompt">{copiado === "prompt" ? "Copiado" : "Copiar prompt"}</Button>
              <Label className="text-xs" htmlFor="luc-devolvido">Cole aqui o texto devolvido pela IA para reidentificar localmente</Label>
              <Textarea id="luc-devolvido" rows={4} value={devolvido} onChange={(ev) => setDevolvido(ev.target.value)} data-testid="luc-devolvido" />
              {reid && <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-sm" data-testid="luc-reidentificado">{reid}</pre>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
