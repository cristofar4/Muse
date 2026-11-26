/* =========================================================================
   MUSE · smoke
   A small GPU fluid solver (stable fluids: advection, vorticity, pressure
   projection) used for the perfume vapour in the hero. WebGL2 only.
   Coordinates are 0..1 with y pointing up.
   ========================================================================= */

const VERT = `#version 300 es
precision highp float;
in vec2 aPos;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
uniform vec2 uTexel;
void main(){
  vUv = aPos * .5 + .5;
  vL = vUv - vec2(uTexel.x, 0.); vR = vUv + vec2(uTexel.x, 0.);
  vT = vUv + vec2(0., uTexel.y); vB = vUv - vec2(0., uTexel.y);
  gl_Position = vec4(aPos, 0., 1.);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;

const FRAG = {
  clear: `uniform sampler2D uTex; uniform float uValue;
    void main(){ o = uValue * texture(uTex, vUv); }`,

  splat: `uniform sampler2D uTarget; uniform float uAspect; uniform vec4 uValue; uniform vec2 uPoint; uniform float uRadius; uniform vec2 uStretch;
    void main(){
      vec2 p = vUv - uPoint; p.x *= uAspect;
      // optional stretch along a direction, for jets
      float along = dot(p, uStretch);
      vec2 q = p - uStretch * along * .7;
      float s = exp(-dot(q, q) / uRadius);
      o = texture(uTarget, vUv) + s * uValue;
    }`,

  advect: `uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uVelTexel; uniform float uDt; uniform float uDiss;
    void main(){
      vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelTexel;
      o = texture(uSource, coord) / (1. + uDiss * uDt);
    }`,

  divergence: `uniform sampler2D uVelocity;
    void main(){
      float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
      float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
      vec2 C = texture(uVelocity, vUv).xy;
      if (vL.x < 0.) L = -C.x;
      if (vR.x > 1.) R = -C.x;
      if (vT.y > 1.) T = -C.y * .2;
      if (vB.y < 0.) B = -C.y;
      o = vec4(.5 * (R - L + T - B), 0., 0., 1.);
    }`,

  curl: `uniform sampler2D uVelocity;
    void main(){
      float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
      float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
      o = vec4(.5 * (R - L - T + B), 0., 0., 1.);
    }`,

  forces: `uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform sampler2D uDye;
    uniform float uCurlK; uniform float uDt; uniform float uBuoy; uniform float uNoise; uniform float uTime; uniform vec2 uWind;
    void main(){
      float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
      vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      f /= length(f) + .0001;
      f *= uCurlK * C;
      f.y *= -1.;
      float dens = texture(uDye, vUv).a;
      // warm vapour rises, a soft draught carries it, and slow turbulence breaks it into wisps
      f.y += uBuoy * min(dens, 1.5);
      f += uWind * min(dens * 3., 1.);
      vec2 u = vUv * vec2(1.7, 1.);
      vec2 n = vec2(
        sin(u.y * 7.3 + uTime * .9) + .55 * sin(u.y * 17.1 - uTime * 1.6 + u.x * 5.3) + .3 * sin(u.x * 29. + uTime * 2.3),
        cos(u.x * 6.1 - uTime * .7) + .55 * cos(u.x * 15.7 + uTime * 1.3 + u.y * 4.1) + .3 * cos(u.y * 27. - uTime * 2.1));
      f += uNoise * n * (.25 + min(dens * 2., 1.));
      vec2 vel = texture(uVelocity, vUv).xy + f * uDt;
      o = vec4(clamp(vel, -1200., 1200.), 0., 1.);
    }`,

  pressure: `uniform sampler2D uPressure; uniform sampler2D uDivergence;
    void main(){
      float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      float div = texture(uDivergence, vUv).x;
      o = vec4((L + R + B + T - div) * .25, 0., 0., 1.);
    }`,

  gradient: `uniform sampler2D uPressure; uniform sampler2D uVelocity;
    void main(){
      float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      vec2 vel = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
      o = vec4(vel, 0., 1.);
    }`,

  display: `uniform sampler2D uDye; uniform float uOpacity; uniform float uGain; uniform vec3 uLight;
    void main(){
      vec4 c = texture(uDye, vUv);
      vec3 col = c.rgb / max(c.a, .0001);
      // shade the vapour from its own density gradient so it reads as volume, not a flat stain
      float l = texture(uDye, vL).a, r = texture(uDye, vR).a, t = texture(uDye, vT).a, b = texture(uDye, vB).a;
      float a = (c.a * 2. + l + r + t + b) / 6.;
      vec3 n = normalize(vec3(l - r, b - t, .6));
      float diff = clamp(dot(n, normalize(uLight)), 0., 1.);
      col *= .9 + .28 * diff;
      float alpha = (1. - exp(-a * uGain)) * uOpacity;
      o = vec4(col * alpha, alpha);
    }`
};

export function createSmoke(canvas, options = {}) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: !!options.preserve });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return null;
  gl.getExtension('OES_texture_float_linear');

  const cfg = Object.assign({
    simRes: 128, dyeRes: 768, iterations: 20,
    velDiss: .5, dyeDiss: .26, pressure: .8, curl: 8,
    buoy: 34, noise: 3, wind: [-2, 0], opacity: 1, gain: 1.6, dpr: 1.5
  }, options);

  /* ---------- programs ---------- */
  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, VERT);
  const prog = {};
  Object.entries(FRAG).forEach(([name, body]) => {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, HEAD + body));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    prog[name] = { p, u };
  });

  /* ---------- full screen quad ---------- */
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  const ib = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  /* ---------- render targets ---------- */
  function target(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h, tx: 1 / w, ty: 1 / h, del() { gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); } };
  }
  function pair(w, h) {
    let a = target(w, h), b = target(w, h);
    return { get read() { return a; }, get write() { return b; }, swap() { const t = a; a = b; b = t; }, w, h, tx: 1 / w, ty: 1 / h, del() { a.del(); b.del(); } };
  }
  const res = (r, aspect) => (aspect >= 1 ? [Math.round(r * aspect), r] : [r, Math.round(r / aspect)]);

  let vel, dye, pres, div, curl, aspect = 1;
  function buildTargets() {
    [vel, dye, pres, div, curl].forEach(t => t && t.del());
    const [sw, sh] = res(cfg.simRes, aspect), [dw, dh] = res(cfg.dyeRes, aspect);
    vel = pair(sw, sh); pres = pair(sw, sh); div = target(sw, sh); curl = target(sw, sh); dye = pair(dw, dh);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, cfg.dpr);
    const w = Math.max(2, Math.round((canvas.clientWidth || window.innerWidth) * dpr));
    const h = Math.max(2, Math.round((canvas.clientHeight || window.innerHeight) * dpr));
    if (canvas.width === w && canvas.height === h && vel) return;
    canvas.width = w; canvas.height = h;
    const a = w / h;
    if (!vel || Math.abs(a - aspect) > .02) { aspect = a; buildTargets(); }
  }
  resize();

  /* ---------- helpers ---------- */
  let unit = 0;
  function use(name, texel) {
    const P = prog[name];
    gl.useProgram(P.p);
    unit = 0;
    if (P.u.uTexel && texel) gl.uniform2f(P.u.uTexel, texel[0], texel[1]);
    return P.u;
  }
  function tex(loc, t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t.tex); gl.uniform1i(loc, unit); unit++; }
  function blit(t) {
    if (t) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.viewport(0, 0, t.w, t.h); }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  /* ---------- public: splats ---------- */
  function splatInto(p, x, y, value, radius, stretch) {
    const u = use('splat', [p.tx, p.ty]);
    tex(u.uTarget, p.read);
    gl.uniform1f(u.uAspect, aspect);
    gl.uniform2f(u.uPoint, x, y);
    gl.uniform4f(u.uValue, value[0], value[1], value[2], value[3]);
    gl.uniform1f(u.uRadius, radius * (aspect > 1 ? aspect : 1));
    gl.uniform2f(u.uStretch, stretch ? stretch[0] : 0, stretch ? stretch[1] : 0);
    blit(p.write);
    p.swap();
  }
  /** x,y in 0..1 (y up). vx,vy in sim units. color 0..1 rgb. amount adds density. */
  function splat(x, y, vx, vy, color, amount, radius = .0012, opts = {}) {
    gl.disable(gl.BLEND);
    let st = null;
    if (opts.stretch) { const l = Math.hypot(vx, vy * (1 / aspect)) || 1; st = [vx / l, vy / l]; }
    if (vx || vy) splatInto(vel, x, y, [vx, vy, 0, 0], opts.velRadius || radius * 1.6, st);
    if (amount > 0) splatInto(dye, x, y, [color[0] * amount, color[1] * amount, color[2] * amount, amount], radius, st);
  }

  /* ---------- public: step ---------- */
  let time = 0;
  function step(dt) {
    dt = Math.min(dt, 1 / 30);
    time += dt;
    gl.disable(gl.BLEND);
    const tx = [vel.tx, vel.ty];

    let u = use('curl', tx); tex(u.uVelocity, vel.read); blit(curl);

    u = use('forces', tx);
    tex(u.uVelocity, vel.read); tex(u.uCurl, curl); tex(u.uDye, dye.read);
    gl.uniform1f(u.uCurlK, cfg.curl); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uBuoy, cfg.buoy);
    gl.uniform1f(u.uNoise, cfg.noise); gl.uniform1f(u.uTime, time); gl.uniform2f(u.uWind, cfg.wind[0], cfg.wind[1]);
    blit(vel.write); vel.swap();

    u = use('divergence', tx); tex(u.uVelocity, vel.read); blit(div);

    u = use('clear', tx); tex(u.uTex, pres.read); gl.uniform1f(u.uValue, cfg.pressure); blit(pres.write); pres.swap();

    for (let i = 0; i < cfg.iterations; i++) {
      u = use('pressure', tx); tex(u.uPressure, pres.read); tex(u.uDivergence, div); blit(pres.write); pres.swap();
    }

    u = use('gradient', tx); tex(u.uPressure, pres.read); tex(u.uVelocity, vel.read); blit(vel.write); vel.swap();

    u = use('advect', tx);
    tex(u.uVelocity, vel.read); tex(u.uSource, vel.read);
    gl.uniform2f(u.uVelTexel, vel.tx, vel.ty); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDiss, cfg.velDiss);
    blit(vel.write); vel.swap();

    u = use('advect', [dye.tx, dye.ty]);
    tex(u.uVelocity, vel.read); tex(u.uSource, dye.read);
    gl.uniform2f(u.uVelTexel, vel.tx, vel.ty); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDiss, cfg.dyeDiss);
    blit(dye.write); dye.swap();
  }

  function render() {
    gl.disable(gl.BLEND);
    const u = use('display', [dye.tx * 1.5, dye.ty * 1.5]);
    tex(u.uDye, dye.read);
    gl.uniform1f(u.uOpacity, cfg.opacity);
    gl.uniform1f(u.uGain, cfg.gain);
    gl.uniform3f(u.uLight, -.35, .75, .55);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    blit(null);
  }

  function clear() {
    [vel, dye, pres].forEach(p => { [p.read, p.write].forEach(t => { gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }); });
  }

  return {
    gl, cfg, resize, splat, step, render, clear,
    get aspect() { return aspect; },
    set(partial) { Object.assign(cfg, partial); }
  };
}
