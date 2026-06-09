/* ============================================================
   It's Jerome's World — interactive engine
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;

  /* ---------- Image fallbacks ---------- */
  function handleFallback(img) {
    if (img.dataset.fallbackHandled) return;
    img.dataset.fallbackHandled = "1";
    if (img.dataset.fallbackIcon) {
      const i = document.createElement("i");
      i.className = "fa-solid " + img.dataset.fallbackIcon;
      img.replaceWith(i);
    } else if (img.dataset.fallbackLabel) {
      const wrap = img.closest(".panel__media");
      if (wrap) { wrap.classList.add("img-fallback"); wrap.setAttribute("data-label", img.dataset.fallbackLabel); }
      img.remove();
    }
  }
  document.querySelectorAll("img[data-fallback-icon], img[data-fallback-label]").forEach((img) => {
    img.addEventListener("error", () => handleFallback(img));
    if (img.complete && img.naturalWidth === 0) handleFallback(img);
  });

  /* ============================================================
     WebGL shader hero — "you bring the light"
     ============================================================ */
  const canvas = document.getElementById("gl");
  let glActive = false;
  const mouseTarget = { x: 0.5, y: 0.5 };
  const mouseSmooth = { x: 0.5, y: 0.5 };
  let lastMove = -9999;

  function initGL() {
    if (isTouch || prefersReduced || typeof THREE === "undefined" || !canvas) return false;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    } catch (e) { return false; }
    if (!renderer) return false;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const frag = `
      precision highp float;
      uniform float uTime; uniform vec2 uMouse; uniform vec2 uRes;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),
                   mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y);
      }
      float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p*=2.0; a*=0.5;} return v; }
      void main(){
        vec2 uv = vUv;
        float ar = uRes.x/uRes.y;
        vec2 p = uv; p.x *= ar;
        vec2 m = uMouse; m.x *= ar;
        float t = uTime * 0.045;
        vec2 q = vec2(fbm(p*2.0 + vec2(0.0,t)), fbm(p*2.0 + vec2(5.2,1.3 - t)));
        vec2 r = vec2(fbm(p*2.0 + 4.0*q + vec2(1.7,9.2) + t),
                      fbm(p*2.0 + 4.0*q + vec2(8.3,2.8) - t));
        float n = fbm(p*2.0 + 4.0*r);
        float d = distance(p, m);
        float light = smoothstep(0.75, 0.0, d);
        float intensity = n*0.5 + light*0.95 + light*n*0.7;
        vec3 bg = vec3(0.02,0.02,0.026);
        vec3 orange = vec3(0.96,0.47,0.13);
        vec3 hot = vec3(1.0,0.86,0.58);
        vec3 col = mix(bg, orange, smoothstep(0.25,0.95,intensity));
        col = mix(col, hot, smoothstep(0.85,1.45,intensity));
        col += orange * light * 0.18;
        float vig = smoothstep(1.25,0.25, length(uv-0.5));
        col *= vig;
        gl_FragColor = vec4(col, 1.0);
      }
    `;
    const vert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag })
    );
    scene.add(mesh);

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
    });

    const clock = new THREE.Clock();
    const render = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      // idle orbit when the cursor hasn't moved recently
      const idle = performance.now() - lastMove > 2500;
      if (idle) {
        const tt = clock.getElapsedTime() * 0.25;
        mouseTarget.x = 0.5 + Math.cos(tt) * 0.22;
        mouseTarget.y = 0.5 + Math.sin(tt * 0.8) * 0.18;
      }
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * 0.05;
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * 0.05;
      uniforms.uMouse.value.set(mouseSmooth.x, mouseSmooth.y);
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();
    return true;
  }

  glActive = initGL();
  if (!glActive) document.body.classList.add("webgl-off");

  /* ============================================================
     Atmospheric embers — layered, cursor-reactive depth
     ============================================================ */
  const atmo = document.getElementById("atmosphere");
  let embers = [];
  const pointer = { x: -9999, y: -9999 };
  if (atmo && !isTouch && !prefersReduced) {
    const ctx = atmo.getContext("2d");
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio, 1.5);
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      atmo.width = W * dpr; atmo.height = H * dpr;
      atmo.style.width = W + "px"; atmo.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = window.innerWidth < 1100 ? 45 : 75;
    const spawn = (init) => {
      const depth = Math.random(); // 0 far .. 1 near
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : H + 20,
        r: 0.6 + depth * 2.2,
        depth,
        vy: -(0.15 + depth * 0.55),
        drift: (Math.random() - 0.5) * 0.4,
        phase: Math.random() * Math.PI * 2,
        sway: 0.3 + Math.random() * 0.8,
        alpha: 0.15 + depth * 0.5,
      };
    };
    for (let i = 0; i < COUNT; i++) embers.push(spawn(true));

    const drawAtmo = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const t = performance.now() * 0.001;
      for (const e of embers) {
        e.y += e.vy;
        e.x += e.drift + Math.sin(t * e.sway + e.phase) * 0.25 * e.depth;
        // gentle cursor influence (nearer layers react more)
        const dx = e.x - pointer.x, dy = e.y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 26000) {
          const f = (1 - dist2 / 26000) * e.depth * 1.6;
          e.x += (dx / Math.sqrt(dist2 + 1)) * f;
          e.y += (dy / Math.sqrt(dist2 + 1)) * f;
        }
        if (e.y < -20) Object.assign(e, spawn(false));
        if (e.x < -20) e.x = W + 20; else if (e.x > W + 20) e.x = -20;
        const flick = 0.7 + Math.sin(t * 2 + e.phase) * 0.3;
        const a = e.alpha * flick;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 4);
        g.addColorStop(0, "rgba(255,180,90," + a + ")");
        g.addColorStop(0.4, "rgba(244,121,33," + a * 0.5 + ")");
        g.addColorStop(1, "rgba(244,121,33,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(drawAtmo);
    };
    drawAtmo();
    window.addEventListener("mousemove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; });
    window.addEventListener("mouseleave", () => { pointer.x = -9999; pointer.y = -9999; });
  }

  /* ============================================================
     Chapter / scene navigation
     ============================================================ */
  const chapters = document.getElementById("chapters");
  if (chapters && "IntersectionObserver" in window) {
    const map = [
      { el: document.querySelector(".hero"), key: "top" },
      { el: document.getElementById("about"), key: "about" },
      { el: document.getElementById("work"), key: "work" },
      { el: document.getElementById("skills"), key: "skills" },
      { el: document.getElementById("contact"), key: "contact" },
    ].filter((m) => m.el);
    const links = {};
    chapters.querySelectorAll("[data-chapter]").forEach((a) => (links[a.dataset.chapter] = a));
    const setActive = (key) => {
      Object.values(links).forEach((a) => a.classList.remove("active"));
      if (links[key]) links[key].classList.add("active");
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const m = map.find((x) => x.el === entry.target);
          if (m) setActive(m.key);
        }
      });
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });
    map.forEach((m) => cio.observe(m.el));
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.getElementById("cursor");
  const cursorLight = document.getElementById("cursorLight");
  if (fine && !prefersReduced) {
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let lx = tx, ly = ty;
    window.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
      lastMove = performance.now();
      mouseTarget.x = e.clientX / window.innerWidth;
      mouseTarget.y = 1 - e.clientY / window.innerHeight;
      if (cursor) cursor.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
      document.body.classList.add("cursor-ready");
    });
    const followLight = () => {
      lx += (tx - lx) * 0.12; ly += (ty - ly) * 0.12;
      if (cursorLight) cursorLight.style.transform = `translate(${lx}px, ${ly}px) translate(-50%,-50%)`;
      requestAnimationFrame(followLight);
    };
    followLight();
    document.querySelectorAll('a, button, [data-magnetic], .skill-row, .panel, [data-link]').forEach((el) => {
      el.addEventListener("mouseenter", () => cursor && cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor && cursor.classList.remove("hover"));
    });
  }

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById("preloader");
  const preCount = document.getElementById("preCount");
  const preBar = document.getElementById("preBar");
  let revealStarted = false;
  function finishLoad() {
    if (revealStarted) return; revealStarted = true;
    document.body.classList.remove("loading");
    if (preloader) preloader.classList.add("done");
    startReveals();
  }
  if (prefersReduced) {
    if (preCount) preCount.textContent = "100";
    if (preBar) preBar.style.width = "100%";
    setTimeout(finishLoad, 150);
  } else {
    const dur = 1300, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const n = Math.round((1 - Math.pow(1 - p, 2)) * 100);
      if (preCount) preCount.textContent = n;
      if (preBar) preBar.style.width = n + "%";
      if (p < 1) requestAnimationFrame(step); else setTimeout(finishLoad, 300);
    };
    requestAnimationFrame(step);
  }
  setTimeout(finishLoad, 4500);

  /* ---------- Nav menus ---------- */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", (e) => { e.stopPropagation(); hamburgerBtn.classList.toggle("active"); navLinks.classList.toggle("active"); });
    navLinks.querySelectorAll("a").forEach((l) => l.addEventListener("click", () => { hamburgerBtn.classList.remove("active"); navLinks.classList.remove("active"); }));
    window.addEventListener("click", (e) => { if (!e.target.closest("nav")) { hamburgerBtn.classList.remove("active"); navLinks.classList.remove("active"); } });
  }
  const iconDropdownBtn = document.getElementById("iconDropdownBtn");
  const iconMenu = document.getElementById("iconMenu");
  if (iconDropdownBtn) {
    iconDropdownBtn.addEventListener("click", (e) => { e.stopPropagation(); iconMenu.classList.toggle("show"); });
    window.addEventListener("click", (e) => { if (!e.target.closest(".icon-dropdown")) iconMenu.classList.remove("show"); });
  }

  /* ---------- Reveals ---------- */
  const revealEls = document.querySelectorAll(".reveal, .mask");
  function startReveals() {
    if (prefersReduced || !("IntersectionObserver" in window)) { revealEls.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target, target = parseInt(el.dataset.count, 10);
        if (prefersReduced) { el.innerHTML = target + '<span class="plus">+</span>'; cio.unobserve(el); return; }
        const dur = 1600, start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          el.innerHTML = Math.round(target * (1 - Math.pow(1 - p, 3))) + '<span class="plus">+</span>';
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick); cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Magnetic ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = el.classList.contains("social-link") ? 0.4 : 0.3;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width/2) * strength}px, ${(e.clientY - r.top - r.height/2) * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced && !isTouch) {
    lenis = new Lenis({ lerp: 0.09 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Unified scroll engine ---------- */
  const progress = document.getElementById("scrollProgress");
  const marquee = document.getElementById("marquee");
  const nav = document.getElementById("nav");
  const logoNav = document.getElementById("logoNav");
  const hero = document.querySelector(".hero");
  const workSection = document.querySelector("[data-pin]");
  const workTrack = document.getElementById("workTrack");

  let marqueeX = 0, prevY = window.scrollY, lastY = window.scrollY, navHidden = false;

  function tick() {
    const y = window.scrollY;
    const vel = y - prevY; prevY = y;
    const vh = window.innerHeight;

    if (progress) {
      const max = document.documentElement.scrollHeight - vh;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
    if (logoNav) logoNav.classList.toggle("scrolled", y > 120);
    if (nav) {
      const down = y > lastY && y > 500;
      if (down && !navHidden) { nav.classList.add("hidden"); navHidden = true; }
      else if (!down && navHidden) { nav.classList.remove("hidden"); navHidden = false; }
      lastY = y;
    }
    if (hero && y < vh * 1.2) {
      hero.style.opacity = Math.max(1 - y / (vh * 0.75), 0);
      hero.style.transform = `translate3d(0, ${y * 0.2}px, 0)`;
    }
    if (marquee) {
      marqueeX -= 0.5 + Math.min(Math.abs(vel) * 0.35, 7) * Math.sign(vel || 1);
      const half = marquee.scrollWidth / 2;
      if (half > 0) marqueeX = ((marqueeX % half) + half) % half - half;
      marquee.style.transform = `translate3d(${marqueeX}px,0,0)`;
    }
    if (workSection && workTrack && !isTouch) {
      const r = workSection.getBoundingClientRect();
      const total = workSection.offsetHeight - vh;
      const scrolled = Math.min(Math.max(-r.top, 0), total);
      const p = total > 0 ? scrolled / total : 0;
      const dist = workTrack.scrollWidth - window.innerWidth;
      workTrack.style.transform = `translate3d(${-(p * dist).toFixed(1)}px,0,0)`;
    }
    requestAnimationFrame(tick);
  }
  if (!prefersReduced) requestAnimationFrame(tick);
})();
