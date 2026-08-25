# Phase 0 — Zero-Cost Proof

## Objective

Prove that ACE can start on a ₦0 infrastructure budget without compromising the application architecture.

## Exit criteria

ACE Phase 0 is complete only when these are verified:

1. **Source control** — repository is private and versioned.
2. **Frontend** — a minimal ACE page deploys successfully.
3. **API** — browser can call a server-side Worker endpoint.
4. **Database** — Worker can perform a controlled D1 read/write test.
5. **Storage** — R2 path is validated for future media/assets.
6. **Bot protection** — Turnstile can protect an appropriate public endpoint.
7. **Authentication** — chosen auth path does not require paid SMS as a core dependency.
8. **Payments** — ₦899 payment flow and server-side verification path are technically feasible before being made a production dependency.
9. **AI** — controlled free/low-cost inference strategy is defined; unlimited free AI is not assumed.
10. **WhatsApp** — official channel-membership verification capability is proven or a fallback is selected before the CBT result gate depends on it.
11. **Content rights** — every textbook/past-question/web source category has a permitted-use strategy before ingestion.
12. **Migration** — each provider is behind a service boundary so it can be replaced later.

## First technical proof

```text
ACE Web
   ↓ HTTPS
ACE Worker API
   ↓
D1
   ↓
JSON response
```

The first deployed build should be intentionally tiny. Its purpose is infrastructure validation, not visual completion.

## Do not proceed if

- a required service unexpectedly requires a paid plan;
- a secret would have to be exposed in frontend code;
- WhatsApp membership verification is being assumed without proof;
- copyrighted content is being copied without an appropriate right to use it;
- premium status can be controlled by the client;
- the architecture becomes provider-specific.

## After Phase 0

Proceed to the architecture/data-model phase, then the first visual ACE milestone. Every major milestone is deployed for phone testing before the next major feature is built.
