# SenteShield

**Check the message. Keep the money.**

A mobile-first message scanner built for Uganda. It highlights suspicious language in SMS, WhatsApp and mobile money requests, then offers practical next steps. It does **not** verify the sender or guarantee a message is safe.

## What's new

The interface now puts the scanner first, removes long promotional sections, and shows instant, on-device warning signs as you type. Detailed server-side analysis is available when Gemini is configured. See [CHANGES.md](CHANGES.md) for the complete change record.

## Run locally

Requires Node.js 20 or newer. Open the project folder in VS Code or Cursor and run:

```bash
npm start
```

Visit **http://localhost:3000**. The CSS and JavaScript are in `public/`, and the Node server serves them at the site root. Run tests with `npm test`.

To enable detailed checks locally, copy `.env.example` to `.env` and put a **new private** Gemini API key in `GEMINI_API_KEY`. Never commit `.env` or share the key in chat. The example model is `gemini-3.8-flash`; adjust `GEMINI_MODEL` if your API access requires a different supported model.

## Deploy on Vercel

The repository contains static frontend files under `public/` and Vercel serverless functions under `api/`:

- `GET /api/health` — returns service health and whether a key is configured.
- `POST /api/analyze` — checks a message with Gemini when configured; otherwise returns a marked rule-based assessment.

Connect the GitHub repository to Vercel with Framework Preset **Other**, project root **`./`**, and no custom build command. Configure these server-side environment variables in your Vercel project:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Private key for detailed checks; leave absent for basic mode |
| `GEMINI_MODEL` | Optional model ID, for example `gemini-3.8-flash` |

Redeploy after changing the environment. Open `/api/health` and test sample messages using the deployed website. If the API returns `404`, verify that the Vercel project uses the correct repository branch and project root and that the `/api/` folder was included in the deployment.

**Important:** If you previously exposed a key publicly, revoke it and use a new one in Vercel's Environment Variables. Never store keys in `public/`.

## Render / other Node hosting

The standalone Node server is in `server.js`. Run with `npm start`; `PORT` is read from the environment. The `render.yaml` file is retained for Render deployments. The same `analysis-service.js` handles detailed analysis on both Node hosting and Vercel.

## How it works

1. A user pastes a message. The browser immediately highlights possible warning phrases *locally*, without contacting the server.
2. The user chooses **Check message**. A server endpoint validates length, masks common private details and submits text to Gemini if a private API key is configured.
3. The response contains a qualitative Low / Medium / High assessment, reasons and recommended actions. When Gemini is unavailable, a clearly marked rule-based quick check is used.

The app includes no account system or message database. Masking is incomplete and users should remove sensitive details before submitting. An in-memory rate guard helps limit repeated requests but is **not** a distributed abuse-prevention service.

## Testing

```bash
npm test
```

Test the live site on a phone and desktop, including all four sample messages, before sharing it widely. The automated suite checks parsing, masking, risk logic and Vercel route contracts. Live Gemini results require a valid private key.

## Responsible use

Do not enter PINs, passwords, OTPs, full account numbers or private conversations. Text analysis alone cannot confirm that a sender, number, URL or financial request is legitimate. Verify through independently located official provider channels.

License: MIT — see `LICENSE`.
