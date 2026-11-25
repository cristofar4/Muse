/* =========================================================================
   MUSE · interactions
   Vanilla JS, no dependencies. Sections:
   1. helpers & data        6. hero (tabs, swirl physics, parallax)
   2. drawn art (SVG)       7. signatures, quick view, bag
   3. intro / preloader     8. journey, finder, house, gifting, FAQ
   4. navigation            9. letters, sillage, magnetic, reveals
   5. overlays (dialogs)   10. boot
   ========================================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     1. HELPERS & DATA
     --------------------------------------------------------------------- */
  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 4);
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '€' + n.toLocaleString('en-GB');
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* one shared animation loop; tasks return false to sleep */
  const loop = (() => {
    const tasks = new Set();
    let raf = 0, last = 0;
    const frame = t => {
      const dt = last ? Math.min(50, t - last) : 16.67;
      last = t;
      tasks.forEach(fn => { if (fn(t, dt) === false) tasks.delete(fn); });
      if (tasks.size) raf = requestAnimationFrame(frame);
      else { raf = 0; last = 0; }
    };
    return {
      add(fn) { tasks.add(fn); if (!raf) raf = requestAnimationFrame(frame); },
      remove(fn) { tasks.delete(fn); }
    };
  })();

  function tween(ms, fn, done) {
    if (reduced() || ms <= 0) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / ms);
      fn(t);
      if (t < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  }

  const SCENTS = {
    ambre: {
      key: 'ambre', no: '01', name: 'Ambre 01', mood: 'Warm & woody', kind: 'Eau de parfum',
      desc: 'Sun-warmed resin and saffron over a base of amberwood. Golden from the first spray, it grows softer and warmer as the evening goes on.',
      notes: { Top: ['Bergamot', 'Pink pepper'], Heart: ['Saffron', 'Orange blossom'], Base: ['Amberwood', 'Sandalwood', 'Vanilla'] },
      heroNotes: 'Bergamot · Saffron · Amberwood',
      why: 'Golden, resinous and warm. It wears like late sun on skin.',
      tags: 'warm amber woody resin golden evening spicy sweet oriental',
      sizes: [{ ml: 50, price: 165 }, { ml: 100, price: 235 }]
    },
    fleur: {
      key: 'fleur', no: '02', name: 'Fleur 02', mood: 'Soft & floral', kind: 'Eau de parfum',
      desc: 'Jasmine sambac and pale rose, kept airy with pear and a clean white musk. Close, quiet and luminous on skin.',
      notes: { Top: ['Pear', 'Mandarin'], Heart: ['Jasmine sambac', 'Rose', 'Peony'], Base: ['White musk', 'Cashmere wood'] },
      heroNotes: 'Pear · Jasmine sambac · White musk',
      why: 'Soft petals and clean musk. Quietly luminous and close to you.',
      tags: 'floral soft white flowers powdery musk clean light daytime romantic',
      sizes: [{ ml: 50, price: 155 }, { ml: 100, price: 220 }]
    },
    cedre: {
      key: 'cedre', no: '03', name: 'Cèdre 03', mood: 'Deep & grounding', kind: 'Eau de parfum',
      desc: 'Atlas cedar and vetiver, opened with lime and cardamom and settled with oakmoss. Green, dry and calm, like a forest after rain.',
      notes: { Top: ['Lime', 'Cardamom'], Heart: ['Atlas cedar', 'Vetiver'], Base: ['Oakmoss', 'Incense'] },
      heroNotes: 'Lime · Atlas cedar · Oakmoss',
      why: 'Green, dry and calm, like a forest after rain.',
      tags: 'woody fresh green citrus earthy aromatic deep grounding forest cedar',
      sizes: [{ ml: 50, price: 170 }, { ml: 100, price: 240 }]
    }
  };
  const ORDER = ['ambre', 'fleur', 'cedre'];
  const SET = { key: 'set', name: 'Discovery set', kind: 'Three 5 ml vials', sizes: [{ ml: 15, price: 48 }] };
  const product = k => SCENTS[k] || (k === 'set' ? SET : null);
  ORDER.forEach(k => {
    const s = SCENTS[k];
    s.all = [].concat(...Object.values(s.notes));
    s.search = norm([s.name, s.mood, s.tags, s.all.join(' ')].join(' '));
  });

  /* ---------------------------------------------------------------------
     2. DRAWN ART · bottles, vials and ingredients are generated SVG
     --------------------------------------------------------------------- */
  let uid = 0;
  const rr = (x, y, w, h, r) =>
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  const SURF = 120;
  const waveLine = (y, a, x0 = -80, x1 = 320, p = 40) => {
    let s = `M${x0} ${y}`;
    for (let x = x0; x < x1; x += p) s += `Q${x + p / 4} ${y - a} ${x + p / 2} ${y}T${x + p} ${y}`;
    return s;
  };
  const WAVE = waveLine(SURF, 2.2);
  const WAVE_FILL = `${WAVE}L320 ${SURF + 10}L-80 ${SURF + 10}Z`;
  const FRAME = rr(20, 96, 160, 170, 12) + rr(31, 108, 138, 132, 7);

  function flacon(key) {
    const id = `fl${++uid}`;
    return `<div class="flacon" data-scent="${key}">
<svg class="flacon__back" viewBox="0 0 200 280" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="${id}w" x1="0" x2="1"><stop class="s-w4" offset="0"/><stop class="s-w2" offset=".14"/><stop class="s-w1" offset=".5"/><stop class="s-w2" offset=".86"/><stop class="s-w4" offset="1"/></linearGradient>
<linearGradient id="${id}l" gradientUnits="userSpaceOnUse" x1="0" y1="112" x2="0" y2="250"><stop class="s-l1" offset="0"/><stop class="s-l2" offset=".3"/><stop class="s-l3" offset=".78"/><stop class="s-l4" offset="1"/></linearGradient>
<linearGradient id="${id}b" x1="0" x2="0" y1="0" y2="1"><stop class="s-l2" offset="0"/><stop class="s-l3" offset=".5"/><stop class="s-w4" offset="1"/></linearGradient>
</defs>
<path d="${FRAME}" fill-rule="evenodd" fill="url(#${id}w)"/>
<rect x="20" y="96" width="160" height="14" fill="url(#g-shoulder)" clip-path="url(#c-body)"/>
<g clip-path="url(#c-cavity)">
<rect class="flacon__air" x="31" y="108" width="138" height="20"/>
<g class="flacon__liquid"><g class="flacon__amp"><g class="flacon__wave"><path d="${WAVE_FILL}" fill="url(#${id}l)"/><path class="flacon__meniscus" d="${WAVE}"/></g></g>
<rect x="-60" y="${SURF + 4}" width="320" height="220" fill="url(#${id}l)"/></g>
<rect x="31" y="108" width="138" height="132" fill="url(#g-cav-shade)"/>
</g>
<g clip-path="url(#c-body)">
<rect x="20" y="240" width="160" height="26" fill="url(#${id}b)"/>
<rect x="31" y="240.4" width="138" height="1.3" fill="#fff" opacity=".55"/>
<rect x="20" y="262" width="160" height="4" fill="#000" opacity=".22"/>
</g>
</svg>
<svg class="flacon__front" viewBox="0 0 200 280" aria-hidden="true" focusable="false">
<defs><linearGradient id="${id}c" x1="0" x2="1" y1="0" y2="1"><stop class="s-c1" offset="0"/><stop class="s-c2" offset="1"/></linearGradient></defs>
<rect x="22.5" y="101" width="5" height="158" rx="2.5" fill="url(#g-hl)" opacity=".8"/>
<rect x="33" y="114" width="1.6" height="120" fill="#fff" opacity=".28"/>
<rect x="172.5" y="104" width="3.4" height="150" rx="1.7" fill="url(#g-hl)" opacity=".45"/>
<path d="M44 110L74 110L58 238L40 238Z" fill="#fff" opacity=".07"/>
<path d="M32 99.5H168" stroke="#fff" stroke-opacity=".55" stroke-width="1.1" stroke-linecap="round"/>
<path d="${rr(20.5, 96.5, 159, 169, 11.5)}" fill="none" stroke="#fff" stroke-opacity=".3"/>
<rect x="58" y="142" width="84" height="54" fill="url(#g-label)"/>
<rect x="58" y="142" width="84" height="54" fill="none" stroke="#000" stroke-opacity=".08"/>
<rect class="fl-rule" x="61.5" y="145.5" width="77" height="47" fill="none"/>
<text class="fl-brand" x="102.3" y="171">MUSE</text>
<text class="fl-name fl-name--ambre" x="100.95" y="184">AMBRE 01</text>
<text class="fl-name fl-name--fleur" x="100.95" y="184">FLEUR 02</text>
<text class="fl-name fl-name--cedre" x="100.95" y="184">CÈDRE 03</text>
<rect x="76" y="80" width="48" height="16" rx="1.5" fill="url(#g-gold)"/>
<path d="M76 84.5H124M76 88.5H124M76 92.5H124" stroke="#5a3a12" stroke-opacity=".35" stroke-width=".6"/>
<rect x="70" y="93.5" width="60" height="4.5" rx="1.5" fill="url(#g-gold)"/>
<g class="cap cap--block">
<rect x="56" y="12" width="88" height="70" rx="5" fill="url(#${id}c)"/>
<g clip-path="url(#c-cap)"><rect class="cap__veins" x="10" y="-40" width="180" height="170" filter="url(#fx-veins)" transform="rotate(-34 100 47)"/></g>
<rect x="56" y="12" width="88" height="70" rx="5" fill="url(#g-cap-shade)"/>
<rect x="58" y="13" width="84" height="3" rx="1.5" fill="#fff" opacity=".18"/>
<path d="M57 78.5H143" stroke="#000" stroke-opacity=".25"/>
</g>
<g class="cap cap--pebble">
<path d="M60 82C56 58 62 30 100 28C138 30 144 58 140 82Z" fill="url(#${id}c)"/>
<path d="M60 82C56 58 62 30 100 28C138 30 144 58 140 82Z" fill="url(#g-pebble-shade)"/>
</g>
</svg></div>`;
  }

  function vial(key) {
    const id = `vi${++uid}`;
    const label = { ambre: 'AMBRE 01', fleur: 'FLEUR 02', cedre: 'CÈDRE 03' }[key] || '';
    return `<div class="vial" data-scent="${key}"><svg viewBox="0 0 40 120" aria-hidden="true" focusable="false">
<defs><linearGradient id="${id}l" x1="0" x2="1"><stop class="s-l3" offset="0"/><stop class="s-l1" offset=".45"/><stop class="s-l3" offset="1"/></linearGradient></defs>
<rect x="11" y="2" width="18" height="31" rx="2" fill="url(#g-gold)"/>
<path d="M11 9H29M11 15H29M11 21H29M11 27H29" stroke="#5a3a12" stroke-opacity=".3" stroke-width=".5"/>
<g clip-path="url(#c-vial)"><rect x="9" y="46" width="22" height="80" fill="url(#${id}l)"/><path d="M9 46Q20 43.6 31 46" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".7"/></g>
<rect x="9" y="34" width="22" height="82" rx="5" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".55" stroke-width=".8"/>
<rect x="12" y="38" width="2.4" height="72" rx="1.2" fill="#fff" opacity=".5"/>
<rect x="11" y="72" width="18" height="22" fill="#f4ecdf"/>
<text x="20.6" y="81" font-family="Bodoni Moda, Georgia, serif" font-size="4.4" letter-spacing="1.2" text-anchor="middle" fill="#2a1a12">MUSE</text>
<text x="20.4" y="88.5" font-family="Jost, sans-serif" font-size="2.5" letter-spacing=".8" text-anchor="middle" fill="#4a352c">${label}</text>
</svg></div>`;
  }

  const P = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  const ING = {
    citrus(v) {
      const id = `ci${++uid}`;
      const lime = v === 'lime';
      const peel = lime ? ['#b3c84a', '#5f7d19', '#3a520e'] : ['#ece06a', '#b0ab2e', '#717c1c'];
      const pulp = lime ? ['#f1f7bd', '#cfe175', '#a2c043'] : ['#fff8c8', '#f2df7e', '#dcbc4c'];
      let seg = '', ves = '';
      const n = 10;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2 + .07, a1 = ((i + 1) / n) * Math.PI * 2 - .07, am = (a0 + a1) / 2;
        seg += `<path d="M${P(7, am - .15)}L${P(38.5, a0)}A38.5 38.5 0 0 1 ${P(38.5, a1)}L${P(7, am + .15)}Z"/>`;
        for (let k = -1; k <= 1; k++) ves += `<path d="M${P(13, am + k * .1)}L${P(33, am + k * .19)}"/>`;
      }
      return `<svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><defs>
<radialGradient id="${id}a" cx=".38" cy=".34" r=".72"><stop offset="0" stop-color="${peel[0]}"/><stop offset=".72" stop-color="${peel[1]}"/><stop offset="1" stop-color="${peel[2]}"/></radialGradient>
<radialGradient id="${id}b" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="40"><stop offset=".15" stop-color="${pulp[0]}"/><stop offset=".7" stop-color="${pulp[1]}"/><stop offset="1" stop-color="${pulp[2]}"/></radialGradient></defs>
<circle r="48" fill="url(#${id}a)"/><circle r="44" fill="#f5f1d4"/><circle r="41" fill="#ece4ba"/>
<g fill="url(#${id}b)" stroke="url(#${id}b)" stroke-width="2.2" stroke-linejoin="round">${seg}</g>
<g stroke="#fff" stroke-opacity=".38" stroke-width=".8" stroke-linecap="round">${ves}</g>
<circle r="6" fill="#f7f2da"/>
<path d="M-31 -31A43 43 0 0 1 9 -43" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></svg>`;
    },
    jasmine() {
      const id = `ja${++uid}`;
      let petals = '';
      for (let i = 0; i < 5; i++) {
        const rot = i * 72 + (i % 2 ? 4 : -3);
        petals += `<g transform="rotate(${rot})"><path d="M0 -3C-11 -9 -15 -30 -4 -43C-1 -46 3 -46 6 -42C15 -29 10 -9 0 -3Z" fill="url(#${id}p)"/><path d="M0 -6Q-1 -24 1 -39" fill="none" stroke="#b49a70" stroke-opacity=".3" stroke-width=".7"/></g>`;
      }
      return `<svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><defs>
<linearGradient id="${id}p" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-44"><stop offset="0" stop-color="#e6d6b2"/><stop offset=".35" stop-color="#fbf6ea"/><stop offset="1" stop-color="#fffefa"/></linearGradient></defs>
<g transform="rotate(-8)">${petals}</g>
<circle r="5.5" fill="#efe2b8"/><circle r="3" fill="#d6bb5c"/>
<g fill="#c3a03c"><circle cx="-1.5" cy="-1" r=".9"/><circle cx="1.6" cy=".6" r=".9"/></g></svg>`;
    },
    wood(v) {
      const id = `wo${++uid}`;
      const c = v === 'dark' ? ['#7d5538', '#3c2416', '#1d1009'] : ['#a97449', '#603c23', '#2e1a0e'];
      const shape = 'M8 78C20 58 44 40 78 32C112 24 146 12 176 8C188 7 197 14 194 26C190 42 172 52 150 62C118 78 86 92 52 104C32 111 14 110 7 100C3 93 4 85 8 78Z';
      let grain = '';
      for (let i = 0; i < 17; i++) {
        const y = 14 + i * 6.2, j = ((i * 37) % 11) - 5;
        grain += `<path d="M-10 ${y + 72}C40 ${y + 52 + j} 92 ${y + 14 - j} 212 ${y - 34}" stroke-width="${(.5 + (i % 3) * .35).toFixed(2)}" stroke-opacity="${(.22 + (i % 4) * .1).toFixed(2)}"/>`;
      }
      return `<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false"><defs>
<linearGradient id="${id}g" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".55" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>
<clipPath id="${id}c"><path d="${shape}"/></clipPath></defs>
<path d="${shape}" fill="url(#${id}g)"/>
<g clip-path="url(#${id}c)" fill="none" stroke="#160903">${grain}
<ellipse cx="122" cy="50" rx="11" ry="4.6" transform="rotate(-18 122 50)" stroke-opacity=".5"/><ellipse cx="122" cy="50" rx="5" ry="2" transform="rotate(-18 122 50)" stroke-opacity=".55"/></g>
<path d="M12 76C26 56 48 42 80 34C112 26 148 14 178 10" fill="none" stroke="#e3b88b" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    },
    petals() {
      const id = `pe${++uid}`;
      const one = (x, y, r, s) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C-16 -4 -22 -26 -6 -36C-2 -38 2 -38 6 -36C22 -26 16 -4 0 0Z" fill="url(#${id}p)"/><path d="M-10 -28C-4 -33 4 -33 10 -28" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/></g>`;
      return `<svg viewBox="0 0 160 90" aria-hidden="true" focusable="false"><defs>
<linearGradient id="${id}p" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="-36"><stop offset="0" stop-color="#c47270"/><stop offset=".6" stop-color="#eeb0a6"/><stop offset="1" stop-color="#f9d6cc"/></linearGradient></defs>
${one(40, 82, -30, 1.1)}${one(92, 86, 20, .92)}${one(132, 72, 70, .75)}${one(68, 52, -80, .7)}</svg>`;
    },
    resin() {
      const id = `re${++uid}`;
      const chunk = dd => `<path d="${dd}" fill="url(#${id}r)"/>`;
      return `<svg viewBox="0 0 120 80" aria-hidden="true" focusable="false"><defs>
<radialGradient id="${id}r" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe49e"/><stop offset=".35" stop-color="#f2a33a"/><stop offset=".8" stop-color="#b85a12"/><stop offset="1" stop-color="#6e2e08"/></radialGradient></defs>
${chunk('M14 60C8 48 16 34 30 32C44 30 52 42 50 54C48 66 22 72 14 60Z')}${chunk('M56 66C50 56 56 44 68 44C80 44 86 54 82 64C78 72 62 74 56 66Z')}
${chunk('M74 40C70 28 80 18 94 20C106 22 110 34 104 42C98 50 80 50 74 40Z')}${chunk('M88 72C86 64 92 58 100 60C108 62 110 70 104 74C98 78 90 78 88 72Z')}
<g fill="#fff" fill-opacity=".7"><ellipse cx="26" cy="40" rx="5" ry="2.4" transform="rotate(-20 26 40)"/><ellipse cx="64" cy="50" rx="3.4" ry="1.6" transform="rotate(-20 64 50)"/><ellipse cx="88" cy="26" rx="4" ry="1.8" transform="rotate(-20 88 26)"/><ellipse cx="97" cy="63" rx="2" ry="1"/></g></svg>`;
    },
    sprig() {
      const id = `sp${++uid}`;
      const pt = t => [(1 - t) * (1 - t) * 10 + 2 * (1 - t) * t * 90 + t * t * 190, (1 - t) * (1 - t) * 100 + 2 * (1 - t) * t * 90 + t * t * 20];
      const ang = t => Math.atan2(2 * (1 - t) * -10 + 2 * t * -70, 2 * (1 - t) * 80 + 2 * t * 100) * 180 / Math.PI;
      let leaves = '';
      for (let i = 1; i <= 11; i++) {
        const t = i / 12, [x, y] = pt(t), a = ang(t), s = (1 - t * .45).toFixed(2);
        leaves += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})"><path d="M0 0C6 -4 16 -10 26 -8C18 -2 8 2 0 0Z" transform="rotate(-38) scale(${s})" fill="url(#${id}l)"/><path d="M0 0C6 4 16 10 26 8C18 2 8 -2 0 0Z" transform="rotate(38) scale(${s})" fill="url(#${id}l)"/></g>`;
      }
      return `<svg viewBox="0 0 200 120" aria-hidden="true" focusable="false"><defs>
<linearGradient id="${id}l" x1="0" x2="1"><stop offset="0" stop-color="#3d481b"/><stop offset=".6" stop-color="#76843a"/><stop offset="1" stop-color="#a9b35e"/></linearGradient></defs>
<path d="M10 100Q90 90 190 20" fill="none" stroke="#5a4628" stroke-width="2.2" stroke-linecap="round"/>${leaves}
<path d="M190 20l6 -6" stroke="#5a4628" stroke-width="1.6" stroke-linecap="round"/></svg>`;
    }
  };

  const setArt = () => `<span style="display:flex;gap:3px;width:100%;height:100%;align-items:center">${ORDER.map(k => `<span style="flex:1;height:86%">${vial(k)}</span>`).join('')}</span>`;

  function mountArt(scope = d) {
    $$('[data-flacon]', scope).forEach(el => { if (!el.firstElementChild) el.innerHTML = flacon(el.dataset.flacon); });
    $$('[data-vial]', scope).forEach(el => { if (!el.firstElementChild) el.innerHTML = vial(el.dataset.vial); });
    $$('[data-ing]', scope).forEach(el => {
      const f = ING[el.dataset.ing];
      if (f && !el.firstElementChild) el.innerHTML = f(el.dataset.variant);
    });
    const tier = $('[data-organ-vials]');
    if (tier && !tier.firstElementChild) {
      const cols = ['#e2a24a', '#c9cf8a', '#f0c6b8', '#8a5a2e', '#d9b26a', '#a8994a', '#e9d6a8', '#b4475a', '#6e7a3a', '#f3e3b0', '#c47a6d', '#9a6a3c', '#e8c07a', '#5a3a22', '#d7a0a0', '#bfa36a', '#7a8a4a', '#e0b890', '#c58a4a', '#efe2c2'];
      tier.innerHTML = cols.map(c => `<span class="organ__vial" style="--v:${c}"></span>`).join('');
    }
    // pause idle liquid waves when a bottle is off-screen
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-paused-art', !e.isIntersecting)), { rootMargin: '120px' });
      $$('[data-flacon]', scope).forEach(el => io.observe(el));
    }
  }

  /* ---------------------------------------------------------------------
     3. INTRO · one drop falls, the curtain lifts like poured liquid
     --------------------------------------------------------------------- */
  const onReady = [];
  function intro() {
    const pre = $('.preloader');
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      root.classList.add('is-ready');
      onReady.forEach(fn => fn());
    };
    if (!root.classList.contains('is-loading') || !pre) {
      if (pre) pre.remove();
      requestAnimationFrame(() => requestAnimationFrame(start));
      return;
    }
    try { sessionStorage.setItem('muse:intro', '1'); } catch (e) { /* ignore */ }
    const fonts = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 3200))]) : Promise.resolve();
    const minTime = new Promise(r => setTimeout(r, 1950));
    Promise.all([fonts, minTime]).then(() => {
      const path = $('path', pre);
      pre.classList.add('is-leaving');
      setTimeout(start, 280);
      tween(1000, t => {
        const e = easeInOut(t), y = 100 - e * 100, b = Math.sin(Math.PI * t) * 18;
        path.setAttribute('d', `M0 0H100V${y.toFixed(2)}Q50 ${(y + b).toFixed(2)} 0 ${y.toFixed(2)}Z`);
      }, () => { root.classList.remove('is-loading'); pre.remove(); });
    });
  }

  /* ---------------------------------------------------------------------
     4. NAVIGATION · liquid logo, flowing pool, vapor text, organ panel
     --------------------------------------------------------------------- */
  const navApi = { show() {}, locked: () => false };

  function splitVapor() {
    $$('[data-vapor]').forEach(el => {
      const text = el.textContent.trim();
      const chars = Array.from(text).map((c, i) => `<span class="ch" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
      el.innerHTML = `<span class="vapor__a" aria-hidden="true">${chars}</span><span class="vapor__b" aria-hidden="true">${chars}</span><span class="sr-only">${esc(text)}</span>`;
    });
  }

  function navigation() {
    const nav = $('#nav');
    if (!nav) return;
    const bar = $('.nav__bar', nav);
    const logo = $('.logo', nav);
    const star = $('.nav__star', nav);
    const pool = $('.nav__pool', nav);
    const drop = $('.nav__drop', nav);
    const links = $$('.nav__link', nav);
    const megaBtn = $('[data-mega]', nav);
    const mega = $('#mega');
    const toneEls = $$('main > section[data-tone], footer[data-tone]');
    const spyMap = {};
    links.forEach(l => { if (l.dataset.spy) spyMap[l.dataset.spy] = l; });
    const spySections = Object.keys(spyMap).map(id => d.getElementById(id)).filter(Boolean);

    let hidden = false, lastY = scrollY, ticking = false;
    let megaOpen = false, megaOpenedAt = 0, megaTimer = 0, hoverTimer = 0;
    let hoverLink = null, spyLink = null;

    const anyModal = () => !!$('dialog[open]');
    const locked = () => megaOpen || anyModal();
    navApi.locked = locked;
    const setHidden = h => {
      if (h === hidden) return;
      hidden = h;
      nav.classList.toggle('is-hidden', h);
    };
    navApi.show = () => setHidden(false);

    /* scroll: progress fills the logo, hide on the way down, adapt tone */
    function update() {
      ticking = false;
      const y = scrollY;
      const max = root.scrollHeight - innerHeight;
      const p = max > 0 ? clamp(y / max, 0, 1) : 0;
      logo.style.setProperty('--level', `${(57 - (.2 + p * .8) * 44).toFixed(2)}px`);
      nav.classList.toggle('is-scrolled', y > 8);
      star.style.setProperty('--spin', `${(y * .12).toFixed(1)}deg`);
      const dy = y - lastY;
      if (!locked()) {
        if (y > innerHeight * .55 && dy > 4) setHidden(true);
        else if (dy < -4 || y < 80) setHidden(false);
      }
      lastY = y;

      const probe = nav.offsetHeight / 2;
      let tone = 'dark';
      for (const s of toneEls) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { tone = s.dataset.tone; break; }
      }
      if (nav.dataset.tone !== tone) nav.dataset.tone = tone;

      const line = innerHeight * .42;
      let found = null;
      for (const s of spySections) {
        const r = s.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { found = spyMap[s.id]; break; }
      }
      if (found !== spyLink) {
        if (spyLink) spyLink.removeAttribute('aria-current');
        spyLink = found;
        if (spyLink) spyLink.setAttribute('aria-current', 'location');
        if (!hoverLink && !megaOpen) aim(spyLink);
      }
    }
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', () => { onScroll(); if (pool.classList.contains('is-on')) aim(hoverLink || (megaOpen ? megaBtn : spyLink), true); });
    update();

    /* the pool: a bead of liquid that flows between links, then drips */
    const sp = { l: 0, r: 0, vl: 0, vr: 0, tl: 0, tr: 0, target: null, dripped: null };
    function aim(link, instant) {
      if (!link || innerWidth <= 1180) { pool.classList.remove('is-on'); sp.target = null; return; }
      const br = bar.getBoundingClientRect();
      const lr = ($('.vapor', link) || link).getBoundingClientRect();
      const l = lr.left - br.left - 2, r = lr.right - br.left + 2;
      if (!pool.classList.contains('is-on') || instant || reduced()) {
        const c = (l + r) / 2;
        sp.l = instant || reduced() ? l : c; sp.r = instant || reduced() ? r : c;
        sp.vl = sp.vr = 0;
        if (instant || reduced()) sp.dripped = link;
      }
      sp.tl = l; sp.tr = r; sp.target = link;
      pool.classList.add('is-on');
      loop.add(stepPool);
    }
    function stepPool(t, dt) {
      const k = dt / 16.67;
      const dir = Math.sign((sp.tl + sp.tr) - (sp.l + sp.r));
      const kl = dir > 0 ? .05 : .15, kr = dir > 0 ? .15 : .05;
      const damp = Math.pow(.74, k);
      sp.vl = (sp.vl + (sp.tl - sp.l) * kl * k) * damp;
      sp.vr = (sp.vr + (sp.tr - sp.r) * kr * k) * damp;
      sp.l += sp.vl * k; sp.r += sp.vr * k;
      const w = Math.max(4, sp.r - sp.l);
      pool.style.transform = `translateX(${sp.l.toFixed(2)}px)`;
      pool.style.width = `${w.toFixed(2)}px`;
      const settled = Math.abs(sp.tl - sp.l) < .4 && Math.abs(sp.tr - sp.r) < .4 && Math.abs(sp.vl) + Math.abs(sp.vr) < .1;
      if (settled) {
        if (sp.target && sp.target !== sp.dripped && !reduced()) { sp.dripped = sp.target; restart(drop, 'is-drip'); }
        return false;
      }
    }
    links.forEach(a => {
      a.addEventListener('pointerenter', () => { hoverLink = a; aim(a); });
      a.addEventListener('focus', () => { hoverLink = a; aim(a); });
      a.addEventListener('blur', () => { hoverLink = null; aim(megaOpen ? megaBtn : spyLink); });
    });
    bar.addEventListener('pointerleave', () => { hoverLink = null; aim(megaOpen ? megaBtn : spyLink); });

    /* the perfumer's organ (Shop panel) */
    function openMega() {
      if (megaOpen || !mega || innerWidth <= 1180) return;
      megaOpen = true; megaOpenedAt = performance.now();
      clearTimeout(megaTimer);
      mega.hidden = false;
      void mega.offsetHeight;
      mega.classList.add('is-open');
      nav.classList.add('is-mega');
      megaBtn.setAttribute('aria-expanded', 'true');
      setHidden(false);
      aim(megaBtn);
    }
    function closeMega(focusBack) {
      if (!megaOpen) return;
      megaOpen = false;
      mega.classList.remove('is-open');
      nav.classList.remove('is-mega');
      megaBtn.setAttribute('aria-expanded', 'false');
      clearTimeout(megaTimer);
      megaTimer = setTimeout(() => { if (!megaOpen) mega.hidden = true; }, 820);
      if (focusBack) megaBtn.focus();
      if (!hoverLink) aim(spyLink);
    }
    navApi.closeMega = closeMega;
    if (megaBtn) {
      megaBtn.addEventListener('click', () => {
        if (megaOpen && performance.now() - megaOpenedAt < 700) return;
        megaOpen ? closeMega() : openMega();
      });
      if (fine) {
        megaBtn.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(openMega, 150); });
        megaBtn.addEventListener('pointerleave', () => { if (!megaOpen) clearTimeout(hoverTimer); });
        links.filter(l => l !== megaBtn).forEach(l => l.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => closeMega(), 120); }));
        nav.addEventListener('pointerleave', () => { clearTimeout(hoverTimer); if (megaOpen) hoverTimer = setTimeout(() => closeMega(), 320); });
        nav.addEventListener('pointerenter', () => { if (megaOpen) clearTimeout(hoverTimer); });
      }
    }
    d.addEventListener('pointerdown', e => { if (megaOpen && !nav.contains(e.target)) closeMega(); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && megaOpen) closeMega(true); });

    const info = $('[data-organ-info]');
    $$('[data-organ]').forEach(b => {
      const show = () => {
        const s = SCENTS[b.dataset.organ];
        $$('[data-organ]').forEach(x => x.classList.toggle('is-active', x === b));
        info.innerHTML = `<p class="organ__mood">${esc(s.mood)}</p><p class="organ__notes">${esc(s.all.slice(0, 3).join(', '))}</p><p class="organ__price">From ${money(s.sizes[0].price)}</p>`;
        restart(info, 'is-swap');
      };
      b.addEventListener('pointerenter', show);
      b.addEventListener('focus', show);
    });
    const firstOrgan = $('[data-organ]');
    if (firstOrgan) firstOrgan.classList.add('is-active');
  }

  /* ---------------------------------------------------------------------
     5. OVERLAYS · menu (liquid curtain), search, bag, quick view
     --------------------------------------------------------------------- */
  const modalOpen = () => $$('dialog[open]').length > 0;
  function syncModalClass() { root.classList.toggle('has-modal', modalOpen()); }

  function openDialog(id) {
    const dlg = d.getElementById(id);
    if (!dlg || dlg.open) return;
    if (navApi.closeMega) navApi.closeMega();
    if (id === 'menu') { menuOpen(dlg); return; }
    dlg.classList.remove('is-closing');
    dlg.showModal();
    syncModalClass();
    if (id === 'search') { const i = $('#search-input'); i.value = ''; renderSearch(''); setTimeout(() => i.focus(), 30); }
    if (id === 'bag') renderBag();
  }
  function closeDialog(dlg, after) {
    if (!dlg || !dlg.open) { if (after) after(); return; }
    if (dlg.id === 'menu') { menuClose(dlg, after); return; }
    if (dlg.classList.contains('is-closing')) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dlg.classList.remove('is-closing');
      if (dlg.open) dlg.close();
      if (after) after();
    };
    if (reduced()) { finish(); return; }
    dlg.classList.add('is-closing');
    dlg.addEventListener('animationend', function h(e) { if (e.target === dlg) { dlg.removeEventListener('animationend', h); finish(); } });
    setTimeout(finish, 650);
  }

  function menuOpen(dlg) {
    const path = $('.menu__curtain path', dlg);
    $$('.menu__nav li', dlg).forEach((li, i) => li.style.setProperty('--i', i));
    dlg.classList.remove('is-in');
    path.setAttribute('d', 'M0 0H100V0Q50 0 0 0Z');
    dlg.showModal();
    syncModalClass();
    tween(880, t => {
      const e = easeInOut(t), y = e * 100, b = Math.sin(Math.PI * t) * 24;
      path.setAttribute('d', `M0 0H100V${y.toFixed(2)}Q50 ${(y + b).toFixed(2)} 0 ${y.toFixed(2)}Z`);
    });
    setTimeout(() => dlg.classList.add('is-in'), reduced() ? 0 : 340);
  }
  function menuClose(dlg, after) {
    if (dlg.dataset.closing) return;
    dlg.dataset.closing = '1';
    const path = $('.menu__curtain path', dlg);
    dlg.classList.remove('is-in');
    setTimeout(() => {
      tween(720, t => {
        const e = easeInOut(t), y = 100 - e * 100, b = Math.sin(Math.PI * t) * 20;
        path.setAttribute('d', `M0 0H100V${y.toFixed(2)}Q50 ${(y + b).toFixed(2)} 0 ${y.toFixed(2)}Z`);
      }, () => { delete dlg.dataset.closing; if (dlg.open) dlg.close(); if (after) after(); });
    }, reduced() ? 0 : 200);
  }

  function dialogs() {
    $$('dialog').forEach(dlg => {
      dlg.addEventListener('cancel', e => { e.preventDefault(); closeDialog(dlg); });
      dlg.addEventListener('close', syncModalClass);
      dlg.addEventListener('click', e => { if (e.target === dlg && dlg.id !== 'menu') closeDialog(dlg); });
    });
  }

  function scrollToHash(hash) {
    const el = hash && hash.length > 1 ? d.getElementById(hash.slice(1)) : null;
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }

  /* search over notes, moods and names */
  function renderSearch(q) {
    const list = $('[data-search-results]'), status = $('[data-search-status]');
    const term = norm(q.trim());
    const res = ORDER.map(k => SCENTS[k]).filter(s => !term || term.split(/\s+/).every(w => s.search.includes(w)));
    const shown = q.trim();
    status.textContent = !term ? 'All three signatures' : res.length
      ? `${res.length} ${res.length > 1 ? 'matches' : 'match'} for “${shown}”`
      : `Nothing matches “${shown}”. Try a note such as jasmine, cedar or bergamot.`;
    const mark = text => {
      if (!term) return esc(text);
      return text.split(', ').map(n => {
        const hit = term.split(/\s+/).some(w => norm(n).includes(w));
        return hit ? `<mark>${esc(n)}</mark>` : esc(n);
      }).join(', ');
    };
    list.innerHTML = res.map(s => `<li><button class="result" type="button" data-pdp="${s.key}">
      <span class="result__flacon">${flacon(s.key)}</span>
      <span><span class="result__name">${esc(s.name)}</span><span class="result__notes">${esc(s.mood)} · ${mark(s.all.join(', '))}</span></span>
      <span class="result__price">${money(s.sizes[0].price)}</span></button></li>`).join('');
    $$('[data-chip]').forEach(c => c.classList.toggle('is-on', norm(c.dataset.chip) === term));
  }
  function search() {
    const input = $('#search-input');
    if (!input) return;
    input.addEventListener('input', () => renderSearch(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const first = $('[data-search-results] .result'); if (first) first.click(); }
      if (e.key === 'Escape') { e.preventDefault(); closeDialog($('#search')); }
    });
  }

  /* ---------------------------------------------------------------------
     7. BAG, QUICK VIEW, FLYING BOTTLES
     --------------------------------------------------------------------- */
  const bag = { items: (store.get('muse:bag', []) || []).filter(i => product(i.key)) };
  const bagCount = () => bag.items.reduce((n, i) => n + i.qty, 0);

  function renderBag() {
    const list = $('[data-bag-items]'), empty = $('[data-bag-empty]'), foot = $('[data-bag-foot]');
    const n = bagCount();
    $$('[data-bag-count]').forEach(el => {
      if (el.textContent !== String(n)) { el.textContent = n; restart(el, 'is-roll'); }
    });
    const btn = $('.nav__bag');
    if (btn) {
      btn.setAttribute('aria-label', `Open bag, ${n} ${n === 1 ? 'item' : 'items'}`);
      btn.style.setProperty('--fill', `${[16, 11, 7, 3][Math.min(3, n)]}px`);
    }
    if (!list) return;
    empty.hidden = n > 0; foot.hidden = n === 0; list.hidden = n === 0;
    list.innerHTML = bag.items.map((it, idx) => {
      const p = product(it.key);
      const size = p.sizes.find(s => s.ml === it.ml) || p.sizes[0];
      const meta = it.key === 'set' ? p.kind : `${p.kind} · ${size.ml} ml`;
      return `<li class="line-item">
        <span class="line-item__art">${it.key === 'set' ? setArt() : flacon(it.key)}</span>
        <div><p class="line-item__name">${esc(p.name)}</p><p class="line-item__meta">${esc(meta)}</p>
          <div class="qty"><button type="button" data-qty="-1" data-idx="${idx}" aria-label="One fewer ${esc(p.name)}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button><span>${it.qty}</span><button type="button" data-qty="1" data-idx="${idx}" aria-label="One more ${esc(p.name)}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div></div>
        <div class="line-item__right"><span class="line-item__price">${money(size.price * it.qty)}</span><button class="line-item__remove" type="button" data-remove="${idx}">Remove</button></div>
      </li>`;
    }).join('');
    const sub = bag.items.reduce((s, it) => { const p = product(it.key); const sz = p.sizes.find(x => x.ml === it.ml) || p.sizes[0]; return s + sz.price * it.qty; }, 0);
    $('[data-bag-subtotal]').textContent = money(sub);
  }

  function addToBag(key, ml, fromEl) {
    const p = product(key);
    if (!p) return;
    const size = ml || p.sizes[0].ml;
    const found = bag.items.find(i => i.key === key && i.ml === size);
    if (found) found.qty += 1; else bag.items.push({ key, ml: size, qty: 1 });
    store.set('muse:bag', bag.items);
    if (fromEl && fromEl.classList.contains('add')) {
      const label = $('span', fromEl);
      fromEl.classList.add('is-added');
      if (label) label.textContent = 'Added';
      setTimeout(() => { fromEl.classList.remove('is-added'); if (label) label.textContent = 'Add to bag'; }, 1800);
    }
    fly(fromEl, key).then(() => {
      renderBag();
      const btn = $('.nav__bag');
      if (btn) restart(btn, 'is-bump');
      toast(`${esc(p.name)}${key === 'set' ? '' : ` · ${size} ml`} is in your bag.`, { label: 'View bag', fn: () => openDialog('bag') });
    });
  }

  function fly(fromEl, key) {
    const target = $('.nav__bag');
    if (reduced() || !fromEl || !target || !fromEl.getBoundingClientRect) return Promise.resolve();
    navApi.show();
    const nav = $('#nav');
    const a = fromEl.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const navTop = nav.getBoundingClientRect().top;
    const el = d.createElement('div');
    el.className = 'flyer';
    el.innerHTML = `<div>${key === 'set' ? vial('ambre') : flacon(key)}</div>`;
    d.body.appendChild(el);
    const x0 = a.left + a.width / 2 - 20, y0 = a.top + a.height / 2 - 28;
    const x1 = b.left + b.width / 2 - 20, y1 = b.top - navTop + b.height / 2 - 28;
    const peak = Math.min(y0, y1) - 120;
    const dur = 950;
    el.animate([{ transform: `translateX(${x0}px)` }, { transform: `translateX(${x1}px)` }], { duration: dur, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' });
    const anim = el.firstElementChild.animate([
      { transform: `translateY(${y0}px) scale(1) rotate(0deg)`, easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: `translateY(${peak}px) scale(.8) rotate(-18deg)`, offset: .42, easing: 'cubic-bezier(.6,0,.85,.4)' },
      { transform: `translateY(${y1}px) scale(.22) rotate(8deg)`, opacity: .4 }
    ], { duration: dur, fill: 'forwards' });
    return anim.finished.then(() => el.remove(), () => el.remove());
  }

  let toastTimer = 0;
  function toast(html, action) {
    const el = $('[data-toast]');
    if (!el) return;
    el.innerHTML = `<span>${html}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    if (action) $('button', el).addEventListener('click', () => { el.classList.remove('is-on'); action.fn(); });
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 4600);
  }

  /* product quick view */
  let pdpKey = 'ambre', pdpMl = 50;
  function updatePdpButton() {
    const s = SCENTS[pdpKey];
    const size = s.sizes.find(x => x.ml === pdpMl) || s.sizes[0];
    $('[data-pdp-add] .btn__t').textContent = `Add to bag · ${money(size.price)}`;
  }
  function openPdp(key) {
    const s = SCENTS[key];
    if (!s) return;
    pdpKey = key; pdpMl = s.sizes[0].ml;
    $('[data-pdp-art]').className = `pdp__art scene--${key}`;
    const fl = $('[data-pdp-bottle] .flacon');
    if (fl) fl.dataset.scent = key;
    $('[data-pdp-k]').textContent = `${s.kind} · ${s.no}`;
    $('[data-pdp-name]').textContent = s.name;
    $('[data-pdp-mood]').textContent = s.mood;
    $('[data-pdp-desc]').textContent = s.desc;
    $('[data-pdp-notes]').innerHTML = Object.entries(s.notes).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v.join(', '))}</dd></div>`).join('');
    $('[data-pdp-sizes]').innerHTML = s.sizes.map((z, i) => `<label class="size${i ? '' : ' is-checked'}"><input type="radio" name="pdp-size" value="${z.ml}"${i ? '' : ' checked'}><b>${z.ml} ml</b><span>${money(z.price)}</span></label>`).join('');
    updatePdpButton();
    const open = $$('dialog[open]').filter(x => x.id !== 'pdp');
    if (open.length) { let left = open.length; open.forEach(x => closeDialog(x, () => { if (--left === 0) openDialog('pdp'); })); }
    else openDialog('pdp');
  }
  function pdp() {
    const sizes = $('[data-pdp-sizes]');
    if (!sizes) return;
    sizes.addEventListener('change', e => {
      if (e.target.name !== 'pdp-size') return;
      pdpMl = Number(e.target.value);
      $$('.size', sizes).forEach(l => l.classList.toggle('is-checked', $('input', l).checked));
      updatePdpButton();
    });
    $('[data-pdp-add]').addEventListener('click', () => {
      const bottle = $('[data-pdp-bottle]');
      const r = bottle.getBoundingClientRect();
      const ghost = { getBoundingClientRect: () => r, classList: { contains: () => false } };
      const key = pdpKey, ml = pdpMl;
      closeDialog($('#pdp'), () => addToBag(key, ml, ghost));
    });
  }

  /* ---------------------------------------------------------------------
     6. HERO · scent tabs, swirl physics, parallax
     --------------------------------------------------------------------- */
  function hero() {
    const sec = $('.hero');
    if (!sec) return;
    const tabs = $$('[data-scent-tab]', sec);
    const stage = $('.hero__stage', sec);
    const wrap = $('[data-hero-bottle]', sec);
    const fl = $('.flacon', wrap);
    const liq = $('.flacon__liquid', fl);
    const amp = $('.flacon__amp', fl);
    const word = $('.hero__word', sec);
    const letters = $$('span', word);
    const moon = $('.hero__moon', sec);
    const panel = $('#hero-panel');
    const hint = $('.hero__hint', sec);
    let current = sec.dataset.scent || 'ambre';
    let visible = true;

    function setScent(key, kick = 1) {
      if (!SCENTS[key] || key === current) return;
      current = key;
      sec.dataset.scent = key;
      fl.dataset.scent = key;
      tabs.forEach(t => {
        const on = t.dataset.scentTab === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', `tab-${key}`);
      $('[data-hero-name]', panel).textContent = SCENTS[key].name;
      $('[data-hero-notes]', panel).textContent = SCENTS[key].heroNotes;
      restart(panel, 'is-swap');
      phys.kick(kick);
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => setScent(t.dataset.scentTab, 1.4));
      t.addEventListener('keydown', e => {
        let j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); tabs[j].focus(); setScent(tabs[j].dataset.scentTab, 1.4); }
      });
      const bar = $('b', t);
      bar.addEventListener('animationend', () => {
        if (t.getAttribute('aria-selected') !== 'true') return;
        const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
        setScent(next, 1);
      });
    });
    if (reduced()) sec.classList.add('is-still');
    const pause = on => sec.classList.toggle('is-paused', on || !visible);
    [stage, $('.hero__tabs', sec)].forEach(el => {
      el.addEventListener('pointerenter', () => pause(true));
      el.addEventListener('pointerleave', () => pause(false));
      el.addEventListener('focusin', () => pause(true));
      el.addEventListener('focusout', () => pause(false));
    });

    /* liquid physics: the bottle is a damped spring, the surface a pendulum */
    const phys = (() => {
      let angle = -5, bv = 0, w = 0, wv = 0, target = 0, drag = null;
      let mx = 0, my = 0, cmx = 0, cmy = 0, sp = 0, csp = 0;
      let awake = false;
      function step(t, dt) {
        const k = Math.min(dt, 40) / 16.67;
        const tgt = drag ? drag.angle : target;
        const stiff = drag ? .22 : .05, damp = drag ? .55 : .13;
        const prev = angle;
        bv += ((tgt - angle) * stiff - bv * damp) * k;
        angle += bv * k;
        const av = (angle - prev) / (k || 1);
        wv += (-w * .05 - wv * .075 + av * .55) * k;
        w = clamp(w + wv * k, -26, 26);
        cmx = lerp(cmx, mx, .07 * k); cmy = lerp(cmy, my, .07 * k);
        csp = lerp(csp, sp, .18 * k);

        wrap.style.transform = `rotate(${angle.toFixed(3)}deg)`;
        liq.setAttribute('transform', `rotate(${(w - angle).toFixed(3)} 100 ${SURF})`);
        amp.style.setProperty('--amp', (1 + Math.min(2.8, Math.abs(wv) * 1.6 + Math.abs(w) * .03)).toFixed(3));

        const depth = [1.25, .55, -.55, -1.25];
        letters.forEach((l, i) => {
          l.style.setProperty('--px', `${(cmx * 26 * depth[i]).toFixed(2)}px`);
          l.style.setProperty('--py', `${(cmy * 14 * Math.abs(depth[i]) - csp * 70).toFixed(2)}px`);
          l.style.setProperty('--sx', `${(csp * 90 * depth[i]).toFixed(2)}px`);
        });
        moon.style.setProperty('--mx', `${(cmx * -18).toFixed(2)}px`);
        moon.style.setProperty('--my', `${(cmy * -12 + csp * 60).toFixed(2)}px`);
        moon.style.setProperty('--ms', (1 + csp * .14).toFixed(4));
        stage.style.setProperty('--stx', `${(cmx * 12).toFixed(2)}px`);
        stage.style.setProperty('--sty', `${(csp * 90).toFixed(2)}px`);

        const still = !drag && Math.abs(tgt - angle) < .02 && Math.abs(bv) < .005 && Math.abs(w) < .02 && Math.abs(wv) < .005
          && Math.abs(cmx - mx) < .001 && Math.abs(cmy - my) < .001 && Math.abs(csp - sp) < .0005;
        if (still || !visible) { awake = false; return false; }
      }
      const wake = () => { if (!awake && !reduced()) { awake = true; loop.add(step); } };
      return {
        wake,
        kick(f = 1) { wv += 1.1 * f; bv += .35 * f; wake(); },
        point(x, y) { mx = x; my = y; target = x * 5; wake(); },
        scroll(p) { sp = p; wake(); },
        jolt(v) { wv += clamp(v, -.6, .6); wake(); },
        dragStart(x) { drag = { x0: x, a0: angle, angle }; wake(); },
        dragMove(x) { if (drag) { drag.angle = clamp(drag.a0 + (x - drag.x0) * .14, -18, 18); wake(); } },
        dragEnd() { drag = null; target = mx * 5; wake(); },
        dragging: () => !!drag
      };
    })();

    if (fine) {
      sec.addEventListener('pointermove', e => {
        const r = sec.getBoundingClientRect();
        phys.point((e.clientX - r.left) / r.width - .5, (e.clientY - r.top) / r.height - .5);
      });
      sec.addEventListener('pointerleave', () => phys.point(0, 0));
    }
    wrap.addEventListener('pointerdown', e => {
      if (reduced()) return;
      wrap.setPointerCapture(e.pointerId);
      wrap.classList.add('is-dragging');
      phys.dragStart(e.clientX);
      if (hint) hint.classList.add('is-gone');
    });
    wrap.addEventListener('pointermove', e => { if (phys.dragging()) phys.dragMove(e.clientX); });
    const end = () => { if (phys.dragging()) { phys.dragEnd(); wrap.classList.remove('is-dragging'); } };
    wrap.addEventListener('pointerup', end);
    wrap.addEventListener('pointercancel', end);
    wrap.addEventListener('lostpointercapture', end);

    let lastY = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY, h = sec.offsetHeight || 1;
      if (y < h * 1.1) {
        phys.scroll(clamp(y / h, 0, 1));
        phys.jolt((y - lastY) * .004);
      }
      lastY = y;
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        pause(false);
        if (visible) phys.wake();
      }).observe(sec);
    }

    onReady.push(() => {
      setTimeout(() => phys.kick(1.2), 650);
      setTimeout(() => { word.classList.add('is-live'); }, 2200);
      if (hint) setTimeout(() => hint.classList.add('is-gone'), 9000);
    });
  }

  /* ---------------------------------------------------------------------
     8. JOURNEY · drag through the hours a fragrance lives on skin
     --------------------------------------------------------------------- */
  function journey() {
    const range = $('#skin-range');
    if (!range) return;
    const K = 4, TMAX = 480;
    const sToT = s => TMAX * (Math.exp(K * s) - 1) / (Math.exp(K) - 1);
    const I = {
      top: t => Math.exp(-t / 35),
      heart: t => { const x = Math.log(1 + t); return .15 + .85 * Math.exp(-((x - 4.4) ** 2) / 2); },
      base: t => { const x = Math.log(1 + t); return .1 + .9 / (1 + Math.exp(-(x - 4.6) * 2.2)); }
    };
    Object.keys(I).forEach(k => {
      const path = $(`[data-curve="${k}"]`);
      let dd = '';
      for (let i = 0; i <= 140; i++) {
        const s = i / 140, v = I[k](sToT(s));
        dd += `${i ? 'L' : 'M'}${(s * 600).toFixed(1)} ${(86 - v * 80).toFixed(1)}`;
      }
      path.setAttribute('d', dd);
    });
    const cursor = $('[data-skin-cursor]'), timeEl = $('[data-skin-time]'), desc = $('[data-skin-desc]');
    const notes = { top: $('[data-note="top"]'), heart: $('[data-note="heart"]'), base: $('[data-note="base"]') };
    const TEXT = {
      top: 'Bright bergamot leads. The top notes carry the first fifteen minutes.',
      heart: 'Jasmine opens at the heart as the citrus lifts away.',
      base: 'Cedar settles close to the skin and stays into the evening.'
    };
    const fmt = t => {
      if (t < 1) return 'Just sprayed';
      if (t < 59.5) { const m = Math.round(t); return `${m} ${m === 1 ? 'minute' : 'minutes'} in`; }
      const h = t / 60;
      if (h < 1.25) return '1 hour in';
      if (h < 2.75) return `${(Math.round(h * 2) / 2).toString()} hours in`;
      return `${Math.round(h)} hours in`;
    };
    let phase = '';
    function update() {
      const s = range.value / 1000, t = sToT(s);
      const vals = { top: I.top(t), heart: I.heart(t), base: I.base(t) };
      Object.keys(notes).forEach(k => notes[k] && notes[k].style.setProperty('--int', vals[k].toFixed(3)));
      cursor.setAttribute('x1', (s * 600).toFixed(1));
      cursor.setAttribute('x2', (s * 600).toFixed(1));
      const label = fmt(t);
      timeEl.textContent = label;
      range.setAttribute('aria-valuetext', t < 1 ? 'Just sprayed' : `${label.replace(' in', '')} after spraying`);
      const lead = Object.keys(vals).reduce((a, b) => (vals[b] > vals[a] ? b : a));
      if (lead !== phase) { phase = lead; desc.textContent = TEXT[lead]; }
    }
    let touched = false;
    range.addEventListener('input', () => { touched = true; update(); });
    update();
    if ('IntersectionObserver' in window && !reduced()) {
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const from = 0, to = 620;
        setTimeout(() => {
          if (touched) return;
          tween(3600, t => { if (touched) return; range.value = Math.round(lerp(from, to, easeInOut(t))); update(); });
        }, 500);
      }, { threshold: .5 });
      io.observe(range.closest('.skin'));
    }
  }

  /* ---------------------------------------------------------------------
     8b. FINDER · three questions, a living aura, a bottle that fills
     --------------------------------------------------------------------- */
  const finderApi = { setFamily() {} };
  function finder() {
    const sec = $('#finder'), form = $('#quiz');
    if (!sec || !form) return;
    const qs = $$('.quiz__q', form);
    const stepEl = $('[data-quiz-step]');
    const next = $('[data-quiz-next]'), back = $('[data-quiz-back]'), again = $('[data-quiz-restart]');
    const result = $('[data-quiz-result]');
    const hint = $('.quiz__hint', form);
    const bottleWrap = $('[data-finder-bottle]');
    const OPT = {
      fresh: { w: { cedre: 2, fleur: 1 }, fam: 'fresh', aura: ['#cfd98e', '#8fb05a', '#f3e8b2', '#a7c27a', '#e7efc0'] },
      floral: { w: { fleur: 3 }, fam: 'floral', aura: ['#f3bcb2', '#e48c98', '#fbe1d4', '#d9a0b8', '#f7cfc0'] },
      woody: { w: { cedre: 2, ambre: 2 }, fam: 'woody', aura: ['#c48448', '#7c4522', '#e5ae6b', '#9a5a2e', '#d9984f'] },
      morning: { w: { fleur: 1, cedre: 1 }, aura: ['#f6e7b6', '#d9e2a8', '#fff3d6', '#f2d7a8', '#e8eec8'] },
      golden: { w: { ambre: 2 }, aura: ['#f2b257', '#d9782c', '#ffd89a', '#e8964a', '#f7c47a'] },
      night: { w: { ambre: 1, cedre: 2 }, aura: ['#7a3c5c', '#3c1a3c', '#a6606c', '#5a2a4a', '#8a4a5a'] },
      close: { w: { fleur: 2 }, aura: ['#f4d3c9', '#e1b1a8', '#fff0e6', '#ecc4b8', '#f8ddd2'] },
      trail: { w: { ambre: 1, fleur: 1 }, aura: ['#e8ba8b', '#d99b8b', '#f7dcc0', '#e0a88a', '#f2c9a8'] },
      bold: { w: { ambre: 2, cedre: 1 }, aura: ['#d8782e', '#8c2b1b', '#f2aa4f', '#b04a22', '#e88f3e'] }
    };
    const LABEL = { fresh: 'Fresh', floral: 'Floral', woody: 'Woody', morning: 'Morning light', golden: 'Golden hour', night: 'After dark', close: 'Close to the skin', trail: 'A soft trail', bold: 'Unforgettable' };
    let step = 0, resultKey = 'cedre';
    const aura = auraCanvas($('[data-aura]'), sec);

    const answers = () => qs.map(q => { const c = $('input:checked', q); return c ? c.value : null; });
    function leader() {
      const score = { ambre: 0, fleur: 0, cedre: 0 };
      const a = answers();
      a.forEach(v => { if (v) Object.entries(OPT[v].w).forEach(([k, n]) => { score[k] += n; }); });
      const first = a[0] ? Object.keys(OPT[a[0]].w)[0] : 'cedre';
      return Object.keys(score).reduce((best, k) => (score[k] > score[best] || (score[k] === score[best] && k === first) ? k : best), first);
    }
    function paint(focusValue) {
      const a = answers();
      if (a[0]) sec.dataset.family = OPT[a[0]].fam;
      const fl = $('.flacon', bottleWrap);
      if (fl) fl.dataset.scent = leader();
      const v = focusValue || a[step] || a[0];
      if (v && aura) aura.palette(OPT[v].aura);
      $$('.opt', form).forEach(l => l.classList.toggle('is-checked', $('input', l).checked));
    }
    function show(i) {
      step = i;
      qs.forEach((q, j) => { q.hidden = j !== i; });
      result.hidden = true;
      form.classList.remove('is-done');
      restart(qs[i], 'is-entering');
      stepEl.textContent = `Question ${i + 1} of ${qs.length}`;
      $('.btn__t', next).textContent = i === qs.length - 1 ? 'Find my fragrance' : 'Next question';
      next.hidden = false; back.hidden = i === 0; again.hidden = true;
      hint.textContent = 'Tip: press 1, 2 or 3 to answer.';
      paint();
    }
    function finish() {
      resultKey = leader();
      const s = SCENTS[resultKey];
      const a = answers();
      qs.forEach(q => { q.hidden = true; });
      result.hidden = false;
      form.classList.add('is-done');
      stepEl.textContent = a.map(v => LABEL[v]).join(' · ');
      $('[data-result-name]').textContent = s.name;
      $('[data-result-why]').textContent = s.why;
      $('[data-result-notes]').textContent = Object.entries(s.notes).map(([k, v]) => `${k}: ${v.join(', ')}`).join('  ·  ');
      $('[data-result-add] .btn__t').textContent = `Add to bag · ${money(s.sizes[0].price)}`;
      next.hidden = true; back.hidden = true; again.hidden = false;
      restart(result, 'is-entering');
      result.focus({ preventScroll: true });
      const fl = $('.flacon', bottleWrap);
      if (fl) fl.dataset.scent = resultKey;
      if (aura) aura.palette(OPT[a[0]].aura);
    }
    form.addEventListener('change', e => { if (e.target.type === 'radio') paint(e.target.value); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!answers()[step]) {
        hint.textContent = 'Choose one answer to continue.';
        restart(qs[step], 'is-entering');
        return;
      }
      if (step < qs.length - 1) show(step + 1); else finish();
    });
    back.addEventListener('click', () => show(Math.max(0, step - 1)));
    again.addEventListener('click', () => { qs.slice(1).forEach(q => $$('input', q).forEach(i => { i.checked = false; })); show(0); });
    $('[data-result-add]').addEventListener('click', e => addToBag(resultKey, null, bottleWrap.getBoundingClientRect ? bottleWrap : e.currentTarget));
    $('[data-result-pdp]').addEventListener('click', () => openPdp(resultKey));

    /* keys 1 to 3 answer the visible question */
    d.addEventListener('keydown', e => {
      if (!/^[1-3]$/.test(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (d.activeElement && d.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag) && d.activeElement.type !== 'radio') return;
      if (modalOpen() || form.classList.contains('is-done')) return;
      const r = sec.getBoundingClientRect();
      if (r.top > innerHeight * .6 || r.bottom < innerHeight * .4) return;
      const input = $$('input', qs[step])[Number(e.key) - 1];
      if (input) { input.checked = true; input.focus({ preventScroll: true }); paint(input.value); }
    });

    finderApi.setFamily = fam => {
      const input = $(`input[name="q0"][value="${fam}"]`, form);
      if (!input) return;
      input.checked = true;
      show(0);
    };
    show(0);
  }

  function auraCanvas(canvas, sec) {
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: [.25, .7, .45, .85, .15][i], y: [.3, .25, .7, .75, .8][i],
      r: [.42, .36, .4, .3, .34][i], s: .00005 + i * .000013, ph: i * 1.7,
      c: [192, 131, 71], tc: [192, 131, 71]
    }));
    let W = 0, H = 0, visible = false, running = false;
    const scale = .5;
    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
      if (reduced()) draw(0);
    }
    function draw(t) {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'screen';
      const m = Math.max(W, H);
      let moving = false;
      blobs.forEach(b => {
        for (let j = 0; j < 3; j++) { const dv = b.tc[j] - b.c[j]; if (Math.abs(dv) > .5) moving = true; b.c[j] += dv * .035; }
        const x = (b.x + Math.sin(t * b.s + b.ph) * .16) * W;
        const y = (b.y + Math.cos(t * b.s * 1.3 + b.ph) * .14) * H;
        const rad = b.r * m;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        const rgb = b.c.map(Math.round).join(',');
        g.addColorStop(0, `rgba(${rgb},.62)`);
        g.addColorStop(.55, `rgba(${rgb},.22)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });
      return moving;
    }
    const tick = t => {
      draw(t);
      if (!visible || reduced()) { running = false; return false; }
    };
    const run = () => { if (!running && visible && !reduced()) { running = true; loop.add(tick); } };
    addEventListener('resize', resize);
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }).observe(sec);
    } else { visible = true; run(); }
    return {
      palette(cols) {
        blobs.forEach((b, i) => { b.tc = hex(cols[i % cols.length]); });
        if (reduced()) { blobs.forEach(b => { b.c = b.tc.slice(); }); draw(0); } else run();
      }
    };
  }

  /* ---------------------------------------------------------------------
     8c. HOUSE, GIFTING, FAQ
     --------------------------------------------------------------------- */
  function house() {
    const fig = $('.atelier');
    if (!fig || !('IntersectionObserver' in window)) { if (fig) fig.classList.add('is-playing'); return; }
    new IntersectionObserver(([e]) => fig.classList.toggle('is-playing', e.isIntersecting && !reduced()), { threshold: .25 }).observe(fig);
  }

  function gifting() {
    const box = $('[data-giftbox]');
    if (box) {
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { box.classList.add('is-open'); io.disconnect(); } }, { threshold: .45 });
        io.observe(box);
      } else box.classList.add('is-open');
    }
    const input = $('#gift-note'), preview = $('[data-note-preview]'), count = $('[data-note-count]');
    if (!input) return;
    const def = preview.textContent;
    const sync = () => {
      const v = input.value.trim();
      preview.textContent = v || def;
      count.textContent = `${input.value.length} / ${input.maxLength}`;
      if (box) box.classList.add('is-open');
    };
    input.addEventListener('input', sync);
    sync();
  }

  function faq() {
    $$('.faq__q').forEach(q => {
      q.addEventListener('click', () => {
        const open = q.getAttribute('aria-expanded') !== 'true';
        q.setAttribute('aria-expanded', String(open));
        q.closest('.faq__item').classList.toggle('is-open', open);
      });
    });
  }

  /* ---------------------------------------------------------------------
     9. LETTERS, SILLAGE, MAGNETIC, REVEALS
     --------------------------------------------------------------------- */
  function letters() {
    const form = $('#letters');
    if (!form) return;
    const input = $('#letters-email', form), msg = $('[data-letters-msg]', form);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      msg.classList.toggle('is-error', !ok);
      if (!ok) {
        msg.textContent = v ? 'That address looks incomplete. Check it reads like name@example.com.' : 'Enter your email address to receive our letters.';
        input.focus();
        return;
      }
      // Connect your mailing list provider here (fetch to your endpoint) before going live.
      msg.textContent = 'Thank you. Our next letter will find you.';
      input.value = '';
      restart(form, 'is-sealed');
    });
  }

  function sillage() {
    const c = $('[data-sillage]');
    if (!c || !fine || reduced()) { if (c) c.remove(); return; }
    const ctx = c.getContext('2d');
    const parts = [];
    let W = 0, H = 0, dpr = 1, lx = null, ly = null, running = false;
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    };
    resize();
    addEventListener('resize', resize);
    const spawn = (x, y) => {
      if (parts.length > 64) parts.shift();
      parts.push({ x, y, vx: (Math.random() - .5) * .3, vy: -.2 - Math.random() * .35, r: 2 + Math.random() * 3, life: 0, max: 900 + Math.random() * 700 });
    };
    const draw = (t, dt) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life > p.max) { parts.splice(i, 1); continue; }
        const k = p.life / p.max;
        p.x += p.vx * dt * .06; p.y += p.vy * dt * .06;
        const r = p.r + k * 16;
        const a = (1 - k) * Math.min(1, k / .12) * .2;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(214,168,104,${a.toFixed(3)})`);
        g.addColorStop(1, 'rgba(214,168,104,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
      }
      if (!parts.length) { running = false; ctx.clearRect(0, 0, W, H); return false; }
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const x = e.clientX, y = e.clientY;
      if (lx === null) { lx = x; ly = y; return; }
      const n = Math.min(3, Math.floor(Math.hypot(x - lx, y - ly) / 16));
      if (!n) return;
      for (let i = 1; i <= n; i++) spawn(lerp(lx, x, i / n), lerp(ly, y, i / n));
      lx = x; ly = y;
      if (!running) { running = true; loop.add(draw); }
    }, { passive: true });
  }

  function magnetic() {
    if (!fine || reduced()) return;
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `translate(${(x * 12).toFixed(1)}px, ${(y * 10).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  function reveals() {
    $$('[data-split]').forEach(el => {
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      el.innerHTML = `<span class="sr-only">${esc(text)}</span>` + text.split(' ').map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ');
    });
    const groups = new Map();
    $$('[data-reveal]').forEach(el => {
      const p = el.parentElement;
      const n = groups.get(p) || 0;
      groups.set(p, n + 1);
      if (n) el.style.setProperty('--d', `${Math.min(n, 6) * .08}s`);
    });
    if (!('IntersectionObserver' in window) || reduced()) {
      $$('[data-reveal],[data-split],.notes,.foot__word').forEach(el => el.classList.add('is-in'));
      root.classList.add('reveal-ready');
      return;
    }
    root.classList.add('reveal-ready');
    // An element fully clipped by its own clip-path never reports as intersecting,
    // so masked reveals are observed through their parent.
    const watch = new Map();
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      (watch.get(e.target) || []).forEach(el => el.classList.add('is-in'));
      io.unobserve(e.target);
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-reveal],[data-split],.notes,.foot__word').forEach(el => {
      const target = el.dataset.reveal === 'mask' ? el.parentElement : el;
      if (!watch.has(target)) { watch.set(target, []); io.observe(target); }
      watch.get(target).push(el);
    });
  }

  /* ---------------------------------------------------------------------
     10. BOOT · delegated clicks and start-up
     --------------------------------------------------------------------- */
  function clicks() {
    d.addEventListener('click', e => {
      const t = e.target.closest('[data-open],[data-close],[data-pdp],[data-add],[data-close-mega],[data-close-bag],[data-menu-link],[data-qty],[data-remove],[data-chip],[data-checkout],[data-pick-family]');
      if (!t) return;
      if (t.matches('[data-open]')) { openDialog(t.dataset.open); return; }
      if (t.matches('[data-close]')) { closeDialog(t.closest('dialog')); return; }
      if (t.matches('[data-pdp]')) { e.preventDefault(); openPdp(t.dataset.pdp); return; }
      if (t.matches('[data-add]')) { addToBag(t.dataset.add, null, t); return; }
      if (t.matches('[data-pick-family]')) finderApi.setFamily(t.dataset.pickFamily);
      if (t.matches('[data-close-mega]') && navApi.closeMega) navApi.closeMega();
      if (t.matches('[data-close-bag],[data-menu-link]')) {
        const href = t.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          closeDialog(t.closest('dialog'), () => scrollToHash(href));
        }
        return;
      }
      if (t.matches('[data-qty]')) {
        const it = bag.items[Number(t.dataset.idx)];
        if (!it) return;
        it.qty += Number(t.dataset.qty);
        if (it.qty <= 0) bag.items.splice(Number(t.dataset.idx), 1);
        store.set('muse:bag', bag.items);
        renderBag();
        return;
      }
      if (t.matches('[data-remove]')) {
        bag.items.splice(Number(t.dataset.remove), 1);
        store.set('muse:bag', bag.items);
        renderBag();
        return;
      }
      if (t.matches('[data-chip]')) {
        const input = $('#search-input');
        input.value = t.textContent.trim();
        renderSearch(input.value);
        input.focus();
        return;
      }
      if (t.matches('[data-checkout]')) {
        toast('Checkout opens here once your payment provider is connected.');
      }
    });
  }

  function boot() {
    mountArt();
    splitVapor();
    reveals();
    navigation();
    dialogs();
    search();
    hero();
    pdp();
    journey();
    finder();
    house();
    gifting();
    faq();
    letters();
    sillage();
    magnetic();
    clicks();
    renderBag();
    intro();
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
