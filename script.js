/* ============================================
   Jerome Bustarga — Portfolio interactions
   ============================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Year ---------- */
  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    };
    render();

    document.querySelectorAll("a, button, [data-magnetic], [data-tilt]").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  /* ---------- Scroll progress ---------- */
  const progress = document.querySelector("[data-progress]");
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight);
    if (progress) progress.style.width = (scrolled * 100) + "%";
    nav.classList.toggle("is-scrolled", h.scrollTop > 40);
  };

  /* ---------- Nav scroll state + mobile menu ---------- */
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

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 0.06 + "s";
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Animated section line reveals (Space Grotesk titles) ---------- */
  if ("IntersectionObserver" in window && !prefersReduced) {
    const lineIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); lineIO.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll(".contact__title").forEach((t) => lineIO.observe(t));
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Project tilt ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const media = card.querySelector(".project__media");
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        media.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
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
        const dur = 1600; const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + "+";
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }
})();
