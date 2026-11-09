import "@/styles/renderizador.css";
import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Download,
  Check,
  ShieldCheck,
  ArrowUpRight,
  RotateCcw,
  ChevronRight,
  LoaderCircle,
  FileCheck2,
} from "lucide-react";
import { createPdfBlob, sample } from "@/lib/renderizador/document.mjs";
export default function RenderizadorPage() {
  const [md, setMd] = useState(""),
    [name, setName] = useState(""),
    [patient, setPatient] = useState(""),
    [detail, setDetail] = useState(""),
    [title, setTitle] = useState("Laudo Neuropediátrico"),
    [subtitle, setSubtitle] = useState("Avaliação neuropediátrica"),
    [tab, setTab] = useState("upload"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [url, setUrl] = useState(""),
    [approved, setApproved] = useState(false),
    [drag, setDrag] = useState(false),
    [manifest, setManifest] = useState<Record<string, unknown> | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  useEffect(() => {
    let active = true;
    fetch(import.meta.env.BASE_URL + "renderizador/brasao.png.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((p: { data: string }) => {
        if (active) setLogoPreview("data:image/png;base64," + p.data);
      })
      .catch(() => {
        if (active)
          setError(
            "Não foi possível carregar o brasão. Tente atualizar a página.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const input = useRef<HTMLInputElement>(null);
  const oldUrl = useRef("");
  const generation = useRef(0);
  useEffect(
    () => () => {
      if (oldUrl.current) URL.revokeObjectURL(oldUrl.current);
    },
    [],
  );
  function invalidate() {
    generation.current++;
    setApproved(false);
    setUrl("");
    setManifest(null);
    setError("");
  }
  async function load(f?: File) {
    if (!f) return;
    if (!/\.(md|markdown)$/i.test(f.name)) {
      setError("Selecione um arquivo .md ou .markdown.");
      return;
    }
    if (f.size > 2000000) {
      setError("O limite por arquivo é de 2 MB.");
      return;
    }
    invalidate();
    setMd(await f.text());
    setName(f.name);
    setTab("editor");
  }
  function demo() {
    invalidate();
    setMd(sample);
    setName("exemplo-demonstrativo.md");
    setPatient("Documento demonstrativo");
    setDetail("Exemplo sem dados clínicos");
    setTab("editor");
  }
  async function render() {
    if (!md.trim() || !patient.trim()) {
      setError("Adicione o Markdown e informe o nome para a capa.");
      return;
    }
    const job = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const [{ jsPDF }, ...assetsJson] = await Promise.all([
        import("jspdf"),
        ...["regular.ttf", "bold.ttf", "italic.ttf", "brasao.png"].map(async (f) => {
          const r = await fetch(import.meta.env.BASE_URL + "renderizador/" + f + ".json");
          if (!r.ok) throw Error("Não foi possível carregar os recursos visuais.");
          return (await r.json()) as { data: string };
        }),
      ]);
      const [regular, bold, italic, logo] = assetsJson as { data: string }[];
      const meta = { patient: patient.trim(), detail, title, subtitle };
      const blob = createPdfBlob(jsPDF, md, meta, {
        fonts: { normal: regular.data, bold: bold.data, italic: italic.data },
        logo: "data:image/png;base64," + logo.data,
      });
      if (job !== generation.current) return;
      if (oldUrl.current) URL.revokeObjectURL(oldUrl.current);
      oldUrl.current = URL.createObjectURL(blob);
      setUrl(oldUrl.current);
      const hash = async (b: ArrayBuffer) =>
        Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b)))
          .map((n) => n.toString(16).padStart(2, "0"))
          .join("");
      setManifest({
        template: "PANT Studio 1.0",
        generated_at: new Date().toISOString(),
        markdown_sha256: await hash(
          new TextEncoder().encode(md).buffer as ArrayBuffer,
        ),
        pdf_sha256: await hash(await blob.arrayBuffer()),
        metadata: meta,
      });
      setApproved(false);
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Não foi possível gerar o PDF.",
      );
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!url || !approved) return;
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "PANT_" + patient.trim().replace(/[^\p{L}\p{N}]+/gu, "_") + ".pdf";
    a.click();
  }
  function saveManifest() {
    const u = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              ...manifest,
              medical_acceptance_at: new Date().toISOString(),
              review_confirmed: approved,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "PANT_manifesto.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  return (
    <div className="pant-studio-root">
      <div className="main">
        <section aria-label="Renderizador PANT">
          <div className="heading">
            <div>
              <div className="eyebrow">DO TEXTO AO DOCUMENTO</div>
              <h1>Renderizador</h1>
              <p>
                Transforme Markdown em um PDF com a identidade SuperNeuroPed.
              </p>
            </div>
            <button className="text-button" onClick={demo}>
              Conhecer o modelo <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="steps">
            <span className="current">
              <b>1</b> Adicione o conteúdo
            </span>
            <i />
            <span className={url ? "current" : ""}>
              <b>2</b> Revise o documento
            </span>
            <i />
            <span className={approved ? "current" : ""}>
              <b>3</b> Exporte o PDF
            </span>
          </div>
          <div className="studio">
            <section className="editor-card">
              <div className="card-title">
                <div>
                  <span className="square-icon">
                    <FileText size={18} />
                  </span>
                  <h2>Conteúdo do laudo</h2>
                </div>
                <span className="tag">MARKDOWN</span>
              </div>
              <div className="tabs">
                <button
                  className={tab === "upload" ? "selected" : ""}
                  onClick={() => setTab("upload")}
                >
                  Enviar arquivo
                </button>
                <button
                  className={tab === "editor" ? "selected" : ""}
                  onClick={() => setTab("editor")}
                >
                  Colar ou editar texto
                </button>
              </div>
              {tab === "upload" ? (
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      input.current?.click();
                  }}
                  className={"dropzone " + (drag ? "drag" : "")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    load(e.dataTransfer.files[0]);
                  }}
                  onClick={() => input.current?.click()}
                >
                  <span className="upload-icon">
                    <Upload size={25} />
                  </span>
                  <h3>Solte seu laudo aqui</h3>
                  <p>
                    ou <u>escolha um arquivo</u> no computador
                  </p>
                  <small>.md ou .markdown · até 2 MB</small>
                </div>
              ) : (
                <div className="textarea-wrap">
                  <textarea
                    aria-label="Markdown do laudo"
                    placeholder="Cole o conteúdo integral do laudo em Markdown…"
                    value={md}
                    onChange={(e) => {
                      invalidate();
                      setMd(e.target.value);
                    }}
                    spellCheck={false}
                  />
                  <div>
                    {name || "Texto colado"}
                    <span>{md.length.toLocaleString("pt-BR")} caracteres</span>
                  </div>
                </div>
              )}
              <input
                ref={input}
                type="file"
                accept=".md,.markdown,text/markdown"
                hidden
                onChange={(e) => load(e.target.files?.[0])}
              />
              <div className="section-label">
                PERSONALIZE A CAPA <span>O corpo do texto é preservado</span>
              </div>
              <label>
                Nome do paciente
                <input
                  value={patient}
                  maxLength={100}
                  placeholder="Nome completo"
                  onChange={(e) => {
                    invalidate();
                    setPatient(e.target.value);
                  }}
                />
              </label>
              <label>
                Informações complementares
                <input
                  value={detail}
                  maxLength={140}
                  placeholder="Idade · data da consulta, conforme o laudo"
                  onChange={(e) => {
                    invalidate();
                    setDetail(e.target.value);
                  }}
                />
              </label>
              <div className="form-grid">
                <label>
                  Título
                  <input
                    value={title}
                    maxLength={70}
                    onChange={(e) => {
                      invalidate();
                      setTitle(e.target.value);
                    }}
                  />
                </label>
                <label>
                  Subtítulo
                  <input
                    value={subtitle}
                    maxLength={100}
                    onChange={(e) => {
                      invalidate();
                      setSubtitle(e.target.value);
                    }}
                  />
                </label>
              </div>
              <div className="render-row">
                <span>
                  <ShieldCheck size={14} /> Processamento local
                </span>
                <button
                  className="primary"
                  disabled={
                    busy || !md.trim() || !patient.trim() || !title.trim()
                  }
                  onClick={render}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <FileCheck2 size={17} />
                  )}{" "}
                  {busy ? "Renderizando…" : "Gerar prévia PDF"}{" "}
                  {!busy && <ChevronRight size={16} />}
                </button>
              </div>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </section>
            <section className="preview-card">
              <div className="preview-toolbar">
                <div>
                  <span className={"status-dot " + (url ? "ready" : "")} />
                  {url ? "PDF pronto para revisão" : "Modelo SuperNeuroPed"}
                </div>
                <span>A4 · RETRATO</span>
              </div>
              <div className={"preview-stage " + (url ? "has-pdf" : "")}>
                {url ? (
                  <iframe
                    title="Prévia integral do PDF"
                    src={url + "#toolbar=1&view=FitH"}
                  />
                ) : (
                  <div className="paper-cover">
                    <div className="cover-border">
                      <img src={logoPreview} alt="Brasão Dr. Jadson Fraga" />
                      <div className="cover-brand">
                        S U P E R N E U R O P E D
                      </div>
                      <h2>{title}</h2>
                      <div className="cover-subtitle">{subtitle}</div>
                      <div className="cover-divider">◇</div>
                      <span className="cover-patient-label">
                        P A C I E N T E
                      </span>
                      <h3>{patient || "Nome do paciente"}</h3>
                      <p>{detail || "Informações da consulta"}</p>
                      <div className="cover-doctor">
                        Dr. Jadson Fraga Araújo Júnior
                        <small>
                          NEUROPEDIATRA · CRM-PE 25.227 · RQE 17.756
                        </small>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="preview-bottom">
                <span>
                  <Check size={14} /> Capa com brasão
                </span>
                <span>
                  <Check size={14} /> Paginação automática
                </span>
                <span>
                  <Check size={14} /> Texto selecionável
                </span>
              </div>
              {url && (
                <div className="export-box">
                  <label className="approval">
                    <input
                      type="checkbox"
                      checked={approved}
                      onChange={(e) => setApproved(e.target.checked)}
                    />{" "}
                    Revisei o texto integral e todas as páginas. Aprovo esta
                    versão para exportação, sem assinatura automática.
                  </label>
                  <button
                    className="primary"
                    disabled={!approved}
                    onClick={download}
                  >
                    <Download size={17} /> Baixar PDF
                  </button>
                  <button
                    className="text-button"
                    disabled={!approved}
                    onClick={saveManifest}
                  >
                    Baixar manifesto SHA-256
                  </button>
                </div>
              )}
            </section>
          </div>
          <div className="bottom-notes">
            <span>
              <ShieldCheck size={16} /> Seu texto, preservado. Sem reescrita ou
              decisões clínicas automáticas.
            </span>
            <button
              onClick={() => {
                if (md && !window.confirm("Limpar o conteúdo deste documento?"))
                  return;
                invalidate();
                setMd("");
                setName("");
                setPatient("");
                setDetail("");
                setTab("upload");
              }}
            >
              <RotateCcw size={14} /> Novo documento
            </button>
          </div>
          <footer>
            <span>
              PANT STUDIO <b>·</b> SUPERNEUROPED
            </span>
            <span>Soli Deo Gloria</span>
          </footer>
        </section>
      </div>
    </div>
  );
}
