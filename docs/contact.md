# Earth Communications backend

`api/contact.ts` is a Vercel Node.js Web Handler in the same Vite repository. No Express process or additional runtime dependency is required. `npm run dev` serves the frontend only; use Vercel's local development tooling or a Vercel preview to exercise the deployed route. The production Vite build alone does not validate Vercel provisioning.

## Contract

`POST /api/contact`, `Content-Type: application/json`, same-origin `Origin` header. JSON fields: `name` (1–100 chars), `email` (up to 254), `message` (1–5000), optional empty `website` honeypot. Unexpected fields are rejected. Body is limited to 24 KB even when Content-Length is missing. Plain-text email only, fixed server recipient and subject, validated Reply-To; no client-controlled recipients or HTML.

Success is HTTP 200 `{ "accepted": true }` **only after Resend returns an acceptance ID**. This confirms acceptance for processing, not inbox delivery. 400 invalid input, 403 origin, 413 oversized body, 415 content type, 429 rate limit (`Retry-After` seconds), 502 provider rejection, 503 missing configuration/dependency failure. Errors are generic; no message bodies or credentials are logged. Skip must not call the API. An aborted browser request cannot retract an email already accepted by the provider; avoid offering Skip while submission is pending.

## Server environment

Copy the variable names from `.env.example` into Vercel's environment settings. Never use `VITE_` prefixes or commit real `.env` files.

- `CONTACT_ORIGIN`: exact HTTPS origin without trailing slash, e.g. the chosen public domain. Configure preview separately if testing there.
- `CONTACT_FROM`: single plain email address on a Resend-verified sending domain.
- `CONTACT_TO`: single portfolio owner's recipient address.
- `RESEND_API_KEY`: server-only key scoped to sending from that domain.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: dedicated Upstash Redis REST endpoint and write token.
- `CONTACT_RATE_SECRET`: at least 32 cryptographically random characters for keyed hashing. Use a unique stable secret; rotating it resets per-sender/IP buckets.

The endpoint fails closed (503) until all settings exist. No deployment, provider account, verified domain, credential setup, or real message delivery has been performed by the automated tests. Deployment acceptance still requires setting these variables, confirming the route on Vercel, and an owner-authorized real email test.

## Abuse protection and privacy

Atomic Redis EVAL increments counters across function instances: 5 submissions per client IP/10 minutes, 3 per sender/hour, and 50 globally/hour. These conservative first-release caps can reject shared-network users; tune after measurement. IP uses Vercel's overwritten `x-vercel-forwarded-for` header; do not deploy this handler behind an arbitrary proxy that trusts client-supplied copies. Missing/invalid IP fails closed. Origin checking prevents cross-site browser submissions but is not authentication; direct HTTP clients can spoof it, so it is not the sole abuse control.

IP/email keys are HMAC hashes, expire within one hour, and store only counters. Raw name/email/message goes to Resend and the owner's mailbox for replying, not Redis. Configure provider/mailbox retention before launch and keep the displayed privacy notice accurate. Honeypot rejects simple bot submissions. Redis/provider outages fail closed. Fetch timeouts are 4/8 seconds. No automated retries; identical payload retries use a stable provider idempotency key (Resend retains keys for 24 hours), reducing duplicates after ambiguous network errors. Global cap limits email cost, but does not replace Vercel firewall controls against volumetric traffic or Redis request costs.

## Validation

`server/contact.test.ts` uses Node's real Request/Response and replaces every external fetch. It covers validation, methods, content type, origin, unavailable configuration, byte limits, abuse rejection, hashed limiter keys, idempotency, provider acceptance/rejection/malformed responses/timeouts. It never sends real email or contacts Redis. The Lua script uses atomic Redis commands; live provider/Redis integration remains an external-configuration check. Run `npm run test -- server/contact.test.ts`, `npm run typecheck`, and the repository quality gates.

Official integration references: [Vercel Web Handlers](https://vercel.com/docs/functions/functions-api-reference), [Vercel trusted request headers](https://vercel.com/docs/headers/request-headers), [Resend Send Email](https://resend.com/docs/api-reference/emails/send-email), [Upstash REST API](https://upstash.com/docs/redis/features/restapi).

The Lua rejection path clamps Retry-After to at least one second, including a counter with TTL 0 just before expiration. Unit tests mock Redis responses and do **not** execute Lua; a live Redis boundary/concurrency check remains pending external configuration.

## Browser security headers

`vercel.json` is the canonical header policy for all deployed paths. `server/securityHeaders.ts` reads that same policy for Vite's production `preview.headers`; the development server is unchanged. Production E2E asserts actual HTTP headers, checks normal scene/Pointer Lock/portfolio behavior for CSP violations, and verifies that an injected inline script is blocked. These checks validate the local production preview, not Vercel provisioning.

CSP restricts scripts and connections to the same origin. Rapier needs `wasm-unsafe-eval` for WebAssembly compilation; JavaScript `unsafe-eval` is not enabled. Inline styles are allowed for React/Fiber sizing and image zoom. Local images and small bundled data images are allowed; frames, objects and workers are blocked. Resend/Redis do not need browser CSP allowances because their calls are server-side. Future GLB decoders/workers or remote assets require a measured policy update rather than broad wildcards. Extra headers prevent MIME sniffing/framing, limit referrer details, and disable unused camera/microphone/geolocation access.
