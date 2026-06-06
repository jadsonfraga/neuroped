import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CheckCircle2, XCircle, BookMarked, ShieldCheck } from "lucide-react";

/**
 * Natureza da ferramenta — portado de sobre-natureza.html (app legado).
 * O que o NeuroPed é, e o que não é. Linguagem clara para profissionais e famílias.
 */

export default function SobreNeuropedPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sobre o NeuroPed
          </span>
        </div>
        <h1 className="text-2xl font-black">Natureza da ferramenta</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          O que o NeuroPed é — e o que ele <strong>não</strong> é. Em linguagem clara,
          para profissionais e famílias.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> O que é
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            O NeuroPed é uma <strong>ferramenta educacional de apoio</strong> à observação do
            desenvolvimento infantil: organiza queixas, sugere quais instrumentos observar por
            idade e contexto, reúne perguntas-guia em linguagem de pais e ajuda a registrar a
            evolução.
          </p>
          <p className="text-sm text-muted-foreground">
            É <strong>apoio à decisão e à observação</strong> — pensado para complementar, e
            nunca substituir, o raciocínio do profissional.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
            <XCircle className="w-4 h-4" /> O que não é
          </h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• <strong>Não é diagnóstico.</strong> Nenhuma tela do app estabelece diagnóstico.</li>
            <li>• <strong>Não substitui</strong> a avaliação de um profissional de saúde.</li>
            <li>• <strong>Não é um dispositivo médico</strong> de uso clínico para decisão sobre pacientes.</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
            <BookMarked className="w-4 h-4 text-primary" /> Sobre os instrumentos
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            Boa parte das triagens e inventários são <strong>autorais e não normatizados</strong> —
            prompts genéricos de observação do desenvolvimento (conhecimento comum), úteis para
            conversar com a família e organizar o olhar.
          </p>
          <p className="text-sm text-muted-foreground">
            Instrumentos de terceiros aparecem apenas como <strong>referência à fonte oficial</strong>:
            o app <strong>não reproduz itens protegidos</strong> e remete à pontuação formal na fonte
            original.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-primary" /> Privacidade dos dados
          </h2>
          <p className="text-sm text-muted-foreground">
            Os dados que você registra ficam <strong>apenas neste aparelho</strong> (armazenamento
            local do navegador). Nada é enviado a servidores e não há rastreamento. Você pode
            exportar um backup ou apagar tudo quando quiser.
          </p>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3 text-center">
        Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756 · Petrolina/PE
      </p>
    </div>
  );
}
