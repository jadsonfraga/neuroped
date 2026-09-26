/* Public editorial demo only. No patient fields, storage, permissions, API or analytics. */
(() => {
  'use strict';
  const select = document.getElementById('scenario');
  const controls = document.getElementById('demo-controls');
  const actions = document.getElementById('demo-actions');
  const previous = document.getElementById('previous');
  const next = document.getElementById('next');
  const reset = document.getElementById('reset');
  const status = document.getElementById('demo-status');
  const buttons = [...document.querySelectorAll('[data-step-button]')];
  const cases = [...document.querySelectorAll('[data-scenario]')];
  if (!select || !controls || !actions || !previous || !next || !reset || !status || buttons.length !== 4 || cases.length !== 3) return;
  let step = 0;
  function show(announce) {
    for (const card of cases) {
      card.hidden = card.dataset.scenario !== select.value;
      for (const panel of card.querySelectorAll('[data-demo-step]')) panel.hidden = Number(panel.dataset.demoStep) !== step;
    }
    buttons.forEach((button, index) => {
      if (index === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    previous.disabled = step === 0;
    next.disabled = step === buttons.length - 1;
    if (announce) status.textContent = `${select.selectedOptions[0].textContent} — ${buttons[step].textContent}`;
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => { step = index; show(true); }));
  previous.addEventListener('click', () => { step = Math.max(0, step - 1); show(true); });
  next.addEventListener('click', () => { step = Math.min(buttons.length - 1, step + 1); show(true); });
  reset.addEventListener('click', () => { step = 0; show(true); select.focus(); });
  select.addEventListener('change', () => { step = 0; show(true); });
  controls.hidden = false;
  actions.hidden = false;
  show(false);
  const print = document.getElementById('print');
  if (print) { print.hidden = false; print.addEventListener('click', () => window.print()); }
})();
