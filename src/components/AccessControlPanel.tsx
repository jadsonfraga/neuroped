export function AccessControlPanel() {
  return (
    <article className="panel">
      <span className="small-label">Compartilhamento</span>
      <h2>Controle temporario</h2>
      <p>Modulo preparado para vinculo por conta cadastrada, prazo definido e remocao posterior.</p>
      <div className="module-grid compact-grid">
        <article className="module-card"><h3>Conta</h3><p>Cadastro previo obrigatorio.</p></article>
        <article className="module-card"><h3>Prazo</h3><p>Todo vinculo deve expirar.</p></article>
        <article className="module-card"><h3>Remocao</h3><p>Fluxo preparado no servico.</p></article>
        <article className="module-card"><h3>Registro</h3><p>Acoes devem ser auditadas.</p></article>
      </div>
    </article>
  );
}
