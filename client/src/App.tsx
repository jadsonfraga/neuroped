import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route, Router, Redirect, useLocation } from "wouter";
import {
  LEGACY_DIRECT_TEST_REDIRECTS,
  LEGACY_INSTRUMENT_REDIRECTS,
} from "@/data/legacyInstrumentRoutes";
import { useAppHashLocation } from "@/lib/hashLocation";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClinicProvider } from "@/contexts/ClinicContext";
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
import { MobilePrimaryDock } from "@/components/MobilePrimaryDock";

import NotFound from "@/pages/not-found";
// O shell reúne ícones, menu longo e animações. Carregá-lo junto à rota ativa
// preserva o primeiro frame e mantém o catálogo clínico fora do entrypoint.
const Layout = lazy(() =>
  import("@/components/Layout").then(({ Layout: Component }) => ({ default: Component })),
);
const PageTransition = lazy(() =>
  import("@/components/PageTransition").then(({ PageTransition: Component }) => ({
    default: Component,
  })),
);
const MotionPreferences = lazy(() =>
  import("@/components/MotionPreferences").then(({ MotionPreferences: Component }) => ({
    default: Component,
  })),
);
// Fluxos de exceção (login/sessão/LGPD) saem da carga inicial: raramente são a
// primeira tela e, no modo ACESSO ABERTO, quase nunca abrem.
const LoginPage = lazy(() => import("@/pages/login"));
const PlanosPage = lazy(() => import("@/pages/planos"));
const CadastroPage = lazy(() => import("@/pages/cadastro"));
const InvitePage = lazy(() => import("@/pages/invite"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const ConfiguracoesPage = lazy(() => import("@/pages/configuracoes"));
const BillingRetornoPage = lazy(() => import("@/pages/billing-retorno"));
const SessionExpiredPage = lazy(() => import("@/pages/session-expired"));
const ForgotPasswordPage = lazy(() => import("@/pages/esqueci-senha"));
const ResetPasswordPage = lazy(() => import("@/pages/redefinir-senha"));
const VerifyEmailPage = lazy(() => import("@/pages/verificar-email"));
const LgpdConsentPage = lazy(() => import("@/pages/lgpd-consent"));
const PreferencesPanel = lazy(() =>
  import("@/components/PreferencesPanel").then(({ PreferencesPanel }) => ({
    default: PreferencesPanel,
  })),
);

const HomePage = lazy(() => import("@/pages/home"));
const BrincandoAprendendoPage = lazy(() => import("@/pages/brincando-e-aprendendo"));
const MissaoSaudePage = lazy(() => import("@/pages/missao-saude"));
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
const NeuropedAcompanhamentoPage = lazy(() => import("@/pages/neuroped-acompanhamento"));
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
const EletroencefalogramaPage = lazy(() => import("@/pages/eletroencefalograma"));
const TermosPage = lazy(() => import("@/pages/termos"));
const NeuropsicologiaPage = lazy(() => import("@/pages/neuropsicologia"));
const PacPage = lazy(() => import("@/pages/pac"));
const AhsdTeaPage = lazy(() => import("@/pages/ahsd-tea"));
const Tde2Page = lazy(() => import("@/pages/tde2"));
const TestesDiretosPage = lazy(() => import("@/pages/sonda-dez-daily"));
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
const MemoriaClinicaPage = lazy(() => import("@/pages/memoria-clinica"));
const AgendarPage = lazy(() => import("@/pages/agendar"));
const MarcacaoPage = lazy(() => import("@/pages/marcacao"));
const RecepcaoPage = lazy(() => import("@/pages/recepcao"));
const PreConsultaPage = lazy(() => import("@/pages/pre-consulta"));
const PreConsultaObs10Page = lazy(() => import("@/pages/pre-consulta-obs10"));
const PreRetornoPage = lazy(() => import("@/pages/pre-retorno"));
const ProntuarioPage = lazy(() => import("@/pages/prontuario"));
const EscutaClinicaPage = lazy(() => import("@/pages/escuta-clinica"));
const DocumentosPage = lazy(() => import("@/pages/documentos"));
const AssinaturaDigitalPage = lazy(() => import("@/pages/assinatura-digital"));
const SatisfacaoMedicacaoPage = lazy(
  () => import("@/pages/satisfacao-medicacao"),
);
const PlanoTerapeuticoPage = lazy(() => import("@/pages/plano-terapeutico"));
const PlanoIntervencaoPage = lazy(() => import("@/pages/plano-intervencao"));
const FichasRegistroPage = lazy(() => import("@/pages/fichas-registro"));
const LaudoNeuropedPage = lazy(() => import("@/pages/laudo-neuroped"));
const LaudoSuperPage = lazy(() => import("@/pages/laudo-super"));
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

  // A Missão Saúde é uma experiência educativa pública, com landmarks próprios,
  // estado somente em memória e sem acesso à navegação clínica do Neuroped.
  if (location === "/missao-saude") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/missao-saude" component={MissaoSaudePage} />
        </Switch>
      </Suspense>
    );
  }

  // A marcação pública é uma porta administrativa independente do shell clínico.
  // A página já possui seu próprio landmark <main>; mantê-la fora do Layout evita
  // duplicidade de landmarks e não expõe navegação ou dados clínicos.
  if (location === "/marcacao") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <MarcacaoPage />
      </Suspense>
    );
  }

  // O Vídeo-EEG é um handoff institucional para famílias, sem dados clínicos
  // nem redirecionamento externo. Ele não deve herdar o layout ou o gate médico.
  if (location === "/eletroencefalograma") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <EletroencefalogramaPage />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          <RouteGuard>
            <PageTransition>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/esqueci-senha" component={ForgotPasswordPage} />
            <Route path="/redefinir-senha" component={ResetPasswordPage} />
            <Route path="/verificar-email" component={VerifyEmailPage} />
            <Route path="/planos" component={PlanosPage} />
            <Route path="/cadastro" component={CadastroPage} />
            <Route path="/invite" component={InvitePage} />
            <Route path="/onboarding" component={OnboardingPage} />
            <Route path="/configuracoes" component={ConfiguracoesPage} />
            <Route path="/billing/retorno" component={BillingRetornoPage} />
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
            <Route path="/neuroacompanhamento" component={NeuropedAcompanhamentoPage} />
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
            <Route path="/eletroencefalograma" component={EletroencefalogramaPage} />
            <Route path="/termos" component={TermosPage} />
            <Route path="/neuropsicologia" component={NeuropsicologiaPage} />
            <Route path="/pac" component={PacPage} />
            <Route path="/ahsd-tea" component={AhsdTeaPage} />
            <Route path="/tde2" component={Tde2Page} />
            <Route path="/testes-diretos" component={TestesDiretosPage} />
            <Route path="/memoria-clinica" component={MemoriaClinicaPage} />
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
            {/* Rotas nominais legadas de instrumentos: uma única superfície
                canônica (/generic-scale/:id ou aplicação dedicada), preservando
                bookmarks antigos. Mapa em data/legacyInstrumentRoutes.ts. */}
            {Object.entries({
              ...LEGACY_INSTRUMENT_REDIRECTS,
              ...LEGACY_DIRECT_TEST_REDIRECTS,
            }).map(([from, to]) => (
              <Route key={from} path={from}>
                <Redirect to={to} replace />
              </Route>
            ))}

            <Route path="/avaliacao-pre-consulta-faixa-etaria" component={PreConsultaObs10Page} />
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
            <Route path="/escuta-clinica">
              <RouteGuard roles={["admin", "professional"]}>
                <EscutaClinicaPage />
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
            <Route path="/laudo-super">
              <RouteGuard roles={["admin", "professional"]}>
                <LaudoSuperPage />
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
            <Route path="/marcacao" component={MarcacaoPage} />

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
            </PageTransition>
          </RouteGuard>
        </Suspense>
      </Layout>
    </Suspense>
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
      <Suspense fallback={<LoadingSpinner />}>
        <MotionPreferences>
          <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ClinicProvider>
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
                  <Router hook={useAppHashLocation}>
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
                <MobilePrimaryDock />
              </ToastProvider>
            </TooltipProvider>
            </ClinicProvider>
          </AuthProvider>
          </QueryClientProvider>
        </MotionPreferences>
      </Suspense>
    </AppErrorBoundary>
  );
}

export default App;
