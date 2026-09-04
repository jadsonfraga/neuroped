const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const form = document.getElementById("scale-form");
const clinicName = document.getElementById("clinic-name");
const scaleTitle = document.getElementById("scale-title");
const scaleSubtitle = document.getElementById("scale-subtitle");
const scaleInstructions = document.getElementById("scale-instructions");
const safetyNotice = document.getElementById("safety-notice");
const itemsRoot = document.getElementById("items");
const progressLabel = document.getElementById("progress-label");
const progressBar = document.getElementById("progress-bar");
const consentNotice = document.getElementById("consent-notice");
const submitButton = document.getElementById("submit-button");
const submitError = document.getElementById("submit-error");
const success = document.getElementById("success");
const successMessage = document.getElementById("success-message");

let scaleToken = "";
let invite = null;
/** Índice da opção escolhida por item (0-based); undefined = não respondido. */
const selectedAnswers = [];

function hide(element) {
  element?.classList.add("hidden");
}

function show(element) {
  element?.classList.remove("hidden");
}

function readTokenFromFragment() {
  const raw = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(raw);
  return params.get("token")?.trim() || "";
}

function removeTokenFromAddressBar() {
  try {
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
  } catch {
    window.location.hash = "";
  }
}

function apiMessage(payload, fallback) {
  return payload && typeof payload.error === "string" ? payload.error : fallback;
}

function renderFatal(title, message) {
  hide(loading);
  hide(form);
  hide(success);
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  show(errorBox);
}

function updateProgress() {
  const total = invite?.scale?.items?.length ?? 0;
  const answered = selectedAnswers.filter((value) => value !== undefined).length;
  progressLabel.textContent = `${answered} de ${total} respondidos`;
  progressBar.style.width = total ? `${(answered / total) * 100}%` : "0%";
  submitButton.disabled = total === 0 || answered !== total;
}

function selectAnswer(itemIndex, optionIndex, row) {
  selectedAnswers[itemIndex] = optionIndex;
  row.classList.add("answered");
  row.querySelectorAll(".option-pill").forEach((pill) => {
    pill.setAttribute("aria-pressed", String(Number(pill.dataset.optionIndex) === optionIndex));
  });
  updateProgress();
}

function createItemRow(item, itemIndex) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.setAttribute("role", "listitem");

  const text = document.createElement("p");
  text.className = "item-text";
  text.textContent = item.emoji ? `${item.emoji} ${item.text}` : item.text;
  row.appendChild(text);

  if (item.example) {
    const example = document.createElement("p");
    example.className = "item-example";
    example.textContent = `Ex.: ${item.example}`;
    row.appendChild(example);
  }

  const options = document.createElement("div");
  options.className = "item-options";
  item.options.forEach((option, optionIndex) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "option-pill";
    pill.textContent = option.label;
    pill.dataset.optionIndex = String(optionIndex);
    pill.setAttribute("aria-pressed", "false");
    pill.addEventListener("click", () => selectAnswer(itemIndex, optionIndex, row));
    options.appendChild(pill);
  });
  row.appendChild(options);

  return row;
}

function renderInvite(payload) {
  invite = payload;
  clinicName.textContent = payload.clinicName || "Equipe assistencial";
  scaleTitle.textContent = payload.scale?.name || "Questionário estruturado";
  scaleSubtitle.textContent = payload.scale?.fullName || "";
  scaleInstructions.textContent = payload.scale?.instructions || "";
  safetyNotice.textContent = payload.safetyNotice || "";
  consentNotice.textContent = payload.consent?.notice || "Confirmo o envio destas respostas.";

  itemsRoot.replaceChildren();
  selectedAnswers.length = 0;
  const items = Array.isArray(payload.scale?.items) ? payload.scale.items : [];
  items.forEach((item, index) => itemsRoot.appendChild(createItemRow(item, index)));
  updateProgress();

  hide(loading);
  hide(errorBox);
  show(form);
}

async function loadInvite() {
  scaleToken = readTokenFromFragment();
  removeTokenFromAddressBar();
  if (!scaleToken) {
    renderFatal("Link incompleto", "Use o link completo enviado pela equipe assistencial. Por segurança, ele não pode ser recuperado nesta página.");
    return;
  }

  try {
    const response = await fetch("/api/public-scale", {
      method: "GET",
      headers: { Authorization: `Scale ${scaleToken}` },
      cache: "no-store",
      credentials: "omit",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      renderFatal("Convite indisponível", apiMessage(payload, "O convite é inválido, expirou ou já foi utilizado."));
      return;
    }
    renderInvite(payload);
  } catch {
    renderFatal("Serviço temporariamente indisponível", "Verifique sua conexão e abra novamente o link enviado pela equipe.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hide(submitError);

  if (!scaleToken || !invite) {
    renderFatal("Sessão do questionário encerrada", "Abra novamente o link original para continuar.");
    return;
  }
  const total = invite.scale?.items?.length ?? 0;
  const answered = selectedAnswers.filter((value) => value !== undefined).length;
  if (answered !== total) {
    submitError.textContent = "Responda todos os itens antes de enviar.";
    show(submitError);
    return;
  }
  if (!document.getElementById("consent").checked) {
    submitError.textContent = "Confirme a ciência do envio antes de continuar.";
    show(submitError);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Enviando com segurança…";
  const body = {
    respondentName: document.getElementById("respondent-name").value.trim(),
    relationship: document.getElementById("relationship").value.trim(),
    consentAccepted: document.getElementById("consent").checked,
    answers: selectedAnswers.slice(0, total),
  };

  try {
    const response = await fetch("/api/public-scale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Scale ${scaleToken}`,
      },
      cache: "no-store",
      credentials: "omit",
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      submitError.textContent = apiMessage(payload, "Não foi possível concluir o envio.");
      show(submitError);
      submitButton.disabled = false;
      submitButton.textContent = "Enviar para revisão da equipe";
      return;
    }

    scaleToken = "";
    invite = null;
    selectedAnswers.length = 0;
    form.reset();
    itemsRoot.replaceChildren();
    hide(form);
    successMessage.textContent = payload?.message || "As respostas foram enviadas para revisão da equipe.";
    show(success);
  } catch {
    submitError.textContent = "Falha de conexão. As respostas não foram confirmadas como enviadas; tente novamente sem atualizar a página.";
    show(submitError);
    submitButton.disabled = false;
    submitButton.textContent = "Enviar para revisão da equipe";
  }
});

void loadInvite();
