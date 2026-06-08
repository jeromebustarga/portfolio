# Jerome Bustarga — Portfolio

A modern, animated personal portfolio for a **designer & developer**. Built with plain
HTML, CSS and JavaScript — no build step, no dependencies — but styled to feel like
something out of Framer / Readymag: smooth scroll-reveal animations, a custom cursor,
magnetic buttons, tilt cards, an animated marquee, and counters.

## ✨ Features

- **Zero build** — open `index.html` and it just works
- Custom blend-mode cursor (auto-disabled on touch devices)
- Scroll-reveal animations via `IntersectionObserver`
- Magnetic buttons + 3D tilt project cards
- Animated marquee and number counters
- Scroll progress bar + sticky blurred nav
- Mobile menu with a clip-path reveal
- Fully responsive, accessible, and respects `prefers-reduced-motion`

## 🗂 Structure

```
portfolio/
├── index.html    # markup & content
├── styles.css    # all styling + animations
├── script.js     # interactions
└── README.md
```

## 🚀 Run locally

Just open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## ✏️ Make it yours

- **Text & projects** → edit `index.html` (hero, the `.project` cards, about, services)
- **Colors** → tweak the CSS variables at the top of `styles.css` (`--accent`, `--accent-2`, `--bg`, …)
- **Project thumbnails** → each card uses a gradient (`--c1`/`--c2`); swap for real images by
  replacing the `.project__media` background with an `<img>`
- **Social links** → update the `href`s in the Contact and footer sections
- **Stats** → change the `data-count` values in the About section

## 🌐 Deploy

Works on any static host:

- **GitHub Pages** — Settings → Pages → deploy from branch
- **Netlify / Vercel** — drag-and-drop the folder, or connect the repo (no build command needed)
