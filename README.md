# abdrx portfolio

Personal site for Abdul Rahman S. Static HTML, no build step.
Light and dark themes. Each app has its own project page.

## Structure
```
index.html                     main portfolio
Abdul_Rahman_Resume.pdf         linked by the Résumé buttons
assets/
  site.css                      shared styles + the theme system
  ev-*.png, org-*.png           app screenshots
projects/
  shypv-platform.html           Shypv Platform case study (flagship, live links)
  mince-n-chop.html             Mince N Chop case study
  society-app.html              Society Manager case study
  campus-events.html            Campus Events case study
```

## Put it online (free, 5 minutes)

1. Make a GitHub repo named `abdrx.github.io`
   (this exact name gives you `https://abdrx.github.io`).
2. Upload everything, keeping the folders: `index.html`, the PDF,
   the `assets` folder, and the `projects` folder.
3. Settings > Pages > Source: `Deploy from a branch`, branch `main`,
   folder `/ (root)`. Save.
4. Wait a minute. Live at `https://abdrx.github.io`.

Easiest path: unzip `abdrx-portfolio.zip`, then drag the whole set
into the repo in one go.

## Themes
The site follows the visitor's system setting first, and remembers
their choice after they tap the sun/moon in the top bar.

## Add a new app later
1. Drop its screenshots into `assets/`.
2. Copy `projects/file-organizer.html`, rename it, and swap the title,
   text, and image paths.
3. Add one card in `index.html` under the projects grid that links to it.
That's the whole pattern. Nothing else to wire up.

## Update before you ship
- LinkedIn link is a guess (`linkedin.com/in/abdrx`). Search and fix
  it in `index.html`.
- GitHub points to `github.com/abdrx`. Change if your username differs.
- Tech tags on the two app pages (Flutter, Android, Maps API) are my
  best guess from the screens. Edit them to match what you actually used.
- GitHub section links @abdrx, @abdrx2025, @abdul and @intermo, and pulls
  the live contribution graph for @abdrx. Set the primary handle by editing
  the ghchart URL and the handle list in index.html, and remove any account
  that is not yours.
- Phone number is left off on purpose since the page is public.

## Custom domain (optional)
Buy a domain, add a `CNAME` file with the domain name, point DNS at
GitHub Pages. Settings > Pages shows the exact records.
