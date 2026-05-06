import { useMemo, useState } from 'react';
import { canUseClinicalData, doctorIdentity, hasConfiguredBackend, isProductionMode } from './config';

async function makeHash(text: string) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [text, setText] = useState('');
  const [hash, setHash] = useState('');

  const status = useMemo(() => {
    if (!isProductionMode) return 'Modo demo seguro';
    if (!hasConfiguredBackend) return 'Produção incompleta';
    return 'Produção com backend configurado';
  }, []);

  async function handleHash() {
    const cleanText = text.trim();
    setHash(cleanText ? await makeHash(cleanText) : '');
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">NeuroPed EDJ</p>
          <h1>Portal em modo seguro antes do uso clínico real</h1>
          <p>
            O app foi convertido para projeto-fonte React/Vite e passa a bloquear dados sensíveis enquanto não houver backend seguro configurado.
          </p>
          <div className="hero-actions">
            <a href="#seguranca" className="primary-link">Ver segurança</a>
            <button type="button" onClick={() => window.print()} className="secondary-button">Exportar PDF</button>
          </div>
        </div>
        <aside className="identity-card">
          <strong>{doctorIdentity.name}</strong>
          <span>{doctorIdentity.specialty}</span>
          <span>{doctorIdentity.crm} | {doctorIdentity.rqe}</span>
          <span>{doctorIdentity.address}</span>
          <span>{doctorIdentity.phone}</span>
          <span>{doctorIdentity.email}</span>
        </aside>
      </section>

      <section id="seguranca" className="grid two-columns">
        <article className="panel strong-panel">
          <span className="small-label">Status operacional</span>
          <h2>{status}</h2>
          <ul className="check-list">
            <li>Armazenamento público externo removido da arquitetura ativa.</li>
            <li>Documento local não declara assinatura digital ICP-Brasil.</li>
            <li>Identidade médica padronizada.</li>
            <li>Workflow passa a executar build real.</li>
            <li>Projeto-fonte criado em src/.</li>
          </ul>
        </article>

        <article className="panel warning-panel">
          <span className="small-label">Bloqueio clínico</span>
          <h2>{canUseClinicalData ? 'Backend configurado' : 'Não usar com pacientes reais'}</h2>
          <p>
            Em modo demo, não informe dados identificáveis. Para produção, configure Supabase com autenticação, permissões, auditoria e políticas RLS.
          </p>
        </article>
      </section>

      <section className="panel">
        <span className="small-label">Módulos</span>
        <h2>Estado após correções</h2>
        <div className="module-grid">
          <article className="module-card"><h3>Escalas</h3><p>Uso educacional sem gravação clínica real.</p></article>
          <article className="module-card"><h3>Prontuário</h3><p>Bloqueado até backend seguro estar ativo.</p></article>
          <article className="module-card"><h3>Portal familiar</h3><p>Deve usar convite seguro, senha própria e expiração.</p></article>
          <article className="module-card"><h3>PDF premium</h3><p>Disponível como impressão visual; documentos reais exigem revisão.</p></article>
        </div>
      </section>

      <section className="grid two-columns">
        <article className="panel">
          <span className="small-label">Integridade local</span>
          <h2>Hash local, sem ICP-Brasil</h2>
          <p>Este recurso apenas calcula SHA-256 local. Não equivale a assinatura digital certificada.</p>
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Use somente texto fictício." rows={7} />
          <div className="button-row">
            <button type="button" onClick={handleHash}>Gerar hash</button>
            <button type="button" onClick={() => { setText(''); setHash(''); }} className="ghost-button">Limpar</button>
          </div>
          {hash ? <code className="hash-box">{hash}</code> : null}
        </article>

        <article className="panel">
          <span className="small-label">Produção</span>
          <h2>Próximos requisitos</h2>
          <ol className="numbered-list">
            <li>Configurar Supabase.</li>
            <li>Aplicar migração SQL.</li>
            <li>Ativar autenticação forte.</li>
            <li>Publicar variáveis de ambiente.</li>
            <li>Usar serviço real de assinatura digital.</li>
          </ol>
        </article>
      </section>
    </main>
  );
}
