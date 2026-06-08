/* ============================================
   Jerome Bustarga — Portfolio
   Interactive particles + kinetic scroll engine
   ============================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  /* ---------- Year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const loader = document.querySelector("[data-loader]");
  const loaderCount = document.querySelector("[data-loader-count]");
  const loaderBar = document.querySelector("[data-loader-bar]");
  function finishLoad() {
    document.body.classList.remove("is-loading");
    if (loader) loader.classList.add("is-done");
  }
  if (loader && !prefersReduced) {
    const dur = 1500, start = performance.now();
    const run = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const val = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      if (loaderCount) loaderCount.textContent = val;
      if (loaderBar) loaderBar.style.width = val + "%";
      if (p < 1) requestAnimationFrame(run);
      else setTimeout(finishLoad, 250);
    };
    requestAnimationFrame(run);
  } else {
    finishLoad();
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.querySelector("[data-cursor]");
  const dot = document.querySelector("[data-cursor-dot]");
  if (fine && cursor && dot && !prefersReduced) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    const render = () => {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    };
    render();
    document.querySelectorAll("a, button, [data-magnetic], [data-tilt]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Nav + mobile menu ---------- */
  const nav = document.querySelector("[data-nav]");
  const progress = document.querySelector("[data-progress]");
  const burger = document.querySelector("[data-burger]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const toggleMenu = (open) => {
    nav.classList.toggle("is-open", open);
    mobileMenu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  if (burger) burger.addEventListener("click", () => toggleMenu(!nav.classList.contains("is-open")));
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Reveal ---------- */
  const reveals = document.querySelectorAll(".reveal, .reveal-img");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el, i) => {
      if (el.classList.contains("reveal")) el.style.transitionDelay = (i % 4) * 0.06 + "s";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Magnetic ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.35}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Tilt ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const media = card.querySelector(".project__media");
      if (!media) return;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
        media.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("mouseleave", () => { media.style.transform = ""; });
    });
  }

  /* ---------- Counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target, target = parseInt(el.dataset.count, 10);
        if (prefersReduced) { el.textContent = target + "+"; cio.unobserve(el); return; }
        const dur = 1600, start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + "+";
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ============================================
     INTERACTIVE PARTICLE HERO
     Renders the name as particles that scatter
     from the cursor and spring back home.
     ============================================ */
  const canvas = document.querySelector("[data-particles]");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, particles = [];
    const mouse = { x: -9999, y: -9999, r: 130 };

    function buildParticles() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const lines = ["JEROME", "BUSTARGA"];
      const longest = lines.reduce((a, b) => (a.length > b.length ? a : b));
      // Fit font size to width and height
      let fs = Math.min((w * 0.86) / (longest.length * 0.58), h / 3.4);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${fs}px "Space Grotesk", "Inter", sans-serif`;
      const lineH = fs * 0.98;
      const startY = h / 2 - (lineH * (lines.length - 1)) / 2;
      ctx.clearRect(0, 0, w, h);
      lines.forEach((t, i) => ctx.fillText(t, w / 2, startY + i * lineH));

      const cw = canvas.width, ch = canvas.height;
      const data = ctx.getImageData(0, 0, cw, ch).data;
      ctx.clearRect(0, 0, w, h);

      particles = [];
      const gap = Math.max(3, Math.round((isMobile ? 6 : 4) * dpr));
      for (let y = 0; y < ch; y += gap) {
        for (let x = 0; x < cw; x += gap) {
          if (data[(y * cw + x) * 4 + 3] > 128) {
            const hx = x / dpr, hy = y / dpr;
            particles.push({
              x: Math.random() * w, y: Math.random() * h,
              hx, hy, vx: 0, vy: 0
            });
          }
        }
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f3f3ee";
      const size = dpr > 1 ? 1.5 : 1.8;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mouse.r * mouse.r) {
          const dist = Math.sqrt(d2) || 0.001;
          const force = (mouse.r - dist) / mouse.r;
          p.vx += (dx / dist) * force * 5;
          p.vy += (dy / dist) * force * 5;
        }
        p.vx += (p.hx - p.x) * 0.022;
        p.vy += (p.hy - p.y) * 0.022;
        p.vx *= 0.86; p.vy *= 0.86;
        p.x += p.vx; p.y += p.vy;
        ctx.fillRect(p.x, p.y, size, size);
      }
    }

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });
    canvas.addEventListener("touchmove", (e) => {
      const r = canvas.getBoundingClientRect(), t = e.touches[0];
      mouse.x = t.clientX - r.left; mouse.y = t.clientY - r.top;
    }, { passive: true });

    let resizeT;
    window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(buildParticles, 200); });

    const startHero = () => {
      buildParticles();
      if (prefersReduced) { drawParticles(); return; } // static
      const loop = () => { drawParticles(); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startHero);
      setTimeout(startHero, 1200); // safety if fonts hang; buildParticles re-runs harmlessly
    } else {
      startHero();
    }
  }

  /* ============================================
     KINETIC SCROLL ENGINE
     parallax · pinned horizontal · velocity skew
     · scroll-reactive marquee · progress
     ============================================ */
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  const skewEls = Array.from(document.querySelectorAll("[data-skew]"));
  const hscroll = document.querySelector("[data-hscroll]");
  const htrack = document.querySelector("[data-hscroll-track]");
  const marquee = document.querySelector("[data-marquee]");

  let lastScroll = window.scrollY;
  let velSmooth = 0;
  let mq = 0;
  const vh = () => window.innerHeight;

  function frame() {
    const scrollY = window.scrollY;
    const vel = scrollY - lastScroll;
    lastScroll = scrollY;
    velSmooth += (vel - velSmooth) * 0.1;

    // Progress + nav
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (docH > 0 ? (scrollY / docH) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 40);

    if (!prefersReduced) {
      // Parallax
      for (const el of parallaxEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh() + 200) continue;
        const speed = parseFloat(el.dataset.speed || "0.1");
        const center = r.top + r.height / 2 - vh() / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(2)}px, 0)`;
      }

      // Velocity skew (liquid feel)
      const skew = Math.max(-5, Math.min(5, velSmooth * 0.28));
      for (const el of skewEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh()) continue;
        el.style.transform = `skewY(${skew.toFixed(2)}deg)`;
      }

      // Pinned horizontal gallery
      if (hscroll && htrack && !isMobile) {
        const top = hscroll.offsetTop;
        const total = hscroll.offsetHeight - vh();
        const p = Math.min(Math.max((scrollY - top) / total, 0), 1);
        const distance = htrack.scrollWidth - window.innerWidth;
        htrack.style.transform = `translate3d(${(-p * distance).toFixed(2)}px, 0, 0)`;
      }

      // Scroll-reactive marquee
      if (marquee) {
        const half = marquee.scrollWidth / 2;
        if (half > 0) {
          mq -= 0.6 + velSmooth * 0.35;
          mq = mq % half;
          if (mq > 0) mq -= half;
          marquee.style.transform = `translateX(${mq.toFixed(2)}px)`;
        }
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Smooth inertia scroll (Lenis, optional) ---------- */
  if (typeof Lenis !== "undefined" && !prefersReduced && !isMobile) {
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target);
      });
    });
  }
})();
