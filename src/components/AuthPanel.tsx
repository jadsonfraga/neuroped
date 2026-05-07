import { useState } from 'react';
import { hasConfiguredBackend, isProductionMode } from '../config';
import { sendMagicLink, signInWithEmail } from '../services/auth';

export function AuthPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isProductionMode) {
    return (
      <article className="panel">
        <span className="small-label">Autenticacao</span>
        <h2>Login desativado no modo demo</h2>
        <p>O acesso real so deve ser ativado depois de configurar Supabase, Auth e RLS.</p>
      </article>
    );
  }

  if (!hasConfiguredBackend) {
    return (
      <article className="panel warning-panel">
        <span className="small-label">Producao incompleta</span>
        <h2>Backend nao configurado</h2>
        <p>Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de liberar login.</p>
      </article>
    );
  }

  async function handlePasswordLogin() {
    setIsLoading(true);
    setMessage('');
    try {
      await signInWithEmail(email, password);
      setMessage('Login realizado com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha no login.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink() {
    setIsLoading(true);
    setMessage('');
    try {
      await sendMagicLink(email);
      setMessage('Link de acesso enviado, se o usuario estiver autorizado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao enviar link.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <article className="panel strong-panel">
      <span className="small-label">Producao</span>
      <h2>Login seguro</h2>
      <p>Use e-mail e senha ou link magico. CPF nunca deve ser senha.</p>
      <div className="form-stack">
        <label>
          <span>E-mail</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="usuario@dominio.com" />
        </label>
        <label>
          <span>Senha</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Senha cadastrada" />
        </label>
        <div className="button-row">
          <button type="button" onClick={handlePasswordLogin} disabled={isLoading || !email || !password}>Entrar</button>
          <button type="button" onClick={handleMagicLink} disabled={isLoading || !email} className="ghost-button">Enviar link</button>
        </div>
        {message ? <p className="status-message">{message}</p> : null}
      </div>
    </article>
  );
}
