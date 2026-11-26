---
name: headless-woocommerce-nextjs
description: Guides architecture, API proxy setup, server-side pricing and payment verification, fail-closed webhooks, authentication hardening, RAG shopping concierge integration, and production verification for headless WooCommerce storefronts built with Next.js App Router and TypeScript. Use when creating, auditing, or extending a decoupled Next.js + WooCommerce e-commerce website.
---

# Headless WooCommerce + Next.js App Router Playbook

Build and harden decoupled Next.js (App Router) storefronts backed by WordPress/WooCommerce, online payments (Razorpay + UPI/COD), customer auth, SMS notifications, and an optional AI shopping concierge.

## 1. Non-Negotiable Architecture Rules

1. **Strict Backend-for-Frontend (BFF) Proxy**:
   - Never expose `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`, `WC_APP_USER`, `WC_APP_PASSWORD`, `RAZORPAY_KEY_SECRET`, `SESSION_SECRET`, `HTTPSMS_API_KEY`, or `NVIDIA_API_KEY` to client components.
   - Keep all WooCommerce, Razorpay, SMS, and AI calls inside `app/api/**` or server-only modules under `lib/`.
   - Pass WooCommerce Basic Auth in the HTTP `Authorization: Basic` header over HTTPS (`lib/api/client.ts`), never as `consumer_key` / `consumer_secret` URL query parameters (which leak into logs, proxies, and error traces).
2. **Zero Client Trust at Checkout**:
   - Client carts supply only `{ product_id, quantity }` and optional `coupon_code`.
   - Always recompute item unit prices, stock availability, coupon eligibility (`date_expires`, `usage_limit`, min/max spend, included/excluded products, sale exclusions), shipping fees, and payable total on the server before creating a Razorpay order or WooCommerce order.
3. **Fail-Closed Auth & Webhooks**:
   - Production must fail closed (`throw` or return `500`) if `SESSION_SECRET` or webhook secrets are missing; never fall back to static hardcoded secrets or keys belonging to another service.
   - Verify HMAC signatures and ID tokens server-side; never decode JWT payloads without verifying signatures against the identity provider.

## 2. Standard Directory Layout

```text
app/
  page.tsx, shop/, product/[slug]/, cart/, checkout/, wishlist/, account/, invoice/[id]/
  api/
    auth/         # login, signup, logout, me, forgot-password, firebase-session, google OAuth
    account/      # profile, address, password (authenticated session required)
    products/     # catalog listing & filters (server-cached proxy)
    search/       # product search proxy
    coupons/      # coupon lookup & validation
    orders/       # create (COD/UPI), inspect (owner or verified guest), patch billing
    payment/      # create-order (server total) & verify (HMAC signature + idempotent confirm)
    webhooks/     # product sync, woocommerce orders, razorpay payment.captured (fail-closed)
    invoice/[id]/download/  # server-generated PDF (owner session or scoped HMAC order token)
    assistant/    # AI shopping concierge endpoint
    media/[...path]/ # same-origin image proxy for WP uploads with strict path checks
    sync-policies/   # bearer-protected admin route to sync policy docs to vector DB
lib/
  api/            # WooCommerce typed REST client (products, orders, customers, reviews)
  auth/           # HMAC-SHA256 httpOnly session cookies + scoped guest order tokens
  firebase/       # Firebase client config (public keys only, fail gracefully if unset)
  payment/        # Razorpay wrapper, server pricing engine, pending cache, idempotent confirm
  rag/            # Agentic concierge, local catalog/policy tools, optional static fallback
  security/       # Bounded in-memory IP rate limiter
  sms/            # E.164 normalization & httpSMS/gateway notifications
  utils/          # Formatters, HTML-escaped invoice template, pdf-lib PDF builder
store/            # React Contexts (Auth, Cart, Wishlist, Theme, Toast)
content/policies/ # Versioned JSON policy sources for pages & AI RAG
scripts/          # Policy/product vector sync, image optimization, icon generation
```

## 3. Step-by-Step Build & Hardening Workflow

### Step 1: WooCommerce REST Client & Media Proxy
- Build one centralized server client (`lib/api/client.ts`) encoding `WC_CONSUMER_KEY:WC_CONSUMER_SECRET` in `Authorization: Basic ...` over `https://`.
- Use Next.js `fetch(..., { next: { revalidate } })` on read-only catalog queries and `cache: 'no-store'` on customer, order, coupon, and stock-sensitive reads.
- If WordPress media URLs need masking or consistent caching, expose `app/api/media/[...path]/route.ts` and reject empty paths, `..` traversal, backslashes, or non-allowlisted characters before proxying only from `${NEXT_PUBLIC_WC_URL}/wp-content/uploads/`.

### Step 2: Customer Sessions, OAuth & Scoped Guest Tokens
- Store customer identity in an `httpOnly`, `sameSite: 'lax'`, `secure` (in production) cookie signed with `crypto.createHmac('sha256', getSessionSecret())` and checked with `crypto.timingSafeEqual`.
- Implement Firebase/Google verification strictly server-side (`identitytoolkit.googleapis.com/v1/accounts:lookup` for Firebase ID tokens, or Authorization Code flow with a single-use `httpOnly` CSRF `state` cookie for Google OAuth).
- Issue a short-lived scoped HMAC token (`createOrderAccessToken(orderId, email)`) alongside guest order responses so guest customers can download their PDF invoice without opening an IDOR hole for other orders.
- Keep login and password-reset error responses uniform so callers cannot enumerate whether an email exists.

### Step 3: Server-Verified Checkout, Razorpay & Webhooks
- Extract one shared pricing helper (`lib/payment/pricing.ts`) called by `POST /api/payment/create-order`, `POST /api/orders`, and payment confirmation (`confirmRazorpayOrder`).
- Store checkout details + Razorpay `notes` (compact SKU list, coupon, phone, address) and run `confirmRazorpayOrder()` **idempotently** from both `POST /api/payment/verify` (browser callback) and `POST /api/webhooks/razorpay` (`payment.captured` server-to-server backup).
- Lock every webhook (`webhooks/razorpay`, `webhooks/woocommerce/orders`, `webhooks/product`) so missing secret -> `500` and missing/invalid HMAC signature header -> `401`. Never leak raw upstream errors to external webhook callers.

### Step 4: Storefront UX, PDF Invoices & PWA Safety
- Keep checkout usable offline/on spotty mobile networks cleanly, and optionally pair browser Geolocation with OpenStreetMap Nominatim reverse geocoding (client-side user gesture) to auto-fill city/state/pincode.
- Generate downloadable GST/Tax invoices server-side with `pdf-lib` and HTML-escape every customer/product string in any HTML invoice view.
- In `public/sw.js`, configure **network-only** (never cache!) for `/api/`, `/account`, `/checkout`, `/invoice`, `/login`, `/signup`, `/cart`, and `/wishlist`, plus any `Set-Cookie` responses.

### Step 5: Cost-Controlled AI Shopping Concierge
- Route frequent queries through an in-memory normalized response cache first (0 LLM tokens), handle single-intent catalog/policy lookups with 1 compact LLM call grounded in live WooCommerce product data, and reserve multi-step tool calling for complex queries.
- Never share server-global conversation memory objects across users; accept bounded stateless client message history (cap message length & turn count).
- Protect `/api/sync-policies` POST routes with `Bearer ${ADMIN_SYNC_SECRET}` using `crypto.timingSafeEqual`.

### Step 6: Verification Gate Before Deploying
Run the full verification sequence on every security or feature change (and inspect `references/security-checklist.md` in full before shipping):
1. Remove stale generated `.next/types` when routes are deleted, regenerate types, verify TypeScript, and run production build:
   - `npx next typegen`
   - `npx tsc --noEmit`
   - `npx next build`
2. Scan source files and `git diff` for accidental hardcoded secrets (`AIza`, `rzp_test_`, `nvapi-`, `ck_`, `cs_`, WP App Passwords, fallback session secrets) before committing.
3. Configure strict response headers in `next.config.ts` (`poweredByHeader: false`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`) and allow only `https://` `images.remotePatterns`.
