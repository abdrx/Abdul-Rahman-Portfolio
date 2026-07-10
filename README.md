# abdrx portfolio

Personal site for Abdul Rahman S. Static HTML, no build step.
Light and dark themes. Each app has its own project page.

## Structure
```
index.html                     main portfolio
Abdul_Rahman_Resume.pdf         linked by the Résumé buttons
assets/
  site.css                      shared styles + the theme system
  *.png, *.jpg                  app screenshots, per project
projects/
  shypv-platform.html           Shypv Platform case study (flagship, live links)
  mince-n-chop.html             Mince N Chop case study
  society-app.html              Society Manager case study
  campus-events.html            Campus Events case study
```

## Live site
Repo: `github.com/abdrx/Abdul-Rahman-Portfolio`

To publish with GitHub Pages:
1. On GitHub: **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
2. Wait a minute. Live at `https://abdrx.github.io/Abdul-Rahman-Portfolio/`.

Want it at the bare `https://abdrx.github.io` instead? Rename this repo to `abdrx.github.io`
(Settings → General → Repository name) — Pages picks that up automatically, nothing else changes.

### Custom domain (optional)
Buy a domain, add a `CNAME` file with the domain name, point DNS at GitHub Pages.
Settings → Pages shows the exact records once Pages is on.

## Themes
The site follows the visitor's system setting first, and remembers their choice
after they tap the sun/moon in the top bar.

## Add a new app later
1. Drop its screenshots into `assets/`.
2. Copy `projects/campus-events.html`, rename it, and swap the title, text, and image paths.
3. Add one card in `index.html` under the projects grid that links to it.
That's the whole pattern. Nothing else to wire up.

## Notes
- Phone number is left off on purpose since the page is public.
- GitHub section pulls a live contribution graph for `@abdrx` and links `@abdrx`,
  `@abdrx2025`, `@abdul` and `@intermo`. Update the handle list in `index.html` if that changes.
