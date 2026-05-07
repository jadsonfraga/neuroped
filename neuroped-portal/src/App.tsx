const box = { padding: 24, border: '1px solid #d9e1ea', borderRadius: 18, background: '#fff', marginBottom: 16 } as const;
const card = { padding: 18, border: '1px solid #d9e1ea', borderRadius: 16, background: '#fafafa' } as const;

export default function App() {
  return (
    <main style={{ minHeight: '100vh', padding: 24, background: '#f5f7fa', color: '#1f2a37', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ maxWidth: 1120, margin: '0 auto' }}>
        <header style={{ ...box, background: '#00696f', color: '#fff' }}>
          <p style={{ letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>NeuroPed EDJ Portal</p>
          <h1 style={{ margin: '8px 0', fontSize: 42 }}>Portal demo seguro</h1>
          <p style={{ margin: 0 }}>Dr. Jadson Fraga Araújo Júnior · Neurologista Infantil · CRM-PE 25.227 · RQE 17.756</p>
        </header>

        <section style={box}>
          <h2>1. Login</h2>
          <p>Tela preparada para autenticação Supabase Auth. Na demo, nenhum documento pessoal é usado como senha.</p>
          <button style={{ padding: '12px 18px', borderRadius: 12, border: 0, background: '#7a1f2b', color: '#fff' }}>Entrar em modo demo</button>
        </section>

        <section style={box}>
          <h2>2. Dashboard</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <article style={card}><span>Registros fictícios</span><strong style={{ display: 'block', fontSize: 24 }}>2</strong></article>
            <article style={card}><span>Documentos demo</span><strong style={{ display: 'block', fontSize: 24 }}>2</strong></article>
            <article style={card}><span>RLS</span><strong style={{ display: 'block', fontSize: 24 }}>SQL pronto</strong></article>
            <article style={card}><span>Storage</span><strong style={{ display: 'block', fontSize: 24 }}>Privado</strong></article>
          </div>
        </section>

        <section style={box}>
          <h2>3. Lista de registros fictícios</h2>
          <div style={card}><strong>João Demo</strong><p>paciente-demo-001 · Registro fictício para teste.</p></div>
          <div style={card}><strong>Maria Exemplo</strong><p>paciente-demo-002 · Registro fictício para navegação.</p></div>
        </section>

        <section style={box}>
          <h2>4. Detalhe fictício</h2>
          <p>Código: paciente-demo-001</p>
          <p>Contato: Responsável Teste</p>
          <p>Observação: conteúdo demonstrativo, sem dado real.</p>
        </section>

        <section style={box}>
          <h2>5. Documentos demo</h2>
          <p>Documento gerado eletronicamente, pendente de assinatura médica válida quando exigida.</p>
          <div style={card}>Relatório demonstrativo de acompanhamento · draft</div>
        </section>

        <section style={box}>
          <h2>6. Administração e auditoria</h2>
          <p>Perfis planejados: admin, medico, secretaria e familia. Logs ficam na tabela audit_logs.</p>
        </section>

        <section style={{ ...box, borderColor: '#7a1f2b' }}>
          <h2>Acesso negado</h2>
          <p>Áreas internas exigem login e perfil autorizado pelo Supabase.</p>
        </section>
      </section>
    </main>
  );
}
