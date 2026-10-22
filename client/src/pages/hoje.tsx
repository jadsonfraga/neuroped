import { useEffect, useMemo, useState } from "react";
import { Sun, ShieldAlert } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { localIsoDate } from "@/lib/clinicalDate";
import { secureClear, secureGet, secureSet } from "@/lib/secureStorage";
import {
  HOJE_HUMOR,
  HOJE_JANELA_DIAS,
  HOJE_MAX_OCORRENCIA,
  HOJE_MEDICACAO,
  HOJE_SONO,
  alternarOpcao,
  chaveDoDia,
  datasDaJanela,
  datasParaLimpar,
  sanitizeCheckin,
  ultimosDias,
  type CheckinHoje,
  type HojeHumor,
  type HojeMedicacao,
  type HojeSono,
} from "@/lib/hojeCheckin";

function OpcoesGrupo<T extends string>({
  legenda,
  opcoes,
  valor,
  onChange,
  testId,
}: {
  legenda: string;
  opcoes: readonly T[];
  valor: T | undefined;
  onChange: (next: T | undefined) => void;
  testId: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => (
          <Button
            key={opcao}
            type="button"
            size="sm"
            variant={valor === opcao ? "default" : "outline"}
            aria-pressed={valor === opcao}
            data-testid={`${testId}-${opcao.replace(/\s+/g, "-")}`}
            onClick={() => onChange(alternarOpcao(valor, opcao))}
          >
            {opcao}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

/** Lê só os dias da janela. Falha de leitura de um dia não afeta os demais. */
async function lerJanela(hojeIso: string): Promise<CheckinHoje[]> {
  const lidos = await Promise.all(
    datasDaJanela(hojeIso).map(async (data) => {
      try {
        return sanitizeCheckin(await secureGet<unknown>(chaveDoDia(data)));
      } catch {
        return null;
      }
    }),
  );
  return lidos.filter((registro): registro is CheckinHoje => registro !== null);
}

/** Devolve true só se todas as chaves forem apagadas. */
async function apagarDatas(datas: string[]): Promise<boolean> {
  const resultados = await Promise.all(
    datas.map((data) => secureClear(chaveDoDia(data)).then(() => true, () => false)),
  );
  return resultados.every(Boolean);
}

export default function HojePage() {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  // Mesma política do diário: em sessão clínica remota autenticada, nada é lido nem gravado aqui.
  const persistenciaLocal = !(accessMode === "remote" && isAuthenticated);

  const hojeIso = localIsoDate();
  const [entries, setEntries] = useState<CheckinHoje[]>([]);
  const [pronto, setPronto] = useState(false);
  const [erroAoSalvar, setErroAoSalvar] = useState(false);
  const [confirmandoApagar, setConfirmandoApagar] = useState(false);
  const [sono, setSono] = useState<HojeSono | undefined>();
  const [humor, setHumor] = useState<HojeHumor | undefined>();
  const [medicacao, setMedicacao] = useState<HojeMedicacao | undefined>();
  const [ocorrencia, setOcorrencia] = useState("");

  useEffect(() => {
    if (!persistenciaLocal) {
      setPronto(true);
      return;
    }
    let ativo = true;
    void (async () => {
      const janela = await lerJanela(hojeIso);
      // Dias fora da janela saem do aparelho ao abrir a tela.
      void apagarDatas(datasParaLimpar(hojeIso).slice(HOJE_JANELA_DIAS));
      if (!ativo) return;
      setEntries(janela);
      // Sempre recarrega o formulário, inclusive quando o dia virou e não há registro.
      const deHoje = janela.find((entry) => entry.data === hojeIso);
      setSono(deHoje?.sono);
      setHumor(deHoje?.humor);
      setMedicacao(deHoje?.medicacao);
      setOcorrencia(deHoje?.ocorrencia ?? "");
      setPronto(true);
    })();
    return () => {
      ativo = false;
    };
  }, [persistenciaLocal, hojeIso]);

  const janela = useMemo(() => ultimosDias(entries, hojeIso), [entries, hojeIso]);
  const registradosNaJanela = janela.filter((dia) => dia.registro).length;
  const temAlgoParaSalvar = Boolean(sono || humor || medicacao || ocorrencia.trim());

  async function salvar() {
    const registro: CheckinHoje = { data: hojeIso, ocorrencia: ocorrencia.trim() };
    if (sono) registro.sono = sono;
    if (humor) registro.humor = humor;
    if (medicacao) registro.medicacao = medicacao;
    // Grava só a chave deste dia: os demais dias não são reescritos.
    const gravado = await secureSet(chaveDoDia(hojeIso), registro);
    setErroAoSalvar(!gravado);
    if (!gravado) {
      toast({
        title: "Não foi possível salvar neste aparelho",
        description: "Tente de novo. Se persistir, o navegador pode estar sem espaço ou bloqueado.",
        variant: "destructive",
      });
      return;
    }
    setEntries((atuais) => [...atuais.filter((entry) => entry.data !== hojeIso), registro]);
    toast({ title: "Registro de hoje salvo", description: "Ele fica neste aparelho." });
  }

  async function apagarTudo() {
    const apagou = await apagarDatas(datasParaLimpar(hojeIso));
    if (!apagou) {
      toast({
        title: "Não foi possível apagar tudo",
        description: "Tente de novo. Nada foi apagado parcialmente sem aviso.",
        variant: "destructive",
      });
      return;
    }
    setEntries([]);
    setSono(undefined);
    setHumor(undefined);
    setMedicacao(undefined);
    setOcorrencia("");
    setErroAoSalvar(false);
    setConfirmandoApagar(false);
    toast({ title: "Registros apagados deste aparelho" });
  }

  if (!persistenciaLocal) {
    return (
      <Card
        className="border-amber-300 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20"
        data-testid="hoje-persistencia-bloqueada"
      >
        <CardContent className="flex items-start gap-3 p-5 text-sm leading-6 text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Check-in local indisponível no modo clínico LIVE.</p>
            <p className="mt-1">
              Durante uma sessão remota autenticada, este registro não é lido nem gravado no dispositivo. Dados locais anteriores não foram apagados.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHero
        icon={Sun}
        eyebrow="acompanhamento diário"
        title="Como foi hoje?"
        subtitle="Três perguntas por dia. Leva menos de um minuto."
        gradient="from-sky-500 to-blue-600"
      />

      <p className="text-xs leading-5 text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        Este registro fica <strong>neste aparelho</strong>, cifrado, e a tela guarda só os últimos 7 dias. Ainda não é enviado à clínica. Se trocar de aparelho ou limpar os dados do navegador, ele se perde.
      </p>

      {erroAoSalvar && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive" role="alert">
          O registro não pôde ser salvo neste aparelho.
        </div>
      )}

      <Card>
        <CardContent className="space-y-5 p-5">
          <p className="text-xs text-muted-foreground">
            Hoje, {new Date(`${hojeIso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>

          <OpcoesGrupo legenda="Como dormiu?" opcoes={HOJE_SONO} valor={sono} onChange={setSono} testId="hoje-sono" />
          <OpcoesGrupo legenda="Humor predominante" opcoes={HOJE_HUMOR} valor={humor} onChange={setHumor} testId="hoje-humor" />
          <OpcoesGrupo legenda="Medicação" opcoes={HOJE_MEDICACAO} valor={medicacao} onChange={setMedicacao} testId="hoje-medicacao" />

          <div className="space-y-2">
            <label htmlFor="hoje-ocorrencia" className="text-sm font-semibold text-foreground">
              Algo que você quer contar? <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="hoje-ocorrencia"
              value={ocorrencia}
              maxLength={HOJE_MAX_OCORRENCIA}
              onChange={(event) => setOcorrencia(event.target.value)}
              rows={3}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {ocorrencia.length}/{HOJE_MAX_OCORRENCIA}
            </p>
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!pronto || !temAlgoParaSalvar}
            onClick={() => void salvar()}
            data-testid="hoje-salvar"
          >
            Salvar o registro de hoje
          </Button>
        </CardContent>
      </Card>

      <section aria-labelledby="hoje-janela" className="space-y-3">
        <h2 id="hoje-janela" className="text-sm font-semibold text-foreground">
          Últimos 7 dias
        </h2>
        <p className="text-xs text-muted-foreground" data-testid="hoje-resumo">
          Você registrou {registradosNaJanela} de 7 dias. Isto mostra só se houve registro, não uma avaliação.
        </p>
        <ol className="grid grid-cols-7 gap-1.5">
          {janela.map((dia) => {
            const rotulo = new Date(`${dia.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
            return (
              <li
                key={dia.data}
                aria-label={`${rotulo}: ${dia.registro ? "registrado" : "sem registro"}`}
                className={`rounded-lg border px-1 py-2 text-center text-[11px] ${
                  dia.registro
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {rotulo}
                <span className="block text-[10px]">{dia.registro ? "✓" : "—"}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="hoje-apagar-titulo" className="space-y-2 border-t pt-4">
        <h2 id="hoje-apagar-titulo" className="text-sm font-semibold text-foreground">
          Apagar do aparelho
        </h2>
        {!confirmandoApagar ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmandoApagar(true)}
            data-testid="hoje-apagar"
          >
            Apagar registros deste aparelho
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Isto apaga os registros de hoje e dos últimos 30 dias, neste aparelho.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void apagarTudo()}
              data-testid="hoje-apagar-confirmar"
            >
              Confirmar exclusão
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmandoApagar(false)}>
              Cancelar
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
