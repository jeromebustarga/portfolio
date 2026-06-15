# Jerome Bustarga — Portfolio

**It's Jerome's World** — the personal portfolio of Jerome Bustarga, a developer &
designer based in San Diego, CA. An awwwards-grade dark/orange experience built with
plain HTML, CSS and JavaScript — no framework, no build step — featuring a holographic
forest entry, a scroll-driven 3D fly-through, and a playable "warp zone".

🌐 **Live:** [jeromebustarga.com](https://jeromebustarga.com)

## ✨ Highlights

- **Click-to-enter preloader** (homepage only) — click the lightbulb to ignite the site
- **Hologram Forest entry** — you drop into a procedurally-built holographic forest, then
  scroll deeper as the hero grows in from center and the nav/logo/chapter rail appear
- **Motion tunnel** — frames stacked in z-depth that you fly the camera through on scroll
- **Warp zone** — an interactive, in-page playable section
- Lenis smooth scroll + a scroll-driven `requestAnimationFrame` engine
- Scroll-reveal animations via `IntersectionObserver`
- Custom blend-mode cursor + cursor light, magnetic buttons (auto-disabled on touch)
- Ember/atmosphere canvas, chapter navigation, scroll progress bar
- Fully responsive, accessible, and respects `prefers-reduced-motion`

## 🗂 Structure

```
portfolio/
├── index.html          # homepage — self-contained (inline CSS + JS); the only page
│                        #   with the click-to-enter preloader
├── about.html          # "My Story" long-read + intro animation
├── illustrations.html  # illustrations gallery + case-study modals
├── styles.css          # shared styling for the subpages
├── script.js           # shared interactions for the subpages
├── CNAME               # custom domain (jeromebustarga.com)
├── images/             # all media (images, video)
└── README.md
```

Notes:
- `index.html` is **fully self-contained** (its CSS and JS are inline).
- `about.html` and `illustrations.html` share `styles.css` and `script.js` (versioned
  with `?v=N` to bust caching).
- Subpage nav is **Home / About**, with **Contact** as a closable popup. The
  click-to-enter gate lives on `index.html` only.

## 🚀 Run locally

No build step. Serve the folder so cross-page links and assets resolve:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

> Opening a single file via htmlpreview works for previewing one page, but page-to-page
> navigation only works from a real host (local server or the live domain).

## ✏️ Make it yours

- **Homepage content & animations** → edit `index.html` (everything is in one file)
- **About / Illustrations content** → edit the respective `.html` files
- **Colors & type** → tweak the CSS custom properties (`--accent`, `--accent-light`,
  `--bg`, `--text`, `--serif`, `--sans`, …)
- **Media** → drop files into `images/` and reference them with relative paths
- **Social / contact links** → update the `href`s in the contact and footer sections

## 🌐 Deploy

Static — works on any host.

- **GitHub Pages** — Settings → Pages → deploy from branch. The included `CNAME`
  points the site at `jeromebustarga.com` (a custom domain can only be attached to one
  repo at a time).
- **Netlify / Vercel** — connect the repo or drag-and-drop the folder; no build command.
