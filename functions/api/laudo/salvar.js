/* Rota nested /api/laudo/salvar — a SPA chama com barra; reexporta o handler de ../../laudo-salvar.js (que servia só /api/laudo-salvar). */
export { onRequest } from '../../laudo-salvar.js';
