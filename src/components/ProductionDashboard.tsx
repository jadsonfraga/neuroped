import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { appEnvironment, hasConfiguredBackend } from '../config';
import { getCurrentUser, getMyProfile, signOut } from '../services/auth';
import type { Profile } from '../types/database';

type State = { user: User | null; profile: Profile | null; loading: boolean; error: string };

export function ProductionDashboard({ refreshToken }: { refreshToken: number }) {
  const [state, setState] = useState<State>({ user: null, profile: null, loading: true, error: '' });

  async function load() {
    if (!hasConfiguredBackend) {
      setState({ user: null, profile: null, loading: false, error: 'Backend nao configurado.' });
      return;
    }
    try {
      const user = await getCurrentUser();
      const profile = user ? await getMyProfile() : null;
      setState({ user, profile, loading: false, error: '' });
    } catch (error) {
      setState({ user: null, profile: null, loading: false, error: error instanceof Error ? error.message : 'Falha ao carregar.' });
    }
  }

  useEffect(() => { void load(); }, [refreshToken]);

  async function leave() {
    await signOut();
    await load();
  }

  if (state.loading) return <section className="panel"><span className="small-label">Dashboard</span><h2>Carregando</h2><p>Validando sessao.</p></section>;
  if (!state.user) return <section className="panel warning-panel"><span className="small-label">Dashboard</span><h2>Sem sessao ativa</h2><p>Faca login para continuar.</p>{state.error ? <p className="status-message">{state.error}</p> : null}</section>;
  if (!state.profile) return <section className="panel warning-panel"><span className="small-label">Perfil</span><h2>Perfil ausente</h2><p>Configure o perfil deste usuario no banco.</p><code className="inline-code">{state.user.id}</code><div className="button-row top-gap"><button type="button" onClick={() => void leave()} className="ghost-button">Sair</button><button type="button" onClick={() => void load()}>Recarregar</button></div></section>;

  return (
    <section className="dashboard-stack">
      <article className="panel strong-panel">
        <div className="dashboard-header">
          <div><span className="small-label">Dashboard</span><h2>Ambiente conectado</h2><p>Modulos operacionais preparados para validacao.</p></div>
          <div className="button-row"><button type="button" onClick={() => void load()}>Atualizar</button><button type="button" onClick={() => void leave()} className="ghost-button">Sair</button></div>
        </div>
        <div className="status-grid">
          <div><strong>Ambiente</strong><span>{appEnvironment}</span></div>
          <div><strong>Backend</strong><span>{hasConfiguredBackend ? 'configurado' : 'ausente'}</span></div>
          <div><strong>Papel</strong><span>{state.profile.role}</span></div>
          <div><strong>Usuario</strong><span>{state.user.email ?? state.user.id}</span></div>
        </div>
      </article>
    </section>
  );
}
