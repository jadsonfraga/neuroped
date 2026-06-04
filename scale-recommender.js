/* NeuroPed SDG — Clinical Scale Intelligence v5.1
 * Motor educacional de apoio a decisao clinica.
 * Nao reproduz itens proprietarios de instrumentos.
 */
(function () {
  "use strict";

  const DEFAULT_ENGINE_FILE = "./scales-engine-v5.json";
  const DOCUMENTARY_WEIGHT = { A: 20, B: 16, C: 13, D: 16, E: 10, F: 6 };

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return [value];
  }

  function tokenize(value) {
    return normalize(value).split(" ").filter(function (token) {
      return token.length >= 3;
    });
  }

  function containsAny(haystack, needles) {
    const text = normalize(asArray(haystack).join(" "));
    return asArray(needles).some(function (needle) {
      const n = normalize(needle);
      return n && text.indexOf(n) >= 0;
    });
  }

  function lexicalScore(source, query, maxScore) {
    const sourceText = normalize(asArray(source).join(" "));
    const tokens = tokenize(query);
    if (!tokens.length) return 0;
    let hits = 0;
    tokens.forEach(function (token) {
      if (sourceText.indexOf(token) >= 0) hits += 1;
    });
    return Math.min(maxScore, Math.round((hits / tokens.length) * maxScore));
  }

  function ageScore(scale, ageMonths) {
    const age = Number(ageMonths);
    if (!Number.isFinite(age) || age <= 0) return { score: 8, warning: "Idade nao informada; recomendacao com menor precisao." };
    const min = Number(scale.idade_min_meses || 0);
    const max = Number(scale.idade_max_meses || 9999);
    if (age >= min && age <= max) return { score: 20, warning: "" };
    const distance = age < min ? min - age : age - max;
    if (distance <= 12) return { score: 8, warning: "Idade proxima, mas fora da faixa preferencial do instrumento." };
    return { score: -15, warning: "Idade fora da faixa preferencial; evitar recomendacao automatica." };
  }

  function purposeScore(scale, purpose) {
    if (!purpose) return 8;
    if (containsAny(scale.finalidades, purpose)) return 30;
    const p = normalize(purpose);
    const finals = normalize((scale.finalidades || []).join(" "));
    if (p.indexOf("convenio") >= 0 || p.indexOf("laudo") >= 0 || p.indexOf("escola") >= 0) {
      if (finals.indexOf("documento") >= 0 || finals.indexOf("perfil funcional") >= 0 || finals.indexOf("justificativa") >= 0) return 24;
    }
    if (p.indexOf("diagnost") >= 0 && finals.indexOf("apoio diagnostico") >= 0) return 24;
    return 4;
  }

  function informantScore(scale, informants) {
    const list = asArray(informants).map(normalize).filter(Boolean);
    if (!list.length) return 8;
    const scaleInformants = normalize((scale.informantes || []).join(" "));
    let hits = 0;
    list.forEach(function (item) {
      if (scaleInformants.indexOf(item) >= 0) hits += 1;
    });
    return hits ? Math.min(20, 10 + hits * 5) : 3;
  }

  function complaintScore(scale, complaint, suspectedDomain) {
    const corpus = [
      scale.nome,
      scale.dominios,
      scale.quando_usar,
      scale.pergunta_clinica,
      scale.saida_medica,
      scale.saida_laudo
    ];
    const raw = lexicalScore(corpus, [complaint, suspectedDomain].join(" "), 30);
    const text = normalize([complaint, suspectedDomain].join(" "));
    const domain = normalize((scale.dominios || []).join(" "));

    const synonyms = [
      ["autismo tea espectro social reciprocidade apontar nome brincar rigidez", "tea"],
      ["tdah atencao hiperatividade impulsividade desatencao", "tdah"],
      ["fala linguagem comunicacao atraso verbal", "linguagem"],
      ["escola aprendizagem leitura escrita matematica", "aprendizagem"],
      ["executiva organizacao planejamento memoria", "funcao executiva"],
      ["funcionalidade autonomia adaptativo vida diaria", "funcionalidade"]
    ];

    let bonus = 0;
    synonyms.forEach(function (pair) {
      const source = pair[0];
      const target = pair[1];
      const found = source.split(" ").some(function (word) { return text.indexOf(word) >= 0; });
      if (found && domain.indexOf(target) >= 0) bonus += 8;
    });

    return Math.min(30, raw + bonus);
  }

  function documentaryScore(scale) {
    return DOCUMENTARY_WEIGHT[scale.nivel_documental] || 8;
  }

  function utilityScore(scale) {
    const value = Number(scale.utilidade_documental || 0);
    return Math.max(0, Math.min(20, value * 2));
  }

  function longitudinalScore(scale) {
    const value = Number(scale.capacidade_longitudinal || 0);
    return Math.max(0, Math.min(10, value));
  }

  function penalties(scale) {
    const generality = Number(scale.generalidade || 0);
    const misuse = Number(scale.risco_uso_inadequado || 0);
    return Math.min(20, generality * 2) + Math.min(25, misuse * 2);
  }

  function scoreScale(scale, input) {
    const age = ageScore(scale, input.ageMonths);
    const details = {
      idade: age.score,
      queixa: complaintScore(scale, input.complaint, input.suspectedDomain),
      finalidade: purposeScore(scale, input.purpose),
      informante: informantScore(scale, input.informants),
      peso_documental: documentaryScore(scale),
      utilidade_documental: utilityScore(scale),
      longitudinalidade: longitudinalScore(scale),
      penalidades: penalties(scale)
    };
    const raw = details.idade + details.queixa + details.finalidade + details.informante + details.peso_documental + details.utilidade_documental + details.longitudinalidade - details.penalidades;
    const score = Math.max(0, Math.min(100, Math.round((raw / 115) * 100)));
    const warnings = [];
    if (age.warning) warnings.push(age.warning);
    if (score < 40) warnings.push("Baixa aderencia a pergunta clinica informada.");
    if (normalize(input.purpose).indexOf("diagnost") >= 0 && (scale.finalidades || []).indexOf("triagem") >= 0 && (scale.finalidades || []).length === 1) {
      warnings.push("Triagem nao deve ser apresentada como diagnostico isolado.");
    }
    return { scale: scale, score: score, details: details, warnings: warnings };
  }

  function packageScore(pkg, input) {
    const age = Number(input.ageMonths || 0);
    let score = 0;
    if (age && age >= Number(pkg.idade_min_meses || 0) && age <= Number(pkg.idade_max_meses || 9999)) score += 35;
    score += lexicalScore([pkg.dominios, pkg.pergunta_clinica, pkg.finalidades], [input.complaint, input.suspectedDomain, input.purpose].join(" "), 50);
    if (containsAny(pkg.finalidades, input.purpose)) score += 15;
    return Math.max(0, Math.min(100, score));
  }

  function documentaryStrength(input, scored, selectedPackage) {
    const top = scored.filter(function (item) { return item.score >= 75; }).length;
    const informants = asArray(input.informants).map(normalize).filter(Boolean);
    const hasFamily = informants.some(function (x) { return x.indexOf("pais") >= 0 || x.indexOf("famil") >= 0 || x.indexOf("cuidador") >= 0; });
    const hasSchool = informants.some(function (x) { return x.indexOf("professor") >= 0 || x.indexOf("escola") >= 0; });
    const hasClinic = informants.some(function (x) { return x.indexOf("clinico") >= 0 || x.indexOf("medico") >= 0 || x.indexOf("observacao") >= 0; });

    if (top >= 3 && hasFamily && hasSchool && hasClinic) return "muito alta";
    if (top >= 2 && ((hasFamily && hasSchool) || (hasFamily && hasClinic) || (hasSchool && hasClinic))) return "alta";
    if (top >= 1 && informants.length >= 2) return "moderada-alta";
    if (top >= 1 || selectedPackage) return "moderada";
    return "baixa";
  }

  function mergeUnique(arrays) {
    const out = [];
    arrays.flat().filter(Boolean).forEach(function (item) {
      if (out.map(normalize).indexOf(normalize(item)) < 0) out.push(item);
    });
    return out;
  }

  function buildQuestion(input, selectedPackage) {
    if (selectedPackage && selectedPackage.pergunta_clinica) return selectedPackage.pergunta_clinica;
    const domain = input.suspectedDomain || input.complaint || "neurodesenvolvimento";
    return "Qual instrumento responde melhor a pergunta clinica relacionada a " + domain + "?";
  }

  function buildNarratives(input, primary, selectedPackage, strength) {
    const main = primary[0] ? primary[0].scale : null;
    const domain = input.suspectedDomain || input.complaint || "neurodesenvolvimento";
    const family = main && main.saida_familia ? main.saida_familia : "O resultado ajuda a organizar sinais clinicos e decidir proximos passos, sem fechar diagnostico isoladamente.";
    const medical = main && main.saida_medica ? main.saida_medica : "A selecao instrumental deve ser integrada a anamnese, observacao clinica, informantes e funcionalidade.";
    const report = selectedPackage && selectedPackage.texto_laudo ? selectedPackage.texto_laudo : (main && main.saida_laudo ? main.saida_laudo : "Os achados documentam necessidade de avaliacao complementar e monitoramento longitudinal conforme impacto funcional.");
    return {
      texto_familia: family,
      texto_medico: medical,
      texto_laudo: report,
      justificativa: "Forca documental " + strength + ": recomendacao baseada em idade, queixa, finalidade, informantes disponiveis, peso documental e risco de uso inadequado para " + domain + "."
    };
  }

  function recommendScales(engine, input) {
    const safeInput = input || {};
    const packages = (engine.packages || []).map(function (pkg) {
      return { package: pkg, score: packageScore(pkg, safeInput) };
    }).sort(function (a, b) { return b.score - a.score; });

    const selectedPackage = packages[0] && packages[0].score >= 50 ? packages[0].package : null;
    const scored = (engine.scales || []).map(function (scale) {
      return scoreScale(scale, safeInput);
    }).sort(function (a, b) { return b.score - a.score; });

    const primary = scored.filter(function (item) { return item.score >= 75; }).slice(0, 5);
    const complementary = scored.filter(function (item) { return item.score >= 60 && item.score < 75; }).slice(0, 6);
    const avoid = scored.filter(function (item) { return item.score < 40 || item.warnings.length; }).slice(0, 6).map(function (item) {
      return {
        id: item.scale.id,
        nome: item.scale.nome,
        motivo: item.warnings.length ? item.warnings.join(" ") : "Baixa aderencia ao caso informado.",
        quando_nao_usar: item.scale.quando_nao_usar || []
      };
    });

    const strength = documentaryStrength(safeInput, scored, selectedPackage);
    const narratives = buildNarratives(safeInput, primary, selectedPackage, strength);
    const differentials = mergeUnique([
      selectedPackage ? selectedPackage.diferenciais_obrigatorios : [],
      primary.map(function (item) { return item.scale.diferenciais_obrigatorios || []; })
    ]).slice(0, 12);

    return {
      pergunta_clinica: buildQuestion(safeInput, selectedPackage),
      pacote_recomendado: selectedPackage ? [{ id: selectedPackage.id, nome: selectedPackage.nome, score: packages[0].score, instrumentos: selectedPackage.instrumentos }] : [],
      escalas_prioritarias: primary.map(toOutputScale),
      escalas_complementares: complementary.map(toOutputScale),
      escalas_nao_recomendadas: avoid,
      diferenciais_obrigatorios: differentials,
      forca_documental: strength,
      justificativa: narratives.justificativa,
      texto_familia: narratives.texto_familia,
      texto_medico: narratives.texto_medico,
      texto_laudo: narratives.texto_laudo
    };
  }

  function toOutputScale(item) {
    return {
      id: item.scale.id,
      nome: item.scale.nome,
      score: item.score,
      classe: item.scale.classe,
      peso_documental: item.scale.peso_documental,
      pergunta_clinica: item.scale.pergunta_clinica,
      quando_usar: item.scale.quando_usar || [],
      combinar_com: item.scale.combinar_com || [],
      detalhes_score: item.details,
      avisos: item.warnings
    };
  }

  async function loadEngine(url) {
    const response = await fetch(url || DEFAULT_ENGINE_FILE, { cache: "no-store" });
    if (!response.ok) throw new Error("Nao foi possivel carregar o motor de escalas.");
    return response.json();
  }

  window.NeuroPedScaleEngine = {
    version: "5.1.0",
    loadEngine: loadEngine,
    recommendScales: recommendScales,
    normalize: normalize
  };
})();
