/* =========================================================================
   MUSE · site script
   Uses GSAP + ScrollTrigger for choreography and Lenis for smooth scroll
   (all vendored in assets/vendor). The 3D hero lives in hero3d.js.
   1. helpers & data      4. home choreography     7. bag, checkout, forms
   2. smooth scroll       5. shop, product, journal 8. router, loader, boot
   3. island, cursor      6. dialogs, search
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
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mobile = () => matchMedia('(max-width: 900px)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const money = n => '€' + Math.round(n).toLocaleString('en-GB');
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const ALT = {
    'amber-satin': 'A round bottle of amber perfume with a gold cap on cream satin',
    'hand-clear': 'A hand holding a clear glass perfume bottle against a pale background',
    'crystal-flowers': 'A cut crystal perfume bottle surrounded by peach flowers',
    'gold-glass': 'Close view of swirling golden glass catching the light',
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
  const img = (n, sizes = '(max-width: 900px) 90vw, 33vw', alt = ALT[n] || '', extra = '') =>
    `<img src="${SRC(n)}" srcset="${SRC(n)} 800w, ${SRC(n, 1600)} 1600w" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;

  const PRODUCTS = [
    { key: 'ambre', no: '01', name: 'Ambre 01', family: 'Amber', mood: 'Warm and resinous', price: 165, img: 'amber-satin', reveal: 'resin',
      desc: 'Sun warmed resin and saffron over a glowing base of labdanum. Golden from the first spray, then softer, warmer and closer to skin as the evening goes on.',
      line: 'Late sun, bottled. Resin that glows on skin for hours.',
      wear: 'Two sprays at the base of the throat. Amber loves warm skin, so it blooms most in the evening.',
      notes: { Top: ['Bergamot', 'Pink pepper'], Heart: ['Saffron', 'Orange blossom'], Base: ['Labdanum', 'Vanilla', 'Sandalwood'] },
      acts: [['citrus-dried', 'Top', 'Bergamot', 'Bright peel, a flash of green.'], ['liquid-gold', 'Heart', 'Saffron', 'Honeyed, leathery, warm as skin.'], ['resin', 'Base', 'Labdanum', 'Resin that glows for hours.']],
      character: { Longevity: 88, Sillage: 72, Warmth: 94, Freshness: 18 } },
    { key: 'fleur', no: '02', name: 'Fleur 02', family: 'Floral', mood: 'Soft and luminous', price: 155, img: 'crystal-flowers', reveal: 'jasmine-star',
      desc: 'Jasmine sambac picked before dawn, kept airy with mandarin and settled on a clean white musk. Close, quiet and luminous, like skin after a long bath.',
      line: 'Night flowers through an open window. Quiet, close, luminous.',
      wear: 'One spray on each wrist and one in the hair. Musk sits close, so let people come near.',
      notes: { Top: ['Mandarin', 'Pear'], Heart: ['Jasmine sambac', 'Rose'], Base: ['White musk', 'Cashmere wood'] },
      acts: [['lemons', 'Top', 'Mandarin', 'Sweet zest, barely there.'], ['jasmine-star', 'Heart', 'Jasmine sambac', 'Night flowers opening.'], ['bottle-frost', 'Base', 'White musk', 'Clean skin, soft as linen.']],
      character: { Longevity: 64, Sillage: 48, Warmth: 52, Freshness: 58 } },
    { key: 'cedre', no: '03', name: 'Cèdre 03', family: 'Woody', mood: 'Green and grounding', price: 170, img: 'hand-clear', reveal: 'cedar-bark',
      desc: 'Cold lime and Atlas cedar over oakmoss and vetiver. Green, dry and calm, like walking into a forest the morning after a storm.',
      line: 'Rain on bark and pencil shavings. Green, dry, calm.',
      wear: 'Spray on the chest and the back of the neck. Woods last, so two sprays will carry you into the evening.',
      notes: { Top: ['Lime', 'Cardamom'], Heart: ['Atlas cedar', 'Vetiver'], Base: ['Oakmoss', 'Ambrette'] },
      acts: [['lemons', 'Top', 'Lime', 'Cold, sharp, awake.'], ['cedar-bark', 'Heart', 'Atlas cedar', 'Pencil shavings and rain.'], ['bark-grey', 'Base', 'Oakmoss', 'Forest floor after a storm.']],
      character: { Longevity: 82, Sillage: 66, Warmth: 40, Freshness: 70 } },
    { key: 'fumee', no: '04', name: 'Fumée 04', family: 'Smoky', mood: 'Dark and hypnotic', price: 180, img: 'bottle-ink', reveal: 'smoke-violet',
      desc: 'Black pepper and frankincense curling over smoked guaiac wood. Dark, slow and strangely comforting, like candles left burning in a cold stone room.',
      line: 'Candles in a cold stone room. Dark, slow, hypnotic.',
      wear: 'One spray is a statement. Wear it on clothes and scarves, where smoke clings longest.',
      notes: { Top: ['Black pepper', 'Elemi'], Heart: ['Frankincense', 'Cypriol'], Base: ['Guaiac wood', 'Birch tar'] },
      acts: [['smoke-teal', 'Top', 'Black pepper', 'A spark in the dark.'], ['smoke-violet', 'Heart', 'Frankincense', 'Old stone, cold air, candles.'], ['bark-grey', 'Base', 'Guaiac wood', 'Smoked wood, slow and deep.']],
      character: { Longevity: 92, Sillage: 84, Warmth: 76, Freshness: 22 } },
    { key: 'prisme', no: '05', name: 'Prisme 05', family: 'Fresh', mood: 'Bright and strange', price: 160, img: 'bottle-prism', reveal: 'smoke-teal',
      desc: 'Sparkling aldehydes, powdery iris and a humming ambrette musk. It smells like light through a prism: clean, metallic and impossible to place.',
      line: 'Light through a prism. Clean, metallic, impossible to place.',
      wear: 'Mist it into the air and walk through. Aldehydes are bright and fleeting, so refresh at noon.',
      notes: { Top: ['Aldehydes', 'Grapefruit'], Heart: ['Orris', 'Violet leaf'], Base: ['Ambrette', 'Cashmeran'] },
      acts: [['smoke-teal', 'Top', 'Aldehydes', 'Fizz, like light on metal.'], ['bottle-prism', 'Heart', 'Orris', 'Powder, violet, cool.'], ['smoke-silk', 'Base', 'Ambrette', 'A musk that hums.']],
      character: { Longevity: 60, Sillage: 70, Warmth: 30, Freshness: 88 } },
    { key: 'soleil', no: '06', name: 'Soleil 06', family: 'Fresh', mood: 'Golden and sunlit', price: 145, img: 'bottle-sun', reveal: 'lemons',
      desc: 'Bergamot and neroli warmed by dry vetiver. A golden citrus that skips the cologne cliché and smells like late afternoon on a terrace.',
      line: 'Late afternoon on a terrace. Golden citrus, dry grass.',
      wear: 'Spray generously on skin and clothes. Citrus is light by nature, so be bold with it.',
      notes: { Top: ['Bergamot', 'Petitgrain'], Heart: ['Neroli', 'Orange blossom'], Base: ['Vetiver', 'Musk'] },
      acts: [['lemons', 'Top', 'Bergamot', 'Sun on peel.'], ['jasmine-night', 'Heart', 'Neroli', 'Orange blossom at noon.'], ['bark-grey', 'Base', 'Vetiver', 'Dry grass, warm earth.']],
      character: { Longevity: 52, Sillage: 58, Warmth: 46, Freshness: 94 } },
    { key: 'set', no: '00', name: 'Discovery set', family: 'Set', mood: 'All six, in 2 ml vials', price: 38, img: 'dropper-leaf', reveal: 'citrus-dried', set: true,
      desc: 'All six signatures in 2 ml vials, packed in a paper case. Wear one a day for a week and let your skin decide which one is yours.',
      line: 'Six small bottles, one week, no pressure.',
      wear: 'Wear one vial a day, on skin rather than paper, and note which one you still notice at dinner.',
      notes: { Inside: ['Ambre 01', 'Fleur 02', 'Cèdre 03', 'Fumée 04', 'Prisme 05', 'Soleil 06'] },
      acts: [], character: null }
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

  const HERO_SCENTS = [
    { name: 'Ambre 01', word: 'AMBRE', deep: '#3f1402', bright: '#f7ad45', bg: '#2a070d', glow: '#6b1f22', photos: ['citrus-dried', 'resin', 'liquid-gold'].map(n => SRC(n)) },
    { name: 'Fleur 02', word: 'FLEUR', deep: '#5a0f26', bright: '#f6a9b6', bg: '#36091d', glow: '#7a2a44', photos: ['jasmine-star', 'jasmine-night', 'jasmine-branch'].map(n => SRC(n)) },
    { name: 'Cèdre 03', word: 'CÈDRE', deep: '#1f2504', bright: '#cfd062', bg: '#141008', glow: '#3d3a1c', photos: ['cedar-bark', 'lemons', 'bark-grey'].map(n => SRC(n)) }
  ];

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
    { key: 'wear', cat: 'Ritual', mins: 3, img: 'hand-clear', title: 'Where to wear it: pulse points and the hair trick', body: [
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
    honey: { label: 'Honey on warm skin', product: 'ambre' },
    night: { label: 'Jasmine through an open window', product: 'fleur' },
    storm: { label: 'A forest after the storm', product: 'cedre' },
    church: { label: 'Candles in an old church', product: 'fumee' },
    neon: { label: 'Neon on wet streets', product: 'prisme' },
    winter: { label: 'Oranges in winter', product: 'soleil' }
  };

  let gsap = null, ST = null, lenis = null;

  /* ---------------------------------------------------------------------
     2. SMOOTH SCROLL
     --------------------------------------------------------------------- */
  function smoothScroll() {
    if (reduced() || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', () => ST && ST.update());
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(el, immediate) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { immediate: !!immediate, duration: 1.6, offset: 0 });
    else el.scrollIntoView({ behavior: immediate || reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  function scrollTop(immediate) {
    if (lenis) lenis.scrollTo(0, { immediate: !!immediate, duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: immediate || reduced() ? 'auto' : 'smooth' });
  }

  /* ---------------------------------------------------------------------
     3. THE ISLAND · glass navigation that morphs into its own menus
     --------------------------------------------------------------------- */
  const islandApi = { close() {}, tone() {}, current() {} };
  function island() {
    const isl = $('#island'), shell = $('[data-shell]'), bar = $('[data-bar]'), panels = $('[data-panels]');
    const blob = $('[data-blob]'), links = $('[data-links]'), progress = $('[data-progress]');
    const menuBtn = $('[data-mobile-menu]');
    let open = null, closeTimer = 0, hoverTimer = 0, blobTarget = null;

    const ipanelProducts = SIGNATURES.map(p => `<li><a href="#${p.key}">${img(p.img, '128px', '')}<b>${esc(p.name)}</b><span>${money(p.price)}</span></a></li>`).join('');
    $('[data-ipanel-products]').innerHTML = ipanelProducts;
    $('[data-mnav-products]').innerHTML = SIGNATURES.map(p => `<li><a href="#${p.key}">${img(p.img, '112px', '')}${esc(p.name)}</a></li>`).join('');

    const setSize = (w, h) => { shell.style.setProperty('--w', `${Math.round(w)}px`); shell.style.setProperty('--h', `${Math.round(h)}px`); };
    const closedSize = () => setSize(bar.offsetWidth + 2, bar.offsetHeight + 2);
    closedSize();
    addEventListener('resize', () => { if (open) openPanel(open, true); else closedSize(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { if (!open) closedSize(); });

    function openPanel(name, instant) {
      clearTimeout(closeTimer);
      const el = $(`[data-ipanel="${name}"]`);
      if (!el) return;
      if (open && open !== name) { const prev = $(`[data-ipanel="${open}"]`); prev.classList.remove('is-in'); prev.hidden = true; }
      el.hidden = false;
      open = name;
      isl.classList.add('is-open');
      $$('[data-panel]').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.panel === name)));
      if (name === 'mobile') menuBtn.setAttribute('aria-expanded', 'true');
      const w = name === 'mobile' ? innerWidth - 24 : Math.max(bar.offsetWidth, el.offsetWidth + 26) + 2;
      const h = name === 'mobile' ? innerHeight - 28 : bar.offsetHeight + panels.offsetHeight + 2;
      setSize(w, h);
      requestAnimationFrame(() => el.classList.add('is-in'));
      if (lenis && name === 'mobile') lenis.stop();
      if (instant) el.classList.add('is-in');
    }
    function closePanel() {
      if (!open) return;
      const el = $(`[data-ipanel="${open}"]`);
      el.classList.remove('is-in');
      const was = open;
      open = null;
      isl.classList.remove('is-open');
      $$('[data-panel]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      menuBtn.setAttribute('aria-expanded', 'false');
      closedSize();
      if (lenis && was === 'mobile') lenis.start();
      closeTimer = setTimeout(() => { if (open !== was) el.hidden = true; }, 600);
      aimBlob(currentLink());
    }
    islandApi.close = closePanel;

    $$('[data-panel]').forEach(b => {
      b.addEventListener('click', () => (open === b.dataset.panel ? closePanel() : openPanel(b.dataset.panel)));
      if (fine) b.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(() => openPanel(b.dataset.panel), 140); });
    });
    $$('.island__link:not([data-panel])').forEach(a => a.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); if (open && open !== 'mobile') hoverTimer = setTimeout(closePanel, 160); }));
    if (fine) {
      shell.addEventListener('pointerleave', () => { clearTimeout(hoverTimer); if (open && open !== 'mobile') hoverTimer = setTimeout(closePanel, 280); });
      shell.addEventListener('pointerenter', () => clearTimeout(hoverTimer));
    }
    menuBtn.addEventListener('click', () => (open === 'mobile' ? closePanel() : openPanel('mobile')));
    panels.addEventListener('click', e => { if (e.target.closest('a')) closePanel(); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { closePanel(); } });
    d.addEventListener('pointerdown', e => { if (open && !shell.contains(e.target)) closePanel(); });

    /* the liquid highlight that slides between links */
    function aimBlob(el) {
      blobTarget = el;
      if (!el || mobile()) { blob.classList.remove('is-on'); return; }
      const lr = links.getBoundingClientRect(), r = el.getBoundingClientRect();
      const x = r.left - lr.left, w = r.width;
      blob.classList.add('is-on');
      if (gsap && !reduced()) gsap.to(blob, { x, width: w, duration: .75, ease: 'elastic.out(1, .72)', overwrite: true });
      else { blob.style.transform = `translateX(${x}px)`; blob.style.width = `${w}px`; }
    }
    const currentLink = () => $('.island__link.is-current');
    $$('.island__link').forEach(l => {
      l.addEventListener('pointerenter', () => aimBlob(l));
      l.addEventListener('focus', () => aimBlob(l));
    });
    links.addEventListener('pointerleave', () => aimBlob(currentLink()));
    islandApi.current = route => {
      const name = route.view === 'product' || route.view === 'shop' ? 'collection' : route.view;
      $$('.island__link').forEach(l => l.classList.toggle('is-current', (l.dataset.route || l.dataset.panel) === name));
      if (!blobTarget || blobTarget.classList.contains('is-current') || !open) aimBlob(currentLink());
    };

    /* tone follows the section under the island, plus a scroll progress line */
    islandApi.tone = () => {
      const probe = 44;
      let t = 'dark';
      for (const el of $$('.view:not([hidden]) [data-tone], .foot')) {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) { t = el.dataset.tone; break; }
      }
      if (isl.dataset.tone !== t) isl.dataset.tone = t;
      const max = root.scrollHeight - innerHeight;
      progress.style.setProperty('--p', (max > 0 ? scrollY / max : 0).toFixed(4));
    };
    addEventListener('scroll', islandApi.tone, { passive: true });
  }

  /* contextual cursor */
  function cursor() {
    if (!fine || reduced() || !gsap) return;
    root.classList.add('has-cursor');
    const c = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('[data-cursor-label]');
    gsap.set([dot, ring], { x: -100, y: -100 });
    const dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' }), dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' });
    let px = -100, py = -100, tick = false;
    const sense = t => {
      const lab = t && t.closest ? t.closest('[data-cursor]') : null;
      c.classList.toggle('is-label', !!lab);
      if (lab && label.textContent !== lab.dataset.cursor) label.textContent = lab.dataset.cursor;
      c.classList.toggle('is-link', !lab && !!(t && t.closest && t.closest('a, button, label, input, select, textarea')));
    };
    addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      dx(px); dy(py); rx(px); ry(py);
      sense(e.target);
    }, { passive: true });
    addEventListener('scroll', () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => { tick = false; sense(d.elementFromPoint(px, py)); });
    }, { passive: true });
    d.addEventListener('pointerleave', () => { dx(-100); dy(-100); rx(-100); ry(-100); });
  }

  /* magnetic buttons */
  function magnetic() {
    if (!fine || reduced() || !gsap) return;
    d.addEventListener('pointermove', e => {
      const b = e.target.closest && e.target.closest('[data-magnetic]');
      $$('[data-magnetic].is-mag').forEach(x => { if (x !== b) { x.classList.remove('is-mag'); gsap.to(x, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1, .5)' }); } });
      if (!b) return;
      b.classList.add('is-mag');
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .5, ease: 'power3' });
    }, { passive: true });
  }

  /* word splitting for reveals */
  function splitWords(el) {
    if (el.dataset.split) return;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = d.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span'); w.className = 'w';
            const i = d.createElement('span'); i.textContent = p; w.appendChild(i);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('sr-only')) walk(n);
      });
    };
    walk(el);
    el.dataset.split = '1';
  }

  /* ---------------------------------------------------------------------
     4. HOME CHOREOGRAPHY
     --------------------------------------------------------------------- */
  let heroApi = null;
  const heroState = { progress: 0 };
  function heroUI(p) {
    const sc = smooth(.12, .36, p) + smooth(.46, .7, p);
    const idx = Math.round(sc);
    $$('[data-hero-scent]').forEach(el => el.classList.toggle('is-on', +el.dataset.heroScent === idx));
    const seg = [[0, .36], [.36, .7], [.7, .92]];
    $$('[data-hero-step]').forEach((el, i) => {
      el.classList.toggle('is-on', i === idx);
      el.style.setProperty('--sp', clamp((p - seg[i][0]) / (seg[i][1] - seg[i][0]), 0, 1).toFixed(3));
    });
    const ui = $('.hero__ui'), veil = $('.hero__veil');
    if (ui) ui.style.opacity = String(1 - smooth(.8, .9, p));
    if (veil) veil.style.opacity = String(smooth(.9, 1, p));
  }

  function initHero3D() {
    const sec = $('.hero'), canvas = $('[data-hero-canvas]'), stage = $('[data-hero-stage]');
    if (!sec || heroApi || reduced() || !window.MuseHero) return null;
    try {
      heroApi = window.MuseHero.createHero({ canvas, scents: HERO_SCENTS, onProgress: p => loaderState.set3d(p) });
    } catch (e) { heroApi = null; return null; }
    sec.classList.add('is-gl');
    heroApi.setProgress(heroState.progress);
    if (fine) sec.addEventListener('pointermove', e => heroApi.setPointer(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5), { passive: true });
    let downX = 0, downY = 0, down = false;
    stage.addEventListener('pointerdown', e => { down = true; downX = e.clientX; downY = e.clientY; heroApi.dragStart(e.clientX); });
    addEventListener('pointermove', e => { if (down) heroApi.dragMove(e.clientX); }, { passive: true });
    addEventListener('pointerup', e => {
      if (!down) return;
      down = false; heroApi.dragEnd();
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) heroApi.spray();
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => heroApi.setVisible(e.isIntersecting && !$('[data-view="home"]').hidden)).observe(sec);
    heroApi.ready.then(() => loaderState.set3d(1));
    if (root.classList.contains('is-ready')) heroApi.start();
    return heroApi;
  }

  function renderCollection() {
    const track = $('[data-col-track]');
    if (!track) return;
    track.innerHTML = SIGNATURES.map(p => `
      <article class="ccard">
        <a class="ccard__img" href="#${p.key}" data-cursor="Discover" aria-label="${esc(p.name)}, ${esc(p.mood)}">${img(p.img, '(max-width: 900px) 74vw, 26vw')}<img src="${SRC(p.reveal)}" alt="" aria-hidden="true" loading="lazy"><span class="ccard__no label">No. ${p.no}</span></a>
        <button class="ccard__add" type="button" data-add="${p.key}" aria-label="Add ${esc(p.name)} to bag"><svg aria-hidden="true"><use href="#i-plus"/></svg></button>
        <div class="ccard__meta"><h3 class="ccard__name">${esc(p.name)}</h3><span class="ccard__price">${money(p.price)}</span></div>
        <p class="ccard__mood">${esc(p.mood)}</p>
      </article>`).join('') + `
      <a class="ccard ccard--end" href="#shop" data-cursor="Open"><span class="label">And the discovery set</span><p>See every scent</p><span class="btn btn--line"><span>The collection</span><svg aria-hidden="true"><use href="#i-arrow"/></svg></span></a>`;
  }

  function buildHome() {
    const ctx = gsap.context(() => {
      // hero pin + scroll story
      const sec = $('.hero');
      ST.create({
        trigger: sec, start: 'top top', end: () => `+=${innerHeight * (mobile() ? 2.4 : 3.4)}`,
        pin: '.hero__pin', scrub: true, anticipatePin: 1,
        onUpdate: self => { heroState.progress = self.progress; if (heroApi) heroApi.setProgress(self.progress); heroUI(self.progress); }
      });

      // manifesto: words light up in reading order
      const text = $('[data-words]');
      if (text) {
        if (!text.dataset.split) {
          const walk = node => Array.from(node.childNodes).forEach(n => {
            if (n.nodeType === 3) {
              const frag = d.createDocumentFragment();
              n.textContent.split(/(\s+)/).forEach(p => {
                if (!p) return;
                if (/^\s+$/.test(p)) frag.appendChild(d.createTextNode(' '));
                else { const s = d.createElement('span'); s.className = 'mw'; s.textContent = p; frag.appendChild(s); }
              });
              n.replaceWith(frag);
            }
          });
          walk(text);
          text.dataset.split = '1';
        }
        const tokens = $$('.mw, .pill', text);
        const n = tokens.length;
        ST.create({
          trigger: text, start: 'top 82%', end: 'bottom 42%', scrub: true,
          onUpdate: self => tokens.forEach((t, i) => {
            const o = clamp((self.progress * (n + 5) - i) / 5, 0, 1);
            if (t.classList.contains('pill')) { t.style.width = `${(o * 2.1).toFixed(3)}em`; t.style.opacity = o.toFixed(3); }
            else t.style.setProperty('--o', (.14 + o * .86).toFixed(3));
          })
        });
      }

      // collection: vertical scroll walks sideways through the bottles
      const track = $('[data-col-track]'), bar = $('[data-col-bar]'), count = $('[data-col-i]');
      if (track && !mobile()) {
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const cards = $$('.ccard', track);
        gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: '.collection', start: 'top top', end: () => `+=${dist() + innerHeight * .2}`,
            pin: '.collection__pin', scrub: true, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: self => {
              bar.style.setProperty('--cp', self.progress.toFixed(4));
              count.textContent = String(Math.min(6, Math.round(self.progress * 5) + 1)).padStart(2, '0');
              const vc = innerWidth / 2;
              cards.forEach(c => { const r = c.getBoundingClientRect(); const a = $('.ccard__img', c); if (a) a.style.setProperty('--px', `${((r.left + r.width / 2 - vc) * -.05).toFixed(1)}px`); });
            }
          }
        });
      } else if (track) {
        track.addEventListener('scroll', () => {
          const p = track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth);
          bar.style.setProperty('--cp', p.toFixed(3));
          count.textContent = String(Math.min(6, Math.round(p * 5) + 1)).padStart(2, '0');
        }, { passive: true });
      }

      // notes: each card sinks as the next one slides over it
      const cards = $$('.stack__card');
      cards.forEach((c, i) => {
        gsap.fromTo($('.stack__img img', c), { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 20%', scrub: true } });
        if (i < cards.length - 1) {
          gsap.to(c, { scale: .9, '--shade': .62, ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 95%', end: 'top 20%', scrub: true } });
        }
      });

      // ritual: the photograph opens to fill the screen
      const frame = $('[data-ritual-frame]');
      if (frame) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: '.ritual', start: 'top top', end: () => `+=${innerHeight * 1.6}`, pin: '.ritual__pin', scrub: true, anticipatePin: 1 } });
        tl.fromTo(frame, { clipPath: getComputedStyle(frame).clipPath }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }, 0)
          .fromTo($('img', frame), { scale: 1.3 }, { scale: 1, ease: 'none', duration: 1 }, 0)
          .fromTo(frame, { '--dim': 0 }, { '--dim': 1, ease: 'none', duration: .5 }, .5)
          .from('.ritual__title .line > *', { yPercent: 115, stagger: .08, duration: .4, ease: 'power3.out' }, .45)
          .from('.ritual__copy .label, .ritual__sub', { opacity: 0, y: 20, duration: .3 }, .6);
      }

      reveals($('[data-view="home"]'));
    });
    return ctx;
  }

  /* headings, images and blocks that rise into place */
  function reveals(scope) {
    $$('[data-reveal]', scope).forEach(el => {
      splitWords(el);
      gsap.from($$('.w > span', el), { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.post, .step, .pcard, .act, .mem', scope).forEach(el => {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });
    $$('.post__img img, .step figure img, .act figure img, .contact__info img', scope).forEach(im => {
      gsap.fromTo(im, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: im, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    const meters = $('.meters', scope);
    if (meters) ST.create({ trigger: meters, start: 'top 85%', onEnter: () => meters.classList.add('is-in') });
  }

  function footer() {
    const word = $('.foot__word');
    if (!word || !gsap) return;
    gsap.from($$('span', word), { yPercent: 100, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: word, start: 'top 95%' } });
    reveals($('.foot'));
    if (fine) word.addEventListener('pointermove', e => { const r = word.getBoundingClientRect(); word.style.setProperty('--sheen', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`); });
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
      if (e.target.name === 'memory') { $$('.mem', form).forEach(l => l.classList.toggle('is-checked', $('input', l).checked)); msg.textContent = ''; }
    });
    loud.addEventListener('input', () => loud.setAttribute('aria-valuetext', loudLabel(+loud.value)));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const m = $('input[name="memory"]:checked', form);
      if (!m) { msg.textContent = 'Choose a memory first.'; return; }
      const mem = MEMORIES[m.value], p = P[mem.product];
      chosen = p.key;
      const terms = Object.values(p.notes).map(a => a[0]);
      $('[data-tr-eq]').innerHTML = [`<span><em>${esc(mem.label)}</em></span>`, '<span class="op">=</span>', ...terms.flatMap((t, i) => [`<span>${esc(t)}</span>`].concat(i < terms.length - 1 ? ['<span class="op">+</span>'] : []))].join(' ');
      const im = $('[data-tr-img]');
      im.src = SRC(p.img); im.alt = ALT[p.img];
      $('[data-tr-link]').href = `#${p.key}`;
      $('[data-tr-name]').textContent = p.name;
      $('[data-tr-mood]').textContent = p.line;
      $('[data-tr-wear]').textContent = WEAR[loudLabel(+loud.value)];
      $('[data-tr-add] span').textContent = `Add ${p.name} · ${money(p.price)}`;
      result.hidden = false;
      if (gsap && !reduced()) {
        gsap.fromTo($('.tr__card', result), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out' });
        gsap.from($$('.tr__eq > span, .tr__name, .tr__mood, .tr__wear, .tr__acts', result), { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .06 });
      }
      if (ST) ST.refresh();
      scrollToEl(result);
      result.focus({ preventScroll: true });
    });
    $('[data-tr-add]').addEventListener('click', e => { if (chosen) bagAdd(chosen, defaultMl(chosen), 1, e.currentTarget); });
    $('[data-tr-again]').addEventListener('click', () => {
      result.hidden = true;
      $$('input[name="memory"]', form).forEach(i => { i.checked = false; });
      $$('.mem', form).forEach(l => l.classList.remove('is-checked'));
      if (ST) ST.refresh();
      scrollToEl(form);
    });
  }

  /* ---------------------------------------------------------------------
     5. SHOP, PRODUCT, JOURNAL
     --------------------------------------------------------------------- */
  const pcardHTML = (p, k = 0) => `
    <article class="pcard" style="--k:${k}">
      <a class="pcard__img" href="#${p.key}" data-cursor="View" aria-label="${esc(p.name)}">${img(p.img, '(max-width: 640px) 92vw, (max-width: 1180px) 46vw, 31vw')}<img src="${SRC(p.reveal)}" alt="" aria-hidden="true" loading="lazy"><span class="pcard__no label">No. ${p.no}</span></a>
      <button class="pcard__add" type="button" data-add="${p.key}" aria-label="Add ${esc(p.name)} to bag">Add<svg aria-hidden="true"><use href="#i-plus"/></svg></button>
      <div class="pcard__meta"><h3 class="pcard__name"><a href="#${p.key}">${esc(p.name)}</a></h3><span class="pcard__price">${money(p.price)}</span></div>
      <p class="pcard__mood">${esc(p.mood)}</p>
    </article>`;

  const shopState = { filter: 'all', sort: 'featured' };
  const NUMS = ['No products', 'One product', 'Two products', 'Three products', 'Four products', 'Five products', 'Six products', 'Seven products'];
  function renderShop() {
    const el = $('[data-grid="shop"]');
    let list = PRODUCTS.filter(p => shopState.filter === 'all' || p.family === shopState.filter);
    if (shopState.sort === 'low') list = list.slice().sort((a, b) => a.price - b.price);
    if (shopState.sort === 'high') list = list.slice().sort((a, b) => b.price - a.price);
    el.innerHTML = list.map(pcardHTML).join('');
    $('[data-shop-count]').textContent = NUMS[list.length] || `${list.length} products`;
  }
  function shop() {
    const f = $('[data-filters]');
    f.addEventListener('click', e => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      shopState.filter = b.dataset.filter;
      $$('[data-filter]', f).forEach(x => x.setAttribute('aria-checked', String(x === b)));
      renderShop();
      if (ST) ST.refresh();
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

  let pdpState = { key: 'ambre', ml: 50, qty: 1 };
  function renderProduct(key) {
    const p = P[key];
    pdpState = { key, ml: defaultMl(key), qty: 1 };
    const main = $('[data-pdp-img]'), second = $('[data-pdp-reveal]');
    main.src = SRC(p.img, 1600); main.srcset = `${SRC(p.img)} 800w, ${SRC(p.img, 1600)} 1600w`; main.sizes = '(max-width: 900px) 92vw, 40vw'; main.alt = ALT[p.img];
    second.src = SRC(p.reveal); second.alt = ALT[p.reveal];
    $('[data-pdp-crumb]').textContent = p.name;
    $('[data-pdp-no]').textContent = p.set ? 'The set · six signatures' : `No. ${p.no} · ${p.family}`;
    const name = $('[data-pdp-name]');
    name.textContent = p.name; delete name.dataset.split;
    $('[data-pdp-mood]').textContent = p.mood;
    $('[data-pdp-desc]').textContent = p.desc;
    $('[data-pdp-sizes]').innerHTML = sizesFor(p).map(s => `<label class="size${s.ml === pdpState.ml ? ' is-checked' : ''}"><input type="radio" name="pdp-size" value="${s.ml}"${s.ml === pdpState.ml ? ' checked' : ''}><b>${esc(s.label)}</b><span>${money(s.price)}</span></label>`).join('');
    $('[data-pdp-qty] output').textContent = '1';
    $('[data-pdp-notes]').innerHTML = Object.entries(p.notes).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v.join(', '))}</dd></div>`).join('');
    $('[data-pdp-wear]').textContent = p.wear;
    updatePdpPrice();
    const acts = $('[data-pdp-acts]');
    if (p.set) {
      acts.className = 'acts acts--six';
      acts.innerHTML = SIGNATURES.map(s => `<li class="act"><figure>${img(s.img, '(max-width: 900px) 45vw, 16vw')}</figure><p class="label">No. ${s.no}</p><h3>${esc(s.name)}</h3><p>${esc(s.line)}</p></li>`).join('');
      $('[data-acts-k]').textContent = 'Inside the case';
      $('[data-acts-title]').textContent = 'Six vials.';
    } else {
      acts.className = 'acts';
      acts.innerHTML = p.acts.map(a => `<li class="act"><figure>${img(a[0], '(max-width: 900px) 40vw, 30vw')}</figure><p class="label">${a[1]} note</p><h3>${esc(a[2])}</h3><p>${esc(a[3])}</p></li>`).join('');
      $('[data-acts-k]').textContent = 'How it opens';
      $('[data-acts-title]').textContent = 'Three acts.';
    }
    const ch = $('.character');
    ch.hidden = !p.character;
    if (p.character) {
      const m = $('[data-pdp-meters]');
      m.classList.remove('is-in');
      m.innerHTML = Object.entries(p.character).map(([k, v]) => `<div><dt>${k}</dt><dd><i style="--v:${v / 100}"></i></dd><span>${v}</span></div>`).join('');
    }
    const others = PRODUCTS.filter(x => x.key !== key && !x.set).sort((a, b) => (b.family === p.family) - (a.family === p.family));
    $('[data-grid="related"]').innerHTML = others.slice(0, 3).map(pcardHTML).join('');
    $('[data-buybar-name]').textContent = p.name;
  }
  function updatePdpPrice() {
    const price = priceOf(pdpState.key, pdpState.ml) * pdpState.qty;
    $('[data-pdp-add-t]').textContent = `Add to bag · ${money(price)}`;
    $('[data-buybar-t]').textContent = `Add · ${money(price)}`;
  }
  function pdp() {
    const view = $('[data-view="product"]');
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
    add.addEventListener('click', () => bagAdd(pdpState.key, pdpState.ml, pdpState.qty, $('.pdp__main')));
    $('[data-buybar-add]').addEventListener('click', e => bagAdd(pdpState.key, pdpState.ml, pdpState.qty, e.currentTarget));
    const bar = $('[data-buybar]');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const on = !e.isIntersecting && !view.hidden && e.boundingClientRect.top < 0;
        bar.classList.toggle('is-on', on);
        bar.setAttribute('aria-hidden', String(!on));
        $('[data-buybar-add]').tabIndex = on ? 0 : -1;
      }).observe(add);
    }
  }

  const postHTML = a => `<button class="post" type="button" data-read="${a.key}" data-cursor="Read">
      <figure class="post__img">${img(a.img, '(max-width: 900px) 92vw, 33vw')}</figure>
      <span class="post__k label">${esc(a.cat)} · ${a.mins} min read</span>
      <span class="post__t">${esc(a.title)}</span>
    </button>`;
  function renderPosts() {
    $('[data-posts="teaser"]').innerHTML = ARTICLES.slice(0, 3).map(postHTML).join('');
    $('[data-posts="all"]').innerHTML = ARTICLES.map(postHTML).join('');
  }
  let readerIdx = 0;
  function openReader(key) { readerIdx = Math.max(0, ARTICLES.findIndex(a => a.key === key)); fillReader(); openDialog('reader'); }
  function fillReader() {
    const a = ARTICLES[readerIdx], im = $('[data-reader-img]');
    im.src = SRC(a.img, 1600); im.alt = ALT[a.img];
    $('[data-reader-k]').textContent = `${a.cat} · ${a.mins} min read`;
    $('[data-reader-title]').textContent = a.title;
    $('[data-reader-text]').innerHTML = a.body.map(t => `<p>${esc(t)}</p>`).join('');
    $('[data-reader-next]').textContent = `Next: ${ARTICLES[(readerIdx + 1) % ARTICLES.length].title}`;
  }

  /* ---------------------------------------------------------------------
     6. DIALOGS & SEARCH
     --------------------------------------------------------------------- */
  const modalOpen = () => $$('dialog[open]').length > 0;
  const syncModal = () => { root.classList.toggle('has-modal', modalOpen()); if (lenis) { if (modalOpen()) lenis.stop(); else lenis.start(); } };
  function openDialog(id) {
    const dlg = d.getElementById(id);
    if (!dlg || dlg.open) return;
    islandApi.close();
    const others = $$('dialog[open]').filter(x => x !== dlg);
    const go = () => {
      dlg.classList.remove('is-closing');
      dlg.showModal();
      syncModal();
      if (id === 'search') { const q = $('#q'); q.value = ''; renderSearch(''); setTimeout(() => q.focus(), 40); }
      if (id === 'bag') renderBag();
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
    dlg.addEventListener('animationend', function h(e) { if (e.target === dlg) { dlg.removeEventListener('animationend', h); finish(); } });
    setTimeout(finish, 700);
  }
  function dialogs() {
    $$('dialog').forEach(dlg => {
      dlg.addEventListener('cancel', e => { e.preventDefault(); closeDialog(dlg); });
      dlg.addEventListener('close', syncModal);
      dlg.addEventListener('click', e => { if (e.target === dlg && dlg.id !== 'search') closeDialog(dlg); });
    });
  }

  function renderSearch(q) {
    const list = $('[data-search-results]'), status = $('[data-search-status]');
    const terms = norm(q.trim()).split(/\s+/).filter(Boolean);
    const match = s => terms.every(t => s.includes(t));
    const prods = PRODUCTS.filter(p => !terms.length || match(p.search));
    const arts = terms.length ? ARTICLES.filter(a => match(a.search)) : [];
    const mark = text => {
      let out = esc(text);
      terms.forEach(t => { const i = norm(text).indexOf(t); if (i > -1) { const raw = text.slice(i, i + t.length); out = out.replace(esc(raw), `<mark>${esc(raw)}</mark>`); } });
      return out;
    };
    const total = prods.length + arts.length;
    status.textContent = !terms.length ? 'Everything' : total ? `${total} ${total === 1 ? 'result' : 'results'} for “${q.trim()}”` : `Nothing matches “${q.trim()}” yet. Try amber, jasmine or fresh.`;
    let k = 0;
    list.innerHTML = prods.map(p => `<li><a class="hit" href="#${p.key}" style="--k:${k++}"><img src="${SRC(p.img)}" alt=""><span><b>${mark(p.name)}</b><span>${mark(p.mood)} · ${mark(Object.values(p.notes).flat().slice(0, 4).join(', '))}</span></span><span class="hit__k label">${money(p.price)}</span></a></li>`).join('')
      + arts.map(a => `<li><button class="hit" type="button" data-read="${a.key}" style="--k:${k++}"><img src="${SRC(a.img)}" alt=""><span><b>${mark(a.title)}</b><span>${esc(a.cat)} · ${a.mins} min read</span></span><span class="hit__k label">Story</span></button></li>`).join('');
  }
  function search() {
    const q = $('#q');
    q.addEventListener('input', () => renderSearch(q.value));
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const f = $('[data-search-results] .hit'); if (f) f.click(); }
      if (e.key === 'Escape') { e.preventDefault(); closeDialog($('#search')); }
    });
  }

  /* ---------------------------------------------------------------------
     7. BAG, CHECKOUT, FORMS
     --------------------------------------------------------------------- */
  const FREE = 150;
  const bag = { items: (store.get('muse:bag3', []) || []).filter(i => P[i.key] && i.qty > 0) };
  const bagCount = () => bag.items.reduce((n, i) => n + i.qty, 0);
  const bagSub = () => bag.items.reduce((s, i) => s + priceOf(i.key, i.ml) * i.qty, 0);
  const saveBag = () => store.set('muse:bag3', bag.items);

  function renderBag() {
    const n = bagCount(), sub = bagSub();
    $$('[data-bag-count]').forEach(el => { el.textContent = n; });
    const b = $('.island__bag');
    if (b) b.setAttribute('aria-label', `Bag, ${n} ${n === 1 ? 'item' : 'items'}`);
    const list = $('[data-bag-items]');
    $('[data-bag-empty]').hidden = n > 0; $('[data-bag-foot]').hidden = n === 0; $('[data-bag-ship]').hidden = n === 0; list.hidden = n === 0;
    const left = FREE - sub;
    $('[data-bag-ship-t]').textContent = left > 0 ? `${money(left)} away from free shipping` : 'Shipping is on us.';
    $('[data-bag-ship-bar]').style.setProperty('--v', clamp(sub / FREE, 0, 1).toFixed(3));
    list.innerHTML = bag.items.map((it, idx) => {
      const p = P[it.key], size = sizesFor(p).find(s => s.ml === it.ml) || sizesFor(p)[0];
      return `<li class="line-i"><img src="${SRC(p.img)}" alt="${esc(ALT[p.img])}">
        <div><b>${esc(p.name)}</b><span class="line-i__meta">${esc(size.label)} · ${esc(p.mood)}</span>
          <div class="qty"><button type="button" data-bq="-1" data-i="${idx}" aria-label="One fewer ${esc(p.name)}"><svg aria-hidden="true"><use href="#i-minus"/></svg></button><span>${it.qty}</span><button type="button" data-bq="1" data-i="${idx}" aria-label="One more ${esc(p.name)}"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div></div>
        <div class="line-i__right"><span>${money(size.price * it.qty)}</span><button class="line-i__rm" type="button" data-rm="${idx}">Remove</button></div></li>`;
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
    fly(fromEl, p).then(() => {
      renderBag();
      const b = $('.island__bag');
      if (b) restart(b, 'is-bump');
      const size = sizesFor(p).find(s => s.ml === ml);
      toast(`${esc(p.name)}, ${esc(size ? size.label : '')}, is in your bag.`, { label: 'View bag', fn: () => openDialog('bag') });
    });
  }
  function fly(fromEl, p) {
    const target = $('.island__bag');
    if (reduced() || !gsap || !fromEl || !target) return Promise.resolve();
    const a = fromEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    const el = d.createElement('div');
    el.className = 'flydot';
    el.innerHTML = `<img src="${SRC(p.img)}" alt="">`;
    d.body.appendChild(el);
    gsap.set(el, { x: a.left + a.width / 2 - 23, y: a.top + a.height / 2 - 29, scale: 1.4, rotate: -8 });
    return new Promise(res => {
      const tl = gsap.timeline({ onComplete: () => { el.remove(); res(); } });
      tl.to(el, { x: b.left + b.width / 2 - 23, duration: .9, ease: 'power2.inOut' }, 0)
        .to(el, { y: Math.min(a.top, b.top) - 80, duration: .42, ease: 'power2.out' }, 0)
        .to(el, { y: b.top + b.height / 2 - 29, duration: .48, ease: 'power2.in' }, .42)
        .to(el, { scale: .2, rotate: 12, opacity: .6, duration: .9, ease: 'power2.in' }, 0);
    });
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

  const co = { step: 0, ship: 'standard', email: '' };
  const shipCost = () => (co.ship === 'express' ? 18 : bagSub() >= FREE ? 0 : 8);
  function renderSummary() {
    const n = bagCount();
    $('[data-sum-items]').innerHTML = bag.items.map(it => {
      const p = P[it.key], s = sizesFor(p).find(x => x.ml === it.ml) || sizesFor(p)[0];
      return `<li class="sum__item"><img src="${SRC(p.img)}" alt=""><div><b>${esc(p.name)}</b><span>${esc(s.label)} · ${it.qty} ${it.qty === 1 ? 'piece' : 'pieces'}</span></div><span>${money(s.price * it.qty)}</span></li>`;
    }).join('');
    const sub = bagSub(), sh = n ? shipCost() : 0;
    $('[data-sum-sub]').textContent = money(sub);
    $('[data-sum-ship]').textContent = n ? (sh ? money(sh) : 'Free') : '€0';
    $('[data-sum-total]').textContent = money(sub + sh);
    $('[data-sum-empty]').hidden = n > 0 || co.step === 3;
    $('[data-ship-std]').textContent = sub >= FREE ? 'Free' : '€8';
    $('[data-co-pay]').textContent = `Place order · ${money(sub + sh)}`;
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
    const [f0, f1, f2] = $$('[data-costep]');
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
      $('[data-costep="3"]').focus({ preventScroll: true });
      scrollTop();
    });
    $$('[data-co-back]').forEach(b => b.addEventListener('click', () => coShow(Math.max(0, co.step - 1))));
  }

  function forms() {
    const c = $('[data-contact]');
    c.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('[data-contact-msg]');
      if (!validate(c)) { msg.textContent = 'Please complete the highlighted fields.'; msg.className = 'form__msg is-err'; return; }
      // Connect your form endpoint here (fetch to your inbox service) before going live.
      const name = $('#c-name').value.trim().split(' ')[0];
      msg.textContent = `Thank you, ${name}. We read every note and reply within two working days.`;
      msg.className = 'form__msg is-ok';
      c.reset();
    });
    const f = $('[data-letters]'), lm = $('[data-letters-msg]');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const inp = $('input', f);
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
      // Connect your mailing list provider here before going live.
      lm.textContent = ok ? 'You are on the list. The first letter arrives with the next batch.' : 'That address looks incomplete. Try name@example.com.';
      lm.className = `letters__msg ${ok ? 'is-ok' : 'is-err'}`;
      if (ok) inp.value = '';
    });
    d.addEventListener('click', e => {
      const b = e.target.closest('.acc__item button');
      if (!b) return;
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      b.closest('.acc__item').classList.toggle('is-open', open);
      if (ST) setTimeout(() => ST.refresh(), 650);
    });
  }

  /* ---------------------------------------------------------------------
     8. ROUTER, LOADER, BOOT
     --------------------------------------------------------------------- */
  const VIEWS = ['home', 'shop', 'product', 'house', 'journal', 'contact', 'checkout'];
  const HOME_ANCHORS = ['finder', 'notes', 'collection', 'top'];
  const TITLES = { home: 'MUSE · Maison de parfum', shop: 'Collection · MUSE', house: 'House · MUSE', journal: 'Journal · MUSE', contact: 'Contact · MUSE', checkout: 'Checkout · MUSE' };
  const WORDS = { home: 'MUSE', shop: 'The collection', house: 'The house', journal: 'Journal', contact: 'Say hello', checkout: 'Checkout' };
  let current = null, viewCtx = null, navigating = false;

  const parse = h => {
    h = (h || '').replace(/^#/, '');
    if (!h || h === 'home') return { view: 'home' };
    if (P[h]) return { view: 'product', key: h };
    if (HOME_ANCHORS.includes(h)) return { view: 'home', anchor: h };
    if (VIEWS.includes(h)) return { view: h };
    return { view: 'home' };
  };

  function buildView(view) {
    if (!gsap) return null;
    if (view === 'home') return buildHome();
    return gsap.context(() => reveals($(`.view[data-view="${view}"]`)));
  }

  function show(route) {
    if (viewCtx) { viewCtx.revert(); viewCtx = null; }
    $$('.view').forEach(v => { v.hidden = v.dataset.view !== route.view; });
    if (route.view === 'product') renderProduct(route.key);
    if (route.view === 'checkout') { if (co.step === 3) coShow(0); else renderSummary(); }
    if (route.view === 'shop') renderShop();
    d.title = route.view === 'product' ? `${P[route.key].name} · MUSE` : TITLES[route.view];
    islandApi.current(route);
    current = route;
    if (heroApi) heroApi.setVisible(route.view === 'home');
    viewCtx = buildView(route.view);
    if (ST) ST.refresh();
    islandApi.tone();
  }

  function place(route) {
    if (route.anchor && route.anchor !== 'top') {
      const el = d.getElementById(route.anchor);
      if (el) { if (ST) ST.refresh(); scrollToEl(el, true); }
    } else scrollTop(true);
    $('#app').focus({ preventScroll: true });
  }

  const curtain = {
    el: null, path: null, word: null,
    run(fromY, toY, bulge, ms, ease = t => t) {
      return new Promise(res => {
        if (reduced()) { res(); return; }
        const t0 = performance.now();
        const step = now => {
          const t = Math.min(1, (now - t0) / ms), e = ease(t);
          const y = fromY + (toY - fromY) * e, b = Math.sin(Math.PI * t) * bulge;
          this.path.setAttribute('d', this.mode === 'in' ? `M0 ${y.toFixed(2)}Q50 ${(y - b).toFixed(2)} 100 ${y.toFixed(2)}V100H0Z` : `M0 0H100V${y.toFixed(2)}Q50 ${(y + b).toFixed(2)} 0 ${y.toFixed(2)}Z`);
          if (t < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
    },
    async in(word) {
      this.el.classList.add('is-on');
      this.word.textContent = word;
      this.mode = 'in';
      if (gsap) gsap.set(this.word, { opacity: 0, y: 30 });
      await this.run(100, 0, 22, 700, t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));
      if (gsap) await gsap.to(this.word, { opacity: 1, y: 0, duration: .45, ease: 'expo.out' });
    },
    async out() {
      if (gsap) gsap.to(this.word, { opacity: 0, y: -30, duration: .35, ease: 'power2.in' });
      this.mode = 'out';
      await wait(150);
      await this.run(100, 0, 18, 800, t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2));
      this.el.classList.remove('is-on');
    }
  };

  async function navigate(route, initial) {
    const same = current && current.view === route.view && (route.view !== 'product' || current.key === route.key);
    if (same) {
      islandApi.current(route);
      if (route.anchor && route.anchor !== 'top') scrollToEl(d.getElementById(route.anchor));
      else scrollTop();
      return;
    }
    if (initial || reduced()) { show(route); place(route); return; }
    if (navigating) return;
    navigating = true;
    const word = route.view === 'product' ? P[route.key].name : route.anchor === 'finder' ? 'Find your scent' : WORDS[route.view];
    await curtain.in(word);
    show(route);
    place(route);
    await wait(120);
    await curtain.out();
    navigating = false;
  }

  /* preloader: waits for fonts and the 3D scene, never longer than a few seconds */
  const loaderState = {
    p3d: 0, fonts: 0, shown: 0,
    set3d(p) { this.p3d = Math.max(this.p3d, p); this.paint(); },
    paint() {
      const p = Math.min(1, this.fonts * .3 + this.p3d * .7);
      const bar = $('[data-load-bar]'), n = $('[data-load-n]');
      if (bar) bar.style.setProperty('--p', p.toFixed(3));
      if (n) n.textContent = String(Math.round(p * 100)).padStart(2, '0');
    }
  };
  async function loader() {
    const el = $('.loader');
    const started = performance.now();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(() => { loaderState.fonts = 1; loaderState.paint(); }); else loaderState.fonts = 1;
    if (!root.classList.contains('is-loading') || !el) { start(); return; }
    await Promise.race([new Promise(res => (window.MuseHero ? res() : addEventListener('musehero', res, { once: true }))), wait(3500)]);
    await wait(30);
    const heroReady = heroApi ? heroApi.ready : Promise.resolve();
    await Promise.race([Promise.all([heroReady, d.fonts ? d.fonts.ready : null, wait(1400)]), wait(6000)]);
    loaderState.fonts = 1; loaderState.p3d = 1; loaderState.paint();
    await wait(Math.max(0, 300 - (performance.now() - started)));
    el.classList.add('is-out');
    await wait(350);
    const path = $('[data-load-path]');
    const t0 = performance.now(), ms = 1100;
    start();
    await new Promise(res => {
      const step = now => {
        const t = Math.min(1, (now - t0) / ms), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const y = 100 - e * 100, b = Math.sin(Math.PI * t) * 20;
        path.setAttribute('d', `M0 0H100V${y.toFixed(2)}Q50 ${(y + b).toFixed(2)} 0 ${y.toFixed(2)}Z`);
        if (t < 1) requestAnimationFrame(step); else res();
      };
      requestAnimationFrame(step);
    });
    root.classList.remove('is-loading');
  }
  function start() {
    root.classList.add('is-ready');
    if (heroApi) heroApi.start();
    if (gsap && !reduced() && current && current.view === 'home') {
      gsap.from('.hero__title .line > *', { yPercent: 115, duration: 1.6, ease: 'expo.out', stagger: .12, delay: .5 });
      gsap.from('.hero__sub, .hero__cta, .hero__right, .hero__steps, .hero__kicker', { y: 24, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: .08, delay: .8 });
    }
  }

  function clicks() {
    d.addEventListener('click', e => {
      const t = e.target.closest('a[href^="#"], [data-open], [data-close], [data-add], [data-bq], [data-rm], [data-q-chip], [data-read], [data-reader-next]');
      if (!t) return;
      if (t.matches('[data-open]')) { openDialog(t.dataset.open); return; }
      if (t.matches('[data-close]')) { closeDialog(t.closest('dialog')); return; }
      if (t.matches('[data-add]')) { e.preventDefault(); const card = t.closest('.pcard, .ccard'); bagAdd(t.dataset.add, null, 1, card ? $('img', card) : t); return; }
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
        const key = t.dataset.read, dlg = t.closest('dialog');
        if (dlg && dlg.id !== 'reader') closeDialog(dlg, () => openReader(key)); else openReader(key);
        return;
      }
      const href = t.getAttribute('href');
      if (href === '#app') { e.preventDefault(); $('#app').focus(); return; }
      e.preventDefault();
      const dlg = t.closest('dialog');
      const go = () => { if (location.hash === href) navigate(parse(href)); else { history.pushState(null, '', href); navigate(parse(href)); } };
      if (dlg) closeDialog(dlg, go); else go();
    });
    addEventListener('popstate', () => navigate(parse(location.hash)));
    addEventListener('hashchange', () => navigate(parse(location.hash)));
  }

  function boot() {
    gsap = window.gsap || null;
    ST = window.ScrollTrigger || null;
    if (gsap && ST) gsap.registerPlugin(ST);
    else root.classList.add('no-gsap');
    if (ST) ST.config({ ignoreMobileResize: true });

    renderCollection();
    renderPosts();
    renderBag();
    curtain.el = $('.curtain'); curtain.path = $('[data-curtain-path]'); curtain.word = $('[data-curtain-word]');
    if (gsap) smoothScroll();
    island();
    cursor();
    magnetic();
    translator();
    shop();
    pdp();
    checkout();
    forms();
    search();
    dialogs();
    clicks();
    if (gsap) footer();

    const go3d = () => { initHero3D(); };
    if (window.MuseHero) go3d(); else addEventListener('musehero', go3d, { once: true });

    navigate(parse(location.hash), true);
    // wait a beat for the module (3D) to arrive before deciding the loader
    loader();
    addEventListener('load', () => ST && ST.refresh());
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
