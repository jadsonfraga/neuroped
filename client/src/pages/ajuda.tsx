import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle, Brain, Search, ClipboardCheck, Pill, Users,
  Printer, Mail, Moon, Sun, ChevronDown, Shield,
  Smartphone, Monitor, Wifi, WifiOff, BookOpen, Filter,
  Baby, GraduationCap, Stethoscope, FileText, Lightbulb
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const guiaRapido = [
  { icon: Filter, title: "Filtro Clínico Inteligente", desc: "Digite a queixa (agitado, desatento, autismo...) ou selecione idade. O filtro prioriza instrumentos clínicos adequados.", color: "from-primary to-chart-2" },
  { icon: ClipboardCheck, title: "Aplicar Escala", desc: "Abra a escala, responda os itens e veja o resultado com interpretação clínica detalhada.", color: "from-blue-500 to-indigo-600" },
  { icon: Mail, title: "Enviar por Email", desc: "Cada escala tem botão 'Enviar por Email' que manda o relatório COMPLETO (todas as respostas por extenso) para jadsonfraga@hotmail.com.", color: "from-emerald-500 to-teal-600" },
  { icon: Printer, title: "Imprimir", desc: "O botão 'Imprimir' gera uma versão formatada em A4 com cabeçalho profissional do Dr. Jadson Fraga.", color: "from-amber-500 to-orange-500" },
  { icon: Users, title: "Pacientes", desc: "Cadastre pacientes e vincule resultados de escalas para acompanhamento longitudinal.", color: "from-pink-500 to-rose-500" },
  { icon: Stethoscope, title: "Prontuário", desc: "Prontuário completo com anamnese, marcos do desenvolvimento, medicações, terapias e exames. Gera relatório para imprimir.", color: "from-violet-500 to-purple-600" },
];

const secoes = [
  { icon: Brain, title: "Escalas Clínicas", desc: "45+ escalas validadas (SNAP, M-CHAT, CARS, SDQ, SCARED, CDI-2, Vineland, CBCL...)", badge: "45+" },
  { icon: Baby, title: "Testes para Crianças", desc: "Reconhecimento (cores, letras, animais, corpo), testes acadêmicos (leitura, escrita, aritmética)", badge: "2-14a" },
  { icon: GraduationCap, title: "Inventários Escolares", desc: "Questionários para professores: comportamento, TEA, alfabetização, funções executivas", badge: "4 inv." },
  { icon: ClipboardCheck, title: "Autoavaliação", desc: "8 inventários que a criança/adolescente responde: humor, ansiedade, atenção, sono, social...", badge: "8 áreas" },
  { icon: Pill, title: "Farmacologia", desc: "142 medicações em 27 categorias com doses, indicações e alertas. Escala de satisfação com medicação.", badge: "142" },
  { icon: BookOpen, title: "Guias Educativos", desc: "Avaliação neuropsicológica, processamento auditivo, psiquiatria infantil, PANT (100 escalas)", badge: "4 guias" },
  { icon: FileText, title: "Bateria Dr. Jadson", desc: "12 escalas autorais: EMDI, EAF, PDAE, ECSM, IPS + 7 de regulação emocional + TDE-2 + AH/SD", badge: "Autoral" },
];

const faqs = [
  { q: "Como encontrar a escala certa?", a: "Use o Filtro Clínico Inteligente (🔍). Digite a queixa da criança em termos simples (agitado, não fala, irritado, desatento, atrasado) e selecione a idade. O filtro prioriza escalas por triagem, avaliação diagnóstica e acompanhamento." },
  { q: "As respostas ficam salvas?", a: "Os resultados das escalas podem ser salvos vinculados a um paciente (botão 'Salvar no Paciente' no resultado). Pacientes e resultados ficam salvos no servidor enquanto o app estiver rodando. Para registro permanente, use o botão 'Enviar por Email' que manda o relatório completo." },
  { q: "O email envia só o resultado ou tudo?", a: "O email envia o relatório COMPLETO: todas as perguntas, todas as respostas por extenso (não só números), interpretação clínica detalhada, resultados por domínio, itens com pontuação elevada e áreas preservadas." },
  { q: "Posso usar offline no celular?", a: "Sim. Abra o app no navegador, depois: iPhone → Safari → Compartilhar → 'Adicionar à Tela de Início'. Android → Chrome → Menu (⋮) → 'Instalar app'. O app funciona como aplicativo nativo e funciona offline após o primeiro acesso." },
  { q: "E no computador?", a: "No Chrome, clique no ícone de instalação na barra de endereço (ou Menu → 'Instalar NeuroPed'). O app abre em janela própria e funciona offline." },
  { q: "Qual a senha de acesso?", a: "A senha é definida pelo Dr. Jadson Fraga e é necessária para acessar o app. Se você não tem a senha, solicite ao administrador." },
  { q: "Posso usar as escalas em consulta?", a: "Sim, este é o objetivo principal. As escalas são ferramentas educacionais adaptadas para aplicação no contexto clínico e pedagógico. O resultado deve ser interpretado no contexto clínico global do paciente." },
  { q: "As escalas substituem avaliação formal?", a: "Não. Este app é uma ferramenta educacional. O diagnóstico clínico requer avaliação formal por profissionais treinados, usando instrumentos padronizados com normas validadas. As escalas aqui são simplificações para fins de triagem e acompanhamento." },
  { q: "Como funciona o Prontuário?", a: "O Prontuário tem 6 abas: Identificação, Anamnese, Marcos do Desenvolvimento (com timeline visual), Medicações (com cálculo mg/kg), Terapias e Exames. No final, o botão 'Gerar Relatório' compila tudo num documento formatado para imprimir." },
  { q: "O que é a Bateria Dr. Jadson?", a: "São escalas autorais criadas pelo Dr. Jadson Fraga em 2026, incluindo: EMDI (triagem do desenvolvimento), EAF (adaptação funcional), PDAE (dificuldades de aprendizagem), ECSM (comportamento e saúde mental), IPS (integração psicossocial), além de 7 escalas de regulação emocional e o TDE-2 adaptado." },
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/20">
          <HelpCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Central de Ajuda</h1>
          <p className="text-xs text-muted-foreground">Como usar o NeuroPed — Guia completo</p>
        </div>
      </div>

      {/* Guia Rápido */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Como Usar</h2>
        <div className="grid sm:grid-cols-2 gap-3 stagger-in">
          {guiaRapido.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="card-hover border-card-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* O que tem no app */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">O Que Tem no App</h2>
        <div className="space-y-2 stagger-in">
          {secoes.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border">
                <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{s.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instalar Offline */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-chart-2/5">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            Instalar no Celular / Computador (Offline)
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <h3 className="text-xs font-bold">iPhone (Safari)</h3>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 pl-4">
                <li>1. Abra o link no Safari</li>
                <li>2. Toque no ícone de Compartilhar (↑)</li>
                <li>3. Selecione “Adicionar à Tela de Início”</li>
                <li>4. Confirme com “Adicionar”</li>
              </ol>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <h3 className="text-xs font-bold">Android (Chrome)</h3>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 pl-4">
                <li>1. Abra o link no Chrome</li>
                <li>2. Toque no menu (⋮)</li>
                <li>3. Selecione “Instalar app”</li>
                <li>4. Confirme a instalação</li>
              </ol>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <h3 className="text-xs font-bold">Computador (Chrome)</h3>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 pl-4">
                <li>1. Abra o link no Chrome</li>
                <li>2. Clique no ícone (⊕) na barra de endereço</li>
                <li>3. Ou Menu → “Instalar NeuroPed”</li>
                <li>4. O app abre em janela própria</li>
              </ol>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
              <WifiOff className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-foreground">Funciona Offline</p>
                <p className="text-[10px] text-muted-foreground">Após o primeiro acesso, o app funciona sem internet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary">Perguntas Frequentes</h2>
        <Accordion type="multiple" className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-3">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Dicas */}
      <Card className="border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4 space-y-2">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Dicas
          </h3>
          <ul className="text-xs text-foreground space-y-1.5">
            {atalhos.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="text-[10px] flex-shrink-0 mt-0.5">{a.tecla}</Badge>
                <span className="text-muted-foreground">{a.desc}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl bg-muted/50 border p-4">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed space-y-1">
            <p><strong>Aviso:</strong> Este app é uma ferramenta educacional desenvolvida pelo Dr. Jadson Fraga (Neuropediatra). Não substitui avaliação clínica multiprofissional. Todos os dados são protegidos por senha de acesso.</p>
            <p>Dr. Jadson Fraga Araújo Júnior — CRM-PE 25227 | CRM-BA 23384</p>
          </div>
        </div>
      </div>
    </div>
  );
}
