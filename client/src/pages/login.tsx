import { Redirect } from "wouter";

/**
 * Rota legada mantida apenas para compatibilidade com links e favoritos antigos.
 *
 * Decisão permanente do autor: o NeuroPed não pode solicitar e-mail, senha ou
 * PIN para abrir a interface. A autorização dos dados persistidos continua sendo
 * responsabilidade exclusiva da API; esta página jamais deve renderizar um
 * formulário de credenciais.
 */
export default function LoginPage() {
  return <Redirect to="/" />;
}
