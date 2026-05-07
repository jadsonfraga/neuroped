import { useState } from 'react';
import { listAuditEvents } from '../services/audit';
import type { AuditEvent, UserRole } from '../types/database';

type Props = { role: UserRole };

export function AuditPanel({ role }: Props) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (role !== 'doctor') {
    return (
      <article className="panel warning-panel">
        <span className="small-label">Auditoria</span>
        <h2>Acesso restrito</h2>
        <p>Este painel fica disponivel apenas para perfil medico responsavel.</p>
      </article>
    );
  }

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      setEvents(await listAuditEvents());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar auditoria.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel">
      <div className="dashboard-header">
        <div><span className="small-label">Auditoria</span><h2>Eventos recentes</h2><p>Exibe eventos registrados por acoes operacionais.</p></div>
        <button type="button" onClick={() => void load()} disabled={loading}>Carregar</button>
      </div>
      {message ? <p className="status-message">{message}</p> : null}
      <div className="table-shell">
        <table>
          <thead><tr><th>Data</th><th>Evento</th><th>Tabela</th><th>Alvo</th></tr></thead>
          <tbody>{events.map((event) => <tr key={event.id}><td>{new Date(event.created_at).toLocaleString('pt-BR')}</td><td>{event.event_name}</td><td>{event.target_table}</td><td>{event.target_id ?? '-'}</td></tr>)}</tbody>
        </table>
      </div>
    </article>
  );
}
