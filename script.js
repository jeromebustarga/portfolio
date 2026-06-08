/* ============================================
   Jerome Bustarga — Portfolio interactions
   ============================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = window.matchMedia("(max-width: 720px)").matches;

  /* ---------- Year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Preloader (0 -> 100 then wipe up) ---------- */
  const loader = document.querySelector("[data-loader]");
  const loaderCount = document.querySelector("[data-loader-count]");
  const loaderBar = document.querySelector("[data-loader-bar]");
  function finishLoad() {
    document.body.classList.remove("is-loading");
    if (loader) loader.classList.add("is-done");
  }
  if (loader && !prefersReduced) {
    const dur = 1400, start = performance.now();
    const run = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * 100);
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

  /* ---------- Nav state + progress + mobile menu ---------- */
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

  /* ---------- Reveal on scroll ---------- */
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

  /* ---------- Magnetic buttons ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.35;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Project tilt ---------- */
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

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
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
     SCROLL ENGINE — parallax + pinned horizontal
     ============================================ */
  const parallaxEls = Array.from(document.querySelectorAll("[data-parallax]"));
  const hscroll = document.querySelector("[data-hscroll]");
  const htrack = document.querySelector("[data-hscroll-track]");

  let ticking = false;
  const vh = () => window.innerHeight;

  function update() {
    ticking = false;
    const scrollY = window.scrollY;

    // Nav + progress
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (docH > 0 ? (scrollY / docH) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 40);

    if (prefersReduced) return;

    // Parallax: move each element relative to its position in the viewport
    for (const el of parallaxEls) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh() + 200) continue; // off-screen, skip
      const speed = parseFloat(el.dataset.speed || "0.1");
      const center = r.top + r.height / 2 - vh() / 2;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(2)}px, 0)`;
    }

    // Pinned horizontal scroll
    if (hscroll && htrack && !isMobile) {
      const top = hscroll.offsetTop;
      const total = hscroll.offsetHeight - vh();
      const p = Math.min(Math.max((scrollY - top) / total, 0), 1);
      const distance = htrack.scrollWidth - window.innerWidth;
      htrack.style.transform = `translate3d(${(-p * distance).toFixed(2)}px, 0, 0)`;
    }
  }

  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", update);
  window.addEventListener("load", update);
  update();

  /* ---------- Smooth inertia scroll (Lenis, optional) ---------- */
  if (typeof Lenis !== "undefined" && !prefersReduced && !isMobile) {
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", onScroll);
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);

    // Smooth anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      });
    });
  }
})();
