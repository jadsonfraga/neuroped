import { useEffect } from "react";
import { useLocation } from "wouter";

// Acesso ao app é feito exclusivamente pelo PIN master (PrivateGate).
// Qualquer navegação para /login redireciona automaticamente para a raiz.
export default function LoginPage() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/"); }, [setLocation]);
  return null;
}
