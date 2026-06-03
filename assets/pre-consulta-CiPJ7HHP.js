function ConsultaBridge(){
  try {
    const base = window.location.pathname.replace(/[^/]*$/, '');
    window.location.replace(base + 'consulta.html');
  } catch (e) {
    window.location.href = './consulta.html';
  }
  return null;
}
export { ConsultaBridge as default };
