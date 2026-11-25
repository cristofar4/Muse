/* =========================================================================
   MUSE · site script (vanilla JS, no dependencies)
   1. helpers          5. home: hold to smell, anatomy, marquee, translator
   2. data             6. shop, product page, journal
   3. type & reveals   7. bag, checkout, forms, search, dialogs
   4. the rack (nav)   8. router with mist transitions, boot
   ========================================================================= */
(() => {
  'use strict';

  /* ---------------------------------------------------------------------
     1. HELPERS
     --------------------------------------------------------------------- */
  const d = document;
  const root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => RM.matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobileQ = matchMedia('(max-width: 960px)');
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const money = n => '€' + Math.round(n).toLocaleString('en-GB');
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  /* one animation loop shared by everything; tasks return false to sleep */
  const loop = (() => {
    const tasks = new Set();
    let raf = 0, last = 0;
    const frame = t => {
      const dt = last ? Math.min(50, t - last) : 16.67;
      last = t;
      tasks.forEach(fn => { if (fn(t, dt) === false) tasks.delete(fn); });
      if (tasks.size) raf = requestAnimationFrame(frame); else { raf = 0; last = 0; }
    };
    return { add(fn) { tasks.add(fn); if (!raf) raf = requestAnimationFrame(frame); } };
  })();

  function tween(ms, fn, done) {
    if (reduced() || ms <= 0) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => { const t = Math.min(1, (now - t0) / ms); fn(t); if (t < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }

  /* scroll bus: one listener, many subscribers */
  const scrollSubs = new Set();
  let scrollTick = false, lastScrollY = scrollY, scrollVel = 0;
  addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      const y = scrollY, dy = y - lastScrollY;
      lastScrollY = y;
      scrollVel = dy;
      scrollSubs.forEach(fn => fn(y, dy));
    });
  }, { passive: true });

  /* ---------------------------------------------------------------------
     2. DATA
     --------------------------------------------------------------------- */
  const ALT = {
    'smoke-violet': 'Violet smoke curling against a black background',
    'smoke-silk': 'Green smoke folding like silk on black',
    'smoke-teal': 'Pale teal smoke drifting across darkness',
    'pipette-gold': 'A glass pipette lets golden perfume fall into a bottle',
    'pipette-mono': 'A perfumer\'s gloved hand holds a pipette above a glass bottle, in black and white',
    'hands-pour': 'Gloved hands pour amber oil into a square glass bottle',
    'liquid-gold': 'Golden liquid pouring into a metal bowl',
    'bottle-frost': 'A frosted glass perfume bottle in soft light with dried pink flowers',
    'bottle-ink': 'A black patterned perfume bottle on swirls of black and white paint',
    'bottle-prism': 'A glass flask of blue perfume reflected in iridescent light',
    'bottle-sun': 'Glass perfume bottles casting long shadows on a golden surface',
    'dropper-leaf': 'A small dropper bottle of oil beside a eucalyptus branch on linen',
    'jasmine-night': 'Jasmine blossoms on a dark green shrub',
    'jasmine-star': 'Star jasmine flowers on a slender stem',
    'jasmine-branch': 'A trailing jasmine branch with small white flowers',
    'cedar-bark': 'Close view of red cedar bark with green moss',
    'bark-grey': 'Weathered grey and brown pine bark',
    'resin': 'A drop of red resin on a bare branch against green leaves',
    'lemons': 'A basket of yellow citrus fruit',
    'citrus-dried': 'Dried orange and grapefruit slices with rosemary sprigs'
  };
  const SRC = (n, w = 800) => `assets/img/${n}-${w}.jpg`;
  const pic = (n, cls = '', sizes = '(max-width: 960px) 92vw, 40vw', alt = ALT[n] || '') =>
    `<img${cls ? ` class="${cls}"` : ''} src="${SRC(n)}" srcset="${SRC(n)} 800w, ${SRC(n, 1600)} 1600w" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

  const PRODUCTS = [
    {
      key: 'ambre', no: '01', name: 'Ambre 01', family: 'Amber', mood: 'Warm and resinous', price: 165, color: '#e0a548',
      img: 'pipette-gold', reveal: 'resin',
      desc: 'Sun warmed resin and saffron over a glowing base of labdanum. Golden from the first spray, then softer, warmer and closer to skin as the evening goes on.',
      line: 'Late sun, bottled. Resin that glows on skin for hours.',
      wear: 'Two sprays at the base of the throat. Amber loves warm skin, so it blooms most in the evening.',
      notes: { Top: ['Bergamot', 'Pink pepper'], Heart: ['Saffron', 'Orange blossom'], Base: ['Labdanum', 'Vanilla', 'Sandalwood'] },
      acts: [['citrus-dried', 'Top', 'Bergamot', 'Bright peel, a flash of green.'], ['liquid-gold', 'Heart', 'Saffron', 'Honeyed, leathery, warm as skin.'], ['resin', 'Base', 'Labdanum', 'Resin that glows for hours.']],
      character: { Longevity: 88, Sillage: 72, Warmth: 94, Freshness: 18 }
    },
    {
      key: 'fleur', no: '02', name: 'Fleur 02', family: 'Floral', mood: 'Soft and luminous', price: 155, color: '#f0c7c0',
      img: 'bottle-frost', reveal: 'jasmine-star',
      desc: 'Jasmine sambac picked before dawn, kept airy with mandarin and settled on a clean white musk. Close, quiet and luminous, like skin after a long bath.',
      line: 'Night flowers through an open window. Quiet, close, luminous.',
      wear: 'One spray on each wrist and one in the hair. Musk sits close, so let people come near.',
      notes: { Top: ['Mandarin', 'Pear'], Heart: ['Jasmine sambac', 'Rose'], Base: ['White musk', 'Cashmere wood'] },
      acts: [['lemons', 'Top', 'Mandarin', 'Sweet zest, barely there.'], ['jasmine-star', 'Heart', 'Jasmine sambac', 'Night flowers opening.'], ['bottle-frost', 'Base', 'White musk', 'Clean skin, soft as linen.']],
      character: { Longevity: 64, Sillage: 48, Warmth: 52, Freshness: 58 }
    },
    {
      key: 'cedre', no: '03', name: 'Cèdre 03', family: 'Woody', mood: 'Green and grounding', price: 170, color: '#8fa86a',
      img: 'cedar-bark', reveal: 'smoke-silk',
      desc: 'Cold lime and Atlas cedar over oakmoss and vetiver. Green, dry and calm, like walking into a forest the morning after a storm.',
      line: 'Rain on bark and pencil shavings. Green, dry, calm.',
      wear: 'Spray on the chest and the back of the neck. Woods last, so two sprays will carry you into the evening.',
      notes: { Top: ['Lime', 'Cardamom'], Heart: ['Atlas cedar', 'Vetiver'], Base: ['Oakmoss', 'Ambrette'] },
      acts: [['lemons', 'Top', 'Lime', 'Cold, sharp, awake.'], ['cedar-bark', 'Heart', 'Atlas cedar', 'Pencil shavings and rain.'], ['bark-grey', 'Base', 'Oakmoss', 'Forest floor after a storm.']],
      character: { Longevity: 82, Sillage: 66, Warmth: 40, Freshness: 70 }
    },
    {
      key: 'fumee', no: '04', name: 'Fumée 04', family: 'Smoky', mood: 'Dark and hypnotic', price: 180, color: '#b7a3e3',
      img: 'bottle-ink', reveal: 'smoke-violet',
      desc: 'Black pepper and frankincense curling over smoked guaiac wood. Dark, slow and strangely comforting, like candles left burning in a cold stone room.',
      line: 'Candles in a cold stone room. Dark, slow, hypnotic.',
      wear: 'One spray is a statement. Wear it on clothes and scarves, where smoke clings longest.',
      notes: { Top: ['Black pepper', 'Elemi'], Heart: ['Frankincense', 'Cypriol'], Base: ['Guaiac wood', 'Birch tar'] },
      acts: [['smoke-teal', 'Top', 'Black pepper', 'A spark in the dark.'], ['smoke-violet', 'Heart', 'Frankincense', 'Old stone, cold air, candles.'], ['bark-grey', 'Base', 'Guaiac wood', 'Smoked wood, slow and deep.']],
      character: { Longevity: 92, Sillage: 84, Warmth: 76, Freshness: 22 }
    },
    {
      key: 'prisme', no: '05', name: 'Prisme 05', family: 'Fresh', mood: 'Bright and strange', price: 160, color: '#86b3d8',
      img: 'bottle-prism', reveal: 'smoke-teal',
      desc: 'Sparkling aldehydes, powdery iris and a humming ambrette musk. It smells like light through a prism: clean, metallic and impossible to place.',
      line: 'Light through a prism. Clean, metallic, impossible to place.',
      wear: 'Mist it into the air and walk through. Aldehydes are bright and fleeting, so refresh at noon.',
      notes: { Top: ['Aldehydes', 'Grapefruit'], Heart: ['Orris', 'Violet leaf'], Base: ['Ambrette', 'Cashmeran'] },
      acts: [['smoke-teal', 'Top', 'Aldehydes', 'Fizz, like light on metal.'], ['bottle-prism', 'Heart', 'Orris', 'Powder, violet, cool.'], ['smoke-silk', 'Base', 'Ambrette', 'A musk that hums.']],
      character: { Longevity: 60, Sillage: 70, Warmth: 30, Freshness: 88 }
    },
    {
      key: 'soleil', no: '06', name: 'Soleil 06', family: 'Fresh', mood: 'Golden and sunlit', price: 145, color: '#f0c95a',
      img: 'bottle-sun', reveal: 'lemons',
      desc: 'Bergamot and neroli warmed by dry vetiver. A golden citrus that skips the cologne cliché and smells like late afternoon on a terrace.',
      line: 'Late afternoon on a terrace. Golden citrus, dry grass.',
      wear: 'Spray generously on skin and clothes. Citrus is light by nature, so be bold with it.',
      notes: { Top: ['Bergamot', 'Petitgrain'], Heart: ['Neroli', 'Orange blossom'], Base: ['Vetiver', 'Musk'] },
      acts: [['lemons', 'Top', 'Bergamot', 'Sun on peel.'], ['jasmine-night', 'Heart', 'Neroli', 'Orange blossom at noon.'], ['bark-grey', 'Base', 'Vetiver', 'Dry grass, warm earth.']],
      character: { Longevity: 52, Sillage: 58, Warmth: 46, Freshness: 94 }
    },
    {
      key: 'set', no: '00', name: 'Discovery set', family: 'Set', mood: 'All six, in 2 ml vials', price: 38, color: '#e0a548', set: true,
      img: 'dropper-leaf', reveal: 'citrus-dried',
      desc: 'All six signatures in 2 ml vials, packed in a paper case. Wear one a day for a week and let your skin decide which one is yours.',
      line: 'Six small bottles, one week, no pressure.',
      wear: 'Wear one vial a day, on skin rather than paper, and note which one you still notice at dinner.',
      notes: { Inside: ['Ambre 01', 'Fleur 02', 'Cèdre 03', 'Fumée 04', 'Prisme 05', 'Soleil 06'] },
      acts: [], character: null
    }
  ];
  const P = Object.fromEntries(PRODUCTS.map(p => [p.key, p]));
  const SIGNATURES = PRODUCTS.filter(p => !p.set);
  const sizesFor = p => {
    if (p.set) return [{ ml: 12, label: 'Six vials', price: p.price }];
    const r = n => Math.round(n / 5) * 5;
    return [{ ml: 30, label: '30 ml', price: r(p.price * .62) }, { ml: 50, label: '50 ml', price: p.price }, { ml: 100, label: '100 ml', price: r(p.price * 1.45) }];
  };
  const priceOf = (key, ml) => { const s = sizesFor(P[key]); return (s.find(x => x.ml === ml) || s[0]).price; };
  const defaultMl = key => (P[key].set ? 12 : 50);
  PRODUCTS.forEach(p => { p.search = norm([p.name, p.family, p.mood, p.desc, Object.values(p.notes).flat().join(' ')].join(' ')); });

  const ARTICLES = [
    { key: 'choose', cat: 'Guide', mins: 6, img: 'jasmine-branch', title: 'How to choose a fragrance you will still love next year', body: [
      'Most of us choose perfume in ten seconds, on paper, in a shop that smells of forty other perfumes. Then we wonder why the bottle feels wrong a month later.',
      'Start somewhere quieter. Spray one scent on the inside of your wrist and leave it alone for an hour. The first ten minutes are the top notes, bright and loud and gone quickly. What stays is the heart and the base, and that is what you are actually buying.',
      'Pay attention to when you notice it. If you catch it on yourself while reading or cooking and feel a small lift, that is the one. If you have to sniff your wrist to remember it is there, keep looking.',
      'Finally, trust memory over vocabulary. You do not need to know what labdanum is. You only need to know that it smells like the summer you were seventeen.'] },
    { key: 'notes', cat: 'Craft', mins: 4, img: 'cedar-bark', title: 'Top, heart and base, explained without the jargon', body: [
      'A perfume is built like a short play in three acts. Each act uses materials that evaporate at different speeds.',
      'Top notes are the smallest, lightest molecules: citrus peel, herbs, a sparkle of pepper. They introduce the fragrance and fade within fifteen minutes.',
      'Heart notes arrive as the top lifts away. Flowers, spices and soft fruits live here, and they shape the character you will recognise for the next few hours.',
      'Base notes are heavy and slow: woods, resins, musks, vanilla. They anchor everything above them, and they are what you still smell on a scarf the next morning.'] },
    { key: 'wear', cat: 'Ritual', mins: 3, img: 'citrus-dried', title: 'Where to wear it: pulse points and the hair trick', body: [
      'Warmth helps a fragrance rise. That is why pulse points matter: the inside of the wrists, the base of the throat, behind the ears, the inside of the elbows.',
      'Do not rub your wrists together. It crushes the top notes before they can open and makes the scent flatten faster.',
      'For a trail that lasts all day, mist once into the air and walk through it, or spray a hairbrush and brush it through dry hair. Hair holds scent beautifully, and it moves when you do.'] },
    { key: 'smoke', cat: 'Essay', mins: 5, img: 'smoke-silk', title: 'Why smoky perfumes feel like memories', body: [
      'Smell is the only sense wired straight into the part of the brain that handles emotion and memory. It skips the polite front office and walks right in.',
      'Smoke has a special place there. For most of human history it meant warmth, food, gathering and ceremony. A drop of birch tar or frankincense can feel like a place you have been, even when you have never been there.',
      'That is why smoky fragrances divide people so sharply. They are not really about how they smell. They are about what they remind you of.'] },
    { key: 'refill', cat: 'House', mins: 4, img: 'hands-pour', title: 'The case for refilling the same bottle for ten years', body: [
      'A perfume bottle is often the heaviest and most expensive part of what you buy. Throwing it away after every use makes very little sense.',
      'Every MUSE bottle is made to be opened. Unscrew the pump, pour in a refill from a recyclable pouch, and the same glass carries on.',
      'Refills cost less, ship lighter and use a fraction of the glass. And there is something quietly lovely about a bottle that has been with you through a decade of evenings.'] }
  ];
  ARTICLES.forEach(a => { a.search = norm([a.title, a.cat, a.body.join(' ')].join(' ')); });

  const MEMORIES = {
    winter: { label: 'Oranges in winter', product: 'soleil' },
    storm: { label: 'A forest after the storm', product: 'cedre' },
    church: { label: 'Candles in an old church', product: 'fumee' },
    night: { label: 'Jasmine through an open window', product: 'fleur' },
    honey: { label: 'Honey on warm skin', product: 'ambre' },
    neon: { label: 'Neon on wet streets', product: 'prisme' }
  };

  /* ---------------------------------------------------------------------
     3. TYPE & REVEALS
     --------------------------------------------------------------------- */
  const lettersHTML = (text, start = 0) => {
    let i = start;
    return text.split(' ').map(w => `<span class="w">${Array.from(w).map(ch => `<span class="l" style="--i:${i++}">${esc(ch)}</span>`).join('')}</span>`).join(' ');
  };

  function splitMelt(scope = d) {
    const counts = new Map();
    $$('[data-melt]', scope).forEach(el => {
      if (el.dataset.split) return;
      const text = el.textContent.trim().replace(/\s+/g, ' ');
      const parent = el.parentElement;
      const chained = /^H[1-6]$/.test(parent.tagName);
      const base = chained ? (counts.get(parent) || 0) : 0;
      el.innerHTML = `<span class="sr-only">${esc(text)}</span><span aria-hidden="true">${lettersHTML(text, base)}</span>`;
      if (chained) counts.set(parent, base + Math.min(text.length, 18));
      el.dataset.split = '1';
    });
  }

  let revealIO = null;
  function observeReveals(scope = d, reset = false) {
    const els = $$('[data-melt], [data-rise], .meters', scope);
    if (!('IntersectionObserver' in window) || reduced()) { els.forEach(el => el.classList.add('is-in')); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
      }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    }
    els.forEach(el => {
      if (reset) el.classList.remove('is-in');
      if (!el.classList.contains('is-in')) revealIO.observe(el);
    });
  }

  /* letters that swell toward the cursor (hero and footer wordmarks) */
  function swell() {
    if (!fine || reduced()) return;
    const sets = $$('[data-swell]').map(el => ({ el, ls: $$('span', el).map(s => ({ s, w: 300, sf: 0, tw: 300, ts: 0 })) }));
    let px = -9999, py = -9999, awake = false;
    const step = () => {
      let moving = false;
      sets.forEach(set => {
        const r = set.el.getBoundingClientRect();
        const near = r.bottom > -200 && r.top < innerHeight + 200;
        set.ls.forEach(o => {
          if (near) {
            const lr = o.s.getBoundingClientRect();
            const cx = lr.left + lr.width / 2, cy = lr.top + lr.height / 2;
            const f = clamp(1 - Math.hypot(px - cx, (py - cy) * 1.3) / (lr.width * 1.5 + 80), 0, 1);
            o.tw = 300 + f * 600; o.ts = f * 100;
          } else { o.tw = 300; o.ts = 0; }
          o.w = lerp(o.w, o.tw, .12); o.sf = lerp(o.sf, o.ts, .12);
          if (Math.abs(o.w - o.tw) > .5) moving = true;
          o.s.style.fontVariationSettings = `"opsz" 144, "wght" ${o.w.toFixed(1)}, "SOFT" ${o.sf.toFixed(1)}, "WONK" ${o.sf > 50 ? 1 : 0}`;
        });
      });
      if (!moving) { awake = false; return false; }
    };
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      if (!awake) { awake = true; loop.add(step); }
    }, { passive: true });
  }

  /* the cursor uncovers what a photograph is made of */
  function reveals() {
    const active = new Map();
    let hovered = null;
    const step = () => {
      active.forEach((o, el) => {
        o.r = lerp(o.r, o.t, .14);
        el.style.setProperty('--r', `${o.r.toFixed(1)}px`);
        el.style.setProperty('--rp', (o.R ? o.r / o.R : 0).toFixed(3));
        if (o.t === 0 && o.r < .5) { el.style.setProperty('--r', '0px'); active.delete(el); }
      });
      if (!active.size) return false;
    };
    d.addEventListener('pointermove', e => {
      const el = e.target.closest ? e.target.closest('[data-reveal]') : null;
      if (hovered && hovered !== el) { const o = active.get(hovered); if (o) o.t = 0; }
      hovered = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(1)}px`);
      el.style.setProperty('--my', `${(e.clientY - r.top).toFixed(1)}px`);
      const R = Math.min(r.width, r.height) * .36;
      const o = active.get(el) || { r: 0, t: R, R };
      o.t = R; o.R = R;
      active.set(el, o);
      loop.add(step);
    }, { passive: true });
  }

  /* contextual cursor label */
  function cursorTag() {
    if (!fine || reduced()) return;
    const tag = $('.tag'), txt = $('[data-tag]');
    let x = -200, y = -200, tx = -200, ty = -200, awake = false;
    const step = () => {
      x = lerp(x, tx, .22); y = lerp(y, ty, .22);
      tag.style.setProperty('--tx', `${x.toFixed(1)}px`);
      tag.style.setProperty('--ty', `${y.toFixed(1)}px`);
      if (Math.abs(x - tx) < .3 && Math.abs(y - ty) < .3) { awake = false; return false; }
    };
    d.addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      const el = e.target.closest ? e.target.closest('[data-cursor]') : null;
      if (el) { if (txt.textContent !== el.dataset.cursor) txt.textContent = el.dataset.cursor; tag.classList.add('is-on'); }
      else tag.classList.remove('is-on');
      if (!awake) { awake = true; loop.add(step); }
    }, { passive: true });
    d.addEventListener('pointerleave', () => tag.classList.remove('is-on'));
  }

  /* ---------------------------------------------------------------------
     4. THE RACK · strips sway with scroll and passing cursors
     --------------------------------------------------------------------- */
  const rackApi = { swing() {} };
  function rack() {
    const rackEl = $('#rack');
    const strips = $$('.strip', rackEl);
    const st = strips.map(() => ({ a: 0, v: 0 }));
    let awake = false, lastMx = null;
    const step = () => {
      let moving = false;
      strips.forEach((s, i) => {
        const o = st[i];
        o.v += (-o.a * .07 - o.v * .09);
        o.a = clamp(o.a + o.v, -28, 28);
        if (Math.abs(o.a) > .02 || Math.abs(o.v) > .02) moving = true;
        s.style.setProperty('--a', `${o.a.toFixed(2)}deg`);
      });
      if (!moving) { awake = false; strips.forEach(s => s.style.setProperty('--a', '0deg')); return false; }
    };
    const wake = () => { if (!awake && !reduced()) { awake = true; loop.add(step); } };
    rackApi.swing = (el, f = 6) => { const i = strips.indexOf(el); if (i > -1) { st[i].v += f; wake(); } };

    scrollSubs.add((y, dy) => {
      const imp = clamp(dy * .045, -3, 3);
      if (Math.abs(imp) > .05) { st.forEach((o, i) => { o.v += imp * (.7 + (i % 3) * .25); }); wake(); }
      rackEl.classList.toggle('is-tucked', y > innerHeight * .45);
      tone();
    });
    if (fine) {
      d.addEventListener('pointermove', e => {
        if (e.clientY > 220) { lastMx = null; return; }
        const dx = lastMx === null ? 0 : e.clientX - lastMx;
        lastMx = e.clientX;
        strips.forEach((s, i) => {
          if (!s.offsetParent) return;
          const r = s.getBoundingClientRect();
          if (e.clientX > r.left - 14 && e.clientX < r.right + 14 && e.clientY < r.bottom + 10) { st[i].v += clamp(dx * .22, -4, 4); wake(); }
        });
      }, { passive: true });
    }

    function tone() {
      const probe = 46;
      const els = $$('.view:not([hidden]) [data-tone], .foot');
      let t = 'dark';
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { t = el.dataset.tone || 'dark'; break; }
      }
      if (rackEl.dataset.tone !== t) rackEl.dataset.tone = t;
    }
    rackApi.tone = tone;

    /* pull the menu strip down to open (phones) */
    const pull = $('.strip--menu', rackEl);
    if (pull) {
      let y0 = null, pulled = false;
      pull.addEventListener('pointerdown', e => { y0 = e.clientY; pulled = false; pull.setPointerCapture(e.pointerId); });
      pull.addEventListener('pointermove', e => {
        if (y0 === null) return;
        const dy = clamp(e.clientY - y0, 0, 140);
        pull.style.height = `${116 + dy}px`;
        if (dy > 70) pulled = true;
      });
      const end = () => {
        if (y0 === null) return;
        y0 = null;
        pull.style.height = '';
        if (pulled) { openDialog('menu'); pull.dataset.skip = '1'; setTimeout(() => delete pull.dataset.skip, 400); }
      };
      pull.addEventListener('pointerup', end);
      pull.addEventListener('pointercancel', end);
    }
  }

  function setActiveStrip(route) {
    const name = route.view === 'product' ? 'shop' : (route.anchor === 'finder' ? 'finder' : route.view);
    $$('.strip[data-route]').forEach(s => {
      const on = s.dataset.route === name;
      s.classList.toggle('is-active', on);
      if (on) s.setAttribute('aria-current', 'page'); else s.removeAttribute('aria-current');
    });
  }

  /* ---------------------------------------------------------------------
     5. HOME
     --------------------------------------------------------------------- */
  /* hold to smell */
  function hold() {
    const sec = $('#hold');
    if (!sec) return;
    const btn = $('[data-hold]', sec), label = $('[data-hold-label]', sec), name = $('[data-hold-name]', sec);
    const layers = $$('.hold__layers img', sec), actsEl = $('[data-hold-acts]', sec), pick = $('[data-hold-pick]', sec);
    const done = $('[data-hold-done]', sec), canvas = $('.hold__smoke', sec);
    let key = 'ambre', p = 0, holding = false, playing = false, finished = false, running = false, visible = false;
    const parts = [];
    const ctx = canvas.getContext('2d');

    pick.innerHTML = SIGNATURES.map(s => `<button type="button" role="radio" aria-checked="${s.key === key}" data-hold-key="${s.key}">${esc(s.name)}</button>`).join('');
    pick.addEventListener('click', e => { const b = e.target.closest('[data-hold-key]'); if (b) setKey(b.dataset.holdKey); });

    function setKey(k) {
      key = k;
      const pr = P[k];
      $$('[data-hold-key]', pick).forEach(b => b.setAttribute('aria-checked', String(b.dataset.holdKey === k)));
      pr.acts.forEach((a, i) => { layers[i].src = SRC(a[0], 1600); });
      actsEl.innerHTML = pr.acts.map((a, i) => `<li><span class="label">0:0${i * 2} · ${a[1]}</span><b>${esc(a[2])}</b><span>${esc(a[3])}</span></li>`).join('');
      name.textContent = pr.name;
      $('[data-hold-done-name]', sec).textContent = pr.name;
      $('[data-hold-link]', sec).setAttribute('href', `#${k}`);
      finished = false; done.hidden = true; p = 0; apply();
    }
    function apply() {
      sec.style.setProperty('--p', p.toFixed(4));
      const o = [1 - smooth(.28, .42, p), smooth(.28, .42, p) * (1 - smooth(.6, .74, p)), smooth(.6, .74, p)];
      layers.forEach((l, i) => l.style.setProperty('--o', (i === 0 ? Math.max(o[0], p < .01 ? .55 : 0) : o[i]).toFixed(3)));
      $$('li', actsEl).forEach((li, i) => li.classList.toggle('is-on', p > [.02, .36, .68][i]));
      btn.style.setProperty('--hw', String(Math.round(300 + p * 600)));
      label.textContent = finished ? 'Again' : p <= .001 ? 'Hold' : 'Breathe';
    }
    const resize = () => { canvas.width = Math.round(canvas.clientWidth * .5); canvas.height = Math.round(canvas.clientHeight * .5); };
    resize();
    addEventListener('resize', resize);

    function step(t, dt) {
      if (holding || playing) p = Math.min(1, p + dt / 6200);
      else if (!finished) p = Math.max(0, p - dt / 1100);
      if (p >= 1 && !finished) complete();
      apply();
      // smoke
      const W = canvas.width, H = canvas.height;
      if ((holding || playing) && parts.length < 140) {
        for (let i = 0; i < 2; i++) parts.push({ x: W * (.5 + (Math.random() - .5) * .5), y: H * 1.05, r: 20 + Math.random() * 40, vx: (Math.random() - .5) * .4, vy: -(.5 + Math.random() * 1.1), life: 0, max: 2600 + Math.random() * 2000 });
      }
      ctx.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i];
        q.life += dt;
        if (q.life > q.max) { parts.splice(i, 1); continue; }
        const k = q.life / q.max;
        q.x += q.vx * dt * .06 + Math.sin((q.life + i * 300) / 600) * .3;
        q.y += q.vy * dt * .06;
        const r = q.r * (1 + k * 2.4), a = (1 - k) * Math.min(1, k * 6) * (.05 + p * .07);
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        g.addColorStop(0, `rgba(237,230,217,${a.toFixed(3)})`);
        g.addColorStop(1, 'rgba(237,230,217,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
      }
      const idle = !holding && !playing && (p <= 0 || finished) && !parts.length;
      if (idle || !visible) { running = false; return false; }
    }
    const run = () => { if (!running) { running = true; loop.add(step); } };
    function complete() {
      finished = true; playing = false;
      done.hidden = false;
      sec.classList.remove('is-holding');
    }
    function start() {
      if (finished) { finished = false; done.hidden = true; p = 0; }
      holding = true; sec.classList.add('is-holding'); run();
    }
    function stop() { holding = false; sec.classList.remove('is-holding'); run(); }

    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.setPointerCapture(e.pointerId); start(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => btn.addEventListener(ev, () => { if (holding) stop(); }));
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
    btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stop(); } });
    d.addEventListener('keydown', e => {
      if (e.key !== ' ' || e.repeat || !visible || modalOpen()) return;
      const tag = (d.activeElement && d.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT|BUTTON|A/.test(tag) && d.activeElement !== btn) return;
      if (d.activeElement === btn) return;
      const r = sec.getBoundingClientRect();
      if (r.top > innerHeight * .5 || r.bottom < innerHeight * .5) return;
      e.preventDefault(); start();
    });
    d.addEventListener('keyup', e => { if (e.key === ' ' && holding && d.activeElement !== btn) stop(); });
    $('[data-hold-play]', sec).addEventListener('click', () => { if (finished) { finished = false; done.hidden = true; p = 0; } playing = true; run(); });
    $('[data-hold-add]', sec).addEventListener('click', e => bagAdd(key, defaultMl(key), 1, e.currentTarget));
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }).observe(sec);
    else visible = true;
    setKey('ambre');
  }

  /* anatomy: vertical scroll becomes a horizontal walk through five notes */
  function anatomy() {
    const sec = $('#anatomy');
    if (!sec) return;
    const track = $('[data-anat-track]', sec), bar = $('[data-anat-bar]', sec), count = $('[data-anat-i]', sec);
    const panels = $$('.panel', track), imgs = panels.map(p => $('.panel__img img', p));
    const n = panels.length;
    const update = () => {
      if (sec.offsetParent === null) return;
      if (mobileQ.matches) {
        const i = Math.round(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth) * (n - 1));
        count.textContent = String(i + 1).padStart(2, '0');
        return;
      }
      const r = sec.getBoundingClientRect();
      const total = Math.max(1, sec.offsetHeight - innerHeight);
      const prog = clamp(-r.top / total, 0, 1);
      const maxX = Math.max(0, track.scrollWidth - innerWidth);
      track.style.transform = `translate3d(${(-prog * maxX).toFixed(1)}px,0,0)`;
      bar.style.setProperty('--ap', prog.toFixed(4));
      count.textContent = String(Math.min(n, Math.round(prog * (n - 1)) + 1)).padStart(2, '0');
      const vc = innerWidth / 2;
      panels.forEach((p, i) => {
        const pr = p.getBoundingClientRect();
        imgs[i].style.setProperty('--px', `${((pr.left + pr.width / 2 - vc) * -.06).toFixed(1)}px`);
      });
    };
    scrollSubs.add(update);
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    mobileQ.addEventListener('change', () => { track.style.transform = ''; update(); });
    update();
  }

  /* marquee: speed and weight follow your scroll speed */
  function marquee() {
    const el = $('[data-marquee]');
    if (!el || reduced()) return;
    const track = $('.marquee__track', el);
    let x = 0, vis = false, running = false, w = 300, half = 0, vel = 0;
    const measure = () => { half = track.scrollWidth / 2; };
    measure();
    addEventListener('resize', measure);
    const step = (t, dt) => {
      vel = lerp(vel, Math.abs(scrollVel), .08);
      scrollVel *= .9;
      x -= (0.05 + vel * .045) * dt;
      if (half && x < -half) x += half;
      track.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      const tw = clamp(300 + vel * 26, 300, 900);
      if (Math.abs(tw - w) > 6) { w = lerp(w, tw, .3); track.style.setProperty('--mw', w.toFixed(0)); }
      if (!vis) { running = false; return false; }
    };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !running) { running = true; measure(); loop.add(step); } }).observe(el);
  }

  /* translator: a memory becomes a fragrance */
  function translator() {
    const form = $('#translator');
    if (!form) return;
    const result = $('[data-tr-result]'), msg = $('[data-tr-msg]'), loud = $('#loud');
    let chosen = null;
    const loudLabel = v => (v < 34 ? 'Whisper' : v < 67 ? 'Speak' : 'Shout');
    const WEAR = {
      Whisper: 'Whisper: one spray on the inside of the wrist. Only the people you hug will know.',
      Speak: 'Speak: two sprays, wrist and neck. It leaves a soft trail when you walk past.',
      Shout: 'Shout: four sprays, collarbone, neck and a mist through your hair. People will ask what you are wearing.'
    };
    form.addEventListener('change', e => {
      if (e.target.name === 'memory') {
        $$('.mem', form).forEach(l => l.classList.toggle('is-checked', $('input', l).checked));
        msg.textContent = '';
      }
    });
    loud.addEventListener('input', () => loud.setAttribute('aria-valuetext', loudLabel(+loud.value)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const m = $('input[name="memory"]:checked', form);
      if (!m) { msg.textContent = 'Choose a memory first.'; return; }
      const mem = MEMORIES[m.value], p = P[mem.product];
      chosen = p.key;
      const terms = Object.values(p.notes).map(a => a[0]);
      const parts = [`<span style="--k:0"><em>${esc(mem.label)}</em></span>`, '<span class="op" style="--k:1">=</span>'];
      terms.forEach((t, i) => {
        parts.push(`<span style="--k:${i * 2 + 2}">${esc(t)}</span>`);
        if (i < terms.length - 1) parts.push(`<span class="op" style="--k:${i * 2 + 3}">+</span>`);
      });
      $('[data-tr-eq]').innerHTML = parts.join(' ');
      $('[data-tr-img]').src = SRC(p.img);
      $('[data-tr-img]').alt = ALT[p.img];
      $('[data-tr-link]').href = `#${p.key}`;
      $('[data-tr-name]').textContent = p.name;
      $('[data-tr-mood]').textContent = `${p.name}. ${p.line}`;
      $('[data-tr-wear]').textContent = WEAR[loudLabel(+loud.value)];
      $('[data-tr-add] span').textContent = `Add ${p.name} · ${money(p.price)}`;
      result.hidden = false;
      result.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      result.focus({ preventScroll: true });
    });
    $('[data-tr-add]').addEventListener('click', e => { if (chosen) bagAdd(chosen, defaultMl(chosen), 1, e.currentTarget); });
    $('[data-tr-again]').addEventListener('click', () => {
      result.hidden = true;
      $$('input[name="memory"]', form).forEach(i => { i.checked = false; });
      $$('.mem', form).forEach(l => l.classList.remove('is-checked'));
      form.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* parallax figures */
  function parallax() {
    const figs = $$('[data-speed]');
    if (!figs.length || reduced()) return;
    const update = () => {
      figs.forEach(f => {
        if (!f.offsetParent) return;
        const r = f.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        const c = r.top + r.height / 2 - innerHeight / 2;
        f.style.transform = `translate3d(0, ${(c * parseFloat(f.dataset.speed)).toFixed(1)}px, 0)`;
      });
    };
    scrollSubs.add(update);
    update();
  }

  /* count up */
  function counters(scope = d) {
    $$('[data-count]', scope).forEach(el => {
      const to = +el.dataset.count, suf = el.dataset.suffix || '';
      if (reduced() || !('IntersectionObserver' in window)) { el.textContent = to + suf; return; }
      el.textContent = '0' + suf;
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        tween(1600, t => { el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))) + suf; });
      }, { threshold: .5 });
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     6. SHOP, PRODUCT, JOURNAL
     --------------------------------------------------------------------- */
  const tileHTML = (p, k = 0, sizes = '(max-width: 640px) 92vw, (max-width: 960px) 46vw, 34vw') => `
    <article class="tile" style="--k:${k}">
      <a class="tile__link" href="#${p.key}" data-cursor="Smell">
        <div class="tile__media reveal" data-reveal>${pic(p.img, 'reveal__base', sizes)}<img class="reveal__top" src="${SRC(p.reveal)}" alt="" aria-hidden="true" loading="lazy" decoding="async"></div>
        <div class="tile__meta"><span class="tile__no label">No. ${p.no} · ${esc(p.family)}</span><h3 class="tile__name">${esc(p.name)}</h3><span class="tile__price">${money(p.price)}</span></div>
        <p class="tile__mood">${esc(p.mood)}</p>
      </a>
      <button class="tile__add" type="button" data-add="${p.key}" aria-label="Add ${esc(p.name)} to bag">Add<svg aria-hidden="true"><use href="#i-plus"/></svg></button>
    </article>`;

  function renderHomeTiles() {
    const el = $('[data-tiles="home"]');
    if (el) el.innerHTML = SIGNATURES.map((p, i) => tileHTML(p, i)).join('');
  }

  const shopState = { filter: 'all', sort: 'featured' };
  const NUMS = ['No products', 'One product', 'Two products', 'Three products', 'Four products', 'Five products', 'Six products', 'Seven products'];
  function renderShop() {
    const el = $('[data-tiles="shop"]');
    if (!el) return;
    let list = PRODUCTS.filter(p => shopState.filter === 'all' || p.family === shopState.filter);
    if (shopState.sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
    if (shopState.sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
    el.innerHTML = list.map((p, i) => tileHTML(p, i)).join('');
    $('[data-shop-count]').textContent = NUMS[list.length] || `${list.length} products`;
  }
  function shop() {
    const f = $('[data-filters]');
    if (!f) return;
    f.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      shopState.filter = b.dataset.filter;
      $$('[data-filter]', f).forEach(x => x.setAttribute('aria-checked', String(x === b)));
      renderShop();
    });
    f.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      const bs = $$('[data-filter]', f), i = bs.indexOf(d.activeElement);
      if (i < 0) return;
      const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length;
      bs[j].focus(); bs[j].click();
    });
    $('[data-sort]').addEventListener('change', e => { shopState.sort = e.target.value; renderShop(); });
    renderShop();
  }

  /* product page */
  let pdpState = { key: 'ambre', ml: 50, qty: 1 };
  function renderProduct(key) {
    const p = P[key];
    const view = $('[data-view="product"]');
    pdpState = { key, ml: defaultMl(key), qty: 1 };
    const base = $('[data-pdp-img]'), top = $('[data-pdp-reveal]');
    base.src = SRC(p.img, 1600); base.srcset = `${SRC(p.img)} 800w, ${SRC(p.img, 1600)} 1600w`; base.sizes = '(max-width: 960px) 92vw, 56vw'; base.alt = ALT[p.img];
    top.src = SRC(p.reveal, 1600);
    $('[data-pdp-crumb]').textContent = p.name;
    $('[data-pdp-no]').textContent = p.set ? 'The set · six signatures' : `No. ${p.no} · ${p.family}`;
    const nameEl = $('[data-pdp-name]');
    nameEl.textContent = p.name;
    nameEl.setAttribute('data-melt', '');
    delete nameEl.dataset.split;
    splitMelt(nameEl.parentElement);
    $('[data-pdp-mood]').textContent = p.mood;
    $('[data-pdp-desc]').textContent = p.desc;
    $('[data-pdp-sizes]').innerHTML = sizesFor(p).map(s => `<label class="size${s.ml === pdpState.ml ? ' is-checked' : ''}"><input type="radio" name="pdp-size" value="${s.ml}"${s.ml === pdpState.ml ? ' checked' : ''}><b>${esc(s.label)}</b><span>${money(s.price)}</span></label>`).join('');
    $('[data-pdp-qty] output').textContent = '1';
    $('[data-pdp-notes]').innerHTML = Object.entries(p.notes).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v.join(', '))}</dd></div>`).join('');
    $('[data-pdp-wear]').textContent = p.wear;
    updatePdpPrice();
    // acts
    const acts = $('[data-pdp-acts]');
    if (p.set) {
      acts.innerHTML = SIGNATURES.map(s => `<li class="act"><figure>${pic(s.img, '', '(max-width: 960px) 40vw, 30vw')}</figure><p class="label">No. ${s.no} · ${esc(s.family)}</p><h3>${esc(s.name)}</h3><p>${esc(s.line)}</p></li>`).join('');
      $('#pyr-title').textContent = 'What is inside';
      $('[data-pyr-meta]').textContent = 'All six signatures, one 2 ml vial each, in the order we suggest you wear them.';
    } else {
      acts.innerHTML = p.acts.map(a => `<li class="act"><figure>${pic(a[0], '', '(max-width: 960px) 40vw, 30vw')}</figure><p class="label">${a[1]} note</p><h3>${esc(a[2])}</h3><p>${esc(a[3])}</p></li>`).join('');
      $('#pyr-title').textContent = 'How it opens';
      $('[data-pyr-meta]').textContent = 'Three acts, from the first spray to the last trace on your skin.';
    }
    // character
    const charSec = $('.character', view);
    charSec.hidden = !p.character;
    if (p.character) {
      $('[data-pdp-meters]').innerHTML = Object.entries(p.character).map(([k, v]) => `<div><dt>${k}</dt><dd><i style="--v:${v / 100}"></i></dd><span>${v}</span></div>`).join('');
      $('[data-pdp-meters]').classList.remove('is-in');
    }
    // related
    const others = PRODUCTS.filter(x => x.key !== key && !x.set);
    others.sort((a, b) => (b.family === p.family) - (a.family === p.family));
    $('[data-tiles="related"]').innerHTML = others.slice(0, 3).map((x, i) => tileHTML(x, i)).join('');
    $('[data-buybar-name]').textContent = p.name;
  }
  function updatePdpPrice() {
    const price = priceOf(pdpState.key, pdpState.ml) * pdpState.qty;
    $('[data-pdp-add-t]').textContent = `Add to bag · ${money(price)}`;
    $('[data-buybar-t]').textContent = `Add · ${money(price)}`;
  }
  function pdp() {
    const view = $('[data-view="product"]');
    if (!view) return;
    $('[data-pdp-sizes]').addEventListener('change', e => {
      if (e.target.name !== 'pdp-size') return;
      pdpState.ml = +e.target.value;
      $$('.size', view).forEach(l => l.classList.toggle('is-checked', $('input', l).checked));
      updatePdpPrice();
    });
    $('[data-pdp-qty]').addEventListener('click', e => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      pdpState.qty = clamp(pdpState.qty + +b.dataset.q, 1, 9);
      $('[data-pdp-qty] output').textContent = pdpState.qty;
      updatePdpPrice();
    });
    const add = $('[data-pdp-add]');
    add.addEventListener('click', () => bagAdd(pdpState.key, pdpState.ml, pdpState.qty, add));
    $('[data-buybar-add]').addEventListener('click', e => bagAdd(pdpState.key, pdpState.ml, pdpState.qty, e.currentTarget));
    const bar = $('[data-buybar]');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const on = !e.isIntersecting && view.hidden === false && e.boundingClientRect.top < 0;
        bar.classList.toggle('is-on', on);
        bar.setAttribute('aria-hidden', String(!on));
        $('[data-buybar-add]').tabIndex = on ? 0 : -1;
      }).observe(add);
    }
  }

  /* journal */
  const postHTML = (a, k) => `<button class="post" type="button" data-read="${a.key}" style="--k:${k}" data-cursor="Read">
      <figure class="post__img">${pic(a.img, '', '(max-width: 960px) 92vw, 34vw')}</figure>
      <span class="post__k label">${esc(a.cat)} · ${a.mins} min read</span>
      <span class="post__t">${esc(a.title)}</span>
    </button>`;
  function renderPosts() {
    const t = $('[data-posts="teaser"]'), all = $('[data-posts="all"]');
    if (t) t.innerHTML = ARTICLES.slice(0, 3).map(postHTML).join('');
    if (all) all.innerHTML = ARTICLES.map(postHTML).join('');
  }
  let readerIdx = 0;
  function openReader(key) {
    readerIdx = Math.max(0, ARTICLES.findIndex(a => a.key === key));
    fillReader();
    openDialog('reader');
  }
  function fillReader() {
    const a = ARTICLES[readerIdx];
    const img = $('[data-reader-img]');
    img.src = SRC(a.img, 1600); img.alt = ALT[a.img];
    $('[data-reader-k]').textContent = `${a.cat} · ${a.mins} min read`;
    $('[data-reader-title]').textContent = a.title;
    $('[data-reader-text]').innerHTML = a.body.map(p => `<p>${esc(p)}</p>`).join('');
    $('[data-reader-next]').textContent = `Next: ${ARTICLES[(readerIdx + 1) % ARTICLES.length].title}`;
  }

  /* ---------------------------------------------------------------------
     7. BAG, CHECKOUT, FORMS, SEARCH, DIALOGS
     --------------------------------------------------------------------- */
  const FREE = 150;
  const bag = { items: (store.get('muse:bag2', []) || []).filter(i => P[i.key] && i.qty > 0) };
  const bagCount = () => bag.items.reduce((n, i) => n + i.qty, 0);
  const bagSub = () => bag.items.reduce((s, i) => s + priceOf(i.key, i.ml) * i.qty, 0);
  const saveBag = () => store.set('muse:bag2', bag.items);

  function renderBag() {
    const n = bagCount(), sub = bagSub();
    $$('[data-bag-count]').forEach(el => { el.textContent = n; });
    $$('.strip--bag').forEach(s => {
      s.setAttribute('aria-label', `Bag, ${n} ${n === 1 ? 'item' : 'items'}`);
      s.style.setProperty('--fill', `${n ? Math.min(82, 22 + n * 12) : 0}%`);
    });
    const list = $('[data-bag-items]'), empty = $('[data-bag-empty]'), foot = $('[data-bag-foot]'), ship = $('[data-bag-ship]');
    empty.hidden = n > 0; foot.hidden = n === 0; ship.hidden = n === 0; list.hidden = n === 0;
    const left = FREE - sub;
    $('[data-bag-ship-t]').textContent = left > 0 ? `${money(left)} away from free shipping` : 'Shipping is on us.';
    $('[data-bag-ship-bar]').style.setProperty('--v', clamp(sub / FREE, 0, 1).toFixed(3));
    list.innerHTML = bag.items.map((it, idx) => {
      const p = P[it.key];
      const size = sizesFor(p).find(s => s.ml === it.ml) || sizesFor(p)[0];
      return `<li class="line">
        <img src="${SRC(p.img)}" alt="${esc(ALT[p.img])}">
        <div><b>${esc(p.name)}</b><span class="line__meta">${esc(size.label)} · ${esc(p.mood)}</span>
          <div class="qty"><button type="button" data-bq="-1" data-i="${idx}" aria-label="One fewer ${esc(p.name)}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button><span>${it.qty}</span><button type="button" data-bq="1" data-i="${idx}" aria-label="One more ${esc(p.name)}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div></div>
        <div class="line__right"><span>${money(size.price * it.qty)}</span><button class="line__rm" type="button" data-rm="${idx}">Remove</button></div>
      </li>`;
    }).join('');
    $('[data-bag-sub]').textContent = money(sub);
    renderSummary();
  }

  function bagAdd(key, ml, qty, fromEl) {
    const p = P[key];
    if (!p) return;
    ml = ml || defaultMl(key);
    const found = bag.items.find(i => i.key === key && i.ml === ml);
    if (found) found.qty = Math.min(20, found.qty + qty); else bag.items.push({ key, ml, qty });
    saveBag();
    flyDrop(fromEl, p.color).then(() => {
      renderBag();
      const strip = $$('.strip--bag').find(s => s.offsetParent);
      if (strip) { restart(strip, 'is-bump'); rackApi.swing(strip, 8); }
      const size = sizesFor(p).find(s => s.ml === ml);
      toast(`${esc(p.name)}, ${esc(size ? size.label : '')}, is in your bag.`, { label: 'View bag', fn: () => openDialog('bag') });
    });
  }

  function flyDrop(fromEl, color) {
    const target = $$('.strip--bag').find(s => s.offsetParent);
    if (reduced() || !fromEl || !target || !fromEl.getBoundingClientRect) return Promise.resolve();
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const el = d.createElement('span');
    el.className = 'drop';
    el.style.setProperty('--c', color || '#e0a548');
    d.body.appendChild(el);
    const x0 = a.left + a.width / 2 - 11, y0 = a.top + a.height / 2 - 14;
    const x1 = b.left + b.width / 2 - 11, y1 = b.top + b.height * .7 - 14;
    const peak = Math.min(y0, y1) - 160;
    const dur = 900;
    const ax = el.animate([{ left: `${x0}px` }, { left: `${x1}px` }], { duration: dur, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' });
    el.animate([
      { top: `${y0}px`, transform: 'scale(1)', easing: 'cubic-bezier(.2,.7,.4,1)' },
      { top: `${peak}px`, transform: 'scale(1.2)', offset: .42, easing: 'cubic-bezier(.6,0,.85,.4)' },
      { top: `${y1}px`, transform: 'scale(.6)' }
    ], { duration: dur, fill: 'forwards' });
    return ax.finished.then(() => el.remove(), () => el.remove());
  }

  let toastTimer = 0;
  function toast(html, action) {
    const el = $('[data-toast]');
    el.innerHTML = `<span>${html}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    if (action) $('button', el).addEventListener('click', () => { el.classList.remove('is-on'); action.fn(); });
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 4600);
  }

  /* checkout */
  const co = { step: 0, ship: 'standard', email: '' };
  const shipCost = () => { const sub = bagSub(); if (co.ship === 'express') return 18; return sub >= FREE ? 0 : 8; };
  function renderSummary() {
    const items = $('[data-sum-items]');
    if (!items) return;
    const n = bagCount();
    items.innerHTML = bag.items.map(it => {
      const p = P[it.key], s = sizesFor(p).find(x => x.ml === it.ml) || sizesFor(p)[0];
      return `<li class="sum__item"><img src="${SRC(p.img)}" alt=""><div><b>${esc(p.name)}</b><span>${esc(s.label)} · ${it.qty} ${it.qty === 1 ? 'piece' : 'pieces'}</span></div><span>${money(s.price * it.qty)}</span></li>`;
    }).join('');
    const sub = bagSub(), sh = n ? shipCost() : 0;
    $('[data-sum-sub]').textContent = money(sub);
    $('[data-sum-ship]').textContent = n ? (sh ? money(sh) : 'Free') : '€0';
    $('[data-sum-total]').textContent = money(sub + sh);
    $('[data-sum-empty]').hidden = n > 0 || co.step === 3;
    const std = $('[data-ship-std]');
    if (std) std.textContent = sub >= FREE ? 'Free' : '€8';
    const pay = $('[data-co-pay]');
    if (pay) pay.textContent = `Place order · ${money(sub + sh)}`;
  }
  function coShow(i) {
    co.step = i;
    $$('[data-costep]').forEach(s => { s.hidden = +s.dataset.costep !== i; });
    $$('[data-costeps] li').forEach((li, j) => { li.classList.toggle('is-on', j === i); li.classList.toggle('is-done', j < i); });
    const cur = $(`[data-costep="${i}"]`);
    const first = cur && $('input, button, [tabindex]', cur);
    if (first && i > 0) first.focus({ preventScroll: true });
    renderSummary();
  }
  function coStart() { if (co.step === 3) coShow(0); else renderSummary(); }
  function validate(form) {
    let ok = true;
    $$('input[required], textarea[required]', form).forEach(inp => {
      let good = inp.type === 'checkbox' ? inp.checked : inp.value.trim().length > 0;
      if (good && inp.type === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
      const f = inp.closest('.field');
      if (f) f.classList.toggle('is-bad', !good);
      inp.setAttribute('aria-invalid', String(!good));
      if (!good && ok) { ok = false; inp.focus(); }
    });
    return ok;
  }
  function checkout() {
    const steps = $$('[data-costep]');
    if (!steps.length) return;
    const [f0, f1, f2] = steps;
    f0.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('[data-co-msg]');
      if (!bagCount()) { msg.textContent = 'Your bag is empty. Add a scent first.'; msg.className = 'form__msg is-err'; return; }
      if (!validate(f0)) { msg.textContent = 'Please complete the highlighted fields.'; msg.className = 'form__msg is-err'; return; }
      msg.textContent = '';
      co.email = $('#co-email').value.trim();
      coShow(1);
    });
    f1.addEventListener('change', e => {
      if (e.target.name === 'ship') { co.ship = e.target.value; $$('.ship__opt', f1).forEach(l => l.classList.toggle('is-checked', $('input', l).checked)); renderSummary(); }
      if (e.target.id === 'co-gift') $('[data-gift-note]').hidden = !e.target.checked;
    });
    $$('.ship__opt', f1).forEach(l => l.classList.toggle('is-checked', $('input', l).checked));
    f1.addEventListener('submit', e => { e.preventDefault(); coShow(2); });
    const card = $('#co-card'), exp = $('#co-exp'), cvc = $('#co-cvc');
    card.addEventListener('input', () => { card.value = card.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); });
    exp.addEventListener('input', () => { const v = exp.value.replace(/\D/g, '').slice(0, 4); exp.value = v.length > 2 ? `${v.slice(0, 2)} / ${v.slice(2)}` : v; });
    cvc.addEventListener('input', () => { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4); });
    f2.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('[data-co-msg2]');
      const digits = card.value.replace(/\D/g, ''), m = +exp.value.slice(0, 2);
      const bad = [];
      if (digits.length < 15) bad.push(card);
      if (!(m >= 1 && m <= 12) || exp.value.replace(/\D/g, '').length !== 4) bad.push(exp);
      if (cvc.value.length < 3) bad.push(cvc);
      [card, exp, cvc].forEach(i => { i.closest('.field').classList.toggle('is-bad', bad.includes(i)); i.setAttribute('aria-invalid', String(bad.includes(i))); });
      if (bad.length) { msg.textContent = 'Check the card details. Any test number with 16 digits works here.'; msg.className = 'form__msg is-err'; bad[0].focus(); return; }
      msg.textContent = '';
      $('[data-co-order]').textContent = `MUSE ${String(Math.floor(10000 + Math.random() * 89999))}`;
      $('[data-co-mail]').textContent = co.email || 'you';
      bag.items = []; saveBag();
      coShow(3);
      renderBag();
      const doneEl = $('[data-costep="3"]');
      doneEl.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    });
    $$('[data-co-back]').forEach(b => b.addEventListener('click', () => coShow(Math.max(0, co.step - 1))));
  }

  /* contact + letters */
  function forms() {
    const c = $('[data-contact]');
    if (c) c.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('[data-contact-msg]');
      if (!validate(c)) { msg.textContent = 'Please complete the highlighted fields.'; msg.className = 'form__msg is-err'; return; }
      // Connect your form endpoint here (fetch to your inbox service) before going live.
      const name = $('#c-name').value.trim().split(' ')[0];
      msg.textContent = `Thank you, ${name}. We read every note and reply within two working days.`;
      msg.className = 'form__msg is-ok';
      c.reset();
    });
    $$('[data-letters]').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      const inp = $('input', f), msg = $('[data-letters-msg]', f);
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
      // Connect your mailing list provider here before going live.
      msg.textContent = ok ? 'You are on the list. The first letter arrives with the next batch.' : 'That address looks incomplete. Try name@example.com.';
      msg.className = `letters__msg ${ok ? 'is-ok' : 'is-err'}`;
      if (ok) inp.value = '';
    }));
  }

  /* accordions */
  function accordions() {
    d.addEventListener('click', e => {
      const b = e.target.closest('.acc__item button');
      if (!b) return;
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      b.closest('.acc__item').classList.toggle('is-open', open);
    });
    $$('.acc__item button[aria-expanded="true"]').forEach(b => b.closest('.acc__item').classList.add('is-open'));
  }

  /* search */
  function renderSearch(q) {
    const list = $('[data-search-results]'), status = $('[data-search-status]');
    const terms = norm(q.trim()).split(/\s+/).filter(Boolean);
    const match = s => terms.every(t => s.includes(t));
    const prods = PRODUCTS.filter(p => !terms.length || match(p.search));
    const arts = terms.length ? ARTICLES.filter(a => match(a.search)) : [];
    const mark = text => {
      let out = esc(text);
      terms.forEach(t => {
        const i = norm(text).indexOf(t);
        if (i > -1) { const raw = text.slice(i, i + t.length); out = out.replace(esc(raw), `<mark>${esc(raw)}</mark>`); }
      });
      return out;
    };
    const total = prods.length + arts.length;
    status.textContent = !terms.length ? 'Everything' : total ? `${total} ${total === 1 ? 'result' : 'results'} for “${q.trim()}”` : `Nothing smells like “${q.trim()}” yet. Try smoky, jasmine or fresh.`;
    let k = 0;
    list.innerHTML = prods.map(p => `<li><a class="hit" href="#${p.key}" data-hit style="--k:${k++}"><img src="${SRC(p.img)}" alt=""><span><b>${mark(p.name)}</b><span>${mark(p.mood)} · ${mark(Object.values(p.notes).flat().slice(0, 4).join(', '))}</span></span><span class="hit__k label">${money(p.price)}</span></a></li>`).join('')
      + arts.map(a => `<li><button class="hit" type="button" data-read="${a.key}" style="--k:${k++}"><img src="${SRC(a.img)}" alt=""><span><b>${mark(a.title)}</b><span>${esc(a.cat)} · ${a.mins} min read</span></span><span class="hit__k label">Story</span></button></li>`).join('');
  }
  function search() {
    const q = $('#q');
    if (!q) return;
    q.addEventListener('input', () => renderSearch(q.value));
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const f = $('[data-search-results] .hit'); if (f) f.click(); }
      if (e.key === 'Escape') { e.preventDefault(); closeDialog($('#search')); }
    });
  }

  /* dialogs */
  const modalOpen = () => $$('dialog[open]').length > 0;
  const syncModal = () => root.classList.toggle('has-modal', modalOpen());
  function openDialog(id) {
    const dlg = d.getElementById(id);
    if (!dlg || dlg.open) return;
    const others = $$('dialog[open]').filter(x => x !== dlg);
    const go = () => {
      dlg.classList.remove('is-closing');
      dlg.showModal();
      syncModal();
      if (id === 'search') { const q = $('#q'); q.value = ''; renderSearch(''); setTimeout(() => q.focus(), 40); }
      if (id === 'bag') renderBag();
      if (id === 'menu') $$('.menu__nav a', dlg).forEach((a, i) => a.style.setProperty('--k', i));
    };
    if (others.length) { let left = others.length; others.forEach(o => closeDialog(o, () => { if (--left === 0) go(); })); } else go();
  }
  function closeDialog(dlg, after) {
    if (!dlg || !dlg.open) { if (after) after(); return; }
    if (dlg.classList.contains('is-closing')) return;
    let done = false;
    const finish = () => { if (done) return; done = true; dlg.classList.remove('is-closing'); if (dlg.open) dlg.close(); syncModal(); if (after) after(); };
    if (reduced()) { finish(); return; }
    dlg.classList.add('is-closing');
    const target = dlg.id === 'menu' ? $('.menu__paper', dlg) : dlg;
    target.addEventListener('animationend', function h(e) { if (e.target === target) { target.removeEventListener('animationend', h); finish(); } });
    setTimeout(finish, 700);
  }
  function dialogs() {
    $$('dialog').forEach(dlg => {
      dlg.addEventListener('cancel', e => { e.preventDefault(); closeDialog(dlg); });
      dlg.addEventListener('close', syncModal);
      dlg.addEventListener('click', e => { if (e.target === dlg && dlg.id !== 'menu' && dlg.id !== 'search') closeDialog(dlg); });
    });
  }

  /* ---------------------------------------------------------------------
     8. ROUTER · pages change through a spray of mist
     --------------------------------------------------------------------- */
  const VIEWS = ['home', 'shop', 'product', 'house', 'journal', 'contact', 'checkout'];
  const HOME_ANCHORS = ['finder', 'hold', 'anatomy'];
  const TITLES = { home: 'MUSE · Perfume you can see', shop: 'Shop · MUSE', house: 'House · MUSE', journal: 'Journal · MUSE', contact: 'Contact · MUSE', checkout: 'Checkout · MUSE' };
  const MIST = { home: 'Inhale', shop: 'The collection', house: 'The house', journal: 'Journal', contact: 'Say hello', checkout: 'Checkout' };
  let current = null;
  let lastPoint = { x: innerWidth / 2, y: innerHeight / 2 };
  d.addEventListener('pointerdown', e => { lastPoint = { x: e.clientX, y: e.clientY }; }, true);
  const vapors = {};

  function parse(h) {
    h = (h || '').replace(/^#/, '');
    if (!h || h === 'home') return { view: 'home' };
    if (P[h]) return { view: 'product', key: h };
    if (HOME_ANCHORS.includes(h)) return { view: 'home', anchor: h };
    if (VIEWS.includes(h)) return { view: h };
    return { view: 'home' };
  }

  function show(route) {
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== route.view; });
    if (route.view === 'product') renderProduct(route.key);
    if (route.view === 'checkout') coStart();
    if (route.view === 'shop') renderShop();
    const view = $(`.view[data-view="${route.view}"]`);
    splitMelt(view);
    observeReveals(view, true);
    d.title = route.view === 'product' ? `${P[route.key].name} · MUSE` : TITLES[route.view];
    setActiveStrip(route);
    current = route;
    if (route.view === 'house' && vapors.house) vapors.house.play();
    requestAnimationFrame(() => { if (rackApi.tone) rackApi.tone(); dispatchEvent(new Event('scroll')); });
  }

  function place(route) {
    if (route.anchor) {
      const el = d.getElementById(route.anchor);
      requestAnimationFrame(() => { if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' }); });
    } else window.scrollTo(0, 0);
    $('#app').focus({ preventScroll: true });
  }

  function navigate(route, initial) {
    const same = current && current.view === route.view && (route.view !== 'product' || current.key === route.key);
    if (same) {
      setActiveStrip(route);
      if (route.anchor) { const el = d.getElementById(route.anchor); if (el) el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); }
      else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
      return;
    }
    if (initial || reduced()) { show(route); place(route); return; }
    const mist = $('.mist');
    const word = route.view === 'product' ? P[route.key].name : (route.anchor === 'finder' ? 'Tell us a memory' : MIST[route.view]);
    $('[data-mist-word]').innerHTML = lettersHTML(word);
    mist.style.setProperty('--x', `${lastPoint.x}px`);
    mist.style.setProperty('--y', `${lastPoint.y}px`);
    mist.classList.remove('is-out');
    restart(mist, 'is-in');
    setTimeout(() => {
      show(route); place(route);
      setTimeout(() => {
        mist.classList.remove('is-in');
        restart(mist, 'is-out');
        setTimeout(() => mist.classList.remove('is-out'), 1000);
      }, 420);
    }, 720);
  }

  /* ---------------------------------------------------------------------
     PRELOADER
     --------------------------------------------------------------------- */
  function inhale(done) {
    const el = $('.inhale');
    if (!root.classList.contains('is-inhaling') || !el) { requestAnimationFrame(() => requestAnimationFrame(done)); return; }
    try { sessionStorage.setItem('muse:inhaled', '1'); } catch (e) { /* ignore */ }
    const word = $('[data-inhale-word]'), count = $('[data-inhale-count]');
    const fonts = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
    const t0 = performance.now(), dur = 1800;
    const frame = now => {
      const t = Math.min(1, (now - t0) / dur), e = easeInOut(t);
      word.style.fontVariationSettings = `"opsz" 144, "wght" ${(100 + e * 800).toFixed(0)}, "SOFT" ${(e * 100).toFixed(0)}, "WONK" 1`;
      count.textContent = String(Math.round(e * 100)).padStart(2, '0');
      if (t < 1) { requestAnimationFrame(frame); return; }
      fonts.then(() => {
        word.textContent = 'Exhale';
        tween(420, k => { word.style.fontVariationSettings = `"opsz" 144, "wght" ${(900 - k * 700).toFixed(0)}, "SOFT" ${(100 - k * 100).toFixed(0)}, "WONK" 1`; });
        setTimeout(() => {
          el.classList.add('is-out');
          done();
          setTimeout(() => root.classList.remove('is-inhaling'), 1000);
        }, 460);
      });
    };
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------------
     BOOT
     --------------------------------------------------------------------- */
  function clicks() {
    d.addEventListener('click', e => {
      const t = e.target.closest('a[href^="#"], [data-open], [data-close], [data-add], [data-bq], [data-rm], [data-q-chip], [data-read], [data-reader-next]');
      if (!t) return;
      if (t.matches('[data-open]')) {
        if (t.dataset.skip) return;
        openDialog(t.dataset.open);
        return;
      }
      if (t.matches('[data-close]')) { closeDialog(t.closest('dialog')); return; }
      if (t.matches('[data-add]')) { e.preventDefault(); bagAdd(t.dataset.add, null, 1, t); return; }
      if (t.matches('[data-bq]')) {
        const it = bag.items[+t.dataset.i];
        if (!it) return;
        it.qty += +t.dataset.bq;
        if (it.qty <= 0) bag.items.splice(+t.dataset.i, 1);
        saveBag(); renderBag();
        return;
      }
      if (t.matches('[data-rm]')) { bag.items.splice(+t.dataset.rm, 1); saveBag(); renderBag(); return; }
      if (t.matches('[data-q-chip]')) { const q = $('#q'); q.value = t.textContent.trim(); renderSearch(q.value); q.focus(); return; }
      if (t.matches('[data-reader-next]')) { readerIdx = (readerIdx + 1) % ARTICLES.length; fillReader(); $('.reader').scrollTop = 0; return; }
      if (t.matches('[data-read]')) {
        const key = t.dataset.read;
        const dlg = t.closest('dialog');
        if (dlg && dlg.id !== 'reader') closeDialog(dlg, () => openReader(key)); else openReader(key);
        return;
      }
      // in page links
      const href = t.getAttribute('href');
      if (href === '#app') { e.preventDefault(); $('#app').focus(); return; }
      const dlg = t.closest('dialog');
      if (dlg) {
        e.preventDefault();
        closeDialog(dlg, () => { if (location.hash === href) navigate(parse(href)); else location.hash = href; });
        return;
      }
      if (href === location.hash || (href === '#home' && !location.hash)) { e.preventDefault(); navigate(parse(href)); }
    });
  }

  function boot() {
    renderHomeTiles();
    renderPosts();
    splitMelt();
    root.classList.add('reveal-ready');
    rack();
    swell();
    reveals();
    cursorTag();
    hold();
    anatomy();
    marquee();
    translator();
    parallax();
    counters();
    shop();
    pdp();
    checkout();
    forms();
    accordions();
    search();
    dialogs();
    clicks();
    renderBag();

    if (window.Vapor) {
      const hero = $('.hero__media');
      if (hero) vapors.hero = new window.Vapor(hero, SRC('smoke-violet', 1600), $('.hero'));
      const house = $('.house-hero__media');
      if (house) vapors.house = new window.Vapor(house, SRC('pipette-mono', 1600), $('.house-hero'));
    }

    addEventListener('hashchange', () => navigate(parse(location.hash)));
    navigate(parse(location.hash), true);

    inhale(() => {
      root.classList.add('is-ready');
      if (vapors.hero) vapors.hero.play();
      if (current && current.view === 'house' && vapors.house) vapors.house.play();
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
