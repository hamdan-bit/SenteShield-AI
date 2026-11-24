# SenteShield AI — deployment guide

## Prerequisites
- Node.js 20+ on your computer for local development.
- A public GitHub repository.
- A Render account with access to that repository.
- A **newly generated** Gemini API key from https://aistudio.google.com/api-keys.

> Security: If an API key has been posted in chat, shared publicly, or committed, revoke/rotate it. Never put any key into source code or GitHub. This project does not ship with an API key.

## Run locally
1. Open the project folder in Cursor and inspect/edit it (the hackathon requires Cursor/Grok Bot).
2. Run `npm install` and `npm test`.
3. Copy `.env.example` to `.env` and add your **new private** `GEMINI_API_KEY`.
4. Run `npm start`, open http://localhost:3000 and try a sample message.
5. Check http://localhost:3000/api/health; `aiConfigured: true` means a key exists, not that the key has been tested.

## Upload to GitHub
1. Create a repository named `SenteShield-AI` (public if you are submitting to the hackathon).
2. In the project folder run:

```bash
git init
git add .
git commit -m "Launch SenteShield AI glass edition"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/SenteShield-AI.git
git push -u origin main
```

3. Do not commit `.env`, credentials, screenshots or `node_modules`.

## Deploy to Render
1. Render Dashboard → New → Web Service → Connect your GitHub repository.
2. Runtime: Node, region closest to your users, plan: Free if available.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Environment variables: `NODE_ENV=production`, `GEMINI_MODEL=gemini-3.8-flash`, and `GEMINI_API_KEY` = your **new secret**.
6. Wait until Render reports `Live` and check `https://YOUR-SERVICE.onrender.com/api/health`.
7. Scan an example and confirm it says `GEMINI AI ASSESSMENT`, not `RULE-BASED PREVIEW`. If Gemini is unreachable, the app falls back visibly to rule-based preview mode.

## Known limitations
- SenteShield detects warning signals in text; it cannot prove the authenticity of a sender, validate links or transactions, or block fraud.
- Automatic redaction is best-effort. Users must remove private data before analysis. A third-party AI provider receives the sanitized text only if configured.
- Basic in-memory rate limiting is included for demonstration, not a fully hardened production anti-abuse solution.
- Some Google AI Studio free-tier prompts may be used to improve the provider's products. Review their current terms before accepting sensitive input.
