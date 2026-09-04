# Korea Telco Advanced Technology Radar

Static site for the Korea Telco Advanced Technology Radar, designed for Cloudflare Pages.

## Layout

- `index.html` — landing page
- `latest.html` — latest structured brief viewer
- `reports/YYYY-MM-DD.html` — immutable daily report pages
- `data/YYYY-MM-DD.json` — immutable daily structured data
- `data/latest.json` — latest report data
- `assets/style.css` — shared visual system
- `assets/app.js` — client-side renderer

## Cloudflare Pages

Recommended settings:

- Framework preset: None
- Production branch: `main`
- Build command: `exit 0`
- Build output directory: repository root (the directory containing `index.html`)

Connect this repository to Cloudflare Pages and then add your custom domain, for example `radar.example.com`.

## Daily automation

The ChatGPT task `Korea Telco 技术雷达` has been configured to:

1. Generate the Chinese daily brief.
2. Produce structured JSON + daily HTML.
3. Preserve historical daily files.
4. Update `data/latest.json`, `latest.html`, and `index.html`.
5. Commit new daily artifacts to `fd-Joker/korea-telco-radar` when the repository is writable.

The initial `data/latest.json` is a non-factual placeholder so the site can deploy before the first automated run.
