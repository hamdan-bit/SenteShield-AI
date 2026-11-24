# Deployment — SenteShield Signal Workspace

## Vercel (primary)

The live project uses `https://sente-shield-ai.vercel.app/` when the Vercel project is correctly linked to `hamdan-bit/SenteShield-AI` and a deployment has succeeded.

1. Vercel Project → **Settings → Git**: confirm the GitHub repository and `main` branch.
2. Project root: `./`. Framework preset **Other**. The static site is under `public/`; serverless functions are under `api/`.
3. Under **Settings → Environment Variables**, create a **secret** `GEMINI_API_KEY` from a new private key. Optionally add `GEMINI_MODEL=gemini-3.8-flash`.
4. Deploy the latest `main` commit. A fresh deployment is required after environment variable changes.
5. Check `GET https://sente-shield-ai.vercel.app/api/health` for a 200 JSON response. `aiConfigured: true` indicates only that a key exists, not that it works.
6. On the live site, try one high-risk and one normal sample. A real Gemini response is labeled **Detailed message check**. When the provider is unavailable, a visible **Quick check · pattern-based** result is shown.
7. Verify layouts on a phone and desktop and test every dialog, results actions and history.

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
