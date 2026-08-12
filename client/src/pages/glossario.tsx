import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookText, Search } from "lucide-react";

/**
 * Glossário NeuroPed — termos de neuropediatria em linguagem acessível.
 *
 * Conteúdo autoral educacional (não havia HTML de glossário no app legado).
 * Reúne termos já usados nas telas e artigos do app, em definições de
 * conhecimento comum — não é instrumento clínico nem substitui avaliação.
 */

interface Termo {
  termo: string;
  sigla?: string;
  def: string;
  grupo: string;
}

const TERMOS: Termo[] = [
  { termo: "Transtorno do Espectro Autista", sigla: "TEA", grupo: "Condições", def: "Condição do neurodesenvolvimento que afeta comunicação social e padrões de comportamento/interesses, com intensidade variável (espectro). A identificação precoce melhora os resultados das intervenções." },
  { termo: "Transtorno de Déficit de Atenção e Hiperatividade", sigla: "TDAH", grupo: "Condições", def: "Transtorno neurobiológico com base genética caracterizado por desatenção, hiperatividade e/ou impulsividade desproporcionais à idade." },
  { termo: "Hiperfoco", grupo: "Comportamento", def: "Capacidade de concentração intensa em atividades muito estimulantes (ex.: jogos), comum no TDAH — não exclui o diagnóstico, já que a dificuldade aparece em tarefas de baixo estímulo." },
  { termo: "Marcos do desenvolvimento", grupo: "Desenvolvimento", def: "Conquistas esperadas em faixas etárias (motoras, de linguagem, sociais). Servem de referência para identificar precocemente possíveis atrasos." },
  { termo: "Brincadeira simbólica", grupo: "Desenvolvimento", def: "Brincar de faz de conta (ex.: dar comida a um boneco). Marco importante por volta dos 18–24 meses, ligado ao desenvolvimento da linguagem e cognição." },
  { termo: "Regressão do desenvolvimento", grupo: "Desenvolvimento", def: "Perda de habilidades já adquiridas (ex.: falava e parou). Sempre merece avaliação profissional." },
  { termo: "Hipersensibilidade sensorial", grupo: "Sensorial", def: "Perfil em que estímulos comuns (sons, luzes, texturas) causam grande desconforto; a criança tende a evitá-los." },
  { termo: "Hipossensibilidade sensorial", grupo: "Sensorial", def: "Perfil em que a criança busca estímulos intensos (balançar, pressão profunda, tocar tudo) por processar menos a informação sensorial." },
  { termo: "Integração Sensorial", grupo: "Sensorial", def: "Abordagem da Terapia Ocupacional que ajuda a criança a organizar e responder melhor aos estímulos sensoriais do ambiente." },
  { termo: "Córtex pré-frontal", grupo: "Neurociência", def: "Região do cérebro responsável por autocontrole, planejamento e regulação emocional; amadurece lentamente, completando-se por volta dos 25 anos." },
  { termo: "Higiene do sono", grupo: "Sono", def: "Conjunto de hábitos que favorecem um sono saudável: horário fixo, ritual de desaceleração, ambiente escuro e sem telas antes de dormir." },
  { termo: "Melatonina", grupo: "Sono", def: "Hormônio que regula o ciclo do sono. A luz azul das telas reduz sua liberação; a suplementação só deve ser feita com orientação médica." },
  { termo: "Plano Educacional Individualizado", sigla: "PEI", grupo: "Escola", def: "Documento que define metas e adaptações curriculares para um aluno com deficiência ou transtorno do neurodesenvolvimento." },
  { termo: "Atendimento Educacional Especializado", sigla: "AEE", grupo: "Escola", def: "Serviço gratuito, no contraturno e em sala de recursos, que complementa a formação do estudante com deficiência." },
  { termo: "Terapia Cognitivo-Comportamental", sigla: "TCC", grupo: "Tratamentos", def: "Abordagem psicoterapêutica com forte evidência para ansiedade e outros quadros, focada em pensamentos e comportamentos." },
  { termo: "Comunicação Alternativa e Aumentativa", sigla: "CAA", grupo: "Tratamentos", def: "Recursos (figuras, pranchas, voz sintetizada) que apoiam ou substituem a fala em pessoas com dificuldade de comunicação oral." },
  { termo: "Intervenção precoce", grupo: "Tratamentos", def: "Conjunto de estímulos e terapias iniciadas nos primeiros anos de vida; é o maior preditor de evolução positiva em vários quadros, como o TEA." },
  { termo: "Hipotonia", grupo: "Neurologia", def: "Tônus muscular reduzido (“criança mole”). Pode ser sinal de alerta no desenvolvimento motor e merece avaliação." },
  { termo: "Período pós-ictal", grupo: "Neurologia", def: "Fase de recuperação logo após uma crise epiléptica, com sonolência ou confusão temporária." },
  { termo: "Seletividade alimentar", grupo: "Comportamento", def: "Recusa persistente de certos alimentos por textura, cor ou cheiro, comum em crianças com TEA; trabalhada gradualmente com apoio profissional." },
];

const GRUPOS = Array.from(new Set(TERMOS.map((t) => t.grupo)));

export default function GlossarioPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const norm = q
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    if (!norm) return TERMOS;
    return TERMOS.filter((t) =>
      (t.termo + " " + (t.sigla || "") + " " + t.def + " " + t.grupo)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .includes(norm),
    );
  }, [q]);

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookText className="w-6 h-6 text-primary" />
          <Badge variant="secondary">Glossário</Badge>
        </div>
        <h1 className="text-2xl font-bold">Termos de Neuropediatria</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Definições em linguagem acessível dos termos usados no app. Conteúdo educativo —
          não é instrumento clínico nem substitui avaliação profissional.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar termo, sigla ou tema…"
          className="pl-10"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} termo{filtered.length !== 1 ? "s" : ""}
        {!q && <span> · {GRUPOS.length} temas</span>}
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((t) => (
          <Card key={t.termo}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-sm font-bold">{t.termo}</h2>
                {t.sigla && <Badge variant="outline" className="text-[10px]">{t.sigla}</Badge>}
                <Badge variant="secondary" className="text-[10px] ml-auto">{t.grupo}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.def}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3 text-center">
        Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}
