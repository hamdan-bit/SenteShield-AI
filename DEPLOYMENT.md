# Deployment — SenteShield Signal Workspace

## Vercel (primary)

The live project uses `https://sente-shield-ai.vercel.app/` when the Vercel project is correctly linked to `hamdan-bit/SenteShield-AI` and a deployment has succeeded.

1. Vercel Project → **Settings → Git**: confirm the GitHub repository and `main` branch.
2. Project root: `./`. Framework preset **Other**. The static site is under `public/`; serverless functions are under `api/`. Link checks use `api/check-link.js`.
3. Under **Settings → Environment Variables**, create a **secret** `GEMINI_API_KEY` from a new private key. Optionally add `GEMINI_MODEL=gemini-3.8-flash`.
4. For optional malicious URL threat lists, enable Google Cloud Web Risk Lookup API and place `WEB_RISK_API_KEY` in **Settings → Environment Variables**. Google Web Risk sends submitted URLs to Google and may incur API charges; read the provider terms. Without a key, the link scanner still performs address and offer checks.
5. Deploy the latest `main` commit. A fresh deployment is required after environment variable changes.
6. Check `GET https://sente-shield-ai.vercel.app/api/health` for a 200 JSON response. `aiConfigured: true` indicates only that a key exists, not that it works.
7. On the live site, try one high-risk and one normal sample. A real Gemini response is labeled **Detailed message check**. When the provider is unavailable, a visible **Quick check · pattern-based** result is shown.
8. Verify layouts on a phone and desktop and test every dialog, results actions and history.

If `/api/health` is 404, verify that the `api/` folder was deployed, the correct repo/root was chosen, and the deployment completed successfully.

## Local development / other Node hosting

With Node.js 20+:

```bash
npm install
npm test
npm start
```

Open `http://localhost:3000`. If you have a replacement Gemini key, put it in a local `.env` (never in Git). `server.js` supports `PORT` and the same `/api` endpoints. Render can run `npm start` using the existing `render.yaml` configuration.

## Security and privacy

- Revoke **any** API key previously pasted into chat, public GitHub, or logs. Replace it in Vercel; never put it in source code.
- The client hints are on-device; detailed scans submit best-effort-masked text to the backend and then the configured model provider.
- No message database exists. The local Recent checks panel keeps result summaries in tab memory only; page reload clears it.
- The built-in in-process rate guard is not distributed and is insufficient as an independent high-volume production defense.
- This is a scam-warning assistant, not a bank or mobile money provider, and it cannot verify sender identity or payment authenticity.

See [README.md](README.md), [CHANGES.md](CHANGES.md) and [DESIGN_NOTES.md](DESIGN_NOTES.md).

## Verify the new Link scanner

1. Open the live website and choose **Link scanner** in the sidebar.
2. Select the *Investment offer* or *Referral scheme* fictional demo. Click **Inspect link**. A result should display high caution and clear reasons, not a blanket accusation.
3. Select *Ordinary link*. Expect no major indicators and an explicit warning that the site is not verified safe.
4. Verify `/api/check-link` responds to a POST with JSON containing `link`, and rejects unsupported methods.
5. If `WEB_RISK_API_KEY` is absent, the threat-list row must say **Not enabled**. If present, test a known published Google Web Risk test URL before interpreting results.
6. The code does not visit, load or follow submitted links. Results do not save full URLs in the browser activity timeline.
