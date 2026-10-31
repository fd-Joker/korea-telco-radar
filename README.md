# Korea Telco Advanced Technology Radar

Static intelligence portal for Korea telco advanced technology, designed for Cloudflare Pages.

## Sites

### Technology Radar — `radar.nrngr.com`

- `index.html` — landing page
- `latest.html` — latest structured brief viewer
- `reports/YYYY-MM-DD.html` — immutable daily report pages
- `data/YYYY-MM-DD.json` — immutable daily structured data
- `data/latest.json` — latest report data
- `assets/` — shared radar frontend

### Korea Advanced Technology Events — `events.nrngr.com`

The Events site lives in the `events/` directory and is intentionally stateful rather than daily-snapshot based.

- `events/index.html` — active/upcoming dashboard
- `events/archive/index.html` — completed-event archive
- `events/insights/index.html` — post-event insight index
- `events/event/index.html` — persistent event detail renderer
- `events/_redirects` — rewrites `/event/<stable-id>` to the detail renderer
- `events/data/events.json` — persistent event database; daily runs update only changed/new records
- `events/data/schema.json` — event record schema
- `events/assets/` — Events frontend

Event IDs are stable URL slugs and must never be changed after publication. Completed events remain in the same database and automatically appear in Archive. Post-event technical analysis is appended under each event's `insights` field, so the original event URL becomes a durable knowledge page.

## Cloudflare Pages deployment

Use the same GitHub repository for two Pages projects.

### Project 1 — Technology Radar

- Production branch: `main`
- Framework preset: None
- Build command: `exit 0`
- Build output directory: repository root
- Custom domain: `radar.nrngr.com`

### Project 2 — Events

- Production branch: `main`
- Framework preset: None
- Root directory: `events`
- Build command: `exit 0`
- Build output directory: repository root relative to the selected root directory
- Custom domain: `events.nrngr.com`

This monorepo setup lets both subdomains deploy independently from the same commit history.

## Event update policy

The event automation should:

1. Search Korea events daily using Korean and English sources.
2. Load the existing `events/data/events.json` before writing.
3. Add newly confirmed events without deleting previous records.
4. Update only fields that have changed (registration, agenda, speakers, dates, venue, sources, etc.).
5. Move lifecycle status through `watch → announced → registration_open → registration_closing → upcoming → ongoing → completed`.
6. Keep completed events permanently and preserve their stable event URLs.
7. Append post-event insights and related analysis to the same event record.
8. Never infer dates or registration details from previous-year events.

## Daily Technology Radar automation

The daily technology radar preserves historical report files and updates the current index/latest pointers. The Events database is a separate persistent dataset and should not be overwritten as a daily snapshot.
