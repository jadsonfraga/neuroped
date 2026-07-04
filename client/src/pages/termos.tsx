import { ScrollText } from "lucide-react";
import { PageHero } from "@/components/PageHero";

const UPDATED = "julho de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="text-sm font-black text-foreground">{title}</h2>
      <div className="text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <div className="space-y-5 pb-10">
      <PageHero
        icon={ScrollText}
        eyebrow="aviso legal"
        title="Termos de Uso e Aviso Legal"
        subtitle={`Leia antes de utilizar o NeuroPed. Atualizado em ${UPDATED}.`}
        gradient="from-slate-500 to-slate-700"
      />

      <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
        <strong className="font-bold">Finalidade exclusivamente educativa.</strong> O NeuroPed é uma ferramenta de
        informação e educação em saúde. <strong className="font-semibold">Não é um dispositivo médico</strong> e não
        realiza diagnóstico, prescrição ou tratamento.
      </div>

      <div className="space-y-5 rounded-2xl border border-border/70 bg-card/80 p-5">
        <Section title="1. Natureza e finalidade">
          O conteúdo do NeuroPed tem <strong className="font-semibold text-foreground">caráter informativo e
          educativo</strong>. Destina-se a apoiar o entendimento sobre desenvolvimento infantil e neuropediatria. Não
          se destina a orientar, por si só, decisões clínicas.
        </Section>
        <Section title="2. Não substitui o profissional de saúde">
          As informações <strong className="font-semibold text-foreground">não substituem</strong> a consulta, a
          avaliação, o diagnóstico ou a conduta de um médico ou profissional de saúde habilitado. O uso do app
          <strong className="font-semibold text-foreground"> não estabelece relação médico-paciente</strong>.
        </Section>
        <Section title="3. Conteúdo e limitações">
          Parte do material é <strong className="font-semibold text-foreground">educativa e pode não ter validação
          clínica formal</strong> (por exemplo, listas de sinais em linguagem do dia a dia e adaptações educativas).
          Instrumentos e escalas de terceiros são citados/creditados às suas fontes e podem exigir treinamento e
          licença próprios para aplicação profissional. O conteúdo pode conter imprecisões e ser alterado a qualquer
          tempo, sem aviso.
        </Section>
        <Section title="4. Responsabilidade do usuário">
          O uso das informações é de <strong className="font-semibold text-foreground">inteira responsabilidade do
          usuário</strong>. Em caso de dúvida, sintoma, piora ou urgência, procure um médico ou serviço de saúde. Em
          emergência, ligue para o serviço de urgência (ex.: SAMU 192).
        </Section>
        <Section title="5. Limitação de responsabilidade">
          Na máxima extensão permitida pela lei, os responsáveis pelo NeuroPed não se responsabilizam por decisões
          tomadas com base no conteúdo, nem por danos diretos ou indiretos decorrentes do uso ou da impossibilidade de
          uso da ferramenta.
        </Section>
        <Section title="6. Privacidade (LGPD)">
          O app, nesta versão pública, <strong className="font-semibold text-foreground">não coleta nem armazena dados
          identificáveis de pacientes</strong>. Preferências locais (ex.: tema) podem ficar no seu navegador. Não
          insira dados pessoais sensíveis de terceiros.
        </Section>
        <Section title="7. Propriedade intelectual">
          Marcas, escalas e materiais de terceiros pertencem aos respectivos titulares e são citados de forma
          educativa. O uso profissional de instrumentos licenciados depende de autorização dos detentores.
        </Section>
        <Section title="8. Alterações destes termos">
          Estes termos podem ser atualizados periodicamente. O uso continuado após alterações implica concordância com
          a versão vigente.
        </Section>
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Ao utilizar o NeuroPed você declara ter lido e compreendido este aviso e concorda com a sua finalidade
        exclusivamente educativa.
      </p>
    </div>
  );
}
