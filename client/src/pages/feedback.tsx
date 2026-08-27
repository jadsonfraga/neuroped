import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageSquareText, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SurveyState {
  available: boolean;
  status?: string;
  surveyType?: string;
  clinicName?: string;
  expiresAt?: string;
}

function queryToken(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const token = useMemo(queryToken, []);
  const [survey, setSurvey] = useState<SurveyState | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiRequest("GET", `/api/feedback?token=${encodeURIComponent(token)}`);
        const data = await response.json() as SurveyState;
        if (active) setSurvey(data);
      } catch {
        if (active) setSurvey({ available: false, status: "not_found" });
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [token]);

  async function submit() {
    if (!token || score === null) return;
    setBusy(true);
    try {
      await apiRequest("POST", "/api/feedback", { token, score, comment: comment.trim() || undefined });
      setSubmitted(true);
      toast({ title: "Obrigado pela sua resposta.", description: "Sua opinião ajuda a melhorar o cuidado." });
    } catch (error) {
      toast({ title: "Não foi possível enviar a resposta.", description: error instanceof Error ? error.message : "O link pode ter expirado.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">Carregando pesquisa…</main>;
  if (!token || !survey?.available) {
    return <main className="mx-auto max-w-2xl px-4 py-10"><Card><CardContent className="space-y-3 p-8 text-center"><MessageSquareText className="mx-auto h-9 w-9 text-primary" /><h1 className="text-2xl font-semibold">Pesquisa indisponível</h1><p className="text-sm text-muted-foreground">Este link não existe, já foi respondido ou expirou. Solicite um novo convite à clínica se necessário.</p></CardContent></Card></main>;
  }
  if (submitted) {
    return <main className="mx-auto max-w-2xl px-4 py-10"><Card className="border-emerald-500/25 bg-emerald-500/5"><CardContent className="space-y-3 p-8 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" /><h1 className="text-2xl font-semibold">Resposta registrada</h1><p className="text-sm text-muted-foreground">Obrigado por compartilhar sua experiência com {survey.clinicName ?? "a clínica"}.</p></CardContent></Card></main>;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:py-12">
      <header className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-6 sm:p-8">
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">Pesquisa de satisfação</Badge>
        <h1 className="text-3xl font-black tracking-tight">Como foi sua experiência?</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sua avaliação sobre {survey.clinicName ?? "o atendimento"} é confidencial e ajuda a equipe a melhorar continuamente o cuidado.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> De 0 a 10, quanto você recomendaria?</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">{Array.from({ length: 11 }, (_, value) => <button key={value} type="button" onClick={() => setScore(value)} className={`min-h-11 rounded-xl border text-sm font-semibold transition ${score === value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50"}`} aria-label={`Nota ${value}`}>{value}</button>)}</div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>Não recomendaria</span><span>Recomendaria com certeza</span></div>
          <div className="space-y-2"><label htmlFor="feedback-comment" className="text-sm font-medium">Comentário opcional</label><Textarea id="feedback-comment" value={comment} onChange={(event) => setComment(event.target.value.slice(0, 4_000))} placeholder="Conte, se quiser, o que foi bom ou o que poderia melhorar." rows={5} /></div>
          <Button className="w-full" disabled={busy || score === null} onClick={submit}>Enviar avaliação</Button>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Não inclua diagnósticos, medicações ou outros dados clínicos no comentário. O convite é válido por tempo limitado.</p>
        </CardContent>
      </Card>
    </main>
  );
}
