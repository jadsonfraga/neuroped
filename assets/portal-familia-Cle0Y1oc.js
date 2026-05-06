async function p(){console.warn("[Portal Familias] Publicacao desativada na versao estatica por seguranca/LGPD.");return null}
async function v(){return{ok:false,motivo:"portal_desativado",msg:"Portal das Famílias temporariamente desativado nesta versão estática. O acesso por CPF como senha foi removido por segurança. Use uma versão com Supabase Auth, controle de permissões e banco com RLS antes de uso real."}}
export{p,v};
