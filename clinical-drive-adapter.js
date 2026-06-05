/* =====================================================================
   NeuroPed EDJ · CLINICAL DRIVE ADAPTER V4.0
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Implementação real do DriveAdapter (interface vazia em V3.2).

   2 MODOS:
     · "event"  (default) — dispatcha "neuroped:upload-to-drive" e deixa
                            que o MCP Google Drive (configurado em
                            CLAUDE.md) capture e suba para a pasta
                            "Laudos NeuroPed" automaticamente.
     · "rest"            — usa Google Drive REST API v3 com OAuth2 token
                            (Client ID precisa estar configurado).

   ATENDE A REGRA DO CLAUDE.md:
     parentId = 1I6hUmweVTo2TP_xsqUTKfcnhCCW8TzEY
     contentMimeType = application/pdf | application/vnd.openxml...word
     disableConversionToGoogleType = true
     nome no padrão: "Laudo - <Paciente> - <YYYY-MM-DD>.pdf"
   ===================================================================== */
(function (global) {
  "use strict";

  const DRIVE_FOLDER_ID = "1I6hUmweVTo2TP_xsqUTKfcnhCCW8TzEY";
  const DRIVE_FOLDER_NAME = "Laudos NeuroPed";

  function fmtDate(d) {
    d = d instanceof Date ? d : new Date();
    return d.toISOString().slice(0, 10);
  }
  function defaultLaudoName(patient) {
    const nome = (patient?.name || patient?.id || "anon").replace(/[\\/:*?"<>|]/g, "_");
    return `Laudo - ${nome} - ${fmtDate()}.pdf`;
  }

  /* ------------------------------------------------------------------
   *  CLASSE PRINCIPAL
   * ------------------------------------------------------------------ */
  class DriveAdapter {
    /**
     * @param {{mode?: "event"|"rest", clientId?: string, accessToken?: string}} [opts]
     */
    constructor(opts = {}) {
      this.mode = opts.mode || "event";
      this.clientId = opts.clientId || null;
      this.accessToken = opts.accessToken || null;
      this.folderId = opts.folderId || DRIVE_FOLDER_ID;
      this.folderName = opts.folderName || DRIVE_FOLDER_NAME;
      this._uploadAudit = [];
      this._namespace = "neuro.drive.v4";
    }

    /** Upload de PDF. @param {{blob: Blob, filename?: string, patient?: Object, contentMimeType?: string}} args */
    async uploadPDF(args) {
      if (!args || !args.blob) return { ok: false, error: "missing_blob" };
      const filename = args.filename || defaultLaudoName(args.patient);
      const mime = args.contentMimeType || args.blob.type || "application/pdf";

      const record = {
        ts: Date.now(),
        filename,
        size: args.blob.size,
        mime,
        mode: this.mode,
        parentId: this.folderId,
        patient_id: args.patient?.id || null
      };

      let result;
      if (this.mode === "rest" && this.accessToken) {
        result = await this._uploadViaREST(args.blob, filename, mime);
      } else {
        result = this._dispatchEvent(args.blob, filename, mime, args.patient);
      }
      record.ok = !!result?.ok;
      record.driveId = result?.id || null;
      record.error = result?.error || null;
      this._audit(record);
      this._notifyBus(record);
      return { ...result, filename, audit: record };
    }

    /** Lista os últimos uploads conhecidos (audit local). */
    listLaudos(limit = 50) {
      return this._auditRead().slice(-limit).reverse();
    }

    /* ----------------- MODO REST ----------------- */
    async _uploadViaREST(blob, filename, mime) {
      try {
        // metadata first
        const metadata = {
          name: filename,
          mimeType: mime,
          parents: [this.folderId],
          appProperties: {
            source: "NeuroPed Clinical Platform V4",
            doctor: "Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756"
          }
        };
        // multipart upload (simples, sem resumable)
        const boundary = "-------neuroped" + Math.random().toString(36).slice(2);
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;
        const metaPart =
          delimiter + "Content-Type: application/json\r\n\r\n" +
          JSON.stringify(metadata);
        const dataPart =
          delimiter + `Content-Type: ${mime}\r\nContent-Transfer-Encoding: base64\r\n\r\n` +
          (await blobToBase64(blob));
        const body = metaPart + dataPart + closeDelim;

        const res = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart" +
          "&supportsAllDrives=true&keepRevisionForever=true" +
          "&convertToGoogleAppFormat=false",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": `multipart/related; boundary=${boundary}`
            },
            body
          }
        );
        if (!res.ok) {
          const txt = await res.text();
          return { ok: false, error: `drive_rest_${res.status}`, detail: txt };
        }
        const json = await res.json();
        return { ok: true, id: json.id, name: json.name };
      } catch (e) {
        return { ok: false, error: "rest_exception", message: e.message };
      }
    }

    /* ----------------- MODO EVENT ----------------- */
    _dispatchEvent(blob, filename, mime, patient) {
      try {
        const url = URL.createObjectURL(blob);
        const ev = new CustomEvent("neuroped:upload-to-drive", {
          detail: {
            filename,
            mime,
            objectURL: url,
            size: blob.size,
            parentId: this.folderId,
            folderName: this.folderName,
            patient,
            disableConversionToGoogleType: true,
            source: "NeuroPed Clinical Platform V4",
            doctor: "Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756"
          }
        });
        global.dispatchEvent(ev);
        // mantém objectURL acessível por 5 min para o MCP poder ler
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
        return { ok: true, mode: "event", objectURL: url };
      } catch (e) {
        return { ok: false, error: "event_exception", message: e.message };
      }
    }

    /* ----------------- AUDIT ----------------- */
    _audit(record) { this._uploadAudit.push(record); this._persistAudit(); }
    _persistAudit() {
      try { localStorage.setItem(this._namespace + ".audit", JSON.stringify(this._uploadAudit.slice(-500))); }
      catch (_) {}
    }
    _auditRead() {
      try { return JSON.parse(localStorage.getItem(this._namespace + ".audit") || "[]"); }
      catch (_) { return []; }
    }
    _notifyBus(record) {
      const bus = global.NeuroPedClinicalEventBus?.bus;
      bus && bus.emit("pdf:generated", { drive_audit: record }, { engine: "DriveAdapter" });
    }
  }

  /* ---------- util ---------- */
  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  }

  /* ------------------------------------------------------------------
   *  AUTO-WIRE: escuta neuroped:laudo-generated do PDF V3.1/V3.2
   *  e dispara upload automaticamente (CLAUDE.md compliance).
   * ------------------------------------------------------------------ */
  function autoWire(adapter) {
    if (typeof window === "undefined") return;
    if (window.__neuropedDriveAutoWired) return;
    window.addEventListener("neuroped:laudo-generated", async (e) => {
      const d = e.detail || {};
      // Se o evento já carrega o blob (raro), usa direto
      if (d.blob) {
        await adapter.uploadPDF({ blob: d.blob, filename: d.filename, patient: d.patient });
      } else if (d.filename) {
        // Tenta reler o último file salvo via jsPDF (não há blob direto)
        // No modo "event" o adapter apenas relana com os detalhes que tem
        const ev2 = new CustomEvent("neuroped:upload-to-drive", {
          detail: { ...d, parentId: adapter.folderId, folderName: adapter.folderName }
        });
        window.dispatchEvent(ev2);
      }
    });
    window.__neuropedDriveAutoWired = true;
  }

  const defaultAdapter = new DriveAdapter({ mode: "event" });
  if (typeof window !== "undefined") {
    window.addEventListener("DOMContentLoaded", () => autoWire(defaultAdapter));
  }

  global.NeuroPedClinicalV4 = global.NeuroPedClinicalV4 || {};
  global.NeuroPedClinicalV4.DriveAdapter = DriveAdapter;
  global.NeuroPedClinicalV4.driveAdapter = defaultAdapter;
  global.NeuroPedClinicalV4.DRIVE_FOLDER_ID = DRIVE_FOLDER_ID;
  global.NeuroPedClinicalV4.DRIVE_FOLDER_NAME = DRIVE_FOLDER_NAME;
  global.NeuroPedClinicalV4.driveVersion = "4.0.0";
  if (typeof module !== "undefined" && module.exports) module.exports = { DriveAdapter };
})(typeof window !== "undefined" ? window : globalThis);
