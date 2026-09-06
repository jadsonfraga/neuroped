/** Adapta o contrato canônico LIVE: nome dentro de profile, após decriptação autorizada no servidor. */
export function patientOptions(input: unknown): Array<{id: string;name: string}> {
  if(!Array.isArray(input))return [];
  return input.flatMap((item: unknown)=>{
    if(!item || typeof item!=="object" || !("id" in item) || typeof item.id!=="string")return [];
    const record=item as {id:string;profile?:{name?:unknown};name?:unknown};
    const name=record.profile?.name ?? record.name;
    return [{id:record.id,name:typeof name==="string" && name.trim()?name.trim():"Paciente sem nome disponível"}];
  });
}
