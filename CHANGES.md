## Logo theme polish — November 24, 2026

- Changed the SenteShield mark to a **thin green outline with white fill in light mode**.
- Changed dark-mode styling to a **white outline with dark fill**.
- Embedded the sidebar mark inline so it reacts immediately to dashboard theme changes.
- Updated matching SVG assets, test assertions, and brand documentation.

## Brand identity refresh — November 24, 2026

- Original shield-and-S SVG logo inspired by the icon + wordmark approach reviewed on BrandCrowd; no third-party template copied.
- Matching favicon and horizontal versions for dark/light backgrounds.
- Sidebar uses the new scalable mark; styling works in both interface themes.
- Added [BRAND_GUIDE.md](BRAND_GUIDE.md) and SVG asset regression tests.

# SenteShield — Release 4.0: Link Intelligence

**Date:** 24 November 2026  
**Branch:** `main`  
**Focus:** Detect potential investment/referral website scams, without opening untrusted links.

## New features

- Added a dedicated **Link scanner** destination in dashboard navigation and a mobile-friendly workspace for checking URLs or WhatsApp messages that contain URLs.
- Optional offer description lets users add the investment pitch. This improves risk assessments when the URL alone reveals little.
- Shows a non-clickable destination preview and a clear **Not opened** indicator.
- Added synthetic demonstration cases for a Hut 8-like fake investment pitch, MYD-like referral earnings, shortened links, and an ordinary public HTTPS URL. Demo links use reserved `.example` domains.
- Added address-pattern checks for domain lookalikes, encoded international domains, misleading `@` usernames, shorteners, IPs, non-HTTPS schemes, excessive subdomains, and suspicious query parameters.
- Added evidence-based investment-pitch checks for promises of guaranteed returns, upfront deposits, recruitment commissions and account credentials.
- Added an explicit warning on Hut 8-named domains that are not on the company-published `hut8.com` domain; does not accuse the legitimate company of wrongdoing.
- Added optional **Google Cloud Web Risk** threat-list lookup through a fixed API endpoint. No submitted link is fetched, redirected to, embedded, or visited. Web Risk requires its own separately configured server-side key. Its absence and errors are displayed transparently.
- Added noncommittal risk labels, transparent analysis methods, share/copy advice and session-only link assessment summaries.
- Updated the existing Help/Privacy dialog to cover URL handling and third-party threat checks.

## Engineering & tests

- New files: `link-service.js`, `api/check-link.js`, `test/link-service.test.js`, `test/link-api.test.js`.
- Updated: `public/index.html`, `public/styles.css`, `public/app.js`, `server.js`, `api/health.js`, `README.md`, `DEPLOYMENT.md`, `.env.example`, `package.json`, UI tests.
- 31 automated tests passed including Web Risk mock hits, missing match, errors, SSRF-style address cases, URL validation, and Vercel API responses.
- Browser mock-interaction review at 320px, 390px, 768px and 1440px; no page JavaScript errors or horizontal overflow.
- Earlier message scanner and its Gemini integration remain intact.

## Important limits

- The link scanner is **not** a guarantee that a site is safe, nor a legal finding that an operator committed fraud. Many scam sites can look ordinary.
- The free/basic mode checks URL patterns and claims, not live page content, domain age or official business registration.
- A Web Risk no-match only means that no queried Google threat list matched that URL at the time of checking; investment fraud is not comprehensively listed.
- No user credentials or private tokens are required. Remove sensitive details before submitting.

---

# SenteShield — Release 3.0: Signal Workspace

**Date:** 24 November 2026  
**Branch:** `main`  
**Release focus:** Convert a single-screen scam checker into an interactive, responsive product workspace.

## Experience and layout

- Reworked the website into an original dashboard shell with sidebar navigation, contextual header, scanner, recent checks and safety guide.
- Replaced marketing-heavy sections with a direct action: **Pause. Check. Stay protected.**
- Built a new 2-column message composer and real-time pattern radar, with a single-column mobile layout.
- Added a visual shield motif, understated animated rings, status indicators, polished hover states and subtle page transitions.
- Designed a controlled color system: midnight navy, mineral green, mint, subdued lilac and warm warning colors. High-contrast typography and distinctive risk colors remain clear when motion is disabled.
- Added a daylight theme in Preferences, plus a reduced-motion setting.
- Introduced a custom SVG favicon; no icon or animation library is required.

## Features and working controls

- On-device signal hints update instantly as a user edits a message. No network request occurs until they choose **Check message**.
- Four interactive sample messages (blocked account, prize, fake official, ordinary text) help new users understand the scanner.
- Detailed message scanning with a visible basic check when the model service is not configured or fails.
- New scanning overlay with a Cancel action, timeout handling, inline errors, toast feedback and loading state.
- Results include risk category, signs, next steps, copy, share and a New check action.
- Recent checks appear in session memory **without storing original message text**, with a confirmation dialog to clear them. This history disappears on refresh or close.
- Dedicated safety guide with four expandable scenarios and actionable advice.
- Accessible native dialogs for Help, Privacy, Preferences and clearing session history.
- Mobile navigation drawer with scrim, keyboard focus states, safe-area spacing and viewport-specific layouts.
- Privacy wording explains that detailed checks process masked text through an external model provider. Automated masking is not perfect.
- Changed stale-result handling: editing a message or changing language hides the old assessment until a new scan is completed.

## Engineering and compatibility

- Preserved the dependency-free HTML/CSS/JavaScript frontend and Node.js 20+ server.
- Preserved the existing Vercel routes at `api/health.js` and `api/analyze.js`, plus the shared analysis layer.
- Kept sensitive environment variables on the server; no credentials were added to public files.
- Added tests for UI markup, responsive rules and required interaction hooks.
- Kept source text insertion safe by using `textContent` rather than interpolating messages into HTML.
- Kept styling and logic self-contained. No proprietary React Bits components were copied.

## Verification performed

- Unit tests: `npm test`.
- JavaScript syntax: `node --check`.
- Local Node server: HTTP 200 for root and styling.
- Headless Chromium layout review at 320px, 390px, 1024px and 1440px. No horizontal overflow.
- Browser flow checks: mobile navigation; sample selection; scanner; results; help dialog; settings theme/motion; accordion; recent checks; confirmation to clear.

## Limitations and launch checks

- Risk labels are cautionary text assessments; the application cannot verify sender identities, payment transactions or URLs.
- The in-process request limiter is not a distributed production-grade abuse-control system.
- Browser tests used a simulated analysis response; a genuine Gemini request needs a **new, private** API key and a live check.
- Live production availability and Vercel deployment should be checked after the GitHub commit is built.
- Before broad public use, perform external security review, accessibility audit with assistive technology and real-device testing.

## Reference research

- [React Bits Pro App UI](https://pro.reactbits.dev/docs/app-ui): dashboard composition, well-formed panels, modal and settings patterns. **Original implementation**, not premium component source.
- [Figma color combinations](https://www.figma.com/resource-library/color-combinations/): coherent primary/accent palette and readable contrast.
- [CSS Design Awards animated gallery](https://www.cssdesignawards.com/website-gallery?feature=animated): restrained motion and transition inspiration.
