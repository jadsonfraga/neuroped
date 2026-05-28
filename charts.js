/* ===========================================================
   NeuroPed EDJ — Charts helper (SVG nativo, zero dependência)
   =========================================================== */

const Charts = {

  /* Line chart com gradiente */
  line(values, opts = {}) {
    const w = opts.width || 600, h = opts.height || 180;
    const pad = 24;
    const max = Math.max(...values), min = Math.min(...values);
    const range = max - min || 1;
    const stepX = (w - pad * 2) / (values.length - 1);
    const pts = values.map((v, i) => [pad + i * stepX, h - pad - ((v - min) / range) * (h - pad * 2)]);
    const d = 'M ' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L ');
    const area = d + ' L ' + pts[pts.length-1][0].toFixed(1) + ',' + (h - pad) + ' L ' + pts[0][0].toFixed(1) + ',' + (h - pad) + ' Z';
    const color = opts.color || 'var(--brand)';
    const grad = opts.gradient !== false;
    return `
      <svg class="chart-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg-${opts.id||'1'}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grad ? `<path d="${area}" fill="url(#lg-${opts.id||'1'})"/>` : ''}
        <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${pts.map((p, i) => i === pts.length - 1 ? `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${color}"/><circle cx="${p[0]}" cy="${p[1]}" r="8" fill="${color}" opacity="0.25"/>` : '').join('')}
      </svg>
    `;
  },

  /* Bar chart */
  bars(values, opts = {}) {
    const w = opts.width || 600, h = opts.height || 160;
    const pad = 16;
    const max = Math.max(...values);
    const barW = (w - pad * 2) / values.length - 6;
    const color = opts.color || 'var(--brand)';
    const grad = opts.gradient !== false;
    return `
      <svg class="chart-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bg-${opts.id||'1'}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ff6b7a"/>
            <stop offset="100%" stop-color="#df2f3a"/>
          </linearGradient>
        </defs>
        ${values.map((v, i) => {
          const x = pad + i * (barW + 6);
          const bh = (v / max) * (h - pad * 2);
          const y = h - pad - bh;
          return `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="4" fill="${grad ? 'url(#bg-' + (opts.id||'1') + ')' : color}"/>`;
        }).join('')}
      </svg>
    `;
  },

  /* Donut chart */
  donut(items, opts = {}) {
    const size = opts.size || 180;
    const cx = size / 2, cy = size / 2, r = size / 2 - 16, ir = r - 28;
    const total = items.reduce((s, x) => s + x.v, 0);
    let acc = 0;
    const arcs = items.map(it => {
      const start = acc / total * Math.PI * 2 - Math.PI / 2;
      acc += it.v;
      const end = acc / total * Math.PI * 2 - Math.PI / 2;
      const large = (end - start) > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
      const x3 = cx + ir * Math.cos(end),  y3 = cy + ir * Math.sin(end);
      const x4 = cx + ir * Math.cos(start), y4 = cy + ir * Math.sin(start);
      return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ir} ${ir} 0 ${large} 0 ${x4} ${y4} Z" fill="${it.c}"/>`;
    }).join('');
    return `
      <svg class="chart-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        ${arcs}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">${total}</text>
        <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.55">total</text>
      </svg>
    `;
  },

  /* Legend (para donut/bar) */
  legend(items) {
    return '<div class="row" style="gap:14px; flex-wrap:wrap; font-size:13px;">' +
      items.map(it => `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:${it.c};"></span>${it.d} <strong>${it.v}</strong></span>`).join('') +
      '</div>';
  }
};

window.Charts = Charts;
