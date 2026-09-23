/** Scoped CSS string so the same React components remain importable by Node's TSX unit runner. */
export const GUIDED_STYLE = `
.obs10 .obs10-guided-task,.obs10 .obs10-integrated-preparation{font-size:1.125rem;line-height:1.6;min-width:0;overflow-wrap:anywhere}
.obs10 .obs10-guided-task.is-large{font-size:1.4rem}
.obs10 .obs10-guided-task :is(button,summary){font-size:1em;min-height:56px;white-space:normal}
/* The legacy shell uses #main-content button:not([data-size=icon]) at 44px.
   Match that ID specificity within OBS-10, without changing any other route. */
#main-content .obs10-guided-task :is(button,summary),#main-content .obs10-integrated-preparation :is(button,summary){font-size:1em;min-height:56px;white-space:normal}
.obs10 .obs10-guided-task :is(h3,h4){font-size:1.15em;line-height:1.35;font-weight:800;margin:0 0 .6em}
.obs10 .obs10-guided-task p,.obs10 .obs10-guided-task :is(.obs10-muted,.obs10-caution,.obs10-record-tip,.obs10-model-note){font-size:1em}
.obs10 .obs10-guided-task .obs10-task-position{font-size:.9em}
.obs10 .obs10-guided-task > svg{max-height:150px;margin:0 auto 12px;display:block;width:100%}
.obs10 .obs10-frame-section{padding:18px;border:1px solid var(--o-line);border-radius:16px;background:var(--o-paper);margin:16px 0}
.obs10 .obs10-frame-section-title{display:flex;align-items:center;gap:12px;font-weight:800;font-size:1.1em;margin-bottom:12px}
.obs10 .obs10-frame-section-title>span{display:grid;place-items:center;flex-shrink:0;min-width:36px;min-height:36px;border-radius:50%;background:var(--o-lilac);color:var(--o-ink)}
.obs10 .obs10-frame-materials{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));gap:12px;margin-top:12px}
.obs10 .obs10-frame-material{padding:12px;border:1px solid var(--o-line);border-radius:14px;min-width:0;background:var(--o-bg)}
.obs10 .obs10-frame-material>svg{width:100%;height:80px}
.obs10 .obs10-frame-material strong,.obs10 .obs10-frame-material .obs10-quantity{display:block;font-size:1em}
.obs10 .obs10-frame-material summary{font-size:.9em}
.obs10 .obs10-frame-material p{margin-top:8px}
.obs10 .obs10-frame-camera{border-left:4px solid var(--o-primary);padding:12px;background:var(--o-mint);margin-top:12px}
.obs10 .obs10-frame-audience{border:2px solid var(--o-line);border-radius:12px;padding:12px;background:var(--o-cream);font-weight:600;margin:12px 0}
.obs10 .obs10-frame-command{font-size:1.3em;font-weight:750;line-height:1.5;background:var(--o-lilac);border-radius:12px;padding:18px}
.obs10 .obs10-guided-task .obs10-microsteps{padding-left:0;list-style:none}
.obs10 .obs10-guided-task .obs10-microsteps li{display:flex;gap:12px;align-items:flex-start;margin-top:12px}
.obs10 .obs10-guided-task .obs10-microsteps li>span{flex-shrink:0;font-weight:800}
.obs10 .obs10-guided-task .obs10-quick-responses{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.obs10 .obs10-guided-task .obs10-quick-responses button,#main-content .obs10-guided-task .obs10-quick-responses button{padding:14px 10px;min-height:64px}
.obs10 .obs10-guided-task .obs10-quick-responses button[aria-pressed=true]{border:3px solid var(--o-primary);background:var(--o-lilac);font-weight:800}
.obs10 .obs10-frame-navigation{display:flex;flex-wrap:wrap;gap:12px;border-top:2px solid var(--o-line);padding-top:16px;margin-top:20px}
.obs10 .obs10-frame-navigation>button{flex:1 1 190px}
.obs10 .obs10-frame-tools{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:12px 0}
.obs10 .obs10-frame-tools button{min-height:56px}
.obs10 .obs10-print-resource{margin-top:14px;border:2px dashed var(--o-line);border-radius:14px;padding:16px;background:var(--o-bg)}
.obs10 .obs10-print-resource svg{display:block;max-width:100%;width:320px;height:auto;background:var(--o-paper);margin:12px auto}
.obs10 .obs10-reading-resource{font-size:1.4em;line-height:1.7;background:var(--o-paper);padding:20px;border:1px solid var(--o-line);border-radius:12px;margin:12px 0;white-space:pre-wrap;overflow-wrap:anywhere}
.obs10 .obs10-paper-model{display:block;width:160px;height:100px;max-width:100%;background:var(--o-paper);margin:12px 0}
.obs10 .obs10-resource-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr));gap:12px;margin:18px 0}
.obs10 .obs10-resource-legend>div{border:1px solid var(--o-line);border-radius:14px;padding:16px;background:var(--o-bg)}
.obs10 .obs10-integrated-preparation{margin:20px 0;padding:20px;background:var(--o-mint);border:1px solid var(--o-line);border-radius:18px}
.obs10 .obs10-integrated-preparation summary,.obs10 .obs10-integrated-preparation button{min-height:56px;font-size:1em}
.obs10 .obs10-integrated-preparation details{border-top:1px solid var(--o-line);margin-top:14px;padding-top:6px}
.obs10 .obs10-guided-task :focus-visible{outline:3px solid var(--o-primary);outline-offset:4px;scroll-margin-block:160px 32px}
.obs10 .obs10-guided-task h3{scroll-margin-top:180px}
.obs10 .obs10-guided-task .obs10-response-saved{padding:14px;background:var(--o-mint);border-radius:12px;font-size:1em}
.obs10 .obs10-live-grid:has(.obs10-guided-task){grid-template-columns:minmax(0,1fr)}
@media(max-width:540px){.obs10 .obs10-frame-section{padding:14px}.obs10 .obs10-frame-command{padding:14px}.obs10 .obs10-guided-task .obs10-quick-responses{grid-template-columns:1fr}.obs10 .obs10-frame-materials{grid-template-columns:1fr}.obs10 .obs10-frame-navigation>button{flex-basis:100%}.obs10 .obs10-integrated-preparation{padding:14px}}
@media(prefers-reduced-motion:reduce){.obs10 .obs10-guided-task *{scroll-behavior:auto!important;transition:none!important}}
`;
