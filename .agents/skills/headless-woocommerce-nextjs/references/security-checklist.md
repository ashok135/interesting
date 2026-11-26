# Headless WooCommerce + Next.js Production Security Checklist

Use this checklist when reviewing or shipping a headless Next.js storefront backed by WooCommerce.

## 1. Secrets & Configuration
- `.env.local` is gitignored and never committed; `.env.example` contains only placeholders.
- `SESSION_SECRET` is mandatory in production (>=16 chars, no hardcoded string fallback, never falls back to Razorpay/WC keys).
- Git history has zero leaked API keys or WordPress Application Passwords (if a key was ever committed, revoke and regenerate it immediately).
- WooCommerce credentials (`WC_CONSUMER_KEY` / `WC_CONSUMER_SECRET`) are sent exclusively in the `Authorization: Basic` HTTPS header, never appended to URL query params.
- Test/sandbox payment keys (`rzp_test_*`) and merchant UPI VPAs are read from `process.env`, never hardcoded in frontend JSX.

## 2. Authentication, OAuth & Rate Limiting
- All login, signup, forgot-password, password-change, OAuth, and Firebase-session routes pass through IP rate limiting with bounded map size (`MAX_TRACKED_IPS`) and proxy-safe IP extraction (`cf-connecting-ip` / `x-real-ip` preferred).
- Firebase token exchange (`POST /api/auth/firebase-session`) verifies ID tokens with Google Identity Toolkit (`accounts:lookup`) and fails closed on network/verification error (never trusts raw base64-decoded JWT claims).
- Google OAuth generates a cryptographic `state` stored in an `httpOnly` cookie and validates it on callback with `crypto.timingSafeEqual`. Dev auth mocks are disabled unless explicitly opted in during non-production development.
- Password change requires and verifies `currentPassword` for email/password accounts before updating WooCommerce customer records.
- Profile updates merge with existing customer `billing` fields so partial updates never erase saved shipping/billing addresses.

## 3. Checkout, Pricing & Order IDOR Protection
- `POST /api/orders` and `POST /api/payment/create-order` ignore client-supplied prices, discounts, shipping totals, and `customer_id`:
  - `customer_id` comes strictly from the verified session (`0` for guests).
  - Payment method is strictly whitelisted (`cod` / `bacs` for non-gateway orders).
  - Unit prices, stock status/quantity, coupon rules, and free-shipping thresholds come strictly from live WooCommerce data on the server.
- `confirmRazorpayOrder()` rejects payments whose captured Razorpay amount is lower than the server-verified order total.
- `GET /api/orders`:
  - Full PII returned only when authenticated email/customer ID matches the order, OR guest supplies an exact non-placeholder email, OR guest supplies >=10 phone digits matching the last 10 billing phone digits.
  - Otherwise returns only masked summary fields (`status`, dates, masked city/state/items without street/phone/email).
- `GET /api/invoice/[id]/download` & `app/invoice/[id]/page.tsx`:
  - Validate numeric order ID (`/^\d+$/`).
  - Require owner session OR valid scoped `invoiceToken` (`?token=...`) before serving full billing details or PDF.
  - HTML-escape all order, customer, address, and product text inside HTML invoice generators to prevent Stored XSS.

## 4. Webhooks & Admin Endpoints
- Every webhook (`/api/webhooks/razorpay`, `/api/webhooks/woocommerce/orders`, `/api/webhooks/product`):
  - Returns `500` if its webhook secret env var is unconfigured.
  - Returns `401` if the signature header (`x-razorpay-signature` or `x-wc-webhook-signature`) is missing or invalid (`crypto.timingSafeEqual`).
  - Does not accept unauthenticated `webhook_id` / ping bypasses before checking HMAC signatures.
- Admin operational routes (`/api/sync-policies`):
  - Expose only `POST` protected with `Authorization: Bearer <ADMIN_SYNC_SECRET>`.
  - Never expose unauthenticated `GET` sync triggers or server filesystem paths.

## 5. Headers, Proxies & Service Worker
- `next.config.ts` sets `poweredByHeader: false`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and excludes legacy insecure headers (`X-XSS-Protection`) or `http://` remote image patterns.
- `app/api/media/[...path]` validates allowed characters and blocks `..`, backslashes, and encoded traversal before fetching WordPress media.
- `public/sw.js` never caches `/api/`, `/account`, `/checkout`, `/invoice`, `/login`, `/signup`, `/cart`, `/wishlist`, or authenticated responses.
