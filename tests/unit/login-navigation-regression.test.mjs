import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regressão: navegar para "/" dentro do submit corria com o commit do estado de
// sessão no AuthContext. O RouteGuard avaliava "/" antes de enxergar o usuário,
// decidia "login" e devolvia para /login?next=/ com a sessão já válida — quem
// acabara de autenticar ficava preso na própria tela de login.
const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

const loginPage = stripComments(read("client/src/pages/login.tsx"));
const flat = loginPage.replace(/\s+/g, " ");

const submitStart = loginPage.indexOf("async function handleSubmit");
assert(submitStart > -1, "handleSubmit desapareceu de login.tsx");
const submitEnd = loginPage.indexOf("return (", submitStart);
assert(submitEnd > submitStart, "não foi possível delimitar handleSubmit");
assert.doesNotMatch(
  loginPage.slice(submitStart, submitEnd),
  /setLocation\s*\(/,
  "handleSubmit não pode navegar: isso corre com o commit da sessão e o RouteGuard devolve para /login",
);

const effects = [...flat.matchAll(/useEffect\(\(\) => \{(.*?)\}, \[(.*?)\]\)/g)];
assert(
  effects.some(([, body, deps]) => deps.includes("isAuthenticated") && /setLocation\s*\(/.test(body)),
  "a saída da tela de login precisa depender do estado de sessão já publicado (isAuthenticated)",
);

// O guard continua sendo a única origem do desvio para /login: se alguém voltar
// a navegar no submit, o teste acima falha antes de o CI gastar um deploy.
const guard = stripComments(read("client/src/components/RouteGuard.tsx"));
assert.match(guard, /decision === "login"/, "RouteGuard perdeu a decisão de login");
assert.match(guard, /isAuthenticated/, "RouteGuard precisa ler isAuthenticated");

console.log("[login-navigation] ✓ login sai da rota só depois que a sessão está publicada; sem corrida com o RouteGuard.");
