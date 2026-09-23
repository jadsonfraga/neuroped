export const TABLET_STYLE = `
.ot-dialog{position:fixed;inset:0;width:100%;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;overflow:auto;background:hsl(var(--background));color:hsl(var(--foreground))}
.ot-dialog::backdrop{background:hsl(var(--foreground)/.55)}
.ot-dialog .ot-root{font-size:20px;line-height:1.6;max-width:1050px;margin:0 auto;padding:24px clamp(14px,3vw,36px) 48px;min-width:0}
.ot-dialog .ot-root.ot-large{font-size:25px}
.ot-dialog .ot-root :is(p,label,legend,button,input,textarea,select,summary,small){font-size:1em;line-height:1.55}
.ot-dialog .ot-root p{margin:.65em 0;overflow-wrap:anywhere}
.ot-dialog .ot-root :is(button,summary,.ot-file){min-height:60px;padding:14px 18px;border-radius:14px;white-space:normal}
.ot-dialog .ot-root :is(button,.ot-file){border:2px solid hsl(var(--border));background:hsl(var(--card));color:hsl(var(--foreground));font-weight:700;cursor:pointer}
.ot-dialog .ot-root button:disabled{opacity:.55;cursor:not-allowed}
.ot-dialog .ot-root .ot-primary{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-color:hsl(var(--primary))}
.ot-dialog .ot-root :is(button,input,textarea,summary,a):focus-visible{outline:3px solid hsl(var(--ring));outline-offset:4px}
.ot-dialog .ot-root :is(h1,h2){line-height:1.25;overflow-wrap:anywhere}
.ot-dialog .ot-root h1{font-size:1.7em;max-width:100%;margin:0}
.ot-dialog .ot-root h2{font-size:1.22em;margin:1.2em 0 .5em}
.ot-dialog .ot-root h1:focus{outline:none}
.ot-header{display:flex;justify-content:space-between;align-items:start;gap:20px;flex-wrap:wrap}
.ot-dialog .ot-root .ot-eyebrow{font-size:.7em;letter-spacing:.1em;font-weight:800}
.ot-mode{padding:12px 16px;border-left:4px solid hsl(var(--primary));background:hsl(var(--secondary));border-radius:8px}
.ot-progress{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:20px 0}
.ot-progress span{padding:12px;border:1px solid hsl(var(--border));border-radius:12px;background:hsl(var(--card))}
.ot-progress [aria-current=step]{border:2px solid hsl(var(--primary));font-weight:800}
.ot-card{border:1px solid hsl(var(--border));border-radius:22px;padding:clamp(16px,3vw,28px);background:hsl(var(--card));margin:20px 0}
.ot-dialog .ot-root label{display:flex;flex-direction:column;gap:8px;margin:18px 0;font-weight:650}
.ot-dialog .ot-root input:not([type=checkbox]):not([type=radio]),.ot-dialog .ot-root textarea{width:100%;min-height:60px;border:2px solid hsl(var(--input));border-radius:12px;padding:12px;color:hsl(var(--foreground));background:hsl(var(--card));font-weight:400}
.ot-dialog .ot-root textarea{min-height:132px;resize:vertical}
.ot-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ot-dialog .ot-root .ot-check{flex-direction:row;align-items:start;padding:14px;border:1px solid hsl(var(--border));border-radius:12px;font-weight:500;cursor:pointer}
.ot-check input{width:26px;height:26px;flex-shrink:0;margin-top:3px;accent-color:hsl(var(--primary))}
.ot-actions,.ot-listen{display:flex;gap:12px;flex-wrap:wrap;align-items:start;margin:20px 0}
.ot-actions button{flex:1 1 220px}.ot-listen p{flex-basis:100%}
.ot-info{background:hsl(var(--secondary));padding:16px;border-radius:12px;border:1px solid hsl(var(--border))}
.ot-dialog .ot-root .ot-error{border:2px solid hsl(var(--destructive));background:hsl(var(--card));padding:18px;color:hsl(var(--foreground));border-radius:12px}
.ot-live-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:hsl(var(--card));border:2px solid hsl(var(--border));padding:12px;border-radius:14px}
.ot-live-bar>span{font-weight:800;font-variant-numeric:tabular-nums}
.ot-dialog .ot-root .ot-danger{border-color:hsl(var(--destructive));color:hsl(var(--foreground))}
.ot-command{background:hsl(var(--secondary));border-left:5px solid hsl(var(--primary));padding:20px;border-radius:10px;font-weight:750}
.ot-badge{font-weight:800;letter-spacing:.05em}
.ot-outcomes{border:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}
.ot-outcomes legend{padding-bottom:12px;font-weight:800}
.ot-outcomes button[aria-pressed=true]{border:3px solid hsl(var(--primary));background:hsl(var(--secondary))}
.ot-child{padding:20px 0;text-align:center}.ot-child>.ot-primary{width:100%;margin-top:24px}
.ot-stimulus{border:1px solid hsl(var(--border));border-radius:20px;background:hsl(var(--card));padding:16px;max-width:820px;margin:auto}
.ot-stimulus svg{display:block;width:100%;height:auto;max-height:450px}
.ot-dialog .ot-root .ot-reading{font-size:1.8em;line-height:1.7;padding:clamp(20px,4vw,48px);text-align:left;background:hsl(var(--card));border-radius:20px;border:1px solid hsl(var(--border));white-space:pre-wrap}
.ot-neutral{padding:30px;background:hsl(var(--card));border-radius:20px}
.ot-choices{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:30px 0}
.ot-dialog .ot-root .ot-choices button{min-height:180px;padding:24px;background:hsl(var(--card))}
.ot-choices svg{width:100%;height:150px;fill:hsl(var(--primary))}
.ot-choices button[aria-pressed=true],.ot-count button[aria-pressed=true]{border:4px solid hsl(var(--ring))}
.ot-count{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin:30px 0}.ot-count button{flex:0 1 120px}.ot-count svg{width:100%;fill:hsl(var(--primary))}
.ot-draw-area{display:block;width:100%;height:auto;aspect-ratio:2/1;background:hsl(var(--card));border:3px solid hsl(var(--input));border-radius:16px;touch-action:none;user-select:none;color:hsl(var(--foreground))}
.ot-model{display:block;width:160px;height:120px;margin:0 auto 16px;background:hsl(var(--card));border-radius:14px}
.ot-video{display:block;width:100%;max-width:720px;max-height:340px;object-fit:contain;background:hsl(var(--muted));margin:18px auto;border-radius:14px}
.ot-review-item{border-bottom:1px solid hsl(var(--border));padding:10px 0}
.ot-file{display:block;text-align:center;text-decoration:underline;margin:14px 0}
.ot-root pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}
.ot-dialog .ot-root .ot-footer{margin-top:25px;font-size:.8em;border-top:1px solid hsl(var(--border));padding-top:15px}
.ot-emergency{border:4px solid hsl(var(--destructive));padding:24px;background:hsl(var(--card));border-radius:16px}
.ot-rehearsal{padding:32px;border:2px dashed hsl(var(--primary));border-radius:20px;background:hsl(var(--secondary))}
@media(max-width:600px){.ot-progress{grid-template-columns:1fr 1fr}.ot-outcomes{grid-template-columns:1fr}.ot-header button{width:100%}.ot-live-bar button{flex:1 1 140px}.ot-dialog .ot-root{padding-top:16px}.ot-choices{gap:12px}.ot-dialog .ot-root .ot-choices button{padding:10px;min-height:130px}.ot-choices svg{height:100px}.ot-dialog .ot-root .ot-reading{font-size:1.4em}}
@media(prefers-reduced-motion:reduce){.ot-dialog *{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
`;
