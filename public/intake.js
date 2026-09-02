const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const form = document.getElementById("intake-form");
const clinicName = document.getElementById("clinic-name");
const formTitle = document.getElementById("form-title");
const formDescription = document.getElementById("form-description");
const safetyNotice = document.getElementById("safety-notice");
const questionsRoot = document.getElementById("questions");
const consentNotice = document.getElementById("consent-notice");
const submitButton = document.getElementById("submit-button");
const submitError = document.getElementById("submit-error");
const success = document.getElementById("success");
const successMessage = document.getElementById("success-message");

let intakeToken = "";
let invite = null;

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

function createQuestion(question) {
  const label = document.createElement("label");
  label.className = "field";

  const title = document.createElement("span");
  title.textContent = question.label;
  if (question.required) title.classList.add("required");
  label.appendChild(title);

  let control;
  if (question.type === "yes_no") {
    control = document.createElement("select");
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Selecione";
    control.appendChild(blank);
    for (const [value, text] of [["true", "Sim"], ["false", "Não"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      control.appendChild(option);
    }
  } else if (question.type === "short_text") {
    control = document.createElement("input");
    control.type = "text";
  } else {
    control = document.createElement("textarea");
  }

  control.name = question.id;
  control.dataset.questionId = question.id;
  control.dataset.questionType = question.type;
  if (question.required) control.required = true;
  if (question.maxLength && question.type !== "yes_no") control.maxLength = question.maxLength;
  label.appendChild(control);

  if (question.help) {
    const help = document.createElement("small");
    help.textContent = question.help;
    label.appendChild(help);
  }

  return label;
}

function renderInvite(payload) {
  invite = payload;
  clinicName.textContent = payload.clinicName || "Equipe assistencial";
  formTitle.textContent = payload.template?.title || "Formulário estruturado";
  formDescription.textContent = payload.template?.description || "";
  safetyNotice.textContent = payload.safetyNotice || "";
  consentNotice.textContent = payload.consent?.notice || "Confirmo o envio destas informações.";

  questionsRoot.replaceChildren();
  const questions = Array.isArray(payload.template?.questions) ? payload.template.questions : [];
  for (const question of questions) questionsRoot.appendChild(createQuestion(question));

  hide(loading);
  hide(errorBox);
  show(form);
}

async function loadInvite() {
  intakeToken = readTokenFromFragment();
  removeTokenFromAddressBar();
  if (!intakeToken) {
    renderFatal("Link incompleto", "Use o link completo enviado pela equipe assistencial. Por segurança, ele não pode ser recuperado nesta página.");
    return;
  }

  try {
    const response = await fetch("/api/public-intake", {
      method: "GET",
      headers: { Authorization: `Intake ${intakeToken}` },
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

function collectResponses() {
  const responses = {};
  for (const control of questionsRoot.querySelectorAll("[data-question-id]")) {
    const id = control.dataset.questionId;
    const type = control.dataset.questionType;
    if (!id) continue;
    if (type === "yes_no") {
      if (control.value === "true") responses[id] = true;
      else if (control.value === "false") responses[id] = false;
      continue;
    }
    const value = control.value.trim();
    if (value) responses[id] = value;
  }
  return responses;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hide(submitError);

  if (!intakeToken || !invite) {
    renderFatal("Sessão do formulário encerrada", "Abra novamente o link original para continuar.");
    return;
  }
  if (!form.reportValidity()) return;

  submitButton.disabled = true;
  submitButton.textContent = "Enviando com segurança…";
  const body = {
    respondentName: document.getElementById("respondent-name").value.trim(),
    relationship: document.getElementById("relationship").value.trim(),
    consentAccepted: document.getElementById("consent").checked,
    responses: collectResponses(),
  };

  try {
    const response = await fetch("/api/public-intake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Intake ${intakeToken}`,
      },
      cache: "no-store",
      credentials: "omit",
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      submitError.textContent = apiMessage(payload, "Não foi possível concluir o envio.");
      show(submitError);
      return;
    }

    intakeToken = "";
    invite = null;
    form.reset();
    questionsRoot.replaceChildren();
    hide(form);
    successMessage.textContent = payload?.message || "As informações foram enviadas para revisão da equipe.";
    show(success);
  } catch {
    submitError.textContent = "Falha de conexão. As respostas não foram confirmadas como enviadas; tente novamente sem atualizar a página.";
    show(submitError);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar para revisão da equipe";
  }
});

void loadInvite();
