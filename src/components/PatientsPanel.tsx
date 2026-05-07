import { useEffect, useState } from 'react';
import { createPatient, listPatients } from '../services/patients';
import { writeAuditEvent } from '../services/audit';
import type { Patient } from '../types/database';

type Props = { actorId: string };

export function PatientsPanel({ actorId }: Props) {
  const [items, setItems] = useState<Patient[]>([]);
  const [initials, setInitials] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      setItems(await listPatients());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao listar registros.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function addPatient() {
    const cleanInitials = initials.trim().toUpperCase();
    const parsedYear = Number.parseInt(birthYear, 10);
    if (!cleanInitials || Number.isNaN(parsedYear)) {
      setMessage('Informe iniciais e ano valido.');
      return;
    }

    setLoading(true);
    try {
      const created = await createPatient({ ownerId: actorId, initials: cleanInitials, birthYear: parsedYear });
      await writeAuditEvent({ actorId, eventName: 'patient_created', targetTable: 'patients', targetId: created.id, metadata: { initials: cleanInitials } });
      setInitials('');
      setBirthYear('');
      await load();
      setMessage('Registro pseudonimizado criado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao criar registro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="panel">
      <span className="small-label">Pacientes</span>
      <h2>Registros pseudonimizados</h2>
      <p>Fase inicial: usar somente iniciais e ano de nascimento.</p>
      <div className="form-stack compact-form">
        <label><span>Iniciais</span><input value={initials} onChange={(event) => setInitials(event.target.value)} maxLength={6} placeholder="ABC" /></label>
        <label><span>Ano</span><input value={birthYear} onChange={(event) => setBirthYear(event.target.value)} inputMode="numeric" placeholder="2018" /></label>
        <div className="button-row"><button type="button" onClick={() => void addPatient()} disabled={loading}>Criar</button><button type="button" onClick={() => void load()} className="ghost-button">Atualizar</button></div>
      </div>
      {message ? <p className="status-message">{message}</p> : null}
      <div className="table-shell">
        <table><thead><tr><th>Iniciais</th><th>Ano</th><th>Criado em</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.initials}</td><td>{item.birth_year ?? '-'}</td><td>{new Date(item.created_at).toLocaleDateString('pt-BR')}</td></tr>)}</tbody></table>
      </div>
    </article>
  );
}
