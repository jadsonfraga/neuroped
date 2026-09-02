const API_BASE = (import.meta.env?.VITE_API_URL ?? "").replace(/\/$/, "");

export interface SelfServiceRegistrationInput {
  name: string;
  email: string;
  password: string;
  specialty?: string;
  professionalRegistry?: string;
}

export interface SelfServiceRegistrationResult {
  ok: true;
  user: {
    id: string;
    name: string;
    email: string;
    role: "professional";
    mustChangePassword: false;
  };
  next: "login";
}

export async function registerSelfService(
  input: SelfServiceRegistrationInput,
): Promise<SelfServiceRegistrationResult> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Cadastro falhou (${response.status})`);
  }
  return response.json() as Promise<SelfServiceRegistrationResult>;
}
