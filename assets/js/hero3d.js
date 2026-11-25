/* =========================================================================
   MUSE · 3D hero
   A real time glass flask (Three.js). Light, liquid, the backdrop word and
   real ingredient photographs are all refracted through the glass.
   Scroll turns the bottle, changes the scent, then dives into the liquid.
   ========================================================================= */
import * as THREE from '../vendor/three.module.min.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- canvas textures ---------- */
function studioEnvironment() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#3a1218'); bg.addColorStop(.5, '#1c080b'); bg.addColorStop(1, '#0b0304');
  g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
  const box = (u, v, w, h, color, blur, alpha = 1) => {
    g.save(); g.filter = `blur(${blur}px)`; g.globalAlpha = alpha; g.fillStyle = color;
    g.beginPath(); if (g.roundRect) g.roundRect(u * 1024 - w / 2, v * 512 - h / 2, w, h, Math.min(w, h) * .2); else g.rect(u * 1024 - w / 2, v * 512 - h / 2, w, h); g.fill(); g.restore();
  };
  box(.62, .46, 54, 300, '#fff4e4', 10);        // right strip
  box(.895, .46, 70, 320, '#ffffff', 12);       // left key strip
  box(.75, .5, 260, 180, '#f3c9a0', 40, .35);   // warm front fill
  box(.75, .06, 900, 70, '#fff0dc', 18, .9);    // top light
  box(.25, .5, 120, 260, '#ff9a6b', 30, .25);   // back warm bounce
  box(.5, .55, 40, 200, '#ffd7b0', 14, .6);
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function wordTexture(word, font) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.textBaseline = 'alphabetic';
  let size = 520;
  g.font = `400 ${size}px ${font}`;
  const spacing = size * .06;
  const widths = Array.from(word).map(ch => g.measureText(ch).width);
  let total = widths.reduce((a, b) => a + b, 0) + spacing * (word.length - 1);
  if (total > 1900) { size *= 1900 / total; g.font = `400 ${size}px ${font}`; }
  const w2 = Array.from(word).map(ch => g.measureText(ch).width);
  const sp = size * .06;
  total = w2.reduce((a, b) => a + b, 0) + sp * (word.length - 1);
  let x = (2048 - total) / 2;
  Array.from(word).forEach((ch, i) => { g.fillText(ch, x, 512 + size * .34); x += w2[i] + sp; });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function labelTexture(name, font) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.textAlign = 'center';
  g.fillStyle = '#f1d9a6';
  g.font = `400 150px ${font}`;
  const letters = 'MUSE'.split('');
  const sp = 46;
  const ws = letters.map(l => g.measureText(l).width);
  let x = 512 - (ws.reduce((a, b) => a + b, 0) + sp * 3) / 2;
  g.textAlign = 'left';
  letters.forEach((l, i) => { g.fillText(l, x, 250); x += ws[i] + sp; });
  g.textAlign = 'center';
  g.font = `500 38px ${font}`;
  if ('letterSpacing' in g) g.letterSpacing = '14px';
  g.fillText(name.toUpperCase(), 512, 340);
  g.font = `400 26px ${font}`;
  if ('letterSpacing' in g) g.letterSpacing = '10px';
  g.fillText('EAU DE PARFUM', 512, 400);
  g.fillRect(442, 288, 140, 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,240,210,1)'); r.addColorStop(.35, 'rgba(255,220,170,.45)'); r.addColorStop(1, 'rgba(255,220,170,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function shadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(0,0,0,.75)'); r.addColorStop(.55, 'rgba(0,0,0,.25)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* ---------- geometry ---------- */
const OUTER = [[0, -1.2], [.46, -1.197], [.66, -1.17], [.76, -1.07], [.8, -.84], [.79, -.46], [.74, -.08], [.64, .24], [.48, .5], [.31, .67], [.2, .76], [.17, .84], [.17, .92]];
function profile(points, n) {
  const curve = new THREE.SplineCurve(points.map(p => new THREE.Vector2(p[0], p[1])));
  return curve.getPoints(n);
}
function radiusAt(pts, y) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if ((y >= a.y && y <= b.y) || (y <= a.y && y >= b.y)) { const t = (y - a.y) / ((b.y - a.y) || 1); return lerp(a.x, b.x, t); }
  }
  return 0;
}

/* =========================================================================
   createHero
   ========================================================================= */
export function createHero({ canvas, scents, font = '"Bodoni Moda", Didot, Georgia, serif', onProgress }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.35 : 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x1a0508, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
  camera.position.set(0, .15, 7.2);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = studioEnvironment();
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();

  const key = new THREE.DirectionalLight(0xfff0dc, 2.2);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb48a, 1.6);
  rim.position.set(4, 2, -3);
  scene.add(rim);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (url, loaded, total) => { if (onProgress) onProgress(loaded / total); };
  const loader = new THREE.TextureLoader(manager);

  /* ----- backdrop: an opaque plane, so the glass can refract it ----- */
  const words = scents.map(s => wordTexture(s.word, font));
  const bgCols = scents.map(s => new THREE.Color(s.bg));
  const glowCols = scents.map(s => new THREE.Color(s.glow));
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 12),
    new THREE.ShaderMaterial({
      toneMapped: false,
      uniforms: {
        t0: { value: words[0] }, t1: { value: words[1] }, t2: { value: words[2] },
        w: { value: new THREE.Vector3(1, 0, 0) },
        uBg: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() }, uInk: { value: new THREE.Color('#f4e6d2') },
        uIntro: { value: 0 }, uTime: { value: 0 }, uWordY: { value: .2 }
      },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D t0; uniform sampler2D t1; uniform sampler2D t2;
        uniform vec3 w; uniform vec3 uBg; uniform vec3 uGlow; uniform vec3 uInk; uniform float uIntro; uniform float uTime; uniform float uWordY;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){
          vec2 p = vUv - vec2(.5, .47);
          p.x *= 22. / 12.;
          float d = length(p);
          vec3 col = mix(uGlow, uBg, smoothstep(.02, .62, d));
          col *= 1. - smoothstep(.55, 1.1, d) * .55;
          // word: plane spans 22 x 12; the word band sits across the middle
          vec2 wuv = vec2((vUv.x - .5) * (22. / 9.4) + .5, (vUv.y - .5) * (12. / 4.7) + .5 - uWordY);
          float a = 0.;
          if (wuv.x > 0. && wuv.x < 1. && wuv.y > 0. && wuv.y < 1.) {
            a = texture2D(t0, wuv).a * w.x + texture2D(t1, wuv).a * w.y + texture2D(t2, wuv).a * w.z;
          }
          col = mix(col, uInk, a * .92 * uIntro);
          col += (hash(vUv * 900. + uTime) - .5) * .025;
          gl_FragColor = vec4(col, 1.);
          #include <colorspace_fragment>
        }`
    })
  );
  backdrop.position.set(0, .1, -3.2);
  scene.add(backdrop);

  /* ----- the flask ----- */
  const bottle = new THREE.Group();
  scene.add(bottle);
  const body = new THREE.Group();
  body.scale.set(1, 1, .78);
  bottle.add(body);

  const outerPts = profile(OUTER, 110);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: .02,
    transmission: 1, thickness: 1.25, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: .03,
    attenuationColor: new THREE.Color('#fff4ea'), attenuationDistance: 3,
    specularIntensity: 1, envMapIntensity: 1.9
  });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 160), glassMat);
  body.add(glass);

  // liquid: an opaque glowing core, so the glass refracts it like perfume
  const FILL = .44, BASE = -.97, T = .13;
  const liqPts = [new THREE.Vector2(0, 0)];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const y = lerp(BASE, FILL, i / steps);
    liqPts.push(new THREE.Vector2(Math.max(.02, radiusAt(outerPts, y) - T), y - BASE));
  }
  liqPts.push(new THREE.Vector2(0, FILL - BASE));
  const liqMat = new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: { uDeep: { value: new THREE.Color() }, uBright: { value: new THREE.Color() }, uTime: { value: 0 }, uH: { value: FILL - BASE } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main(){
        vP = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      uniform vec3 uDeep; uniform vec3 uBright; uniform float uTime; uniform float uH;
      void main(){
        float ndv = clamp(abs(dot(normalize(vN), normalize(vV))), 0., 1.);
        float core = pow(ndv, 2.4);
        float h = clamp(vP.y / uH, 0., 1.);
        vec3 col = mix(uDeep, uBright, core * (.3 + .55 * h));
        float caustic = sin(vP.y * 18. + uTime * 1.1 + sin(vP.x * 7. + vP.z * 5. + uTime * .7) * 2.6) * .5 + .5;
        col += uBright * pow(caustic, 10.) * .05 * core;
        col *= .68 + .4 * h;
        float rim = pow(1. - ndv, 2.2);
        col = mix(col, uDeep * .45, rim * .75);
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`
  });
  const liquid = new THREE.Mesh(new THREE.LatheGeometry(liqPts, 120), liqMat);
  liquid.position.y = BASE;
  body.add(liquid);

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xe0bd78, metalness: 1, roughness: .16, clearcoat: .7, clearcoatRoughness: .15, envMapIntensity: 1.9 });
  const goldDark = new THREE.MeshPhysicalMaterial({ color: 0x8a6430, metalness: 1, roughness: .3, envMapIntensity: 1.3 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.205, .215, .12, 96), gold);
  collar.position.y = .93;
  bottle.add(collar);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.235, .235, .82, 128, 1), gold);
  cap.position.y = 1.4;
  bottle.add(cap);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(.21, .235, .035, 128), gold);
  capTop.position.y = 1.828;
  bottle.add(capTop);
  [1.02, 1.06].forEach(y => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(.237, .006, 10, 128), goldDark);
    r.rotation.x = Math.PI / 2; r.position.y = y;
    bottle.add(r);
  });

  const labels = scents.map(s => labelTexture(s.name, font));
  const labelMat = new THREE.MeshPhysicalMaterial({ map: labels[0], transparent: true, metalness: .55, roughness: .3, envMapIntensity: 1.2, depthWrite: false });
  const label = new THREE.Mesh(new THREE.CylinderGeometry(.807, .807, .5, 96, 1, true, -.66, 1.32), labelMat);
  label.position.y = -.62;
  body.add(label);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: .85 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.22;
  bottle.add(shadow);

  /* ----- photographs floating in depth (opaque rounded panes, so they refract) ----- */
  function paneGeometry(r = .06) {
    const sh = new THREE.Shape();
    const x = -.5, y = -.5, w = 1, h = 1;
    sh.moveTo(x + r, y); sh.lineTo(x + w - r, y); sh.quadraticCurveTo(x + w, y, x + w, y + r);
    sh.lineTo(x + w, y + h - r); sh.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    sh.lineTo(x + r, y + h); sh.quadraticCurveTo(x, y + h, x, y + h - r);
    sh.lineTo(x, y + r); sh.quadraticCurveTo(x, y, x + r, y);
    const g = new THREE.ShapeGeometry(sh, 8);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) + .5, p.getY(i) + .5);
    return g;
  }
  const SLOTS = [
    { p: [-2.6, .55, -2.0], s: 1.15, r: .26 },
    { p: [2.7, -.55, -1.5], s: 1.05, r: -.3 },
    { p: [1.75, 1.4, -2.8], s: .8, r: -.14 }
  ];
  const photoGroups = scents.map((s, si) => {
    const g = new THREE.Group();
    scene.add(g);
    s.photos.forEach((url, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const m = new THREE.Mesh(paneGeometry(), mat);
      const slot = SLOTS[i];
      m.userData = { slot, aspect: .8, phase: si * 2 + i * 1.3 };
      loader.load(url, tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        // crop the photograph to the pane (cover)
        const ia = tex.image.width / tex.image.height, pa = i === 2 ? 1 : .78;
        if (ia > pa) { tex.repeat.set(pa / ia, 1); tex.offset.set((1 - pa / ia) / 2, 0); } else { tex.repeat.set(1, ia / pa); tex.offset.set(0, (1 - ia / pa) / 2); }
        mat.map = tex; mat.needsUpdate = true;
        m.userData.aspect = pa;
      });
      g.add(m);
    });
    return g;
  });

  /* ----- dust and spray ----- */
  const DUST = small ? 160 : 320;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(DUST * 3), ds = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) { dp[i * 3] = (Math.random() - .5) * 9; dp[i * 3 + 1] = (Math.random() - .5) * 5; dp[i * 3 + 2] = (Math.random() - .5) * 4 - .5; ds[i] = Math.random(); }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dot = dotTexture();
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .05, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55, color: 0xffd9a0 }));
  scene.add(dust);

  const SPRAY = 260;
  const sprayGeo = new THREE.BufferGeometry();
  const sp = new Float32Array(SPRAY * 3), sv = new Float32Array(SPRAY * 3), sl = new Float32Array(SPRAY);
  sprayGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sprayMat = new THREE.PointsMaterial({ size: .09, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: 0xfff2dc });
  const spray = new THREE.Points(sprayGeo, sprayMat);
  scene.add(spray);
  let sprayT = 99;

  /* ----- state ----- */
  const st = {
    progress: 0, intro: 0, introStart: 0, started: false,
    mx: 0, my: 0, cmx: 0, cmy: 0,
    spin: 0, spinV: 0, dragging: false, lastX: 0,
    visible: true, running: false, t0: performance.now()
  };
  const liq = new THREE.Color(), glow = new THREE.Color(), bg = new THREE.Color(), gl = new THREE.Color(), tmp = new THREE.Color();
  const deepCols = scents.map(s => new THREE.Color(s.deep));
  const brightCols = scents.map(s => new THREE.Color(s.bright));
  let labelIndex = 0;

  function weights(sc) {
    return [Math.max(0, 1 - Math.abs(sc - 0)), Math.max(0, 1 - Math.abs(sc - 1)), Math.max(0, 1 - Math.abs(sc - 2))];
  }
  const mixCols = (out, arr, w) => { out.setRGB(0, 0, 0); arr.forEach((c, i) => { tmp.copy(c).multiplyScalar(w[i]); out.r += tmp.r; out.g += tmp.g; out.b += tmp.b; }); return out; };

  let aspect = 1;
  function resize() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect < .8 ? 44 : 30;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  function frame(now) {
    if (!st.running) return;
    requestAnimationFrame(frame);
    const t = (now - st.t0) / 1000;
    const p = st.progress;
    if (st.started) st.intro = Math.min(1, (now - st.introStart) / 2800);
    const ii = easeOutExpo(st.intro);

    // scent from scroll: holds, then turns
    const sc = smooth(.12, .36, p) + smooth(.46, .7, p);
    const w = weights(sc);
    const dive = smooth(.8, 1, p);
    mixCols(liqMat.uniforms.uDeep.value, deepCols, w);
    mixCols(liqMat.uniforms.uBright.value, brightCols, w);
    liqMat.uniforms.uTime.value = t;
    mixCols(bg, bgCols, w);
    mixCols(glow, glowCols, w);
    const u = backdrop.material.uniforms;
    u.uBg.value.copy(bg); u.uGlow.value.copy(glow);
    u.w.value.set(w[0], w[1], w[2]);
    u.uIntro.value = smooth(.25, 1, st.intro);
    u.uTime.value = t;
    const li = Math.round(sc);
    if (li !== labelIndex) { labelIndex = li; labelMat.map = labels[li]; labelMat.needsUpdate = true; }

    // pointer and drag
    st.cmx = lerp(st.cmx, st.mx, .06); st.cmy = lerp(st.cmy, st.my, .06);
    if (!st.dragging) { st.spin += st.spinV; st.spinV *= .94; }
    const idle = .12 * Math.sin(t * .35);
    bottle.rotation.y = idle + st.cmx * .45 + st.spin + sc * Math.PI * .66 + (1 - ii) * -2.4;
    bottle.rotation.x = st.cmy * .12;
    bottle.rotation.z = Math.sin(t * .5) * .015 + st.cmx * -.03;
    const narrow = aspect < .8;
    bottle.scale.setScalar(narrow ? .76 : 1);
    bottle.position.y = lerp(-3.6, narrow ? .92 : -.26, ii) + Math.sin(t * .8) * .03;
    bottle.position.x = aspect < .8 ? 0 : lerp(0, .0, 0);
    liquid.scale.y = lerp(.04, 1, smooth(.15, .85, st.intro));

    // photographs
    const kx = aspect < .8 ? .42 : Math.min(1, aspect / 1.6);
    photoGroups.forEach((g, gi) => {
      const vis = smooth(.15, .85, w[gi]) * smooth(.35, 1, st.intro) * (1 - dive);
      g.children.forEach((m, i) => {
        const { slot, aspect: a, phase } = m.userData;
        const k = vis;
        const s = slot.s * (aspect < .8 ? .7 : 1);
        m.scale.set(Math.max(.0001, s * a * k), Math.max(.0001, s * k), 1);
        const yy = aspect < .8 ? slot.p[1] * 1.6 + (i === 1 ? -.6 : .4) : slot.p[1];
        m.position.set(slot.p[0] * kx + st.cmx * (.25 + i * .1), yy + Math.sin(t * .6 + phase) * .08 + (1 - k) * -.6 + st.cmy * -.12, slot.p[2] - (1 - k) * 1.5);
        m.rotation.set(Math.sin(t * .4 + phase) * .05, slot.r + st.cmx * .15, Math.sin(t * .3 + phase) * .03);
        m.visible = k > .002;
      });
    });

    // dust
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < DUST; i++) { arr[i * 3 + 1] += .0015 + ds[i] * .002; if (arr[i * 3 + 1] > 2.6) arr[i * 3 + 1] = -2.6; }
    dustGeo.attributes.position.needsUpdate = true;
    dust.material.opacity = .55 * st.intro;

    // spray
    if (sprayT < 2.2) {
      sprayT += 1 / 60;
      const a = sprayGeo.attributes.position.array;
      for (let i = 0; i < SPRAY; i++) {
        if (sprayT < sl[i]) continue;
        a[i * 3] += sv[i * 3] * .016; a[i * 3 + 1] += sv[i * 3 + 1] * .016; a[i * 3 + 2] += sv[i * 3 + 2] * .016;
        sv[i * 3] *= .985; sv[i * 3 + 1] = sv[i * 3 + 1] * .985 + .004; sv[i * 3 + 2] *= .985;
      }
      sprayGeo.attributes.position.needsUpdate = true;
      sprayMat.opacity = Math.max(0, 1 - sprayT / 2.2) * .9;
    }

    // camera: gentle parallax, then a dive into the liquid
    const de = easeInOut(dive);
    camera.position.x = st.cmx * .35 * (1 - de);
    camera.position.y = lerp(.15 + st.cmy * -.2, -.15, de);
    camera.position.z = lerp(aspect < .8 ? 9.4 : 7.2, .55, de);
    camera.lookAt(0, lerp(.1, -.2, de), 0);

    renderer.render(scene, camera);
  }

  function run() { if (!st.running && st.visible) { st.running = true; requestAnimationFrame(frame); } }

  const api = {
    start() { st.started = true; st.introStart = performance.now(); run(); },
    setProgress(p) { st.progress = p; },
    setPointer(x, y) { st.mx = x; st.my = y; },
    setVisible(v) { st.visible = v; if (v) run(); else st.running = false; },
    dragStart(x) { st.dragging = true; st.lastX = x; },
    dragMove(x) { if (!st.dragging) return; const dx = x - st.lastX; st.lastX = x; st.spin += dx * .008; st.spinV = dx * .008; },
    dragEnd() { st.dragging = false; },
    spray() {
      sprayT = 0;
      const a = sprayGeo.attributes.position.array;
      const top = bottle.position.y + 1.86;
      for (let i = 0; i < SPRAY; i++) {
        a[i * 3] = (Math.random() - .5) * .1; a[i * 3 + 1] = top; a[i * 3 + 2] = .1;
        const ang = (Math.random() - .5) * 1.2, sp = 1.4 + Math.random() * 2.4;
        sv[i * 3] = Math.sin(ang) * sp * .9; sv[i * 3 + 1] = .4 + Math.random() * 1.2; sv[i * 3 + 2] = Math.cos(ang) * sp * .5;
        sl[i] = Math.random() * .25;
      }
      sprayGeo.attributes.position.needsUpdate = true;
      st.spinV += .04;
    },
    renderOnce() { st.running = true; frame(performance.now()); st.running = false; },
    ready: new Promise(res => { manager.onLoad = res; })
  };
  return api;
}
