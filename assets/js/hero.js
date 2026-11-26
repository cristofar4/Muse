/* =========================================================================
   MUSE · hero
   A heavy glass flacon rendered in real time (Three.js). Scrolling lifts the
   cap away, presses the atomiser and releases the scent as real fluid vapour
   (smoke.js). Also renders the product packshots used across the store.
   ========================================================================= */
import * as THREE from '../vendor/three.module.min.js';
import { createSmoke } from './smoke.js';

const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const FONT = '"Bodoni Moda", Didot, "Bodoni 72", Georgia, serif';

/* ---------- geometry helpers ---------- */
function smoothGeometry(geo, tol = 1e-4) {
  const pos = geo.attributes.position;
  const map = new Map(), verts = [], index = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = `${Math.round(x / tol)},${Math.round(y / tol)},${Math.round(z / tol)}`;
    let id = map.get(k);
    if (id === undefined) { id = verts.length / 3; map.set(k, id); verts.push(x, y, z); }
    index.push(id);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  geo.dispose();
  return g;
}
function rrect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
/** a rounded block standing on y = 0 */
function block(w, d, h, r, bevel, segs = 6) {
  const g = new THREE.ExtrudeGeometry(rrect(w - 2 * bevel, d - 2 * bevel, Math.max(.004, r - bevel)), {
    depth: h - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, curveSegments: 16
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return smoothGeometry(g);
}
const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg);

/* ---------- canvas textures ---------- */
function studio(kind) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const strip = (u, v, w, h, col, blur, a = 1) => {
    g.save(); g.filter = `blur(${blur}px)`; g.globalAlpha = a; g.fillStyle = col;
    g.fillRect(u * 1024 - w / 2, v * 512 - h / 2, w, h); g.restore();
  };
  if (kind === 'dark') {
    g.fillStyle = '#040303'; g.fillRect(0, 0, 1024, 512);
    strip(.12, .5, 40, 330, '#ffffff', 6);
    strip(.38, .48, 26, 300, '#fff3e2', 5, .9);
    strip(.53, .5, 34, 340, '#ffffff', 7);
    strip(.88, .5, 34, 300, '#ffe9cc', 6, .8);
    strip(.5, .05, 1024, 46, '#fff6ea', 14, .7);
    strip(.75, .55, 220, 120, '#ffb36b', 50, .18);
  } else {
    const bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(.5, '#f3efe9'); bg.addColorStop(1, '#d9d2c8');
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    strip(.375, .5, 46, 360, '#14110f', 10);
    strip(.625, .5, 70, 360, '#14110f', 12);
    strip(.125, .5, 30, 300, '#2a2420', 10, .8);
    strip(.875, .5, 30, 300, '#2a2420', 10, .8);
    strip(.5, .04, 1024, 50, '#ffffff', 12);
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function labelCanvas(scent, font) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 640;
  const draw = () => {
    const g = c.getContext('2d');
    g.clearRect(0, 0, 1024, 640);
    g.fillStyle = '#ecd6a6';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const word = 'MUSE';
    g.font = `400 168px ${font}`;
    const sp = 40, ws = Array.from(word).map(ch => g.measureText(ch).width);
    let x = 512 - (ws.reduce((a, b) => a + b, 0) + sp * (word.length - 1)) / 2;
    g.textAlign = 'left';
    Array.from(word).forEach((ch, i) => { g.fillText(ch, x, 300); x += ws[i] + sp; });
    g.textAlign = 'center';
    g.fillRect(452, 352, 120, 2);
    if ('letterSpacing' in g) g.letterSpacing = '16px';
    g.font = `500 44px ${font}`;
    g.fillText(scent.name.toUpperCase(), 520, 430);
    if ('letterSpacing' in g) g.letterSpacing = '11px';
    g.font = `400 28px ${font}`;
    g.fillText('EAU DE PARFUM', 517, 494);
    g.fillText(scent.volume || '50 ML', 517, 548);
  };
  draw();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.redraw = () => { draw(); t.needsUpdate = true; };
  return t;
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,248,236,1)'); r.addColorStop(.4, 'rgba(255,244,228,.4)'); r.addColorStop(1, 'rgba(255,244,228,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- materials ---------- */
function liquidMaterial(deep, bright, H, half) {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: { uDeep: { value: new THREE.Color(deep) }, uBright: { value: new THREE.Color(bright) }, uTime: { value: 0 }, uH: { value: H }, uHalf: { value: new THREE.Vector2(half[0], half[1]) } },
    vertexShader: `
      varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec3 vON;
      void main(){
        vP = position; vON = normal;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vP; varying vec3 vN; varying vec3 vV; varying vec3 vON;
      uniform vec3 uDeep; uniform vec3 uBright; uniform float uTime; uniform float uH; uniform vec2 uHalf;
      void main(){
        float h = clamp(vP.y / uH, 0., 1.);
        float edge = pow(max(abs(vP.x) / uHalf.x, abs(vP.z) / uHalf.y), 5.);
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        vec3 col = mix(uBright, uDeep, clamp(.12 + .5 * h + .5 * edge + (1. - ndv) * .35, 0., 1.));
        float band = sin(vP.y * 9. + vP.x * 2.5 + uTime * .7 + sin(vP.x * 5. - uTime * .45) * 1.6) * .5 + .5;
        col += uBright * pow(band, 9.) * .12 * (1. - edge);
        col += uBright * smoothstep(.3, 0., h) * .28 * (1. - edge);
        if (vON.y > .9) col = mix(col, uBright * 1.1, .5);
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`
  });
}

/* the floor carries the light pool, the contact shadows and the coloured caustic
   that light makes after passing through tinted glass. Opaque, so glass refracts it. */
function floorMaterial(kind, bright) {
  const dark = kind === 'dark';
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uBase: { value: new THREE.Color(dark ? '#060505' : '#e6e0d7') },
      uPool: { value: new THREE.Color(dark ? '#2b221b' : '#f1ece5') },
      uTint: { value: new THREE.Color(bright) },
      uTintK: { value: dark ? .55 : .42 },
      uShadowK: { value: dark ? .9 : .55 },
      uBottle: { value: new THREE.Vector2(0, 0) },
      uSize: { value: new THREE.Vector2(.7, .44) },
      uCap: { value: new THREE.Vector3(0, 0, 9) },
      uIntro: { value: 1 },
      uAngle: { value: 0 }
    },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `
      varying vec3 vW;
      uniform vec3 uBase; uniform vec3 uPool; uniform vec3 uTint; uniform float uTintK; uniform float uShadowK;
      uniform vec2 uBottle; uniform vec2 uSize; uniform vec3 uCap; uniform float uIntro; uniform float uAngle;
      float box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
      void main(){
        vec2 p0 = vW.xz - uBottle;
        float ca0 = cos(uAngle), sa0 = sin(uAngle);
        vec2 p = vec2(ca0 * p0.x - sa0 * p0.y, sa0 * p0.x + ca0 * p0.y);
        float pool = exp(-dot(p * vec2(.32, .55), p * vec2(.32, .55)) * 1.4);
        vec3 col = mix(uBase, uPool, pool * uIntro);
        // contact shadow
        float d = box(p, uSize, .14);
        float sh = (1. - smoothstep(-.05, .55, d)) * .55 + (1. - smoothstep(-.02, .1, d)) * .45;
        col *= 1. - sh * uShadowK;
        // caustic: tinted light thrown forward through the liquid
        vec2 c = (p - vec2(-.16, .78)) / vec2(.62, .36);
        float ca = exp(-dot(c, c) * 1.6);
        float ring = exp(-pow(length(c) - .55, 2.) * 22.) * .5;
        col += uTint * (ca * .8 + ring) * uTintK * uIntro;
        // cap shadow, fading as the cap lifts away
        if (uCap.z < 4.) {
          float dc = box(vW.xz - uCap.xy, vec2(.31), .1);
          float k = 1. - smoothstep(0., 1.4, uCap.z);
          col *= 1. - (1. - smoothstep(-.03, .4 + uCap.z * .4, dc)) * .6 * k * uShadowK;
        }
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`
  });
}

function backdropMaterial(kind, bright) {
  const dark = kind === 'dark';
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uA: { value: new THREE.Color(dark ? '#130f0c' : '#f2eee8') },
      uB: { value: new THREE.Color(dark ? '#060505' : '#e2dbd1') },
      uTint: { value: new THREE.Color(bright) },
      uCenter: { value: new THREE.Vector2(.5, .47) },
      uIntro: { value: 1 }, uTime: { value: 0 }, uDark: { value: dark ? 1 : 0 }
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uA; uniform vec3 uB; uniform vec3 uTint; uniform vec2 uCenter; uniform float uIntro; uniform float uTime; uniform float uDark;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 p = (vUv - uCenter) * vec2(1.9, 1.);
        float d = length(p);
        vec3 col;
        if (uDark > .5) {
          col = mix(uA + uTint * .035, uB, smoothstep(.0, .5, d));
          col = mix(uB, col, smoothstep(.3, .52, vUv.y) * uIntro);
        } else {
          col = mix(uA, uB, clamp(d * .9, 0., 1.));
        }
        col += (hash(vUv * 1200. + uTime) - .5) * (uDark > .5 ? .018 : .006);
        gl_FragColor = vec4(col, 1.);
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- the flacon ---------- */
const DIM = { W: 1.36, D: .84, H: 2, R: .19, base: -1 };
function buildBottle(scent, font) {
  const g = new THREE.Group();
  const { W, D, H, R, base } = DIM;

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: .035,
    transmission: 1, thickness: 1.15, ior: 1.52,
    clearcoat: 1, clearcoatRoughness: .02,
    specularIntensity: 1, envMapIntensity: 1.5,
    attenuationColor: new THREE.Color('#f6fbf8'), attenuationDistance: 4
  });
  const glass = new THREE.Mesh(block(W, D, H, R, .075, 7), glassMat);
  glass.position.y = base;
  g.add(glass);

  const wall = .12, floorT = .32, fill = .8;
  const Wl = W - 2 * wall, Dl = D - 2 * wall, Hl = (H - floorT - .14) * fill;
  const liqMat = liquidMaterial(scent.deep, scent.bright, Hl, [Wl / 2, Dl / 2]);
  const liquid = new THREE.Mesh(block(Wl, Dl, Hl, .09, .035, 4), liqMat);
  liquid.position.y = base + floorT;
  g.add(liquid);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.18, .19, .1, 64), glassMat);
  neck.position.y = base + H + .05;
  g.add(neck);

  const gold = new THREE.MeshPhysicalMaterial({ color: 0xdcbb7f, metalness: 1, roughness: .2, clearcoat: .6, clearcoatRoughness: .12, envMapIntensity: 1.6 });
  const goldSoft = new THREE.MeshPhysicalMaterial({ color: 0xc9a66b, metalness: 1, roughness: .38, envMapIntensity: 1.3 });
  const top = base + H;

  const collar = new THREE.Mesh(lathe([[0, 0], [.2, 0], [.235, .008], [.25, .03], [.25, .13], [.238, .152], [.215, .162], [.06, .162], [0, .162]]), gold);
  collar.position.y = top + .06;
  g.add(collar);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .09, 32), goldSoft);
  stem.position.y = top + .06 + .162 + .045;
  g.add(stem);

  const actuator = new THREE.Group();
  actuator.position.y = top + .06 + .162 + .07;
  g.add(actuator);
  const act = new THREE.Mesh(lathe([[0, 0], [.145, 0], [.155, .008], [.158, .022], [.158, .17], [.152, .19], [.135, .2], [.08, .197], [0, .19]]), gold);
  actuator.add(act);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(.024, 32), new THREE.MeshBasicMaterial({ color: 0x0b0806 }));
  hole.position.set(-.1592, .11, 0);
  hole.rotation.y = -Math.PI / 2;
  actuator.add(hole);
  const nozzleLocal = new THREE.Vector3(-.17, .11, 0);

  // cap: a heavy block of brushed gold
  const capH = .74, capW = .62;
  const cap = new THREE.Group();
  const capMesh = new THREE.Mesh(block(capW, capW, capH, .11, .045, 6), gold);
  cap.add(capMesh);
  const capLine = new THREE.Mesh(block(capW + .006, capW + .006, .012, .11, .004, 2), goldSoft);
  capLine.position.y = .1;
  cap.add(capLine);
  cap.position.y = top;
  g.add(cap);

  // gold foil print on the front face
  const labelTex = labelCanvas(scent, font);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(.96, .6),
    new THREE.MeshBasicMaterial({ map: labelTex, transparent: true, color: 0xfff1d6, depthWrite: false })
  );
  label.position.set(0, base + .78, D / 2 + .002);
  g.add(label);

  return { group: g, glass, glassMat, liquid, liqMat, cap, capH, actuator, nozzleLocal, labelTex, gold };
}

function capFlight(t, narrow) {
  // lifts, arcs over and lands standing on the floor behind the bottle
  const A = new THREE.Vector3(0, 1.12, 0), B = new THREE.Vector3(.5, 3.1, -.3), C = narrow ? new THREE.Vector3(.86, -1, -1.25) : new THREE.Vector3(1.34, -1, -.66);
  const u = 1 - t;
  return new THREE.Vector3(
    u * u * A.x + 2 * u * t * B.x + t * t * C.x,
    u * u * A.y + 2 * u * t * B.y + t * t * C.y,
    u * u * A.z + 2 * u * t * B.z + t * t * C.z
  );
}

/* =========================================================================
   createHero
   ========================================================================= */
export function createHero({ glCanvas, smokeCanvas, scent, font = FONT, small = false, onProgress }) {
  const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.4 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x050404, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 80);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = studio('dark');
  scene.environment = pmrem.fromEquirectangular(env).texture;
  env.dispose();

  const key = new THREE.DirectionalLight(0xfff1e0, 2.4);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const sweep = new THREE.DirectionalLight(0xffffff, 0);
  scene.add(sweep);

  const rig = new THREE.Group();
  scene.add(rig);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), backdropMaterial('dark', scent.bright));
  backdrop.position.set(0, 3, -7);
  rig.add(backdrop);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), floorMaterial('dark', scent.bright));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, DIM.base, 4);
  rig.add(floor);

  const B = buildBottle(scent, font);
  const turn = new THREE.Group();
  turn.add(B.group);
  rig.add(turn);
  // the cap flies in rig space, not bottle space
  B.group.remove(B.cap);
  rig.add(B.cap);

  if (document.fonts && document.fonts.load) document.fonts.load(`400 120px ${font}`).then(() => B.labelTex.redraw()).catch(() => {});

  /* fine droplets that sparkle in the light of the spray */
  const N = 220;
  const dropGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(N * 3), dv = new Float32Array(N * 3), dl = new Float32Array(N);
  dropGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dropMat = new THREE.PointsMaterial({ size: .035, map: dotTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: 0xfff4e6 });
  const drops = new THREE.Points(dropGeo, dropMat);
  drops.frustumCulled = false;
  rig.add(drops);

  /* vapour */
  let smoke = null;
  try {
    smoke = smokeCanvas ? createSmoke(smokeCanvas, small
      ? { simRes: 96, dyeRes: 512, iterations: 14, dpr: 1.25 }
      : { simRes: 128, dyeRes: 896, iterations: 20, dpr: 1.5 }) : null;
  } catch (e) { smoke = null; }
  const tint = new THREE.Color(scent.bright);
  const vapour = [.94 * .82 + tint.r * .18, .92 * .82 + tint.g * .18, .89 * .82 + tint.b * .18];
  const mist = [1, .985, .96];

  const st = {
    progress: 0, intro: 0, introStart: 0, started: false, visible: true, running: false,
    mx: 0, my: 0, cmx: 0, cmy: 0, t0: performance.now(), last: performance.now(),
    sprayT: 9, armed: true, pressT: 9, glow: 0, aspect: 1
  };

  function resize() {
    const w = glCanvas.clientWidth || innerWidth, h = glCanvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    st.aspect = w / h;
    camera.aspect = st.aspect;
    camera.fov = st.aspect < .8 ? 34 : 30;
    camera.updateProjectionMatrix();
    if (smoke) smoke.resize();
  }
  resize();
  addEventListener('resize', resize);

  const nozzleW = new THREE.Vector3(), aheadW = new THREE.Vector3(), tmp = new THREE.Vector3();
  function nozzleScreen() {
    B.actuator.updateWorldMatrix(true, false);
    nozzleW.copy(B.nozzleLocal).applyMatrix4(B.actuator.matrixWorld);
    aheadW.copy(B.nozzleLocal).add(tmp.set(-.5, 0, 0)).applyMatrix4(B.actuator.matrixWorld);
    const a = nozzleW.clone().project(camera), b = aheadW.clone().project(camera);
    const x = (a.x + 1) / 2, y = (a.y + 1) / 2;
    let dx = (b.x - a.x) * st.aspect, dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x, y, dx: dx / l, dy: dy / l };
  }

  function burst() {
    st.sprayT = 0;
    st.pressT = 0;
    // droplets in world space, along the nozzle direction
    B.actuator.updateWorldMatrix(true, false);
    const o = B.nozzleLocal.clone().applyMatrix4(B.actuator.matrixWorld);
    const dir = new THREE.Vector3(-1, 0, 0).transformDirection(B.actuator.matrixWorld);
    rig.worldToLocal(o);
    for (let i = 0; i < N; i++) {
      dp[i * 3] = o.x; dp[i * 3 + 1] = o.y; dp[i * 3 + 2] = o.z;
      const sp = 2.2 + Math.random() * 3.2, a = (Math.random() - .5) * .5, b = (Math.random() - .5) * .5;
      dv[i * 3] = (dir.x + a * .6) * sp; dv[i * 3 + 1] = (dir.y + b * .5 + .08) * sp; dv[i * 3 + 2] = (dir.z + a * .4) * sp;
      dl[i] = Math.random() * .3;
    }
    dropGeo.attributes.position.needsUpdate = true;
  }

  function frame(now) {
    if (!st.running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - st.last) / 1000);
    st.last = now;
    const t = (now - st.t0) / 1000;
    const p = st.progress;
    if (st.started) st.intro = clamp01((now - st.introStart) / 2600);
    const ii = easeOut(st.intro);
    const narrow = st.aspect < .8;

    /* lights come up */
    renderer.toneMappingExposure = lerp(.05, 1.05, smooth(0, .75, st.intro));
    backdrop.material.uniforms.uIntro.value = smooth(.1, 1, st.intro);
    backdrop.material.uniforms.uTime.value = t;
    floor.material.uniforms.uIntro.value = smooth(.2, 1, st.intro);
    const sw = smooth(.3, 1, st.intro);
    sweep.intensity = Math.sin(sw * Math.PI) * 5;
    sweep.position.set(lerp(-6, 6, sw), 2, 3);

    /* cap: pull, arc, land */
    const pull = smooth(.07, .15, p);
    const fly = easeInOut(smooth(.14, .34, p));
    if (fly <= 0) {
      B.cap.position.set(0, DIM.base + DIM.H + pull * .12, 0);
      B.cap.rotation.set(0, turn.rotation.y - pull * .22, 0);
    } else {
      const q = capFlight(fly, narrow);
      B.cap.position.copy(q);
      B.cap.rotation.set(Math.sin(fly * Math.PI) * -.25, turn.rotation.y - .22 - fly * 1.1, Math.sin(fly * Math.PI) * -.5);
    }
    const capAway = smooth(.16, .3, p);

    /* bottle stance */
    st.cmx = lerp(st.cmx, st.mx, .05); st.cmy = lerp(st.cmy, st.my, .05);
    turn.rotation.y = .42 + Math.sin(t * .3) * .05 + st.cmx * .22 - (1 - ii) * .6 - smooth(.4, .9, p) * .16;
    turn.position.y = lerp(-.18, 0, ii);

    /* atomiser press: scroll, or a click */
    const scrollPress = smooth(.38, .405, p) - smooth(.415, .44, p);
    st.pressT += dt;
    const clickPress = st.pressT < .32 ? Math.sin(clamp01(st.pressT / .32) * Math.PI) : 0;
    B.actuator.position.y = DIM.base + DIM.H + .06 + .162 + .07 - .045 * Math.max(scrollPress, clickPress);
    if (p > .405 && st.armed) { st.armed = false; burst(); }
    if (p < .36) st.armed = true;

    /* camera: framing follows the story */
    const frameP = smooth(.1, .4, p) - smooth(.62, .9, p) * .6;
    const dist = (narrow ? 11.8 : 8.6) * lerp(1, .84, frameP);
    const lookY = (narrow ? -.55 : .32) + frameP * (narrow ? .25 : .38);
    const halfW = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * st.aspect;
    const fx = narrow ? 0 : halfW * (.2 - frameP * .04);
    rig.position.x = fx;
    camera.position.set(st.cmx * .25, lookY + .75 + st.cmy * -.15, dist);
    camera.lookAt(0, lookY, 0);

    /* floor and backdrop follow */
    floor.material.uniforms.uAngle.value = turn.rotation.y;
    floor.material.uniforms.uCap.value.set(B.cap.position.x, B.cap.position.z, Math.max(0, B.cap.position.y - DIM.base));
    B.liqMat.uniforms.uTime.value = t;

    /* droplets */
    st.sprayT += dt;
    if (st.sprayT < 1.6) {
      for (let i = 0; i < N; i++) {
        if (st.sprayT < dl[i]) continue;
        dp[i * 3] += dv[i * 3] * dt; dp[i * 3 + 1] += dv[i * 3 + 1] * dt; dp[i * 3 + 2] += dv[i * 3 + 2] * dt;
        const k = Math.pow(.12, dt);
        dv[i * 3] *= k; dv[i * 3 + 1] = dv[i * 3 + 1] * k + .25 * dt; dv[i * 3 + 2] *= k;
      }
      dropGeo.attributes.position.needsUpdate = true;
      dropMat.opacity = Math.max(0, 1 - st.sprayT / 1.6) * .85;
    } else dropMat.opacity = 0;

    renderer.render(scene, camera);

    /* vapour */
    if (smoke) {
      const n = nozzleScreen();
      const thread = capAway * (1 - smooth(.94, 1, p));
      if (thread > .01) {
        const k = dt * 60;
        const wob = Math.sin(t * 1.7) * .0012 + Math.sin(t * 4.3) * .0006;
        smoke.splat(n.x + wob, n.y + .012, Math.sin(t * 1.1) * 12, 42 + Math.sin(t * .8) * 9, vapour, .09 * thread * k, .00004, { velRadius: .00012 });
      }
      if (st.sprayT < .9) {
        const k = 1 - st.sprayT / .9, front = Math.min(1, st.sprayT / .3), kk = dt * 60;
        const px = -n.dy, py = n.dx;
        for (let i = 0; i < 2; i++) {
          const a = (Math.random() - .5) * .3 + .04;
          const dx = n.dx * Math.cos(a) - n.dy * Math.sin(a), dy = n.dx * Math.sin(a) + n.dy * Math.cos(a);
          const sp = (70 + Math.random() * 60) * k;
          smoke.splat(n.x + dx * .03 / st.aspect, n.y + dy * .03, dx * sp, dy * sp + 8, mist, 0, .001, { velRadius: .003 });
        }
        for (let i = 0; i < 5; i++) {
          const s = Math.pow(Math.random(), .9) * (.02 + .13 * front);
          const w = (Math.random() - .5) * 2 * s * .34;
          const x = n.x + (n.dx * s + px * w) / st.aspect, y = n.y + n.dy * s + py * w + s * .05;
          smoke.splat(x, y, n.dx * 25 * k, n.dy * 25 * k, mist, .075 * k * kk, .0002 + s * .01, { velRadius: .001 });
        }
      }
      smoke.step(dt);
      smoke.render();
    }
  }

  function run() { if (!st.running && st.visible) { st.running = true; st.last = performance.now(); requestAnimationFrame(frame); } }

  let readyRes;
  const ready = new Promise(r => { readyRes = r; });
  // compile everything on the first frame, then report ready
  requestAnimationFrame(() => {
    try { renderer.compile(scene, camera); } catch (e) { /* first render compiles anyway */ }
    if (onProgress) onProgress(1);
    readyRes();
  });

  return {
    hasSmoke: !!smoke,
    start() { st.started = true; st.introStart = performance.now(); run(); },
    setProgress(p) { st.progress = p; },
    setPointer(x, y) { st.mx = x; st.my = y; },
    stir(x, y, dx, dy) { if (smoke && st.progress > .16) smoke.splat(x, y, dx * 900, dy * 900, vapour, 0, .0025, { velRadius: .0025 }); },
    spray() { if (st.progress > .3) burst(); },
    setVisible(v) { st.visible = v; if (v) run(); else st.running = false; },
    ready
  };
}

/* =========================================================================
   Packshots: the same flacon on an ivory studio set, rendered to a canvas
   ========================================================================= */
export async function renderPackshot({ canvas, width = 1600, height = 2000, scents, font = FONT, set = false }) {
  if (document.fonts && document.fonts.load) { try { await document.fonts.load(`400 120px ${font}`); await document.fonts.load(`500 44px ${font}`); } catch (e) { /* fall back to system serif */ } }
  canvas.width = width; canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = studio('light');
  scene.environment = pmrem.fromEquirectangular(env).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 5, 4); scene.add(key);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), backdropMaterial('light', scents[0].bright));
  backdrop.material.uniforms.uCenter.value.set(.5, .6);
  backdrop.position.set(0, 4, -6);
  scene.add(backdrop);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), floorMaterial('light', scents[0].bright));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, DIM.base, 4);
  scene.add(floor);

  const camera = new THREE.PerspectiveCamera(set ? 26 : 22, width / height, .1, 80);
  if (!set) {
    const b = buildBottle(scents[0], font);
    b.group.rotation.y = -.32;
    floor.material.uniforms.uAngle.value = -.32;
    b.cap.rotation.y = 0;
    scene.add(b.group);
    camera.position.set(0, 1.25, 11.4);
    camera.lookAt(0, .3, 0);
  } else {
    floor.material.uniforms.uShadowK.value = 0;
    floor.material.uniforms.uTintK.value = 0;
    const n = scents.length;
    scents.forEach((s, i) => {
      const b = buildBottle(s, font);
      const k = .35;
      b.group.scale.setScalar(k);
      const a = (-1 + 2 * i / (n - 1)) * .78;
      b.group.position.set(Math.sin(a) * 1.7, DIM.base - DIM.base * k, -Math.cos(a) * 1.7 + 1.1);
      b.group.rotation.y = -a * .7;
      scene.add(b.group);
      // a small shadow for each vial
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(.9, .6), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, opacity: .55 }));
      sh.rotation.x = -Math.PI / 2; sh.position.set(b.group.position.x, DIM.base + .002, b.group.position.z);
      scene.add(sh);
    });
    camera.position.set(0, 1.75, 8.5);
    camera.lookAt(0, -.45, -.45);
  }
  renderer.render(scene, camera);
  const url = canvas.toDataURL('image/jpeg', .9);
  renderer.dispose();
  return url;
}
function shadowTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(40,30,20,.7)'); r.addColorStop(.5, 'rgba(40,30,20,.25)'); r.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
