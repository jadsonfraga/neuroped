/** Somente no servidor Vite isolado do teste; transporte de auth simulado. */
export const authFetch: typeof fetch = (input, init) => fetch(input, init);
