# Axiom Technologies · India Office Options · Hosting Package

One static page plus one small serverless function. `index.html` is the whole dashboard. `functions/api/state.js` keeps one live copy of every edit (`/api/state`) for every viewer.

| File | Purpose |
|---|---|
| `index.html` | The dashboard. Do not rename. |
| `functions/api/state.js` | Cloudflare Pages Function. Needs one KV binding named `STATE`. Optional environment variable `RESET_PW` for a server-side reset check. |
| `_headers` | No caching on the page or the API; no search indexing; frame protection. |
| `.nojekyll`, `.gitignore` | Housekeeping for GitHub. |
| `deploy.sh` | Optional direct upload to Cloudflare Pages from Terminal (`npx wrangler login` first). |

Full steps are in `00 Read Me First · Handover.md`.
