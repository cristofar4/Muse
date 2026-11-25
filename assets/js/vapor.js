/* =========================================================================
   MUSE · Vapor
   A small WebGL effect: a photograph that rises like smoke wherever the
   cursor moves, and condenses out of vapor when it first appears.
   Falls back to the plain <img> when WebGL or the texture is unavailable.
   Usage: const v = new Vapor(hostElement, imageUrl, listenElement); v.play();
   ========================================================================= */
(() => {
  'use strict';

  const VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const FS = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D uImg;uniform sampler2D uTrail;',
    'uniform vec2 uRes;uniform vec2 uImgSize;uniform float uTime;uniform float uIntro;',
    'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*noise(p);p*=2.02;a*=.5;}return s;}',
    'vec2 cover(vec2 uv){float rs=uRes.x/uRes.y,ri=uImgSize.x/uImgSize.y;',
    ' vec2 sc=rs>ri?vec2(1.,ri/rs):vec2(rs/ri,1.);return (uv-.5)*sc+.5;}',
    'void main(){',
    ' vec2 uv=v;float t=uTime;',
    ' float tr=texture2D(uTrail,uv).r;',
    ' float n1=fbm(uv*vec2(3.,4.)+vec2(0.,-t*.08));',
    ' float n2=fbm(uv*vec2(7.,5.)+vec2(t*.05,-t*.16));',
    ' float amt=tr*.12+uIntro*.38;',
    ' vec2 off=vec2((n1-.5)*.7,-(.35+n2*.9))*amt;',
    ' off+=(vec2(n1,n2)-.5)*.007;',
    ' vec3 col=vec3(texture2D(uImg,cover(uv+off*1.07)).r,texture2D(uImg,cover(uv+off)).g,texture2D(uImg,cover(uv+off*.93)).b);',
    ' col+=tr*n2*.12;',
    ' col*=1.-uIntro*.75;',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  class Vapor {
    constructor(host, src, listen) {
      this.host = host;
      this.src = src;
      this.ok = false;
      this.visible = false;
      this.intro = 1;
      this.introStart = 0;
      this.points = [];
      this.last = null;
      this.raf = 0;
      if (reduced() || !host) return;

      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      let gl = null;
      try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
      if (!gl) return;
      this.canvas = canvas;
      this.gl = gl;

      const prog = this.program(VS, FS);
      if (!prog) return;
      this.prog = prog;
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {};
      ['uImg', 'uTrail', 'uRes', 'uImgSize', 'uTime', 'uIntro'].forEach(n => { this.u[n] = gl.getUniformLocation(prog, n); });
      gl.uniform1i(this.u.uImg, 0);
      gl.uniform1i(this.u.uTrail, 1);

      this.trail = document.createElement('canvas');
      this.trail.width = 128; this.trail.height = 128;
      this.tctx = this.trail.getContext('2d');
      this.tctx.fillStyle = '#000';
      this.tctx.fillRect(0, 0, 128, 128);

      this.texImg = this.texture(0);
      this.texTrail = this.texture(1);

      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        try {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.texImg);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
          if (gl.getError() !== gl.NO_ERROR) throw new Error('texture');
        } catch (e) { return; }
        this.imgSize = [img.naturalWidth, img.naturalHeight];
        this.ok = true;
        host.appendChild(canvas);
        this.resize();
        requestAnimationFrame(() => host.classList.add('is-gl'));
        this.kick();
      };
      img.src = src;

      (listen || host).addEventListener('pointermove', e => this.move(e), { passive: true });
      (listen || host).addEventListener('pointerleave', () => { this.last = null; });
      if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(host);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; this.kick(); }).observe(host);
      } else this.visible = true;
    }

    program(vs, fs) {
      const gl = this.gl;
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
      };
      const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
      if (!v || !f) return null;
      const p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    }

    texture(unit) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }

    resize() {
      if (!this.ok) return;
      const r = this.host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, matchMedia('(max-width: 960px)').matches ? 1 : 1.5);
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
        this.gl.viewport(0, 0, w, h);
      }
      this.aspect = r.width / Math.max(1, r.height);
    }

    move(e) {
      if (!this.ok) return;
      const r = this.host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) { this.last = null; return; }
      if (this.last) {
        const dx = x - this.last.x, dy = y - this.last.y;
        const dist = Math.hypot(dx * this.aspect, dy);
        const steps = Math.min(12, Math.ceil(dist / .01));
        for (let i = 1; i <= steps; i++) this.points.push({ x: this.last.x + dx * i / steps, y: this.last.y + dy * i / steps, s: Math.min(1, dist * 18) });
      }
      this.last = { x, y };
      this.kick();
    }

    play() { this.introStart = performance.now(); this.kick(); }

    kick() { if (this.ok && this.visible && !this.raf) this.raf = requestAnimationFrame(t => this.frame(t)); }

    frame(now) {
      this.raf = 0;
      if (!this.ok || !this.visible) return;
      const gl = this.gl, c = this.tctx;
      // trail: fade, then paint new puffs
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = 'rgba(0,0,0,0.045)';
      c.fillRect(0, 0, 128, 128);
      c.globalCompositeOperation = 'lighter';
      const pts = this.points.splice(0, 60);
      pts.forEach(p => {
        const x = p.x * 128, y = p.y * 128, rad = 7 + p.s * 14;
        const g = c.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(255,255,255,${(0.16 + p.s * .22).toFixed(3)})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      });
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texTrail);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.trail);

      if (this.introStart) {
        const k = Math.min(1, (now - this.introStart) / 2600);
        this.intro = 1 - (1 - Math.pow(1 - k, 3));
      }
      gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
      gl.uniform2f(this.u.uImgSize, this.imgSize[0], this.imgSize[1]);
      gl.uniform1f(this.u.uTime, now / 1000);
      gl.uniform1f(this.u.uIntro, this.intro);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.raf = requestAnimationFrame(t => this.frame(t));
    }
  }

  window.Vapor = Vapor;
})();
