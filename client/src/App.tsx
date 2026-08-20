import { lazy, Suspense, useState, useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import {
  AvisoLegalGate,
  hasAcceptedLegalNotice,
} from "@/components/AvisoLegalGate";
import { ToastProvider } from "@/components/Toast";
import { SkeletonShimmer } from "@/components/SkeletonShimmer";

import { PrivateGate } from "@/components/PrivateGate";
import { RouteGuard } from "@/components/RouteGuard";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";

import NotFound from "@/pages/not-found";
// Fluxos de exceção (login/sessão/LGPD) saem da carga inicial: raramente são a
// primeira tela e, no modo ACESSO ABERTO, quase nunca abrem.
const LoginPage = lazy(() => import("@/pages/login"));
const SessionExpiredPage = lazy(() => import("@/pages/session-expired"));
const LgpdConsentPage = lazy(() => import("@/pages/lgpd-consent"));
const PreferencesPanel = lazy(() =>
  import("@/components/PreferencesPanel").then(({ PreferencesPanel }) => ({
    default: PreferencesPanel,
  })),
);

const HomePage = lazy(() => import("@/pages/home"));
const BrincandoAprendendoPage = lazy(() => import("@/pages/brincando-e-aprendendo"));
const SplashScreen = lazy(() =>
  import("@/components/SplashScreen").then(({ SplashScreen }) => ({
    default: SplashScreen,
  })),
);
const MchatPage = lazy(() => import("@/pages/mchat"));
const CarsPage = lazy(() => import("@/pages/cars"));
const SnapPage = lazy(() => import("@/pages/snap"));
const DenverPage = lazy(() => import("@/pages/denver"));
const SdqPage = lazy(() => import("@/pages/sdq"));
const ScaredPage = lazy(() => import("@/pages/scared"));
const ConnersPage = lazy(() => import("@/pages/conners"));
const VinelandPage = lazy(() => import("@/pages/vineland"));
const PantPage = lazy(() => import("@/pages/pant"));
const FluxogramaPage = lazy(() => import("@/pages/fluxograma"));
const Cdi2Page = lazy(() => import("@/pages/cdi2"));
const PhqaPage = lazy(() => import("@/pages/phqa"));
const CssrsPage = lazy(() => import("@/pages/cssrs"));
const CrafftPage = lazy(() => import("@/pages/crafft"));
const CbclPage = lazy(() => import("@/pages/cbcl"));
const VanderbiltPage = lazy(() => import("@/pages/vanderbilt"));
const Brief2Page = lazy(() => import("@/pages/brief2"));
const AbcPage = lazy(() => import("@/pages/abc"));
const Asq3Page = lazy(() => import("@/pages/asq3"));
const PedsqlPage = lazy(() => import("@/pages/pedsql"));
const GmfcsPage = lazy(() => import("@/pages/gmfcs"));
const CshqPage = lazy(() => import("@/pages/cshq"));
const YgtssPage = lazy(() => import("@/pages/ygtss"));
const EpilepsyDiaryPage = lazy(() => import("@/pages/epilepsy-diary"));
const HeadacheCalendarPage = lazy(() => import("@/pages/headache-calendar"));
const TeaPage = lazy(() => import("@/pages/tea"));
const TeaBehaviorsPage = lazy(() => import("@/pages/tea-behaviors"));
const PsiquiatriaGuiaPage = lazy(() => import("@/pages/psiquiatria-guia"));
const BateriaJadsonPage = lazy(() => import("@/pages/bateria-jadson"));
const EmdiPage = lazy(() => import("@/pages/emdi"));
const EafPage = lazy(() => import("@/pages/eaf"));
const EcsmPage = lazy(() => import("@/pages/ecsm"));
const IpsPage = lazy(() => import("@/pages/ips"));
const EcarSiPage = lazy(() => import("@/pages/ecar-si"));
const EdiPage = lazy(() => import("@/pages/edi"));
const EaiPage = lazy(() => import("@/pages/eai"));
const EasiPage = lazy(() => import("@/pages/easi"));
const EmsPage = lazy(() => import("@/pages/ems"));
const EtarePage = lazy(() => import("@/pages/etare"));
const EaahPage = lazy(() => import("@/pages/eaah"));
const FiltroPage = lazy(() => import("@/pages/filtro"));
const EscalasNeuropsiquiatriaPage = lazy(
  () => import("@/pages/escalas-neuropsiquiatria"),
);
const CaaPage = lazy(() => import("@/pages/caa"));
const DiarioSonoPage = lazy(() => import("@/pages/diario-sono"));
const DiarioAlimentarPage = lazy(() => import("@/pages/diario-alimentar"));
const SobrePage = lazy(() => import("@/pages/sobre"));
const ServicosClinicaPage = lazy(() => import("@/pages/servicos-clinica"));
const TermosPage = lazy(() => import("@/pages/termos"));
const NeuropsicologiaPage = lazy(() => import("@/pages/neuropsicologia"));
const PacPage = lazy(() => import("@/pages/pac"));
const AhsdTeaPage = lazy(() => import("@/pages/ahsd-tea"));
const Tde2Page = lazy(() => import("@/pages/tde2"));
const TestesReconhecimentoPage = lazy(
  () => import("@/pages/testes-reconhecimento"),
);
const TestesAcademicosPage = lazy(() => import("@/pages/testes-academicos"));
const TestesDiretosPage = lazy(() => import("@/pages/testes-diretos"));
const CognitiveLabPage = lazy(() => import("@/pages/cognitive-lab"));
const CognitiveTaskPage = lazy(() => import("@/pages/cognitive-task"));
const AvaliacaoCognitivaInfantilPage = lazy(
  () => import("@/pages/avaliacao-cognitiva-infantil"),
);
const AcademicoInterativoPage = lazy(
  () => import("@/pages/academico-interativo"),
);
const EscritaDesenhoPage = lazy(() => import("@/pages/escrita-desenho"));
const ConhecimentoVisualPage = lazy(
  () => import("@/pages/conhecimento-visual"),
);
const MotricidadeTestePage = lazy(() => import("@/pages/motricidade-teste"));
const ConhecimentosGeraisPage = lazy(
  () => import("@/pages/conhecimentos-gerais"),
);
const FuncoesExecutivasPage = lazy(() => import("@/pages/funcoes-executivas"));
const AtencaoConcentracaoPage = lazy(
  () => import("@/pages/atencao-concentracao"),
);
const LinguagemFonologiaPage = lazy(
  () => import("@/pages/linguagem-fonologia"),
);
const MemoriaTestePage = lazy(() => import("@/pages/memoria-teste"));
const ProcessamentoVisuoauditivoPage = lazy(
  () => import("@/pages/processamento-visuoauditivo"),
);
const InventariosAutoPage = lazy(() => import("@/pages/inventarios-auto"));
const AjudaPage = lazy(() => import("@/pages/ajuda"));
const CurvasCrescimentoPage = lazy(() => import("@/pages/curvas-crescimento"));
const OrientacaoParentalPage = lazy(
  () => import("@/pages/orientacao-parental"),
);
const Psc17Page = lazy(() => import("@/pages/psc17"));
const Gad7Page = lazy(() => import("@/pages/gad7"));
const Aq10Page = lazy(() => import("@/pages/aq10"));
const Aq50Page = lazy(() => import("@/pages/aq50"));
const ClassificacaoPage = lazy(() => import("@/pages/classificacao"));
const BallardPage = lazy(() => import("@/pages/ballard"));
const BibliotecaInstrumentosPage = lazy(
  () => import("@/pages/biblioteca-instrumentos"),
);
const EspasticidadePage = lazy(() => import("@/pages/espasticidade"));
const ClassificacoesPage = lazy(() => import("@/pages/classificacoes"));
const FluxogramasPage = lazy(() => import("@/pages/fluxogramas"));
const MarcosDesenvolvimentoPage = lazy(
  () => import("@/pages/marcos-desenvolvimento"),
);
const ValoresReferenciaPage = lazy(() => import("@/pages/valores-referencia"));
const PdaePage = lazy(() => import("@/pages/pdae"));

const FarmacologiaPage = lazy(() => import("@/pages/farmacologia"));
const MedicamentosPage = lazy(() => import("@/pages/medicamentos"));
const Eusm10Page = lazy(() => import("@/pages/eusm10"));
const GenericScalePage = lazy(() => import("@/pages/generic-scale"));
const BayleyPage = lazy(() => import("@/pages/bayley"));
const GriffithsPage = lazy(() => import("@/pages/griffiths"));
const RcadsPage = lazy(() => import("@/pages/rcads"));
const Masc2Page = lazy(() => import("@/pages/masc2"));
const Leiter3Page = lazy(() => import("@/pages/leiter3"));
const Nepsy2Page = lazy(() => import("@/pages/nepsy2"));
const RavenPage = lazy(() => import("@/pages/raven"));
const Wisc5Page = lazy(() => import("@/pages/wisc5"));
const WppsiPage = lazy(() => import("@/pages/wppsi"));
const PedicatPage = lazy(() => import("@/pages/pedicat"));
const TdePage = lazy(() => import("@/pages/tde"));
const ConfiasPage = lazy(() => import("@/pages/confias"));
const PortagePage = lazy(() => import("@/pages/portage"));
const VinelandCompletePage = lazy(() => import("@/pages/vineland"));
const CbclInterativoPage = lazy(() => import("@/pages/cbcl-interativo"));
const AvaliacaoMultiprofissionalPage = lazy(
  () => import("@/pages/avaliacao-multiprofissional"),
);
const CalculadoraDosePage = lazy(() => import("@/pages/calculadora-dose"));
const PortalFamiliaPage = lazy(() => import("@/pages/portal-familia"));
const FamiliaPage = lazy(() => import("@/pages/familia"));
const PortalNovidadesPage = lazy(() => import("@/pages/portal-novidades-safe"));
const PortalAcessoPage = lazy(() => import("@/pages/portal-acesso"));
const AcessibilidadePage = lazy(() => import("@/pages/acessibilidade"));
const SobreNeuropedPage = lazy(() => import("@/pages/sobre-neuroped"));
const GlossarioPage = lazy(() => import("@/pages/glossario"));
const InstrumentosPadronizadosPage = lazy(
  () => import("@/pages/instrumentos-padronizados"),
);
const QualidadePage = lazy(() => import("@/pages/qualidade"));
const PacientesPage = lazy(() => import("@/pages/pacientes"));
const PacienteDetalhePage = lazy(() => import("@/pages/paciente-detalhe"));
const ConectaPage = lazy(() => import("@/pages/conecta"));
const AgendaPage = lazy(() => import("@/pages/agenda"));
const ManusIntegracoesPage = lazy(() => import("@/pages/manus-integracoes"));
const AgendarPage = lazy(() => import("@/pages/agendar"));
const RecepcaoPage = lazy(() => import("@/pages/recepcao"));
const PreConsultaPage = lazy(() => import("@/pages/pre-consulta"));
const PreRetornoPage = lazy(() => import("@/pages/pre-retorno"));
const ProntuarioPage = lazy(() => import("@/pages/prontuario"));
const DocumentosPage = lazy(() => import("@/pages/documentos"));
const AssinaturaDigitalPage = lazy(() => import("@/pages/assinatura-digital"));
const SatisfacaoMedicacaoPage = lazy(
  () => import("@/pages/satisfacao-medicacao"),
);
const PlanoTerapeuticoPage = lazy(() => import("@/pages/plano-terapeutico"));
const PlanoIntervencaoPage = lazy(() => import("@/pages/plano-intervencao"));
const FichasRegistroPage = lazy(() => import("@/pages/fichas-registro"));
const LaudoNeuropedPage = lazy(() => import("@/pages/laudo-neuroped"));
const ReceitaC1Page = lazy(() => import("@/pages/receita-c1"));
const ReceitaC1ExpressPage = lazy(() => import("@/pages/receita-c1-express"));
const VerificarPage = lazy(() => import("@/pages/verificar"));
const DiarioEscolaPage = lazy(() => import("@/pages/diario-escola"));
const InventariosEscolaPage = lazy(() => import("@/pages/inventarios-escola"));
const Onboarding = lazy(() =>
  import("@/components/Onboarding").then((mod) => ({
    default: mod.Onboarding,
  })),
);
const WelcomeTour = lazy(() =>
  import("@/components/WelcomeTour").then((mod) => ({
    default: mod.WelcomeTour,
  })),
);
const AmbientEffects = lazy(() =>
  import("@/components/AmbientEffects").then(({ AmbientEffects: Component }) => ({
    default: Component,
  })),
);
const InstallPrompt = lazy(() =>
  import("@/components/InstallPrompt").then(({ InstallPrompt: Component }) => ({
    default: Component,
  })),
);
const FloatingHelp = lazy(() =>
  import("@/components/FloatingHelp").then(({ FloatingHelp: Component }) => ({
    default: Component,
  })),
);
const CommandPalette = lazy(() =>
  import("@/components/CommandPalette").then((mod) => ({
    default: mod.CommandPalette,
  })),
);

const MobilePrimaryDock = lazy(() =>
  import("@/components/MobilePrimaryDock").then(({ MobilePrimaryDock: Component }) => ({
    default: Component,
  })),
);

function LoadingSpinner() {
  return (
    <div className="py-2">
      <SkeletonShimmer variant="page" />
    </div>
  );
}

function AppRouter() {
  const [location] = useLocation();
  useEffect(() => {
    // Ao trocar de rota (ex.: abrir uma escala a partir do filtro), sobe ao topo.
    // Sem isso, a nova página abre na mesma posição de rolagem e parece que
    // "não abriu" — especialmente saindo de páginas longas como o /filtro.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.scrollingElement?.scrollTo?.(0, 0);
    } catch {
      /* ambiente sem window (SSR/testes) — ignora */
    }
  }, [location]);
  // A experiência infantil é um microsite público completo, com header/main/footer
  // próprios. Mantê-la dentro do Layout clínico criaria dois landmarks <main> e
  // carregaria navegação clínica desnecessária para uma rota sem dados sensíveis.
  if (location === "/brincando-e-aprendendo") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/brincando-e-aprendendo" component={BrincandoAprendendoPage} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <RouteGuard>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/sessao-expirada" component={SessionExpiredPage} />
            <Route path="/consentimento-lgpd" component={LgpdConsentPage} />

            <Route path="/" component={HomePage} />
            <Route path="/mchat" component={MchatPage} />
            <Route path="/cars" component={CarsPage} />
            <Route path="/snap" component={SnapPage} />
            <Route path="/denver" component={DenverPage} />
            <Route path="/sdq" component={SdqPage} />
            <Route path="/scared" component={ScaredPage} />
            <Route path="/conners" component={ConnersPage} />
            <Route path="/vineland" component={VinelandPage} />
            <Route path="/pant" component={PantPage} />
            <Route path="/fluxograma" component={FluxogramaPage} />
            <Route path="/cdi2" component={Cdi2Page} />
            <Route path="/phqa" component={PhqaPage} />
            <Route path="/cssrs" component={CssrsPage} />
            <Route path="/crafft" component={CrafftPage} />
            <Route path="/cbcl" component={CbclPage} />
            <Route path="/vanderbilt" component={VanderbiltPage} />
            <Route path="/brief2" component={Brief2Page} />
            <Route path="/abc" component={AbcPage} />
            <Route path="/asq3" component={Asq3Page} />
            <Route path="/pedsql" component={PedsqlPage} />
            <Route path="/gmfcs" component={GmfcsPage} />
            <Route path="/cshq" component={CshqPage} />
            <Route path="/ygtss" component={YgtssPage} />
            <Route path="/epilepsia" component={EpilepsyDiaryPage} />
            <Route path="/cefaleia" component={HeadacheCalendarPage} />
            <Route path="/tea" component={TeaPage} />
            <Route path="/tea-comportamentos" component={TeaBehaviorsPage} />
            <Route path="/psiquiatria" component={PsiquiatriaGuiaPage} />
            <Route path="/bateria-jadson" component={BateriaJadsonPage} />
            <Route path="/emdi" component={EmdiPage} />
            <Route path="/eaf" component={EafPage} />
            <Route path="/ecsm" component={EcsmPage} />
            <Route path="/ips" component={IpsPage} />
            <Route path="/ecar-si" component={EcarSiPage} />
            <Route path="/edi" component={EdiPage} />
            <Route path="/eai" component={EaiPage} />
            <Route path="/easi" component={EasiPage} />
            <Route path="/ems" component={EmsPage} />
            <Route path="/etare" component={EtarePage} />
            <Route path="/eaah" component={EaahPage} />
            <Route path="/filtro" component={FiltroPage} />
            <Route path="/filtro-escalas" component={FiltroPage} />
            <Route
              path="/escalas-neuropsiquiatria"
              component={EscalasNeuropsiquiatriaPage}
            />
            <Route path="/caa" component={CaaPage} />
            <Route path="/diario-sono" component={DiarioSonoPage} />
            <Route path="/diario-alimentar" component={DiarioAlimentarPage} />
            <Route path="/sobre" component={SobrePage} />
            <Route path="/servicos-clinica" component={ServicosClinicaPage} />
            <Route path="/termos" component={TermosPage} />
            <Route path="/neuropsicologia" component={NeuropsicologiaPage} />
            <Route path="/pac" component={PacPage} />
            <Route path="/ahsd-tea" component={AhsdTeaPage} />
            <Route path="/tde2" component={Tde2Page} />
            <Route
              path="/testes-reconhecimento"
              component={TestesReconhecimentoPage}
            />
            <Route path="/testes-academicos" component={TestesAcademicosPage} />
            <Route path="/testes-diretos" component={TestesDiretosPage} />
            <Route path="/cognitive-lab" component={CognitiveLabPage} />
            <Route
              path="/cognitive-lab/:taskId"
              component={CognitiveTaskPage}
            />
            <Route
              path="/avaliacao-cognitiva-infantil"
              component={AvaliacaoCognitivaInfantilPage}
            />
            <Route
              path="/academico-interativo"
              component={AcademicoInterativoPage}
            />
            <Route path="/escrita-desenho" component={EscritaDesenhoPage} />
            <Route
              path="/conhecimento-visual"
              component={ConhecimentoVisualPage}
            />
            <Route path="/motricidade-teste" component={MotricidadeTestePage} />
            <Route
              path="/conhecimentos-gerais"
              component={ConhecimentosGeraisPage}
            />
            <Route
              path="/funcoes-executivas"
              component={FuncoesExecutivasPage}
            />
            <Route
              path="/atencao-concentracao"
              component={AtencaoConcentracaoPage}
            />
            <Route
              path="/linguagem-fonologia"
              component={LinguagemFonologiaPage}
            />
            <Route path="/memoria-teste" component={MemoriaTestePage} />
            <Route
              path="/processamento-visuoauditivo"
              component={ProcessamentoVisuoauditivoPage}
            />
            <Route path="/inventarios-auto" component={InventariosAutoPage} />
            <Route path="/ajuda" component={AjudaPage} />
            <Route
              path="/curvas-crescimento"
              component={CurvasCrescimentoPage}
            />
            <Route
              path="/orientacao-parental"
              component={OrientacaoParentalPage}
            />
            <Route path="/psc17" component={Psc17Page} />
            <Route path="/gad7" component={Gad7Page} />
            <Route path="/aq10" component={Aq10Page} />
            <Route path="/aq50" component={Aq50Page} />
            <Route path="/classificacao/:id" component={ClassificacaoPage} />
            <Route path="/ballard" component={BallardPage} />
            <Route
              path="/biblioteca-instrumentos"
              component={BibliotecaInstrumentosPage}
            />
            <Route path="/espasticidade" component={EspasticidadePage} />
            <Route path="/classificacoes" component={ClassificacoesPage} />
            <Route path="/fluxogramas" component={FluxogramasPage} />
            <Route
              path="/marcos-desenvolvimento"
              component={MarcosDesenvolvimentoPage}
            />
            <Route
              path="/valores-referencia"
              component={ValoresReferenciaPage}
            />
            <Route path="/pdae" component={PdaePage} />

            <Route path="/medicamentos" component={MedicamentosPage} />
            <Route path="/farmacologia" component={FarmacologiaPage} />
            <Route path="/calculadora-dose" component={CalculadoraDosePage} />
            <Route path="/eusm10" component={Eusm10Page} />
            <Route
              path="/avaliacao-multiprofissional"
              component={AvaliacaoMultiprofissionalPage}
            />
            <Route path="/generic-scale/:id" component={GenericScalePage} />
            <Route path="/bayley" component={BayleyPage} />
            <Route path="/griffiths" component={GriffithsPage} />
            <Route path="/rcads" component={RcadsPage} />
            <Route path="/masc2" component={Masc2Page} />
            <Route path="/leiter3" component={Leiter3Page} />
            <Route path="/nepsy2" component={Nepsy2Page} />
            <Route path="/raven" component={RavenPage} />
            <Route path="/wisc5" component={Wisc5Page} />
            <Route path="/wppsi" component={WppsiPage} />
            <Route path="/pedicat" component={PedicatPage} />
            <Route path="/tde" component={TdePage} />
            <Route path="/confias" component={ConfiasPage} />
            <Route path="/portage" component={PortagePage} />
            <Route path="/vineland-completo" component={VinelandCompletePage} />
            <Route path="/cbcl-interativo" component={CbclInterativoPage} />

            <Route path="/pre-consulta" component={PreConsultaPage} />
            <Route path="/pre-retorno" component={PreRetornoPage} />
            <Route path="/efeitos-colaterais" component={PreRetornoPage} />
            <Route path="/recepcao">
              <RouteGuard roles={["admin", "professional", "operator"]}>
                <RecepcaoPage />
              </RouteGuard>
            </Route>
            <Route path="/prontuario">
              <RouteGuard roles={["admin", "professional"]}>
                <ProntuarioPage />
              </RouteGuard>
            </Route>
            <Route path="/manus">
              <RouteGuard roles={["admin", "professional"]}>
                <ManusIntegracoesPage />
              </RouteGuard>
            </Route>
            <Route path="/documentos">
              <RouteGuard roles={["admin", "professional"]}>
                <DocumentosPage />
              </RouteGuard>
            </Route>
            <Route path="/assinatura-digital">
              <RouteGuard roles={["admin", "professional"]}>
                <AssinaturaDigitalPage />
              </RouteGuard>
            </Route>
            <Route path="/satisfacao-medicacao">
              <RouteGuard roles={["admin", "professional"]}>
                <SatisfacaoMedicacaoPage />
              </RouteGuard>
            </Route>
            <Route path="/plano-terapeutico">
              <RouteGuard roles={["admin", "professional"]}>
                <PlanoTerapeuticoPage />
              </RouteGuard>
            </Route>
            <Route path="/plano-intervencao">
              <RouteGuard roles={["admin", "professional"]}>
                <PlanoIntervencaoPage />
              </RouteGuard>
            </Route>
            <Route path="/fichas-registro">
              <RouteGuard roles={["admin", "professional"]}>
                <FichasRegistroPage />
              </RouteGuard>
            </Route>
            <Route path="/laudo-neuroped">
              <RouteGuard roles={["admin", "professional"]}>
                <LaudoNeuropedPage />
              </RouteGuard>
            </Route>
            <Route path="/receita-c1">
              <RouteGuard roles={["admin", "professional"]}>
                <ReceitaC1Page />
              </RouteGuard>
            </Route>
            <Route path="/receita-c1-express">
              <RouteGuard roles={["admin", "professional"]}>
                <ReceitaC1ExpressPage />
              </RouteGuard>
            </Route>
            <Route path="/verificar" component={VerificarPage} />
            <Route path="/diario-escola">
              <RouteGuard roles={["admin", "professional"]}>
                <DiarioEscolaPage />
              </RouteGuard>
            </Route>
            <Route path="/inventarios-escola">
              <RouteGuard roles={["admin", "professional"]}>
                <InventariosEscolaPage />
              </RouteGuard>
            </Route>
            <Route path="/conecta">
              <RouteGuard roles={["admin", "professional"]}>
                <ConectaPage />
              </RouteGuard>
            </Route>
            <Route path="/agenda">
              <RouteGuard roles={["admin", "professional"]}>
                <AgendaPage />
              </RouteGuard>
            </Route>
            <Route path="/agendar" component={AgendarPage} />

            <Route path="/familia" component={FamiliaPage} />
            <Route path="/portal-familia" component={PortalFamiliaPage} />
            <Route
              path="/portal-familia/novidades"
              component={PortalNovidadesPage}
            />
            <Route path="/portal-familia/acesso" component={PortalAcessoPage} />
            <Route path="/acessibilidade" component={AcessibilidadePage} />
            <Route path="/sobre-neuroped" component={SobreNeuropedPage} />
            <Route path="/glossario" component={GlossarioPage} />
            <Route
              path="/instrumentos-padronizados"
              component={InstrumentosPadronizadosPage}
            />
            <Route path="/qualidade" component={QualidadePage} />
            <Route path="/pacientes" component={PacientesPage} />
            <Route path="/paciente/:id" component={PacienteDetalhePage} />
            <Route component={NotFound} />
          </Switch>
        </RouteGuard>
      </Suspense>
    </Layout>
  );
}

function getCurrentHashPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.hash.replace(/^#/, "") || "/";
}

function canSkipSplash(): boolean {
  if (typeof window === "undefined") return false;
  if (getCurrentHashPath() !== "/") return true;
  try {
    return localStorage.getItem("neuroped:onboarding-seen") === "1";
  } catch {
    return false;
  }
}

function shouldShowOnboarding(): boolean {
  if (typeof window === "undefined" || getCurrentHashPath() !== "/") {
    return false;
  }
  try {
    return localStorage.getItem("neuroped:onboarding-seen") !== "1";
  } catch {
    return false;
  }
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);
  const [splashComplete, setSplashComplete] = useState(canSkipSplash);
  const [appReady, setAppReady] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(hasAcceptedLegalNotice);
  const [currentPath, setCurrentPath] = useState(getCurrentHashPath);

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const syncCurrentPath = () => {
      const nextPath = getCurrentHashPath();
      if (nextPath === "/" && shouldShowOnboarding()) {
        setShowOnboarding(true);
      }
      setCurrentPath(nextPath);
    };
    window.addEventListener("hashchange", syncCurrentPath);
    syncCurrentPath();
    return () => window.removeEventListener("hashchange", syncCurrentPath);
  }, []);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem("neuroped:onboarding-seen", "1");
    } catch {
      /* storage indisponível (modo privado/cota) — silencioso */
    }
  }

  // O hash real também entra na condição para que o clique em "Ler Termos"
  // esconda o onboarding já no mesmo render em que registra o aceite.
  const isRootRoute = currentPath === "/" && getCurrentHashPath() === "/";
  const onboardingVisible =
    splashComplete && legalAccepted && showOnboarding && isRootRoute;
  const auxiliarySurfacesVisible =
    splashComplete && legalAccepted && !onboardingVisible;

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              <ToastProvider>
                <Suspense fallback={null}>
                  <AmbientEffects />
                </Suspense>
                <Toaster />
                {!splashComplete && (
                  <Suspense fallback={null}>
                    <SplashScreen
                      awaiting={!appReady}
                      onComplete={() => setSplashComplete(true)}
                    />
                  </Suspense>
                )}
                {onboardingVisible && (
                  <Suspense fallback={null}>
                    <Onboarding onComplete={dismissOnboarding} />
                  </Suspense>
                )}
                <PrivateGate>
                  <Router hook={useHashLocation}>
                    <AppRouter />
                  </Router>
                  {auxiliarySurfacesVisible && (
                    <Suspense fallback={null}>
                      <CommandPalette />
                    </Suspense>
                  )}
                  {auxiliarySurfacesVisible && (
                    <Suspense fallback={null}>
                      <WelcomeTour />
                    </Suspense>
                  )}
                </PrivateGate>
                {splashComplete && (
                  <AvisoLegalGate onAccepted={() => setLegalAccepted(true)} />
                )}
                {auxiliarySurfacesVisible && (
                  <>
                    <Suspense fallback={null}>
                      <InstallPrompt />
                      <PreferencesPanel />
                      <FloatingHelp />
                    </Suspense>
                  </>
                )}
                <ServiceWorkerManager />
                <Suspense fallback={null}>
                  <MobilePrimaryDock />
                </Suspense>
              </ToastProvider>
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </MotionConfig>
    </AppErrorBoundary>
  );
}

export default App;
