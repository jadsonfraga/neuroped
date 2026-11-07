// Regressão (diagnóstico 07/11/2026, P1): a ficha do paciente chamava
// /api/clinical-core/events, rota que só existe no adaptador Express. Em
// produção (Cloudflare Functions) o cockpit e as metas terapêuticas ficavam
// "Indisponível" e não gravavam. Em sessão LIVE a fonte deve ser
// /api/live/events, isolada por clínica. Dados 100% sintéticos.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  clinicalEventFromWriteResponse,
  clinicalEventWriteRequest,
  clinicalEventsFromResponse,
  clinicalEventsQueryKey,
  clinicalEventsReady,
} from "../../client/src/lib/clinicalEventsSource";

const LIVE = { live: true, clinicId: "clinic-sintetica" };
const LOCAL = { live: false, clinicId: null };

describe("clinicalEventsSource", () => {
  it("usa a rota LIVE por clínica em sessão remota e o legado só no modo local", () => {
    assert.equal(
      clinicalEventsQueryKey("pac-1", LIVE),
      "/api/live/events?clinicId=clinic-sintetica&patientId=pac-1",
    );
    assert.equal(clinicalEventsQueryKey("pac-1", LOCAL), "/api/clinical-core/events?patient_id=pac-1&days=3650");
  });

  it("não consulta nada em LIVE enquanto a clínica ativa não está resolvida", () => {
    assert.equal(clinicalEventsReady("pac-1", { live: true, clinicId: null }), false);
    assert.equal(clinicalEventsReady("pac-1", LIVE), true);
    assert.equal(clinicalEventsReady("", LOCAL), false);
  });

  it("normaliza a linha LIVE e descarta tipos que não são eventos do cockpit", () => {
    const events = clinicalEventsFromResponse(
      {
        data: [
          {
            id: "ev-1",
            patientId: "pac-1",
            eventType: "plan",
            occurredAt: "2026-11-01T10:00:00.000Z",
            provenanceKind: "decision",
            provenanceSource: "clinician",
            payload: { kind: "therapy", target: "Meta sintética", status: "in_progress", priority: "routine" },
            supersedesEventId: null,
            status: "active",
          },
          { id: "doc-1", patientId: "pac-1", eventType: "document", occurredAt: "2026-11-01T10:00:00.000Z", payload: {} },
        ],
      },
      LIVE,
    );
    assert.equal(events.length, 1);
    const [event] = events as unknown as Array<Record<string, any>>;
    assert.deepEqual(event.provenance, { kind: "decision", source: "clinician" });
    assert.equal(event.data.target, "Meta sintética");
    assert.equal(event.status, "active");
    assert.equal("supersedesEventId" in event, false);
  });

  it("monta o corpo LIVE com clinicId, proveniência achatada e payload", () => {
    const request = clinicalEventWriteRequest(
      {
        patientId: "pac-1",
        eventType: "outcome",
        occurredAt: "2026-11-02T10:00:00.000Z",
        supersedesEventId: "ev-0",
        provenance: { kind: "measured", source: "clinician", sourceLabel: "Medida sintética" },
        data: { measure: "Medida sintética", context: "clinic" },
      } as any,
      LIVE,
    );
    assert.equal(request.url, "/api/live/events");
    assert.deepEqual(request.body, {
      clinicId: "clinic-sintetica",
      patientId: "pac-1",
      eventType: "outcome",
      occurredAt: "2026-11-02T10:00:00.000Z",
      supersedesEventId: "ev-0",
      provenanceKind: "measured",
      provenanceSource: "clinician",
      payload: { measure: "Medida sintética", context: "clinic" },
    });
    assert.throws(() => clinicalEventWriteRequest({ provenance: {} } as any, { live: true, clinicId: null }));
  });

  it("converte a resposta de escrita LIVE para o formato canônico", () => {
    const event = clinicalEventFromWriteResponse(
      { id: "ev-2", patientId: "pac-1", eventType: "plan", occurredAt: "2026-11-02T10:00:00.000Z", provenanceKind: "decision", provenanceSource: "clinician", payload: { target: "x" }, status: "active" },
      LIVE,
    ) as unknown as Record<string, any>;
    assert.equal(event.data.target, "x");
    assert.equal(event.provenance.kind, "decision");
  });
});

describe("ficha do paciente não chama rota inexistente em produção", () => {
  it("a rota legada não existe nas Functions (premissa do adaptador)", () => {
    assert.equal(existsSync("functions/api/clinical-core/events.ts"), false);
    assert.equal(existsSync("functions/api/clinical-core/events/index.ts"), false);
  });

  for (const file of [
    "client/src/components/clinical/PatientCockpit.tsx",
    "client/src/components/clinical/TherapyGoalsPanel.tsx",
  ]) {
    it(`${file} não fixa /api/clinical-core/events e usa a fonte compartilhada`, () => {
      const source = readFileSync(file, "utf8");
      assert.equal(source.includes("/api/clinical-core/events"), false);
      assert.match(source, /@\/lib\/clinicalEventsSource/);
    });
  }

  it("o cockpit não consulta tabelas legadas de consulta/Conecta em sessão LIVE", () => {
    const source = readFileSync("client/src/components/clinical/PatientCockpit.tsx", "utf8");
    assert.match(source, /\/api\/consultations[\s\S]{0,160}enabled: Boolean\(patientId\) && !live/);
    assert.match(source, /\/api\/conecta\/events[\s\S]{0,160}enabled: Boolean\(patientId\) && !live/);
  });
});
