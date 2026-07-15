// Alias legado mantido para evitar que imports antigos reativem a versão que
// renderizava HTML rico sem sanitização. A implementação canônica exibe apenas
// conteúdo previamente reduzido a texto seguro.
export { default } from "./portal-novidades-safe";
