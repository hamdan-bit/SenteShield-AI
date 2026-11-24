# SenteShield — interface and functionality update

**Date:** 24 November 2026  
**Purpose:** Move from a long promotional landing page to a focused, mobile-first message scanner.

## User experience

- Moved the scanner into the first screen on desktop and immediately after a short introduction on mobile.
- Removed the large decorative phone mockup, scrolling marketing sections, repeated feature claims, numbered process cards and promotional AI captions.
- Replaced long explanatory copy with one clear headline, one sentence, a message field, and a visible primary action.
- Kept a glass-style midnight navy / mint visual system with fewer blur layers, clearer text hierarchy, larger tap areas and responsive layouts.
- Retained English and Luganda result-language options and realistic fictional sample messages.
- Added instant, **local** warning-sign feedback while typing: security-code mentions, urgency, payment requests, reward claims, and links. These are regex-based clues, not AI verdicts.
- Added distinct ready, basic-check and offline connection labels; loading states, keyboard shortcut (Ctrl/Cmd + Enter), error feedback, clipboard paste, reset, copy and mobile sharing.
- Reduced risk-result copy to a summary, potential signals, and clear next actions.
- Kept key safety and privacy disclosures in the scanner and a small expandable safety section. Low risk is never represented as verified safe.
- Honored reduced-motion preferences; added semantic labels, keyboard focus states and accessible contrast fallbacks.

## Runtime and deployment

- Added `api/analyze.js` and `api/health.js`, Node.js Vercel Functions. This supports `/api/analyze` and `/api/health` when the site is hosted on Vercel, where the standalone `server.js` is not automatically used.
- Added `analysis-service.js` to share the Gemini analysis and rule-based fallback between local/Render hosting and Vercel.
- Preserved the `GEMINI_API_KEY` environment variable on the **server only**. No key is embedded in the client or committed to the repository.
- The UI distinguishes a detailed Gemini check from a quick rule-based check, so it does not present an offline fallback as a live AI assessment.
- Request length checks, a per-instance rate guard for the serverless endpoint, sensitive-data masking, and no message database were retained. The in-memory guard is not a globally enforced rate limit.

## Files changed

| File | Change |
| --- | --- |
| `public/index.html` | Rebuilt scanner-first page and concise content |
| `public/styles.css` | New responsive glass interface and reduced-motion support |
| `public/app.js` | Instant signals, streamlined scanning, results, and controls |
| `server.js` | Uses shared analysis service |
| `analysis-service.js` | New shared Gemini + fallback analysis logic |
| `api/health.js` | New Vercel health endpoint |
| `api/analyze.js` | New Vercel analysis endpoint |
| `test/api.test.js` | New tests for the Vercel route |
| `CHANGES.md` | This change record |

## Checks and limitations

- Run `npm test` for deterministic logic and Vercel route checks.
- Run `npm start` locally, then test `/api/health` and `/api/analyze` with sample text.
- Verify the deployed Vercel project uses the repository's `main` branch and is configured with `GEMINI_API_KEY` to enable detailed analysis.
- Live Gemini output cannot be verified without a privately configured, working API key. Basic checks are available without one.
- The scanner analyzes wording only. It does not inspect link destinations, verify a sender or guarantee that a message is safe.