import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COPY, LANGUAGES, RELEASE, PRODUCT, CONTACT, CANONICAL } from './content.mjs';
const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const checking = process.argv.includes('--check');
export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h = escapeHTML;
const asset = '/obs10-global/';
const icons = ['🧺','🧩','🔎','🩺'];
function blocks(items, className='cards') { return `<div class="${className}">${items.map(([title, text], i) => `<article><span class="number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3>${h(title)}</h3><p>${h(text)}</p></article>`).join('')}</div>`; }
function demo(c) {
 return `<section id="demo" class="section demo" aria-labelledby="demo-title">
 <div class="section-heading"><span class="eyebrow">02 / DEMO</span><h2 id="demo-title">${h(c.demoTitle)}</h2><p>${h(c.demoIntro)}</p></div>
 <noscript><p class="notice">${h(c.noJs)}</p></noscript>
 <div id="demo-controls" hidden><label for="scenario">${h(c.scenarioLabel)}</label><select id="scenario">${c.scenarios.map(s=>`<option value="${s.id}">${h(s.label)}</option>`).join('')}</select>
 <nav class="demo-steps" aria-label="${h(c.stepsLabel)}">${c.steps.map((s,i)=>`<button type="button" data-step-button="${i}">${h(s)}</button>`).join('')}</nav></div>
 <div class="demo-cases">${c.scenarios.map(s=>`<article class="demo-case" data-scenario="${s.id}">
 <div class="demo-case-heading"><span class="scenario-icon" aria-hidden="true">${s.icon}</span><div><p class="eyebrow">${h(c.synthetic)}</p><h3>${h(s.label)}</h3></div></div>
 <div data-demo-step="0"><h4>${h(c.fields[0])}</h4><p>${h(s.kit)}</p><div class="prompt"><span>${h(c.fields[1])}</span><p>${h(s.command)}</p></div></div>
 <div data-demo-step="1"><h4>${h(c.fields[2])}</h4><blockquote>${h(s.response)}</blockquote><h4>${h(c.fields[3])}</h4><p>${h(s.help)}</p></div>
 <div data-demo-step="2"><h4>${h(c.fields[4])}</h4><p class="reference">${h(s.reference)}</p><p class="notice">${h(c.trace)}</p><div class="trace-map" aria-hidden="true"><span>${h(c.workflow[1][0])}</span><b>→</b><span>${h(c.workflow[2][0])}</span><b>→</b><span>${h(c.workflow[3][0])}</span></div></div>
 <div data-demo-step="3"><h4>${h(c.fields[5])}</h4><p>${h(s.review)}</p><div class="limit"><h4>${h(c.fields[6])}</h4><p>${h(s.limit)}</p></div></div></article>`).join('')}</div>
 <div id="demo-actions" class="demo-actions" hidden><button type="button" id="previous">← ${h(c.previous)}</button><button type="button" id="next" class="primary">${h(c.next)} →</button><button type="button" id="reset" class="quiet">${h(c.reset)}</button></div><p id="demo-status" role="status" class="sr-only"></p></section>`;
}
function partnerKit(c, lang) {
 const t=c.kitHeadings;
 return `# NeuroPed OBS-10 — ${c.kitTitle}\n\n${c.footnote}\n\n## ${t[0]}\n\n${c.status}\n\n${c.disclaimer}\n\n${c.factsNote}\n\n## ${t[1]}\n\n${c.workflow.map(([a,b])=>`### ${a}\n\n${b}`).join('\n\n')}\n\n## ${t[2]}\n\n${c.evidence[2][1]}\n\n## ${t[3]}\n\n${c.pilotSteps.map(([a,b],i)=>`${i+1}. **${a}.** ${b}`).join('\n')}\n\n## ${t[4]}\n\n${c.metrics.map(x=>`- ${x}`).join('\n')}\n\n${c.analysis}\n\n## ${t[5]}\n\n${c.criteria.map(x=>`- [ ] ${x}`).join('\n')}\n\n## ${t[6]}\n\n${c.boundaries.map(([a,b])=>`**${a}** ${b}`).join('\n\n')}\n\n## ${t[7]}\n\n${c.email}\n\n## ${t[8]}\n\n${CONTACT}\n\n${CANONICAL}${lang.path}\n\n${c.contactNote}\n\n## ${c.references}\n\n${c.referencesText}\n\n- FDA: https://www.fda.gov/medical-devices/human-factors-and-medical-devices/human-factors-considerations\n- W3C: https://www.w3.org/International/questions/qa-html-language-declarations\n\n${c.footer}\n`;
}
export function render(c, lang) {
 const mail=`mailto:${CONTACT}?subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(c.email)}`;
 const path = lang.path;
 return `<!doctype html>
<html lang="${lang.html}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<title>${h(c.title)}</title><meta name="description" content="${h(c.description)}"><meta name="robots" content="index,follow"><meta name="color-scheme" content="light">
<link rel="canonical" href="${CANONICAL}${path}">${LANGUAGES.map(l=>`<link rel="alternate" hreflang="${l.html}" href="${CANONICAL}${l.path}">`).join('')}<link rel="alternate" hreflang="x-default" href="${CANONICAL}/obs10-global/en/">
<meta property="og:title" content="${h(c.title)}"><meta property="og:description" content="${h(c.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${CANONICAL}${path}">
<link rel="icon" href="${asset}icon.svg" type="image/svg+xml"><link rel="stylesheet" href="${asset}site.css"><script src="${asset}site.js" defer></script></head>
<body><a class="skip" href="#main">${h(c.skip)}</a><div class="wrap">
<header class="top"><a class="brand" href="${path}" aria-label="NeuroPed OBS-10"><span class="brand-symbol" aria-hidden="true">✦</span><span>NeuroPed <b>OBS-10</b><small>SDG</small></span></a><nav class="languages" aria-label="${h(c.language)}">${LANGUAGES.map(l=>`<a href="${l.path}" lang="${l.html}" hreflang="${l.html}" ${l.id===lang.id?'aria-current="page"':''}>${l.name}</a>`).join('')}</nav></header>
<nav class="main-nav" aria-label="${h(c.menu)}">${['workflow','demo','evidence','pilot'].map((id,i)=>`<a href="#${id}">${h(c.nav[i])}</a>`).join('')}</nav>
<main id="main"><section class="hero" aria-labelledby="title"><div class="hero-copy"><p class="eyebrow">${h(c.eyebrow)}</p><h1 id="title">${c.headline.split('\n').map(h).join('<br>')}</h1><p class="intro">${h(c.intro)}</p><div class="actions"><a href="#demo" class="primary">${h(c.demoCta)} <span aria-hidden="true">→</span></a><a href="#pilot" class="secondary">${h(c.pilotCta)}</a></div><p class="status"><span aria-hidden="true">●</span> ${h(c.status)}</p></div>
<div class="hero-visual" aria-hidden="true"><span class="spark s1">✦</span><span class="spark s2">✦</span><div class="bear">🧸</div><div class="visual-path">${c.workflow.map(([title],i)=>`<span><b>${icons[i]}</b>${h(title)}</span>`).join('')}</div></div></section>
<aside class="notice hero-notice"><strong>${h(c.disclaimer)}</strong></aside>
<section class="facts" aria-labelledby="facts-title"><h2 id="facts-title">${h(c.factsTitle)}</h2><dl>${c.facts.map(([n,label])=>`<div><dt>${h(label)}</dt><dd>${h(n)}</dd></div>`).join('')}</dl><p>${h(c.factsNote)}</p></section>
<section id="workflow" class="section" aria-labelledby="workflow-title"><div class="section-heading"><span class="eyebrow">01 / OBS-10</span><h2 id="workflow-title">${h(c.workflowTitle)}</h2><p>${h(c.workflowIntro)}</p></div>${blocks(c.workflow)}</section>
${demo(c)}
<section id="evidence" class="section" aria-labelledby="evidence-title"><div class="section-heading"><span class="eyebrow">03 / OBS-10</span><h2 id="evidence-title">${h(c.evidenceTitle)}</h2><p>${h(c.evidenceIntro)}</p></div>${blocks(c.evidence,'evidence-cards')}<div class="boundaries">${c.boundaries.map(([q,a])=>`<details><summary>${h(q)}</summary><p>${h(a)}</p></details>`).join('')}</div></section>
<section id="pilot" class="section" aria-labelledby="pilot-title"><div class="section-heading"><span class="eyebrow">04 / OBS-10</span><h2 id="pilot-title">${h(c.pilotTitle)}</h2><p>${h(c.pilotIntro)}</p></div>${blocks(c.pilotSteps)}<div class="partner-grid"><div class="metrics"><h3>${h(c.metricsTitle)}</h3><ul>${c.metrics.map(x=>`<li>${h(x)}</li>`).join('')}</ul></div><div class="partner-kit"><span class="kit-icon" aria-hidden="true">🧺</span><h3>${h(c.kitTitle)}</h3><p>${h(c.kitText)}</p><a id="kit-download" class="primary" href="${asset}partner-kit-${lang.id}.md" download="OBS10-partner-kit-${lang.id}.md">${h(c.kitDownload)} ↓</a><button type="button" id="print" class="quiet" hidden>${h(c.print)}</button></div></div>
<div class="contact"><a id="contact" class="secondary" href="${h(mail)}">${h(c.contact)} ↗</a><p>${h(c.contactNote)}</p><a class="clinical" href="/#/avaliacao-pre-consulta-faixa-etaria">${h(c.clinicalCta)}</a></div></section>
<section class="method" aria-labelledby="method-title"><h2 id="method-title">${h(c.references)}</h2><p>${h(c.referencesText)}</p><a href="https://www.fda.gov/medical-devices/human-factors-and-medical-devices/human-factors-considerations" lang="en" target="_blank" rel="noopener noreferrer">FDA · Human factors considerations ↗</a><a href="https://www.w3.org/International/questions/qa-html-language-declarations" lang="en" target="_blank" rel="noopener noreferrer">W3C · Declaring language in HTML ↗</a></section>
</main><footer><p lang="pt-BR">${h(c.footer)}</p><p>${h(c.footnote)}</p></footer></div></body></html>\n`;
}
const files = [];
for (const lang of LANGUAGES) {
 const c = COPY[lang.id];
 files.push([`client/public${lang.path}index.html`, render(c,lang)]);
 files.push([`client/public/obs10-global/partner-kit-${lang.id}.md`, partnerKit(c,lang)]);
}
files.push(['client/public/obs10-global/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${LANGUAGES.map(l=>`<url><loc>${CANONICAL}${l.path}</loc></url>`).join('')}</urlset>\n`]);
for (const [path, content] of files) {
 const full=resolve(root,path);
 if(checking) { if(readFileSync(full,'utf8')!==content) throw new Error(`Generated output differs: ${path}`); }
 else { mkdirSync(resolve(full,'..'),{recursive:true});writeFileSync(full,content); }
}
console.log(`OBS-10 international presentation ${RELEASE}, product reference ${PRODUCT}: ${files.length} deterministic files ${checking?'verified':'rendered'}.`);
