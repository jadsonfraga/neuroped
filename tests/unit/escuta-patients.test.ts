import assert from "node:assert/strict";
import { patientOptions } from "../../shared/escuta/patients.ts";
assert.deepEqual(patientOptions([{id:"qa-001",profile:{name:"Paciente fictício QA"}}]),[{id:"qa-001",name:"Paciente fictício QA"}]);
assert.deepEqual(patientOptions([{id:"qa-001",name:"legado",profile:{name:"nome canônico"}}]),[{id:"qa-001",name:"nome canônico"}]);
assert.deepEqual(patientOptions(null),[]);
assert.deepEqual(patientOptions([null,{profile:{name:"sem identificador"}}]),[]);
assert.equal(patientOptions([{id:"qa-001",profile:{}}])[0].name,"Paciente sem nome disponível");
console.log("PASS 5 contratos do cadastro LIVE: profile.name, precedência, entrada nula, identificador obrigatório e campo ausente.");
