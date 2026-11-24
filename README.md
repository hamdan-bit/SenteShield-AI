# SenteShield · Signal Workspace

**Pause. Check. Stay protected.**

SenteShield is a privacy-conscious **Uganda-focused message and suspicious link warning app** for SMS, WhatsApp and mobile money requests. It looks for warning signs and gives practical next steps. It does **not** authenticate senders, verify transactions or guarantee safety.

## Brand identity

Original SenteShield SVG shield-and-S brand mark, matching favicon and light/dark horizontal wordmarks. See [BRAND_GUIDE.md](BRAND_GUIDE.md) for assets and colors.

## Features

- Responsive, keyboard-accessible dashboard with midnight and daylight themes
- Interactive message scanner with four sample scenarios
- **Link scanner** for investment, referral and prize URLs: inspects the address and any surrounding offer text without opening the destination
- Scam warning signals for hidden URLs, possible brand lookalikes, guaranteed returns, deposits, sign-in requests and recruitment pitches
- Optional Google Cloud Web Risk threat-list lookup for known malware and social-engineering URLs (separate API key required)
- Four *fictional* link demos including Hut 8-style imitation and referral schemes, plus a normal HTTPS example
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
3. `api/health.js`, `api/analyze.js`, and `api/check-link.js` are Node.js serverless functions.
4. Under **Settings → Environment Variables**, add `GEMINI_API_KEY` as a **secret** and optionally `GEMINI_MODEL` (default: `gemini-3.8-flash`).
5. **Optional threat reputation:** Enable Google Cloud Web Risk in your own Google Cloud project, configure billing/quotas, and add `WEB_RISK_API_KEY` as a server-only environment variable. Without this, link scans perform URL and offer-pattern checks, explicitly reporting that no threat-list lookup happened. With the key, SenteShield submits the link to Google’s fixed Web Risk lookup endpoint, not to the destination website. Web Risk can incur charges; see Google Cloud pricing.
6. Redeploy after changing environment variables. Visit `/api/health`, then scan an example on the live site.
7. A successful health response only proves that a key is configured, **not** that the model key works. Scan a message and confirm the result says **Detailed message check**.

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
| `api/check-link.js` | Vercel link-check endpoint |
| `link-service.js` | URL structure, offer pattern warnings and optional Web Risk lookup |
| `analysis-service.js` | Model prompt and fallback handling |
| `logic.js` | Masking, signals and normalized results |
| `server.js` | Local or Render Node server |
| `test/` | Automated logic, API and UI-structure checks |

## Privacy and scope

- The input is never written to an app database. The browser stores only current-tab result summaries in memory; a refresh clears them.
- The app stores theme and motion preferences in browser local storage, but **not message text**.
- On **Check message**, the server masks some common phone, email and code patterns. **Masking can miss information. Remove sensitive details yourself** before submitting anything.
- Link checks never open the supplied website, follow redirects, embed it, scrape it or download files. The link and offer text are sent to SenteShield’s server for analysis.
- If Web Risk is configured, the full submitted URL is sent to Google for a threat-list lookup. Remove sensitive URL parameters before submitting. Links with likely auth tokens or private IPs are excluded from this optional lookup. A no-match does not establish safety.
- A detailed message check sends masked text to the external model provider. Consider its data handling terms before entering private content.
- The in-memory request guard is a small abuse deterrent, not a distributed production rate limiter.
- Low risk does **not** mean a message, link or sender is verified safe.

## Tests

```bash
npm test
```

The suite includes parsing, masking, deterministic assessment, API contracts and frontend structure. The live provider response must be tested separately with a valid private key.

License: MIT. See [LICENSE](LICENSE).

## Interpreting link results

- **Strong warning signs**: highly suspicious URL structure, investment offer, or a listed Web Risk threat. Do not enter credentials or pay.
- **Needs closer review**: one or more cautionary patterns; verify the company, URL and financial licensing independently.
- **No strong signals found**: the limited information did not trigger major patterns; this is **not** a guarantee the site is trustworthy.
- If Google Web Risk is not configured, the interface explicitly says **Not enabled**. It never claims a reputation lookup occurred. Even when enabled, its threat lists are not a complete database of fraudulent investment schemes.

This project uses fictional demo domains ending in `.example`; they are not real scam URLs or accusations against any existing domain. The genuine Hut 8 company uses `hut8.com`; Ugandan authorities warned about offers impersonating that brand. See [Uganda Police reporting](https://www.monitor.co.ug/uganda/news/national/police-probe-alleged-hut-8-online-investment-fraud-as-investors-face-withdrawal-losses-5562938) and [Hut 8's filed website address](https://www.sec.gov/Archives/edgar/data/1964789/000110465926019392/hut-20251231x10k.htm).
