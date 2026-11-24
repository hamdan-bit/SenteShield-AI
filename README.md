# SenteShield AI

**Think before you send.** A mobile-first web application that identifies warning signs in suspicious Uganda mobile-money messages. Built for the **Cursor Hackathon Kampala — AI for Local Impact**.

## What works

- Paste an SMS or WhatsApp message (10–1600 characters).
- With a Gemini API key: the server asks Gemini to generate a cautionary risk assessment, suspicious phrases and recommended steps.
- Without an API key: the app offers an **explicitly labelled rule-based demo**, never represented as live AI.
- Four samples: account-blocking, prize scam, ordinary text.
- Privacy: no messages are saved. The server redacts basic mobile numbers, emails and common PIN/OTP patterns before sending to Gemini. **Redaction is best-effort, not complete**. Ask users to remove private information themselves.
- Built-in per-IP rate limiting, basic security headers, no logins, no database.
- Responsive desktop/mobile interface.

## Local run — Windows/macOS/Linux

Install Node.js 20+; open this folder in **Cursor**, then run:

```bash
npm install
cp .env.example .env
# Edit .env to add GEMINI_API_KEY; on Windows PowerShell use: Copy-Item .env.example .env
npm start
```

Go to http://localhost:3000. If you do not yet have a Gemini API key, the interface will work in **rule-based demo mode**. For the competition, add a Gemini API key and verify the AI mode is active before recording your demo. Get the key from https://aistudio.google.com/api-keys.

`.env` example:
```
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.8-flash
PORT=3000
```

Google may change model availability. If Gemini responds 404 or unsupported model, select a currently available text model in Google AI Studio, then update `GEMINI_MODEL`. Current models and rate limits are shown in AI Studio.

## Tests

```bash
npm test
```

## Deploy to Render (free plan)

1. Push this **project folder contents** to a new public GitHub repository. Do **not** push `.env` or keys.
2. In [Render](https://dashboard.render.com), choose **New → Web Service**, connect GitHub, and select your repository. Alternatively, use the `render.yaml` blueprint in this repository.
3. Configure: Runtime **Node**, Build Command **`npm install`**, Start Command **`npm start`**, Instance **Free** (if available).
4. Set environment variables in Render: `GEMINI_API_KEY` (secret), `GEMINI_MODEL=gemini-3.8-flash`, `NODE_ENV=production`.
5. Deploy and check `https://YOUR-SERVICE.onrender.com/api/health` returns `aiConfigured: true`.
6. Test three sample messages through the live site and record your demo.

A Render free service may take time to wake after inactivity. Open the live link before your pitch.

## Hackathon submission checklist

- [ ] The project has been opened/edited and tested using **Cursor / Grok Bot**, as required by the event rules.
- [ ] Code changes were made during the permitted build window.
- [ ] Public GitHub repository URL.
- [ ] 2-minute-max demo video or working live URL.
- [ ] Submission form completed by 4:05 PM EAT, November 21, 2026.

## App architecture

```
Browser (HTML/CSS/JS) → Node HTTP POST /api/analyze → Gemini REST API
                      ↘ demo rule-checker (only when key absent)
```

## Scope and responsible use

This tool **does not authenticate senders**, detect fraud with certainty, access financial accounts, inspect devices, or guarantee that messages are legitimate. Users should independently verify through official provider channels. Keep your API key private. Never submit PINs or OTPs to the app.

## License

MIT — see LICENSE.

## 2026 design refresh
- Dark midnight, restrained lavender/mint glassmorphism palette with responsive navigation.
- Polished interactive message scanner, clipboard paste, four sample scenarios, analysis-language selector (English/Luganda), result review, risk ring, copy and native share.
- Keyboard accessible elements, accessible forms, 44px touch controls, and `prefers-reduced-motion` support.
- No external runtime dependencies: Node.js 20+ built-ins only.
- Model defaults to `gemini-3.8-flash`; verify availability in Google AI Studio.

Full GitHub and Render instructions: see `DEPLOYMENT.md`.
