/* Rota nested /api/patients/:id — a SPA chama /api/patients/<id>; reexporta ../../patients-[id].js. */
export { onRequest } from '../../patients-[id].js';
