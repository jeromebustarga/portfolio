/* ============================================
   Jerome Bustarga — Playful portfolio
   ============================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;

  /* ---------- Year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const loader = document.querySelector("[data-loader]");
  function finishLoad() {
    document.body.classList.remove("is-loading");
    if (loader) loader.classList.add("is-done");
  }
  window.addEventListener("load", () => setTimeout(finishLoad, 700));
  setTimeout(finishLoad, 2500); // safety

  /* ---------- Mobile menu ---------- */
  const nav = document.querySelector("[data-nav]");
  const burger = document.querySelector("[data-burger]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const toggleMenu = (open) => {
    nav.classList.toggle("is-open", open);
    mobileMenu.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  if (burger) burger.addEventListener("click", () => toggleMenu(!nav.classList.contains("is-open")));
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Reveal on scroll (bouncy) ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i % 5) * 0.07 + "s";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Magnetic buttons (bouncy) ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Card tilt (playful) ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px) scale(1.02)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target, target = parseInt(el.dataset.count, 10);
        if (prefersReduced) { el.textContent = target + "+"; cio.unobserve(el); return; }
        const dur = 1500, start = performance.now();
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

  /* ---------- Confetti 🎉 ---------- */
  const colors = ["#ff6b6b", "#ffd23f", "#4d96ff", "#43c59e", "#b983ff", "#ff8fab"];
  function burst(x, y) {
    if (prefersReduced) return;
    const n = 28;
    for (let i = 0; i < n; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.background = colors[(Math.random() * colors.length) | 0];
      c.style.left = x + "px";
      c.style.top = y + "px";
      if (Math.random() > 0.5) c.style.borderRadius = "50%";
      document.body.appendChild(c);
      const angle = Math.random() * Math.PI * 2;
      const vel = 60 + Math.random() * 160;
      const dx = Math.cos(angle) * vel;
      const dy = Math.sin(angle) * vel - 120;
      const rot = (Math.random() * 720 - 360) + "deg";
      c.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 260}px) rotate(${rot})`, opacity: 0 }
      ], { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" })
        .onfinish = () => c.remove();
    }
  }
  document.querySelectorAll("[data-confetti]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    });
  });

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced && !isMobile) {
    lenis = new Lenis({ lerp: 0.1 });
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
      if (lenis) lenis.scrollTo(target, { offset: -90 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ============================================
     Unified scroll-driven engine
     ============================================ */
  const progressBar = document.querySelector("[data-progress]");
  const parallaxEls = Array.from(document.querySelectorAll("[data-speed]"));
  const blobEls = Array.from(document.querySelectorAll("[data-float]"));
  const marquee = document.querySelector("[data-marquee]");
  const pinSection = document.querySelector("[data-pin]");
  const pinTrack = document.querySelector("[data-pin-track]");

  // layout-based absolute top (ignores transforms — avoids feedback loop)
  const absTop = (el) => { let t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; };
  let bases = new WeakMap();
  const measure = () => {
    parallaxEls.forEach((el) => bases.set(el, absTop(el) + el.offsetHeight / 2));
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  // mouse state (for blobs)
  let mx = 0, my = 0, cx = 0, cy = 0;
  if (fine && !prefersReduced) {
    window.addEventListener("mousemove", (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  // scroll state (for marquee velocity)
  let lastScroll = window.scrollY, marqueeX = 0, velocity = 0;

  if (!prefersReduced) {
    const vh = () => window.innerHeight;

    const tick = () => {
      const y = window.scrollY;
      velocity = y - lastScroll;
      lastScroll = y;

      // 1) Progress bar
      if (progressBar) {
        const max = document.documentElement.scrollHeight - vh();
        const p = max > 0 ? Math.min(y / max, 1) : 0;
        progressBar.style.transform = `scaleX(${p})`;
      }

      // 2) Parallax elements (move relative to viewport center, no feedback)
      parallaxEls.forEach((el) => {
        const base = bases.get(el) || 0;
        const center = base - y - vh() / 2;
        const speed = parseFloat(el.dataset.speed) || 0;
        el.style.transform = `translate3d(0, ${(center * speed).toFixed(1)}px, 0)`;
      });

      // 3) Blobs: smooth mouse follow + gentle scroll drift
      cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
      blobEls.forEach((el) => {
        const s = parseFloat(el.dataset.float) * 100;
        const drift = y * parseFloat(el.dataset.float) * 0.6;
        el.style.transform = `translate3d(${cx * s}px, ${cy * s + drift}px, 0)`;
      });

      // 4) Marquee: constant drift + scroll-velocity boost, seamless loop
      if (marquee) {
        marqueeX -= 0.6 + Math.min(Math.abs(velocity) * 0.4, 8) * Math.sign(velocity || 1);
        const half = marquee.scrollWidth / 2;
        if (half > 0) { marqueeX = ((marqueeX % half) + half) % half - half; }
        marquee.style.transform = `translate3d(${marqueeX}px, 0, 0)`;
      }

      // 5) Pinned horizontal gallery
      if (pinSection && pinTrack && !isMobile) {
        const r = pinSection.getBoundingClientRect();
        const total = pinSection.offsetHeight - vh();
        const scrolled = Math.min(Math.max(-r.top, 0), total);
        const p = total > 0 ? scrolled / total : 0;
        const dist = pinTrack.scrollWidth - window.innerWidth;
        pinTrack.style.transform = `translate3d(${-(p * dist).toFixed(1)}px, 0, 0)`;
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
