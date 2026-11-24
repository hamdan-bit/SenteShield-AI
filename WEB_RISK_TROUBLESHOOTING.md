# Web Risk troubleshooting

The Link scanner shows **Unavailable** if the Google Web Risk request fails. The URL and offer-pattern assessment still works, but that does not verify a link is safe.

## Owner checklist

1. In [Google Cloud Console](https://console.cloud.google.com/), select the **same project that created the API key**.
2. Check that [Web Risk API](https://console.cloud.google.com/apis/library/webrisk.googleapis.com) is **Enabled** and the project has an active billing account.
3. In [Credentials](https://console.cloud.google.com/apis/credentials), verify the key's **API restrictions** allow **Web Risk API**. A server-side Vercel Function should not use HTTP referrer restrictions; configure appropriate server-side restrictions.
4. In Vercel Project → Settings → Environment Variables, verify `WEB_RISK_API_KEY` exists for **Production** and redeploy after changes.
5. On the live site scan a harmless URL such as `https://www.google.com`, then inspect Vercel **Runtime Logs** for `/api/check-link`.

## New safe diagnostics

The server now logs only `HTTP <status>, category <allowlisted Google status>` or `TIMEOUT` / `NETWORK_OR_RESPONSE_ERROR`. It does **not** log the URL, API key, or raw Google error message.

- **HTTP 400**: usually invalid input or key/request issue.
- **HTTP 401/403**: check key validity, Cloud API enablement, billing, and restrictions.
- **HTTP 429**: quota or rate limits.
- **HTTP 5xx**, **TIMEOUT**, or **NETWORK_OR_RESPONSE_ERROR**: retry and check connectivity/provider availability.

Never paste the API key into a support conversation, public log, or GitHub commit. A lookup with **No listed match** is not proof of safety.

Documentation: [Google Web Risk Lookup API](https://docs.cloud.google.com/web-risk/docs/lookup-api) and [API key restrictions](https://docs.cloud.google.com/docs/authentication/api-keys).
