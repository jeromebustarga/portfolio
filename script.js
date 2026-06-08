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

  /* ---------- Floating blob parallax ---------- */
  const floaters = Array.from(document.querySelectorAll("[data-float]"));
  if (fine && !prefersReduced && floaters.length) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
    const loop = () => {
      cx += (mx - cx) * 0.05; cy += (my - cy) * 0.05;
      floaters.forEach((el) => {
        const s = parseFloat(el.dataset.float) * 100;
        el.style.transform = `translate(${cx * s}px, ${cy * s}px)`;
      });
      requestAnimationFrame(loop);
    };
    loop();
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

  /* ---------- Smooth scroll (Lenis, optional) ---------- */
  if (typeof Lenis !== "undefined" && !prefersReduced && !isMobile) {
    const lenis = new Lenis({ lerp: 0.1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -90 });
      });
    });
  }
})();
