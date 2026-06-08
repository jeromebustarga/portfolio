/* ============================================================
   Jerome Bustarga — It's Jerome's World
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;

  /* ---------- Image fallbacks (until real assets are added) ---------- */
  function handleFallback(img) {
    if (img.dataset.fallbackHandled) return;
    img.dataset.fallbackHandled = "1";
    if (img.dataset.fallbackIcon) {
      const i = document.createElement("i");
      i.className = "fa-solid " + img.dataset.fallbackIcon + (img.classList.contains("bulb-on") ? " bulb-icon" : "");
      img.replaceWith(i);
    } else if (img.dataset.fallbackLabel) {
      const wrap = img.closest(".project-visual");
      if (wrap) { wrap.classList.add("img-fallback"); wrap.setAttribute("data-label", img.dataset.fallbackLabel); }
      img.remove();
    } else {
      img.style.display = "none";
    }
  }
  document.querySelectorAll("img[data-fallback-icon], img[data-fallback-label]").forEach((img) => {
    img.addEventListener("error", () => handleFallback(img));
    if (img.complete && img.naturalWidth === 0) handleFallback(img);
  });

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById("preloader");
  const preCount = document.getElementById("preCount");
  const preBar = document.getElementById("preBar");
  function finishLoad() {
    document.body.classList.remove("loading");
    if (preloader) preloader.classList.add("done");
    startReveals();
  }
  if (prefersReduced) {
    if (preCount) preCount.textContent = "100";
    if (preBar) preBar.style.width = "100%";
    setTimeout(finishLoad, 200);
  } else {
    let n = 0;
    const dur = 1100, t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      n = Math.round((1 - Math.pow(1 - p, 2)) * 100);
      if (preCount) preCount.textContent = n;
      if (preBar) preBar.style.width = n + "%";
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(finishLoad, 250);
    };
    requestAnimationFrame(step);
  }
  setTimeout(finishLoad, 4000); // safety

  /* ---------- Hamburger menu ---------- */
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks = document.getElementById("navLinks");
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hamburgerBtn.classList.toggle("active");
      navLinks.classList.toggle("active");
    });
    navLinks.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => { hamburgerBtn.classList.remove("active"); navLinks.classList.remove("active"); })
    );
    window.addEventListener("click", (e) => {
      if (!e.target.closest("nav")) { hamburgerBtn.classList.remove("active"); navLinks.classList.remove("active"); }
    });
  }

  /* ---------- Icon dropdown ---------- */
  const iconDropdownBtn = document.getElementById("iconDropdownBtn");
  const iconMenu = document.getElementById("iconMenu");
  if (iconDropdownBtn) {
    iconDropdownBtn.addEventListener("click", (e) => { e.stopPropagation(); iconMenu.classList.toggle("show"); });
    window.addEventListener("click", (e) => { if (!e.target.closest(".icon-dropdown")) iconMenu.classList.remove("show"); });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal, .mask");
  let revealIO = null;
  function startReveals() {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      revealEls.forEach((el) => el.classList.add("in"));
      return;
    }
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("in"); revealIO.unobserve(entry.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => revealIO.observe(el));
  }

  /* ---------- Animated counters ---------- */
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
          const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
          el.innerHTML = val + '<span class="plus">+</span>';
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = el.classList.contains("social-link") ? 0.4 : 0.25;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Project card spotlight + tilt ---------- */
  if (fine && !prefersReduced) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -3;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 3;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("mouseleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Nav: logo swap + solid + hide on scroll ---------- */
  const nav = document.getElementById("nav");
  const logoNav = document.getElementById("logoNav");
  let lastY = window.scrollY, navHidden = false;
  function updateNav(y) {
    if (logoNav) logoNav.classList.toggle("scrolled", y > 100);
    if (nav) {
      nav.classList.toggle("solid", y > 40);
      const goingDown = y > lastY && y > 400;
      if (goingDown && !navHidden) { nav.classList.add("hidden"); navHidden = true; }
      else if (!goingDown && navHidden) { nav.classList.remove("hidden"); navHidden = false; }
    }
    lastY = y;
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (typeof Lenis !== "undefined" && !prefersReduced && !isTouch) {
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
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ---------- Unified scroll-driven engine ---------- */
  const progress = document.getElementById("scrollProgress");
  const marquee = document.getElementById("marquee");
  const shapes = document.querySelector(".floating-shapes");
  const heroInner = document.getElementById("heroInner");

  let mx = 0, my = 0, cx = 0, cy = 0;
  if (fine && !prefersReduced) {
    window.addEventListener("mousemove", (e) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  let marqueeX = 0, prevScroll = window.scrollY;
  if (!prefersReduced) {
    const tick = () => {
      const y = window.scrollY;
      const vel = y - prevScroll;
      prevScroll = y;

      updateNav(y);

      // Progress bar
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      }

      // Smooth mouse
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;

      // Floating shapes: gentle scroll + mouse parallax on container
      if (shapes) shapes.style.transform = `translate3d(${cx * 20}px, ${y * -0.06 + cy * 20}px, 0)`;

      // Hero parallax (drift up + fade as you scroll)
      if (heroInner) {
        const f = Math.max(1 - y / 700, 0);
        heroInner.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        heroInner.style.opacity = f;
      }

      // Marquee: drift + scroll-velocity boost
      if (marquee) {
        marqueeX -= 0.5 + Math.min(Math.abs(vel) * 0.35, 7) * Math.sign(vel || 1);
        const half = marquee.scrollWidth / 2;
        if (half > 0) marqueeX = ((marqueeX % half) + half) % half - half;
        marquee.style.transform = `translate3d(${marqueeX}px, 0, 0)`;
      }

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  } else {
    window.addEventListener("scroll", () => updateNav(window.scrollY), { passive: true });
  }

  /* ---------- Signature p5 cursor trail (desktop only) ---------- */
  if (!isTouch && !prefersReduced && typeof p5 !== "undefined") {
    new p5((p) => {
      let trails = [], particles = [];
      p.setup = () => {
        const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.position(0, 0);
        canvas.style("pointer-events", "none");
        canvas.style("z-index", "9998");
        canvas.style("position", "fixed");
        canvas.style("top", "0");
        canvas.style("left", "0");
        p.clear(); p.noStroke();
      };
      p.draw = () => {
        p.clear();
        for (let i = trails.length - 1; i >= 0; i--) {
          const pt = trails[i];
          p.fill(244, 121, 33, pt.alpha * 0.12); p.ellipse(pt.x, pt.y, pt.size * 4);
          p.fill(244, 121, 33, pt.alpha * 0.2); p.ellipse(pt.x, pt.y, pt.size * 2);
          p.fill(255, 255, 255, pt.alpha * 0.6); p.ellipse(pt.x, pt.y, pt.size);
          pt.alpha -= 3; pt.size *= 0.97;
          if (pt.alpha <= 0) trails.splice(i, 1);
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const part = particles[i];
          p.fill(244, 121, 33, part.alpha); p.ellipse(part.x, part.y, part.size);
          part.x += part.vx; part.y += part.vy; part.alpha -= 4; part.size *= 0.95;
          if (part.alpha <= 0) particles.splice(i, 1);
        }
        const d = p.dist(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
        if (d > 0.5) {
          const steps = p.max(1, d * 0.5);
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            trails.push({ x: p.lerp(p.pmouseX, p.mouseX, t), y: p.lerp(p.pmouseY, p.mouseY, t), size: p.random(5, 9), alpha: p.random(120, 160) });
          }
          if (p.random() > 0.7) {
            for (let j = 0; j < 2; j++) particles.push({ x: p.mouseX, y: p.mouseY, vx: p.random(-2, 2), vy: p.random(-2, 2), size: p.random(2, 4), alpha: p.random(80, 120) });
          }
        }
        if (trails.length > 500) trails.splice(0, trails.length - 500);
        if (particles.length > 100) particles.splice(0, particles.length - 100);
      };
      p.windowResized = () => p.resizeCanvas(p.windowWidth, p.windowHeight);
    });
  }
})();
