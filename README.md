# SenteShield · Signal Workspace

**Pause. Check. Stay protected.**

SenteShield is a privacy-conscious **Uganda-focused message scam warning app** for SMS, WhatsApp and mobile money requests. It looks for warning signs and gives practical next steps. It does **not** authenticate senders, verify transactions or guarantee safety.

## Features

- Responsive, keyboard-accessible dashboard with midnight and daylight themes
- Interactive message scanner with four sample scenarios
- Instant browser-only pattern radar as you type
- Server-side Gemini message assessment with a clearly labeled rules-based fallback
- Risk summary, warning signs, recommended actions, copy and sharing
- Recent assessment summaries in **tab memory only**; original messages are not saved in history
- Expandable safety guide and Help / Privacy / Preferences dialogs
- Reduced-motion support, mobile navigation and scan cancellation

See [CHANGES.md](CHANGES.md) for release details and [DESIGN_NOTES.md](DESIGN_NOTES.md) for the design rationale.

## Run locally

Use Node.js 20 or later. In Cursor or VS Code, open this repository folder and run:

```bash
npm install
npm test
npm start
```

Open http://localhost:3000. The application can display a **Quick check** without a model key; this uses deterministic rules and is labeled as such. For detailed model analysis, copy `.env.example` to `.env` and insert a newly generated `GEMINI_API_KEY`. Never commit `.env` or expose the key in a browser.

## Deploy with Vercel

1. Connect `hamdan-bit/SenteShield-AI` to your Vercel project (or use the existing Git integration).
2. Project root: repository root `./`. Framework preset: **Other**. No custom frontend build is required; `public/` provides static assets.
3. `api/health.js` and `api/analyze.js` are Node.js serverless functions.
4. Under **Settings → Environment Variables**, add `GEMINI_API_KEY` as a **secret** and optionally `GEMINI_MODEL` (default: `gemini-3.8-flash`).
5. Redeploy after changing environment variables. Visit `/api/health`, then scan an example on the live site.
6. A successful health response only proves that a key is configured, **not** that the model key works. Scan a message and confirm the result says **Detailed message check**.

If a key was previously posted in chat or another public place, revoke it and generate a replacement. Never put credentials in `public/`, `.md` files or code commits.

## Alternative Node hosting

`npm start` runs `server.js`, which serves the same frontend and endpoints. `PORT` is read from the environment. `render.yaml` is included for the existing Render service.

## Key files

| Path | Purpose |
|---|---|
| `public/index.html` | Accessible app workspace and modal structure |
| `public/styles.css` | Responsive palette, glass surfaces, transitions and layouts |
| `public/app.js` | Navigation, live signals, scanner, session activity and dialogs |
| `public/favicon.svg` | Custom vector brand mark |
| `api/analyze.js` | Serverless analysis endpoint |
| `api/health.js` | Health and key-configuration status |
| `analysis-service.js` | Model prompt and fallback handling |
| `logic.js` | Masking, signals and normalized results |
| `server.js` | Local or Render Node server |
| `test/` | Automated logic, API and UI-structure checks |

## Privacy and scope

- The input is never written to an app database. The browser stores only current-tab result summaries in memory; a refresh clears them.
- The app stores theme and motion preferences in browser local storage, but **not message text**.
- On **Check message**, the server masks some common phone, email and code patterns. **Masking can miss information. Remove sensitive details yourself** before submitting anything.
- A detailed check sends masked text to the external model provider. Consider its data handling terms before entering private content.
- The in-memory request guard is a small abuse deterrent, not a distributed production rate limiter.
- Low risk does **not** mean a message, link or sender is verified safe.

## Tests

```bash
npm test
```

The suite includes parsing, masking, deterministic assessment, API contracts and frontend structure. The live provider response must be tested separately with a valid private key.

License: MIT. See [LICENSE](LICENSE).
