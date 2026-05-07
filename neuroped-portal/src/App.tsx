export default function App() {
  return (
    <main className="contentOnly">
      <section className="panel">
        <p className="eyebrow">NeuroPed EDJ Portal</p>
        <h1>Portal demo seguro</h1>
        <p>Base React + Vite preparada para Supabase e Cloudflare Pages.</p>
        <div className="cards">
          <article className="card"><span>Modo</span><strong>Demo</strong></article>
          <article className="card"><span>Backend</span><strong>Supabase</strong></article>
          <article className="card"><span>Deploy</span><strong>Cloudflare Pages</strong></article>
        </div>
      </section>
    </main>
  );
}
