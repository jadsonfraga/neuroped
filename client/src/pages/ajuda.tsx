import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Brain, ClipboardCheck, Pill, Users, Printer, Mail, Moon, Sun, Smartphone, Monitor, WifiOff, BookOpen, Filter, GraduationCap, Stethoscope, FileText, Lightbulb } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { appMetrics } from "@/data/appMetrics";

const guiaRapido = [
  { icon: Filter, title: "Filtro Inteligente", desc: "Digite a queixa ou selecione idade. O filtro mostra recomendações por prioridade clínica.", color: "from-primary to-chart-2" },
  { icon: ClipboardCheck, title: "Aplicar Escala", desc: "Abra a escala, responda os itens e veja o resultado com interpretação clínica detalhada.", color: "from-blue-500 to-indigo-600" },
  { icon: Mail, title: "Enviar por Email", desc: "Quando disponível, o envio registra relatório completo para acompanhamento clínico.", color: "from-emerald-500 to-teal-600" },
  { icon: Printer, title: "Imprimir", desc: "Quando disponível, o botão de impressão gera documento formatado para registro.", color: "from-amber-500 to-orange-500" },
  { icon: Users, title: "Pacientes", desc: "Cadastre pacientes e vincule resultados para acompanhamento longitudinal.", color: "from-pink-500 to-rose-500" },
  { icon: Stethoscope, title: "Prontuário", desc: "Área clínica para anamnese, marcos, medicações, terapias e exames quando disponível.", color: "from-violet-500 to-purple-600" },
];

const secoes = [
  { icon: Brain, title: "Escalas Clínicas", desc: `Catálogo principal com ${appMetrics.scaleCount} escalas registradas.`, badge: String(appMetrics.scaleCount) },
  { icon: Filter, title: "Itens Filtráveis", desc: `Escalas, questionários, inventários e ferramentas: ${appMetrics.filterableInstrumentCount} itens filtráveis.`, badge: String(appMetrics.filterableInstrumentCount) },
  { icon: GraduationCap, title: "Inventários Escolares", desc: "Questionários para professores e contexto pedagógico.", badge: "escola" },
  { icon: ClipboardCheck, title: "Autoavaliação", desc: "Inventários que criança/adolescente pode responder quando clinicamente adequado.", badge: "auto" },
  { icon: Pill, title: "Farmacologia", desc: `${appMetrics.medicationCount} medicações cadastradas em ${appMetrics.medicationCategoryCount} categorias clínicas.`, badge: String(appMetrics.medicationCount) },
  { icon: BookOpen, title: "Guias Educativos", desc: "Conteúdo educativo e psicoeducativo separado das áreas clínicas.", badge: "pais" },
  { icon: FileText, title: "Bateria Dr. Jadson", desc: "Escalas autorais e instrumentos de apoio clínico.", badge: "Autoral" },
];

const faqs = [
  { q: "Como encontrar a escala certa?", a: "Use o Filtro Inteligente. Digite a queixa da criança em termos simples e selecione a idade. O filtro mostra as opções por prioridade e também aponta teste direto e questionário escolar." },
  { q: "As respostas ficam salvas?", a: "Os resultados podem ser salvos quando a rota tiver suporte para isso. Para registro permanente, gere PDF, exporte ou use o fluxo clínico do paciente quando disponível." },
  { q: "O email envia só o resultado ou tudo?", a: "Quando a ferramenta tiver envio por e-mail, a proposta é mandar relatório completo. Confirme na rota específica antes do uso clínico." },
  { q: "Posso usar offline no celular?", a: "Sim. Abra o app no navegador, depois instale como PWA. O funcionamento offline depende do cache e dos dados disponíveis localmente." },
  { q: "E no computador?", a: "No Chrome ou Edge, clique no ícone de instalação na barra de endereço ou use o menu de instalação do navegador." },
  { q: "Qual a senha de acesso?", a: "A senha é definida pelo administrador do app e é necessária para acessar a área clínica." },
  { q: "Posso usar as escalas em consulta?", a: "Sim, como ferramentas de triagem e acompanhamento. O resultado deve ser interpretado no contexto clínico global." },
  { q: "As escalas substituem avaliação formal?", a: "Não. O diagnóstico clínico requer avaliação formal por profissional treinado." },
  { q: "Como funciona a área dos pais?", a: "A área dos pais concentra psicoeducação e recursos não individualizados. Documentos de paciente exigem liberação específica." },
];

const atalhos = [
  { tecla: "Sidebar", desc: "Navegue por todas as seções pelo menu lateral" },
  { tecla: "Busca na Home", desc: "Digite na barra de busca da home para filtrar cards" },
  { tecla: "Filtro", desc: "Use termos coloquiais: agitado, irritado, não fala, estudo..." },
  { tecla: "Tema", desc: "Alterne entre claro/escuro no rodapé do sidebar" },
];

export default function AjudaPage() {
  return (
    <div className="space-y-8 page-enter">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/20"><HelpCircle className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-lg font-bold">Central de Ajuda</h1><p className="text-xs text-muted-foreground">Como usar o NeuroPed — Guia completo</p></div>
      </div>

      <div className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wider text-primary">Como Usar</h2><div className="grid sm:grid-cols-2 gap-3 stagger-in">{guiaRapido.map((item) => { const Icon = item.icon; return <Card key={item.title} className="card-hover border-card-border"><CardContent className="p-4 flex items-start gap-3"><div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}><Icon className="w-4 h-4 text-white" /></div><div><h3 className="text-sm font-bold text-foreground">{item.title}</h3><p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p></div></CardContent></Card>; })}</div></div>

      <div className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wider text-primary">O Que Tem no App</h2><div className="space-y-2 stagger-in">{secoes.map((s) => { const Icon = s.icon; return <div key={s.title} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border"><Icon className="w-5 h-5 text-primary flex-shrink-0" /><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-foreground">{s.title}</h3><Badge variant="outline" className="text-[10px]">{s.badge}</Badge></div><p className="text-xs text-muted-foreground">{s.desc}</p></div></div>; })}</div></div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-chart-2/5"><CardContent className="p-5 space-y-4"><h2 className="text-sm font-bold flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" />Instalar no Celular / Computador (Offline)</h2><div className="grid sm:grid-cols-2 gap-4"><div className="space-y-2"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /><h3 className="text-xs font-bold">iPhone (Safari)</h3></div><ol className="text-xs text-muted-foreground space-y-1 pl-4"><li>1. Abra o link no Safari</li><li>2. Toque no ícone de Compartilhar</li><li>3. Selecione Adicionar à Tela de Início</li><li>4. Confirme</li></ol></div><div className="space-y-2"><div className="flex items-center gap-2"><Monitor className="w-4 h-4" /><h3 className="text-xs font-bold">Computador</h3></div><ol className="text-xs text-muted-foreground space-y-1 pl-4"><li>1. Abra o link no Chrome ou Edge</li><li>2. Clique em instalar app</li><li>3. Use como janela própria</li><li>4. Reabra pelo ícone instalado</li></ol></div><div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 sm:col-span-2"><WifiOff className="w-5 h-5 text-emerald-500" /><div><p className="text-xs font-bold text-foreground">Funciona Offline</p><p className="text-[10px] text-muted-foreground">Após o primeiro acesso, parte do app pode funcionar sem internet conforme cache.</p></div></div></div></CardContent></Card>

      <div className="space-y-3"><h2 className="text-sm font-bold uppercase tracking-wider text-primary">Perguntas Frequentes</h2><Accordion type="multiple" className="space-y-2">{faqs.map((faq, i) => <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4"><AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">{faq.q}</AccordionTrigger><AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">{faq.a}</AccordionContent></AccordionItem>)}</Accordion></div>

      <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20"><CardContent className="p-4 space-y-2"><h3 className="text-sm font-bold flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />Dicas</h3><div className="grid sm:grid-cols-2 gap-2">{atalhos.map((a) => <div key={a.tecla} className="p-2 rounded-lg bg-background/50"><p className="text-xs font-bold text-foreground">{a.tecla}</p><p className="text-[11px] text-muted-foreground">{a.desc}</p></div>)}</div></CardContent></Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Moon className="w-4 h-4" /><Sun className="w-4 h-4" /><span>Use tema claro/escuro conforme o ambiente de consulta.</span></div>
    </div>
  );
}
