// Laudo em um clique: pseudonimização, escalas, estilo e gerador.
// Dados 100% fictícios; nenhum paciente real.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  conferirEstilo, entradaVazia, escalasDeResultados, garantirPseudonimizado, gerarLaudoUmClique,
  idadePorExtenso, montarPacoteIA, opcoesDe, pseudonimizar, reidentificar,
  type EntradaLaudoUmClique,
} from "../../client/src/lib/laudoUmClique";

function caso(): EntradaLaudoUmClique {
  return {
    ...entradaVazia(),
    paciente: "Davi Exemplo Teste",
    responsaveis: ["Marta Exemplo Teste", "Escola Municipal Modelo"],
    dataNascimento: "2018-03-10",
    dataConsulta: "2026-10-15",
    serie: "o segundo ano",
    moraCom: "a mãe e o irmão",
    cidade: "Cidade Fictícia",
    quemE: "Ele conta histórias longas sobre dinossauros e desenha com cuidado.",
    historia: "A gestação transcorreu sem intercorrências. Sentou aos oito meses e andou aos catorze.",
    historiaFonte: "a caderneta e o laudo anterior, de março de 2026",
    familia: "A mãe conta que a escola liga com frequência. O pai nega crises. A família pergunta se precisa de exames.",
    escola: "A professora descreve que Davi levanta da carteira e perde a linha na leitura.",
    escolaFonte: "o relatório da escola, de setembro de 2026",
    exameNeuro: "A marcha saiu simétrica e os reflexos vieram presentes e iguais.",
    leitura: "Os relatos de casa e da escola descrevem o mesmo padrão de desatenção, e o exame não mostra outra causa.",
    diagnosticos: [{ nome: "Transtorno do déficit de atenção com hiperatividade", camada: "firmado", cid10: "F90.0", cid11: "6A05.2" }],
    conduta: "Iniciar acompanhamento com terapia ocupacional por oito semanas. A escola recebe orientações por escrito.",
    escolaOrienta: "Sentar o aluno perto da professora e dar pausas curtas a cada vinte minutos.",
    retorno: "Retorno em 15 de janeiro de 2027, ou antes se surgirem crises.",
    escalas: escalasDeResultados([
      { id: "r1", scaleName: "SNAP-IV", totalScore: 38, classification: "Sugestivo", createdAt: "2026-09-20T12:00:00Z" },
      { id: "r2", scaleName: "M-CHAT-R/F", totalScore: 3, classification: "", createdAt: "2026-09-21T12:00:00Z" },
      { id: "r3", scaleName: "CBCL", totalScore: null, classification: "Resultado registrado", createdAt: "2026-09-22T12:00:00Z" },
    ]),
    incluirAnexoTecnico: true,
  };
}

describe("pseudonimização", () => {
  it("troca nomes, documentos e contatos e reidentifica de volta", () => {
    const o = { paciente: "Davi Exemplo Teste", responsaveis: ["Marta Exemplo Teste"], outros: ["Cidade Fictícia"] };
    const original = "Davi nasceu em 10/03/2018. A mãe, Marta, CPF 123.456.789-09, tel (87) 99999-1234, mora na Rua das Flores, 120, em Cidade Fictícia. Contato: mae@example.com.";
    const r = pseudonimizar(original, o);
    for (const proibido of ["Davi", "Marta", "123.456.789-09", "99999-1234", "Rua das Flores", "Cidade Fictícia", "mae@example.com", "10/03/2018"]) {
      assert.ok(!r.texto.includes(proibido), `vazou: ${proibido} em ${r.texto}`);
    }
    assert.doesNotThrow(() => garantirPseudonimizado(r.texto, o));
    assert.equal(reidentificar(r.texto, r.mapa).includes("123.456.789-09"), true);
    assert.equal(reidentificar(r.texto, r.mapa).includes("Davi"), true);
  });

  it("a trava lança erro quando há identificador", () => {
    assert.throws(() => garantirPseudonimizado("Davi foi atendido", { paciente: "Davi Exemplo Teste" }), /bloqueado/);
    assert.throws(() => garantirPseudonimizado("CPF 123.456.789-09", { paciente: "X Y" }), /bloqueado/);
  });

  it("usa marcadores estáveis para o mesmo nome", () => {
    const o = { paciente: "Davi Exemplo Teste" };
    const original = "Davi chegou. Exemplo Teste saiu. Davi voltou. Davi Exemplo Teste assina.";
    const r = pseudonimizar(original, o);
    assert.equal((r.texto.match(/PACIENTE_1\b/g) ?? []).length, 1); // nome completo
    assert.equal(new Set(r.texto.match(/PACIENTE_\d+/g)).size, 4);
    assert.ok(!/Davi|Exemplo|Teste/.test(r.texto));
    assert.equal(reidentificar(r.texto, r.mapa), original);
  });

  it("pacote de IA nunca contém dado identificável do caso completo", () => {
    const e = caso();
    const pacote = montarPacoteIA(e);
    for (const proibido of ["Davi", "Marta", "Exemplo Teste", "Escola Municipal Modelo", "Cidade Fictícia", "2026-10-15"]) {
      assert.ok(!pacote.prompt.includes(proibido), `vazou ${proibido}`);
    }
    assert.match(pacote.prompt, /PACIENTE_1/);
    assert.doesNotThrow(() => garantirPseudonimizado(pacote.prompt, opcoesDe(e)));
  });
});

describe("escalas pontuadas", () => {
  it("usa escore salvo, deriva M-CHAT pelo corte oficial e nunca inventa escore", () => {
    const e = caso();
    const snap = e.escalas.find((s) => s.nome === "SNAP-IV")!;
    const mchat = e.escalas.find((s) => /M-CHAT/.test(s.nome))!;
    const cbcl = e.escalas.find((s) => s.nome === "CBCL")!;
    assert.equal(snap.escore, 38); assert.equal(snap.origem, "salvo");
    assert.equal(mchat.origem, "derivado"); assert.match(mchat.classificacao, /Moderado/i);
    assert.equal(cbcl.escore, null); assert.equal(cbcl.origem, "sem-escore"); assert.equal(cbcl.incluir, false);
  });

  it("repetições da mesma escala ficam desmarcadas (mais recente vence)", () => {
    const l = escalasDeResultados([
      { id: "a", scaleName: "SNAP-IV", totalScore: 10, classification: "x", createdAt: "2026-01-01" },
      { id: "b", scaleName: "SNAP-IV", totalScore: 20, classification: "y", createdAt: "2026-06-01" },
    ]);
    assert.equal(l[0].id, "b"); assert.equal(l[0].incluir, true); assert.equal(l[1].incluir, false);
  });
});

describe("gerador", () => {
  it("monta quadro, capítulos, fechamento e anexo; escala só no anexo", () => {
    const { laudo, controle } = gerarLaudoUmClique(caso());
    assert.deepEqual(laudo.quadro.map((q) => q.rotulo), ["Motivo", "Diagnóstico", "Decisão de hoje", "Próximos passos", "Retorno"]);
    assert.match(laudo.capitulos[0].titulo, /^Quem é Davi$/);
    assert.match(laudo.capitulos[0].texto, /^Davi tem 8 anos/);
    assert.ok(laudo.anexoTecnico?.includes("SNAP-IV") && laudo.anexoTecnico.includes("escore 38"));
    assert.ok(!laudo.anexoTecnico?.includes("CBCL"));
    const corpo = laudo.capitulos.map((c) => c.texto).join(" ");
    assert.ok(!/SNAP|M-CHAT|escore/i.test(corpo));
    assert.deepEqual(laudo.fechamento, [
      "Redação clínica de Dr. Jadson Fraga Araújo Júnior, revista com auxílio de ferramenta computacional.", "Soli Deo Gloria",
    ]);
    assert.ok(controle.estilo.aprovado, JSON.stringify(controle.estilo.itens.filter((i) => !i.ok)));
    assert.ok(controle.estilo.metricas.declaracoesFonte >= 2);
  });

  it("CID do quadro coincide com o do capítulo e vem em paralelo", () => {
    const { laudo } = gerarLaudoUmClique(caso());
    const dxCap = laudo.capitulos.find((c) => /diagnóstico/i.test(c.titulo))!.texto;
    assert.match(dxCap, /CID-10 F90\.0; CID-11 6A05\.2/);
    assert.match(laudo.quadro[1].texto, /CID-10 F90\.0; CID-11 6A05\.2/);
  });

  it("não inventa: sem material, omite capítulo e registra lacuna", () => {
    const e = { ...caso(), escola: "", escolaFonte: "", terapias: "", exames: "" };
    const { laudo, controle } = gerarLaudoUmClique(e);
    assert.ok(!laudo.capitulos.some((c) => /escola descreve/.test(c.titulo)));
    assert.ok(controle.lacunas.some((l) => /escola descreve.*omitido/.test(l)));
  });

  it("terceiros sem fonte geram lacuna, e firmado sem CID também", () => {
    const e = { ...caso(), escolaFonte: "", diagnosticos: [{ nome: "TDAH", camada: "firmado" as const, cid10: "F90.0", cid11: "" }] };
    const { controle } = gerarLaudoUmClique(e);
    assert.ok(controle.lacunas.some((l) => /declaração de fonte/.test(l)));
    assert.ok(controle.lacunas.some((l) => /CID-10 e CID-11 em paralelo/.test(l)));
  });

  it("sem escala marcada ou sem escore não há anexo nem número inventado", () => {
    const e = { ...caso(), incluirAnexoTecnico: false };
    assert.equal(gerarLaudoUmClique(e).laudo.anexoTecnico, null);
  });

  it("alto risco acrescenta as cinco perguntas de segunda leitura", () => {
    assert.equal(gerarLaudoUmClique({ ...caso(), altoRisco: true }).controle.segundaLeitura.length, 5);
    assert.equal(gerarLaudoUmClique(caso()).controle.segundaLeitura.length, 0);
  });

  it("idade por extenso", () => {
    assert.equal(idadePorExtenso("2018-03-10", "2026-10-15"), "8 anos");
    assert.equal(idadePorExtenso("2024-01-10", "2026-03-15"), "2 anos e 2 meses");
    assert.equal(idadePorExtenso("", "2026-03-15"), "");
  });
});

describe("conferência de estilo", () => {
  const base = (corpo: string, quadro = "") => conferirEstilo({ corpo, quadro, capitulos: 10 });
  const falha = (r: ReturnType<typeof base>, id: string) => r.itens.find((i) => i.id === id && !i.ok);

  it("bloqueia léxico vetado, processo, primeira pessoa, travessão e escala", () => {
    const r = base("Vale ressaltar que o assistente examinei a criança - e o escore SNAP foi alto. Sem verificação direta nesta consulta.");
    for (const id of ["lexico", "processo", "primeira-pessoa", "travessao", "escala-no-corpo"]) assert.ok(falha(r, id), id);
    assert.equal(r.aprovado, false);
  });

  it("bloqueia frase acima de 45 palavras", () => {
    const longa = Array.from({ length: 50 }, () => "palavra").join(" ") + ". Sem verificação direta nesta consulta. Retorno em janeiro.";
    assert.ok(falha(base(longa), "teto-45"));
  });

  it("exige declaração de fonte e CID coincidente", () => {
    assert.ok(falha(base("Ele brinca bem. Retorno em janeiro."), "fonte"));
    assert.ok(falha(base("Sem verificação direta nesta consulta. F90.0 e 6A05.2.", "F90.0"), "cid-coincide"));
  });

  it("não confunde 'sistema nervoso' nem 'ensino fundamental' com vazamento", () => {
    const r = base("O sistema nervoso foi examinado em detalhe. Cursa o ensino fundamental. Sem verificação direta nesta consulta. Retorno em janeiro.");
    assert.ok(!falha(r, "processo")); assert.ok(!falha(r, "lexico"));
  });

  it("fala literal pode ter primeira pessoa", () => {
    const r = base('A mãe diz: "eu não aguento mais". Sem verificação direta nesta consulta. Retorno em janeiro.');
    assert.ok(!falha(r, "primeira-pessoa"));
  });
});
