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
      requestAnimationFrame(render);
      // Skip rendering when the hero is scrolled out of view (big perf win)
      if (window.scrollY > window.innerHeight * 1.3) return;
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
      { el: document.getElementById("archive"), key: "archive" },
      { el: document.getElementById("motion"), key: "motion" },
      { el: document.getElementById("about"), key: "about" },
      { el: document.getElementById("work"), key: "work" },
      { el: document.getElementById("warpzone"), key: "warpzone" },
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
  const preEnter = document.getElementById("preEnter");
  let revealStarted = false;
  function finishLoad() {
    if (revealStarted) return; revealStarted = true;
    document.body.classList.remove("loading");
    if (preloader) preloader.classList.add("done");
    startReveals();
  }
  // Wait for the user to click the logo (or press Enter), then play the ignition reveal
  let entering = false;
  function enterSite() {
    if (entering || revealStarted) return;
    entering = true;
    if (prefersReduced || !preloader) { finishLoad(); return; }
    preloader.classList.add("igniting");
    setTimeout(finishLoad, 1000);
  }
  if (preEnter) {
    preEnter.addEventListener("click", enterSite);
    window.addEventListener("keydown", (e) => {
      if (!revealStarted && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); enterSite(); }
    });
  } else {
    finishLoad();
  }

  /* ---------- Nav menus ---------- */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", (e) => { e.stopPropagation(); hamburgerBtn.classList.toggle("active"); navLinks.classList.toggle("active"); });
    navLinks.querySelectorAll("a").forEach((l) => l.addEventListener("click", () => { hamburgerBtn.classList.remove("active"); navLinks.classList.remove("active"); }));
    window.addEventListener("click", (e) => { if (!e.target.closest("nav")) { hamburgerBtn.classList.remove("active"); navLinks.classList.remove("active"); } });
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
  const stripTrack = document.getElementById("stripTrack");
  const stackSection = document.getElementById("archive");
  const stackProgress = document.getElementById("stackProgress");
  const plates = stackSection
    ? Array.from(stackSection.querySelectorAll(".stack-img")).map((el) => ({ el, x: +el.dataset.x || 0, y: +el.dataset.y || 0, rot: +el.dataset.rot || 0 }))
    : [];

  let marqueeX = 0, stripX = 0, prevY = window.scrollY, lastY = window.scrollY, navHidden = false;

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

    // Motion film strip: continuous drift + scroll-velocity boost
    if (stripTrack) {
      stripX -= 0.7 + Math.min(Math.abs(vel) * 0.3, 6) * Math.sign(vel || 1);
      const half = stripTrack.scrollWidth / 2;
      if (half > 0) stripX = ((stripX % half) + half) % half - half;
      stripTrack.style.transform = `translate3d(${stripX}px,0,0)`;
    }

    // Archive: spread the plates as you scroll through the pinned section
    if (stackSection && plates.length) {
      const r = stackSection.getBoundingClientRect();
      const total = stackSection.offsetHeight - vh;
      const p = total > 0 ? Math.min(Math.max(-r.top, 0), total) / total : 0;
      const sf = Math.min(1, window.innerWidth / 1300);
      for (const pl of plates) {
        pl.el.style.transform = `translate(calc(-50% + ${(pl.x * p * sf).toFixed(1)}px), calc(-50% + ${(pl.y * p * sf).toFixed(1)}px)) rotate(${(pl.rot * p).toFixed(2)}deg)`;
      }
      if (stackProgress) stackProgress.style.width = (p * 100).toFixed(1) + "%";
    }

    requestAnimationFrame(tick);
  }
  if (!prefersReduced) requestAnimationFrame(tick);

  /* ============================================================
     Warp Zone — playable in place (desktop / keyboard)
     ============================================================ */
  const wzStart = document.getElementById("wzStart");
  const wzSection = document.getElementById("warpzone");
  const wzGame = document.getElementById("wzGame");
  if (wzStart && wzSection && wzGame && !isTouch) {
    const wzArena = document.getElementById("wzArena");
    const wzChar = document.getElementById("wzChar");
    const wzMain = document.getElementById("wzMain");
    const wzStudio = document.getElementById("wzStudio");
    const wzLevel = document.getElementById("wzLevel");
    const wzExit = document.getElementById("wzExit");
    const charCtx = document.getElementById("wzCharCanvas").getContext("2d");

    let charX = 100, charY = 100, velocityX = 0, velocityY = 0;
    let isGrounded = false, currentLevel = "main";
    let physicsActive = false, active = false, loopStarted = false;
    const GRAVITY = 0.6, JUMP_FORCE = -14, MOVE_SPEED = 5, MAX_FALL_SPEED = 12;
    const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false };

    function drawCharacter() {
      charCtx.clearRect(0, 0, 40, 60);
      charCtx.fillStyle = "#f47921"; charCtx.fillRect(12, 8, 16, 16);
      charCtx.fillStyle = "#0d0d0d"; charCtx.fillRect(15, 13, 4, 4); charCtx.fillRect(21, 13, 4, 4);
      charCtx.fillStyle = "#e8e8e8"; charCtx.fillRect(10, 24, 20, 20);
      charCtx.fillStyle = "#f47921"; charCtx.fillRect(10, 30, 20, 4);
      charCtx.fillStyle = "#a0a0a0"; charCtx.fillRect(12, 44, 6, 12); charCtx.fillRect(22, 44, 6, 12);
    }
    drawCharacter();

    const mainGrid = [];
    for (let row = 0; row < 20; row++) {
      mainGrid[row] = [];
      for (let col = 0; col < 30; col++) {
        if (row === 0 || row === 19 || col === 0 || col === 29) mainGrid[row][col] = 1;
        else if (row >= 17) mainGrid[row][col] = 1;
        else if (col >= 3 && col <= 9 && row === 14) mainGrid[row][col] = 1;
        else if (col >= 5 && col <= 11 && row === 10) mainGrid[row][col] = 1;
        else if (col >= 20 && col <= 26 && row === 14) mainGrid[row][col] = 1;
        else if (col >= 18 && col <= 24 && row === 10) mainGrid[row][col] = 1;
        else if (col >= 13 && col <= 16 && row === 6) mainGrid[row][col] = 1;
        else if (col >= 12 && col <= 17 && row === 13) mainGrid[row][col] = 1;
        else mainGrid[row][col] = 0;
      }
    }
    const mainDoors = [
      { row: 12, col: 6, icon: "fa-door-open", label: "Repository", type: "repository" },
      { row: 8, col: 21, icon: "fa-door-open", label: "Studio", type: "studio" },
      { row: 4, col: 14, icon: "fa-house", label: "Home", type: "home" },
      { row: 12, col: 23, icon: "fa-user", label: "About", type: "about" },
    ];
    const studioGrid = [];
    for (let row = 0; row < 20; row++) {
      studioGrid[row] = [];
      for (let col = 0; col < 30; col++) {
        if (row === 0 || row === 19 || col === 0 || col === 29) studioGrid[row][col] = 1;
        else if ((col === 7 || col === 15 || col === 22) && (row < 6 || (row > 9 && row < 13) || row > 16)) studioGrid[row][col] = 1;
        else if ((row === 7 || row === 14) && (col < 6 || (col > 9 && col < 14) || (col > 17 && col < 21) || col > 24)) studioGrid[row][col] = 1;
        else studioGrid[row][col] = 0;
      }
    }
    const studioDoors = [
      { row: 4, col: 4, icon: "fa-palette", label: "Illustrations", type: "illustrations" },
      { row: 11, col: 11, icon: "fa-tag", label: "Branding", type: "branding" },
      { row: 4, col: 19, icon: "fa-cube", label: "3D Art", type: "3dart" },
      { row: 4, col: 26, icon: "fa-code", label: "Web Design", type: "webdesign" },
      { row: 4, col: 11, icon: "fa-film", label: "Film", type: "film" },
      { row: 11, col: 19, icon: "fa-arrow-left", label: "Back", type: "back" },
    ];

    function buildGrid(container, grid, doors, doorClass) {
      container.innerHTML = "";
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          const cell = document.createElement("div");
          cell.className = "wz-cell " + (grid[row][col] === 1 ? "wall" : "path");
          const d = doors.find((x) => x.row === row && x.col === col);
          if (d) {
            const door = document.createElement("div");
            door.className = doorClass;
            door.dataset.type = d.type;
            door.innerHTML = '<div class="wz-prompt">Press space</div><div class="wz-door-icon"><i class="fa-solid ' + d.icon + '"></i></div><div class="wz-door-label">' + d.label + "</div>";
            cell.appendChild(door);
          }
          container.appendChild(cell);
        }
      }
    }
    buildGrid(wzMain, mainGrid, mainDoors, "wz-door");
    buildGrid(wzStudio, studioGrid, studioDoors, "wz-sdoor");
    wzMain.classList.add("active");

    // Precompute wall rectangles in arena-local pixels (recomputed on resize) —
    // avoids hundreds of getBoundingClientRect calls per frame.
    const wallRects = { main: [], studio: [] };
    function computeWalls() {
      const r = wzArena.getBoundingClientRect();
      if (!r.width) return;
      const cw = r.width / 30, ch = r.height / 20;
      const build = (grid) => {
        const arr = [];
        for (let row = 0; row < 20; row++)
          for (let col = 0; col < 30; col++)
            if (grid[row][col] === 1) arr.push({ x: col * cw, y: row * ch, w: cw, h: ch });
        return arr;
      };
      wallRects.main = build(mainGrid);
      wallRects.studio = build(studioGrid);
    }
    computeWalls();
    window.addEventListener("resize", computeWalls);

    function showToast(html) {
      const old = document.getElementById("wzToast");
      if (old) old.remove();
      const t = document.createElement("div");
      t.className = "wz-toast"; t.id = "wzToast"; t.innerHTML = html;
      document.body.appendChild(t);
    }
    const moveHint = '<span class="wz-key">←</span> <span class="wz-key">→</span> Move · <span class="wz-key">↑</span> Jump · <span class="wz-key">Space</span> Enter';
    const mazeHint = '<span class="wz-key">←</span> <span class="wz-key">↑</span> <span class="wz-key">↓</span> <span class="wz-key">→</span> Move · <span class="wz-key">Space</span> Enter';

    function placeChar(colMul, rowMul, half) {
      const r = wzArena.getBoundingClientRect();
      const cw = r.width / 30, ch = r.height / 20;
      charX = half ? cw * colMul + cw / 2 - 20 : cw * colMul - 20;
      charY = half ? ch * rowMul + ch / 2 - 30 : ch * rowMul - 30;
      wzChar.style.left = charX + "px";
      wzChar.style.top = charY + "px";
    }

    function powerOn() {
      if (active) return;
      active = true;
      wzSection.classList.add("playing");
      computeWalls(); // arena is now visible and sized
      // Gently bring the game into view — scrolling stays enabled
      const targetY = wzSection.getBoundingClientRect().top + window.scrollY;
      if (lenis) lenis.scrollTo(targetY, { duration: 0.9 });
      else window.scrollTo({ top: targetY, behavior: "smooth" });
      showToast(moveHint);
      requestAnimationFrame(() => {
        placeChar(15, 10, false);
        isGrounded = false; velocityY = 0; physicsActive = true;
      });
      if (!loopStarted) { loopStarted = true; moveCharacter(); }
    }
    function powerOff() {
      active = false; physicsActive = false;
      wzSection.classList.remove("playing");
      const t = document.getElementById("wzToast"); if (t) t.remove();
      // reset to main hub for next time
      currentLevel = "main";
      wzStudio.classList.remove("active"); wzMain.classList.add("active");
      wzLevel.textContent = "Main hub";
    }
    wzStart.addEventListener("click", (e) => { e.preventDefault(); powerOn(); });
    wzExit.addEventListener("click", powerOff);

    function switchToStudio() {
      currentLevel = "studio";
      wzMain.classList.remove("active"); wzStudio.classList.add("active");
      wzLevel.textContent = "Studio maze";
      showToast(mazeHint);
      velocityX = velocityY = 0; isGrounded = false; physicsActive = false;
      setTimeout(() => { placeChar(17, 11, true); physicsActive = true; }, 100);
    }
    function switchToMain() {
      currentLevel = "main";
      wzStudio.classList.remove("active"); wzMain.classList.add("active");
      wzLevel.textContent = "Main hub";
      showToast(moveHint);
      velocityX = velocityY = 0; isGrounded = false; physicsActive = false;
      requestAnimationFrame(() => { placeChar(15, 10, false); physicsActive = true; });
    }

    function wzVisible() {
      const r = wzSection.getBoundingClientRect();
      return r.top < window.innerHeight * 0.6 && r.bottom > window.innerHeight * 0.4;
    }
    window.addEventListener("keydown", (e) => {
      if (!active) return;
      if (e.code === "Escape") { powerOff(); return; }
      // Only grab game keys while the arena is on screen; otherwise let the page scroll
      if ((e.code in keys || e.code === "Space") && wzVisible()) {
        e.preventDefault();
        if (e.code === "Space") { keys.Space = true; checkDoorEntry(); }
        else if (e.code === "ArrowUp") { keys.ArrowUp = true; if (currentLevel === "main" && isGrounded) { velocityY = JUMP_FORCE; isGrounded = false; } }
        else keys[e.code] = true;
      }
    });
    window.addEventListener("keyup", (e) => {
      if (e.code in keys || e.code === "Space") { if (e.code === "Space") keys.Space = false; else keys[e.code] = false; }
    });

    function platformCollision(x, y) {
      const box = { left: x, right: x + 40, top: y, bottom: y + 60 };
      for (const w of wallRects[currentLevel]) {
        if (box.bottom >= w.y - 2 && box.bottom <= w.y + 15 && box.right > w.x + 5 && box.left < w.x + w.w - 5 && velocityY >= 0)
          return { collision: true, platformTop: w.y };
      }
      return { collision: false };
    }
    function isWallAt(x, y) {
      const m = 6;
      const box = { left: x + m, right: x + 40 - m, top: y + m, bottom: y + 60 - m };
      for (const w of wallRects[currentLevel]) {
        if (!(box.right < w.x || box.left > w.x + w.w || box.bottom < w.y || box.top > w.y + w.h)) return true;
      }
      return false;
    }
    function moveCharacter() {
      requestAnimationFrame(moveCharacter);
      if (!active || !physicsActive) return;
      const a = wzArena.getBoundingClientRect();
      if (currentLevel === "main") {
        velocityX = keys.ArrowLeft ? -MOVE_SPEED : keys.ArrowRight ? MOVE_SPEED : 0;
        if (!isGrounded) { velocityY += GRAVITY; if (velocityY > MAX_FALL_SPEED) velocityY = MAX_FALL_SPEED; }
        let newX = charX + velocityX, newY = charY + velocityY;
        if (newX < 5) newX = 5;
        if (newX > a.width - 45) newX = a.width - 45;
        if (!isWallAt(newX, charY)) charX = newX; else velocityX = 0;
        const c = platformCollision(charX, newY);
        if (c.collision) { charY = c.platformTop - 58; velocityY = 0; isGrounded = true; }
        else if (!isWallAt(charX, newY)) { charY = newY; isGrounded = false; }
        else if (velocityY > 0) { velocityY = 0; isGrounded = true; }
        if (charY > a.height - 65) { charY = a.height - 65; velocityY = 0; isGrounded = true; }
        if (isGrounded && charY < a.height - 65 && !platformCollision(charX, charY + 2).collision) isGrounded = false;
      } else {
        const sp = 4;
        let newX = charX, newY = charY;
        if (keys.ArrowLeft && charX > 5) newX = charX - sp;
        if (keys.ArrowRight && charX < a.width - 45) newX = charX + sp;
        if (keys.ArrowUp && charY > 5) newY = charY - sp;
        if (keys.ArrowDown && charY < a.height - 65) newY = charY + sp;
        if (!isWallAt(newX, charY)) charX = newX;
        if (!isWallAt(charX, newY)) charY = newY;
      }
      wzChar.style.left = charX + "px";
      wzChar.style.top = charY + "px";
      checkDoorCollision();
    }
    function overlap(r1, r2) { return !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom); }
    function checkDoorCollision() {
      const cr = wzChar.getBoundingClientRect();
      (currentLevel === "main" ? wzMain.querySelectorAll(".wz-door") : wzStudio.querySelectorAll(".wz-sdoor"))
        .forEach((d) => d.classList.toggle("can-enter", overlap(cr, d.getBoundingClientRect())));
    }
    function checkDoorEntry() {
      const d = (currentLevel === "main" ? wzMain : wzStudio).querySelector(".can-enter");
      if (!d) return;
      const t = d.dataset.type;
      if (t === "studio") switchToStudio();
      else if (t === "back") switchToMain();
      else {
        const map = { repository: "repository.html", home: "index.html", about: "about.html", illustrations: "illustrations.html", branding: "logobranding.html", webdesign: "webdesign.html", film: "film.html", "3dart": "3d-art.html" };
        if (map[t]) window.location.href = map[t];
      }
    }
  }
})();
