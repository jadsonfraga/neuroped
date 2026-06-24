import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Onboarding } from "@/components/Onboarding";
import { AuthProvider } from "@/contexts/AuthContext";
import { RouteGuard } from "@/components/RouteGuard";
import { SplashScreen } from "@/components/SplashScreen";
import { PreferencesPanel } from "@/components/PreferencesPanel";
import { ToastProvider } from "@/components/Toast";
import { SkeletonShimmer } from "@/components/SkeletonShimmer";
import { AmbientEffects } from "@/components/AmbientEffects";
import { WelcomeTour } from "@/components/WelcomeTour";
import { CommandPalette } from "@/components/CommandPalette";

import HomePage from "@/pages/home";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import SessionExpiredPage from "@/pages/session-expired";
import LgpdConsentPage from "@/pages/lgpd-consent";

const MchatPage = lazy(() => import("@/pages/mchat"));
const CarsPage = lazy(() => import("@/pages/cars"));
const SnapPage = lazy(() => import("@/pages/snap"));
const DenverPage = lazy(() => import("@/pages/denver"));
const SdqPage = lazy(() => import("@/pages/sdq"));
const ScaredPage = lazy(() => import("@/pages/scared"));
const ConnersPage = lazy(() => import("@/pages/conners"));
const VinelandPage = lazy(() => import("@/pages/vineland"));
const PantPage = lazy(() => import("@/pages/pant"));
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
const PreConsultaPage = lazy(() => import("@/pages/pre-consulta"));
const PreRetornoPage = lazy(() => import("@/pages/pre-retorno"));
const RecepcaoPage = lazy(() => import("@/pages/recepcao"));
const EscalasNeuropsiquiatriaPage = lazy(() => import("@/pages/escalas-neuropsiquiatria"));
const CaaPage = lazy(() => import("@/pages/caa"));
const DiarioSonoPage = lazy(() => import("@/pages/diario-sono"));
const DiarioAlimentarPage = lazy(() => import("@/pages/diario-alimentar"));
const AssinaturaDigitalPage = lazy(() => import("@/pages/assinatura-digital"));
const SobrePage = lazy(() => import("@/pages/sobre"));
const NeuropsicologiaPage = lazy(() => import("@/pages/neuropsicologia"));
const PacPage = lazy(() => import("@/pages/pac"));
const AhsdTeaPage = lazy(() => import("@/pages/ahsd-tea"));
const Tde2Page = lazy(() => import("@/pages/tde2"));
const TestesReconhecimentoPage = lazy(() => import("@/pages/testes-reconhecimento"));
const TestesAcademicosPage = lazy(() => import("@/pages/testes-academicos"));
const TestesDiretosPage = lazy(() => import("@/pages/testes-diretos"));
const AcademicoInterativoPage = lazy(() => import("@/pages/academico-interativo"));
const EscritaDesenhoPage = lazy(() => import("@/pages/escrita-desenho"));
const ConhecimentoVisualPage = lazy(() => import("@/pages/conhecimento-visual"));
const MotricidadeTestePage = lazy(() => import("@/pages/motricidade-teste"));
const ConhecimentosGeraisPage = lazy(() => import("@/pages/conhecimentos-gerais"));
const FuncoesExecutivasPage = lazy(() => import("@/pages/funcoes-executivas"));
const AtencaoConcentracaoPage = lazy(() => import("@/pages/atencao-concentracao"));
const LinguagemFonologiaPage = lazy(() => import("@/pages/linguagem-fonologia"));
const MemoriaTestePage = lazy(() => import("@/pages/memoria-teste"));
const ProcessamentoVisuoauditivoPage = lazy(() => import("@/pages/processamento-visuoauditivo"));
const InventariosAutoPage = lazy(() => import("@/pages/inventarios-auto"));
const AjudaPage = lazy(() => import("@/pages/ajuda"));
const CurvasCrescimentoPage = lazy(() => import("@/pages/curvas-crescimento"));
const OrientacaoParentalPage = lazy(() => import("@/pages/orientacao-parental"));
const Psc17Page = lazy(() => import("@/pages/psc17"));
const Gad7Page = lazy(() => import("@/pages/gad7"));
const Aq10Page = lazy(() => import("@/pages/aq10"));
const EspasticidadePage = lazy(() => import("@/pages/espasticidade"));
const ClassificacoesPage = lazy(() => import("@/pages/classificacoes"));
const FluxogramasPage = lazy(() => import("@/pages/fluxogramas"));
const MarcosDesenvolvimentoPage = lazy(() => import("@/pages/marcos-desenvolvimento"));
const ValoresReferenciaPage = lazy(() => import("@/pages/valores-referencia"));
const PdaePage = lazy(() => import("@/pages/pdae"));

const FarmacologiaPage = lazy(() => import("@/pages/farmacologia"));
const PacientesPage = lazy(() => import("@/pages/pacientes"));
const PacienteDetalhePage = lazy(() => import("@/pages/paciente-detalhe"));
const SatisfacaoMedicacaoPage = lazy(() => import("@/pages/satisfacao-medicacao"));
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
const ProntuarioPage = lazy(() => import("@/pages/prontuario"));
const AvaliacaoMultiprofissionalPage = lazy(() => import("@/pages/avaliacao-multiprofissional"));
const PlanoTerapeuticoPage = lazy(() => import("@/pages/plano-terapeutico"));
const PlanoIntervencaoPage = lazy(() => import("@/pages/plano-intervencao"));
const CalculadoraDosePage = lazy(() => import("@/pages/calculadora-dose"));
const FichasRegistroPage = lazy(() => import("@/pages/fichas-registro"));
const PortalFamiliaPage = lazy(() => import("@/pages/portal-familia"));
const PortalNovidadesPage = lazy(() => import("@/pages/portal-novidades-safe"));
const PortalAcessoPage = lazy(() => import("@/pages/portal-acesso"));
const AcessibilidadePage = lazy(() => import("@/pages/acessibilidade"));
const SobreNeuropedPage = lazy(() => import("@/pages/sobre-neuroped"));
const GlossarioPage = lazy(() => import("@/pages/glossario"));
const InstrumentosPadronizadosPage = lazy(() => import("@/pages/instrumentos-padronizados"));
const QualidadePage = lazy(() => import("@/pages/qualidade"));
const LaudoNeuropedPage = lazy(() => import("@/pages/laudo-neuroped"));
const ReceitaC1Page = lazy(() => import("@/pages/receita-c1"));
const DocumentosPage = lazy(() => import("@/pages/documentos"));
const VerificarPage = lazy(() => import("@/pages/verificar"));

function LoadingSpinner() {
  return (
    <div className="py-2">
      <SkeletonShimmer variant="page" />
    </div>
  );
}

function Protected({ children, roles }: { children: React.ReactNode; roles?: Array<"admin" | "professional" | "reader" | "operator"> }) {
  return <RouteGuard roles={roles}>{children}</RouteGuard>;
}

function AppRouter() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
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
          <Route path="/pant"><Protected roles={["admin", "professional"]}><PantPage /></Protected></Route>
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
          <Route path="/pre-consulta" component={PreConsultaPage} />
          <Route path="/pre-retorno" component={PreRetornoPage} />
          <Route path="/efeitos-colaterais" component={PreRetornoPage} />
          <Route path="/recepcao" component={RecepcaoPage} />
          <Route path="/escalas-neuropsiquiatria" component={EscalasNeuropsiquiatriaPage} />
          <Route path="/caa" component={CaaPage} />
          <Route path="/diario-sono" component={DiarioSonoPage} />
          <Route path="/diario-alimentar" component={DiarioAlimentarPage} />
          <Route path="/assinatura-digital"><Protected roles={["admin", "professional"]}><AssinaturaDigitalPage /></Protected></Route>
          <Route path="/sobre" component={SobrePage} />
          <Route path="/neuropsicologia" component={NeuropsicologiaPage} />
          <Route path="/pac" component={PacPage} />
          <Route path="/ahsd-tea" component={AhsdTeaPage} />
          <Route path="/tde2" component={Tde2Page} />
          <Route path="/testes-reconhecimento" component={TestesReconhecimentoPage} />
          <Route path="/testes-academicos" component={TestesAcademicosPage} />
          <Route path="/testes-diretos" component={TestesDiretosPage} />
          <Route path="/academico-interativo" component={AcademicoInterativoPage} />
          <Route path="/escrita-desenho" component={EscritaDesenhoPage} />
          <Route path="/conhecimento-visual" component={ConhecimentoVisualPage} />
          <Route path="/motricidade-teste" component={MotricidadeTestePage} />
          <Route path="/conhecimentos-gerais" component={ConhecimentosGeraisPage} />
          <Route path="/funcoes-executivas" component={FuncoesExecutivasPage} />
          <Route path="/atencao-concentracao" component={AtencaoConcentracaoPage} />
          <Route path="/linguagem-fonologia" component={LinguagemFonologiaPage} />
          <Route path="/memoria-teste" component={MemoriaTestePage} />
          <Route path="/processamento-visuoauditivo" component={ProcessamentoVisuoauditivoPage} />
          <Route path="/inventarios-auto" component={InventariosAutoPage} />
          <Route path="/ajuda" component={AjudaPage} />
          <Route path="/curvas-crescimento" component={CurvasCrescimentoPage} />
          <Route path="/orientacao-parental" component={OrientacaoParentalPage} />
          <Route path="/psc17" component={Psc17Page} />
          <Route path="/gad7" component={Gad7Page} />
          <Route path="/aq10" component={Aq10Page} />
          <Route path="/espasticidade" component={EspasticidadePage} />
          <Route path="/classificacoes" component={ClassificacoesPage} />
          <Route path="/fluxogramas" component={FluxogramasPage} />
          <Route path="/marcos-desenvolvimento" component={MarcosDesenvolvimentoPage} />
          <Route path="/valores-referencia" component={ValoresReferenciaPage} />
          <Route path="/pdae" component={PdaePage} />

          <Route path="/farmacologia"><Protected roles={["admin", "professional"]}><FarmacologiaPage /></Protected></Route>
          <Route path="/medicamentos"><Protected roles={["admin", "professional"]}><FarmacologiaPage /></Protected></Route>
          <Route path="/pacientes"><Protected roles={["admin", "professional"]}><PacientesPage /></Protected></Route>
          <Route path="/paciente/:id"><Protected roles={["admin", "professional"]}><PacienteDetalhePage /></Protected></Route>
          <Route path="/prontuario"><Protected roles={["admin", "professional"]}><ProntuarioPage /></Protected></Route>
          <Route path="/calculadora-dose"><Protected roles={["admin", "professional"]}><CalculadoraDosePage /></Protected></Route>
          <Route path="/satisfacao-medicacao"><Protected roles={["admin", "professional"]}><SatisfacaoMedicacaoPage /></Protected></Route>
          <Route path="/eusm10"><Protected roles={["admin", "professional"]}><Eusm10Page /></Protected></Route>
          <Route path="/avaliacao-multiprofissional"><Protected roles={["admin", "professional"]}><AvaliacaoMultiprofissionalPage /></Protected></Route>
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
          <Route path="/plano-terapeutico"><Protected roles={["admin", "professional"]}><PlanoTerapeuticoPage /></Protected></Route>
          <Route path="/plano-intervencao"><Protected roles={["admin", "professional"]}><PlanoIntervencaoPage /></Protected></Route>
          <Route path="/fichas-registro"><Protected roles={["admin", "professional"]}><FichasRegistroPage /></Protected></Route>

          <Route path="/portal-familia" component={PortalFamiliaPage} />
          <Route path="/portal-familia/novidades" component={PortalNovidadesPage} />
          <Route path="/portal-familia/acesso" component={PortalAcessoPage} />
          <Route path="/acessibilidade" component={AcessibilidadePage} />
          <Route path="/sobre-neuroped" component={SobreNeuropedPage} />
          <Route path="/glossario" component={GlossarioPage} />
          <Route path="/instrumentos-padronizados" component={InstrumentosPadronizadosPage} />
          <Route path="/verificar" component={VerificarPage} />
          <Route path="/documentos" component={DocumentosPage} />
          <Route path="/laudo-neuroped"><Protected roles={["admin", "professional"]}><LaudoNeuropedPage /></Protected></Route>
          <Route path="/receita-c1" component={ReceitaC1Page} />
          <Route path="/qualidade" component={QualidadePage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Layout>
  );
}

function getCurrentHashPath(): string {
  if (typeof window === "undefined") return "/";
  return window.location.hash.replace(/^#/, "") || "/";
}

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!splashComplete) return;
    const currentPath = getCurrentHashPath();
    if (currentPath !== "/") return;
    try {
      const seen = localStorage.getItem("neuroped:onboarding-seen");
      if (!seen) setShowOnboarding(true);
    } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
  }, [splashComplete]);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem("neuroped:onboarding-seen", "1");
    } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ToastProvider>
            <AmbientEffects />
            <Toaster />
            <SplashScreen awaiting={!appReady} onComplete={() => setSplashComplete(true)} />
            {splashComplete && showOnboarding && <Onboarding onComplete={dismissOnboarding} />}
            <Router hook={useHashLocation}><AppRouter /></Router>
            <InstallPrompt />
            <PreferencesPanel />
            <CommandPalette />
            {splashComplete && <WelcomeTour />}
          </ToastProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
