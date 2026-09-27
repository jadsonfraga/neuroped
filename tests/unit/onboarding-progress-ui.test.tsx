import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  OnboardingProgressSummary,
  onboardingProgressSchema,
} from "../../client/src/components/OnboardingProgressCard";
import {
  onboardingMilestoneDefinitions,
  type TenantOnboardingSnapshot,
} from "../../shared/onboarding";

// O tsconfig do app preserva JSX para o plugin React do Vite. No renderer Node
// isolado, disponibilizamos o runtime clássico usado pelo `tsx` neste teste.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

function blockedSnapshot(): TenantOnboardingSnapshot {
  const completedKeys = new Set([
    "account_created",
    "email_verified",
    "clinic_created",
    "plan_selected",
  ]);
  return {
    clinicId: "clinic-sintetica-onboarding",
    generatedAt: "2026-09-26T12:00:00.000Z",
    progress: { completed: 4, total: 10, percent: 40 },
    billingEvidence: {
      status: "BLOCKED_EXTERNAL",
      provider: "asaas",
      environment: null,
      confirmedAt: null,
      source: null,
      limitation:
        "Credenciais do provedor não estão disponíveis; nenhuma cobrança foi presumida.",
    },
    milestones: onboardingMilestoneDefinitions.map((definition) => {
      const completed = completedKeys.has(definition.key);
      return {
        ...definition,
        status:
          definition.key === "billing_configured"
            ? ("blocked_external" as const)
            : completed
              ? ("completed" as const)
              : ("pending" as const),
        completedAt: completed ? "2026-09-20T12:00:00.000Z" : null,
      };
    }),
  };
}

test("o contrato runtime aceita o snapshot canônico e rejeita progresso inconsistente", () => {
  const snapshot = blockedSnapshot();
  assert.equal(onboardingProgressSchema.safeParse(snapshot).success, true);

  assert.equal(
    onboardingProgressSchema.safeParse({ ...snapshot, inventado: 99 }).success,
    false,
    "campos desconhecidos não podem entrar na UI",
  );
  assert.equal(
    onboardingProgressSchema.safeParse({
      ...snapshot,
      progress: { ...snapshot.progress, percent: 100 },
    }).success,
    false,
    "percentual não pode divergir dos marcos",
  );
  assert.equal(
    onboardingProgressSchema.safeParse({
      ...snapshot,
      billingEvidence: {
        ...snapshot.billingEvidence,
        status: "AWAITING_PROVIDER_EVENT",
      },
    }).success,
    false,
    "estado visual de billing deve refletir a evidência do servidor",
  );
  assert.equal(
    onboardingProgressSchema.safeParse({
      ...snapshot,
      milestones: snapshot.milestones.map((milestone, index) =>
        index === 9 ? snapshot.milestones[0] : milestone,
      ),
    }).success,
    false,
    "a resposta deve conter cada marco canônico exatamente uma vez",
  );
});

test("o resumo distingue concluído, pendente e bloqueio externo sem presumir cobrança", () => {
  const html = renderToStaticMarkup(
    React.createElement(OnboardingProgressSummary, {
      onboarding: blockedSnapshot(),
    }),
  );

  assert.match(html, /4 de 10/);
  assert.match(html, /Progresso do onboarding: 40%/);
  assert.match(html, /data-status="completed"/);
  assert.match(html, /data-status="pending"/);
  assert.match(html, /data-status="blocked_external"/);
  assert.match(html, /Validação externa pendente/);
  assert.match(html, /bloqueada por dependência externa/);
  assert.match(html, /nenhuma cobrança foi presumida/);
  assert.doesNotMatch(html, /Cobrança: confirmada/);
});

test("o card é alcançável na home e consulta o tenant com cache isolado e cancelável", () => {
  const home = readFileSync("client/src/pages/home.tsx", "utf8");
  const component = readFileSync(
    "client/src/components/OnboardingProgressCard.tsx",
    "utf8",
  );

  assert.match(home, /import \{ OnboardingProgressCard \}/);
  assert.match(
    home,
    /<OnboardingProgressCard \/>[\s\S]*<ClinicalCockpit \/>/,
    "o progresso deve anteceder o cockpit da clínica ativa",
  );
  assert.match(
    component,
    /queryKey: \["tenant-onboarding-progress", user\?\.id, activeClinicId\]/,
  );
  assert.match(
    component,
    /\/api\/tenants\/\$\{encodeURIComponent\(activeClinicId\)\}\/onboarding/,
  );
  assert.match(component, /signal,/);
  assert.match(component, /cache: "no-store"/);
  assert.match(component, /gcTime: 0/);
  assert.match(component, /refetchOnMount: "always"/);
  assert.match(component, /onboardingProgressSchema\.parse/);
  assert.match(
    component,
    /roleHasPermission\(activeClinic\.role, "organization\.manage"\)/,
  );
  assert.doesNotMatch(
    component,
    /localStorage|sessionStorage|dangerouslySetInnerHTML/,
  );
  assert.doesNotMatch(component, /useMutation|method:\s*["'](?:POST|PATCH|PUT)/);
});
