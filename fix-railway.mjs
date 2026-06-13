/**
 * NeuroPed — Fix Railway Dashboard via API
 * node fix-railway.mjs
 */
import https from "https";

const TOKEN  = process.env.RAILWAY_TOKEN;
const API    = "backboard.railway.app";
const SVC_ID = "9724306d-35ba-4364-b520-83b3f84bcf82";
const ENV_ID = "0e82b70b-9668-4395-9e36-3487fda39fa0";

if (!TOKEN) {
  console.error("Defina RAILWAY_TOKEN no ambiente antes de executar este script.");
  process.exit(1);
}

function gql(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    const req = https.request(
      {
        hostname: API,
        path: "/graphql/v2",
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { resolve({ raw: data }); }
        });
      }
    );
    req.on("error", (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

console.log("\n==========================================");
console.log(" NeuroPed — Railway Fix Script");
console.log("==========================================\n");

// STEP 1: Ultimo deploy (sem sub-campos de meta)
console.log("[1] Buscando ultimo deploy...");
const deps = await gql(`
  query {
    deployments(input: { serviceId: "${SVC_ID}" environmentId: "${ENV_ID}" }) {
      edges { node { id status createdAt } }
    }
  }
`);

const latestDep = deps?.data?.deployments?.edges?.[0]?.node;
if (latestDep) {
  console.log(`    ID:     ${latestDep.id}`);
  console.log(`    Status: ${latestDep.status}`);
} else {
  console.log("    Aviso: nao foi possivel obter deploy. Continuando...");
  if (deps.errors) console.log("    Erro:", deps.errors[0]?.message);
}

// STEP 2: Logs do build (se tiver deploy ID)
if (latestDep?.id) {
  console.log("\n[2] Ultimas linhas do build log...");
  const logs = await gql(`
    query {
      deploymentLogs(deploymentId: "${latestDep.id}" limit: 60 filter: "build") {
        message severity
      }
    }
  `);
  if (logs?.data?.deploymentLogs?.length) {
    const lines = logs.data.deploymentLogs.slice(-25);
    console.log("    --- BUILD LOGS ---");
    lines.forEach((l) => console.log(`    [${l.severity}] ${l.message}`));
    console.log("    ------------------");
  } else {
    console.log("    (logs nao disponiveis via API)");
  }
}

// STEP 3: CRITICO — Corrigir buildCommand + startCommand no Dashboard
console.log("\n[3] Atualizando buildCommand no Dashboard Railway...");
const update = await gql(`
  mutation {
    serviceInstanceUpdate(
      serviceId: "${SVC_ID}"
      environmentId: "${ENV_ID}"
      input: {
        buildCommand: "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --include=dev && npm run build"
        startCommand: "npm start"
      }
    )
  }
`);

if (update?.data?.serviceInstanceUpdate === true) {
  console.log("    OK buildCommand atualizado com sucesso!");
} else {
  console.log("    Resposta:", JSON.stringify(update, null, 2));
}

// STEP 4: CRITICO — Acionar novo deploy
console.log("\n[4] Acionando redeploy...");
const deploy = await gql(`
  mutation {
    serviceInstanceDeploy(
      serviceId: "${SVC_ID}"
      environmentId: "${ENV_ID}"
      latestCommit: true
    )
  }
`);

const deployId = deploy?.data?.serviceInstanceDeploy;
if (deployId) {
  console.log(`    OK Deploy acionado: ${deployId}`);
} else {
  console.log("    Resposta:", JSON.stringify(deploy, null, 2));
}

console.log("\n==========================================");
console.log(" Concluido! Aguarde ~5 min e verifique:");
console.log(" https://neuroped-api-production.up.railway.app/api/health");
console.log("==========================================\n");
