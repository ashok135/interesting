<p align="center">
  <img src="public/images/logo.png" alt="INTERSTING Logo" width="140" />
</p>

# 🥜 INTERSTING — Gourmet Dry Fruits Storefront

**INTERSTING** is a live, decoupled e-commerce storefront for gourmet dry fruits, nuts, and pantry staples.  
Customers shop on a fast Next.js website, a private backend API bridge handles security and payments, and **WordPress + WooCommerce** runs as the live store admin.

---

## 🎯 Problems Solved & What Is Used

| Problem | How This Project Solves It | Tech / Service Used |
| :--- | :--- | :--- |
| **Slow WordPress store pages** | Separates the customer website from WordPress so pages load fast like a mobile app (PWA). | **Next.js 16**, **React 19**, **TypeScript**, **TanStack Query** |
| **Price or coupon tampering at checkout** | Re-calculates real product prices, stock, coupons, and the **₹499 free-shipping** rule on the server before confirming any order. | **Next.js API Routes** (`/api/payment/*`, `/api/orders`) |
| **Limited payment options & gateway fees** | Supports Razorpay (UPI/cards/net banking), Direct Store UPI (0% fee with 12-digit UTR), and Cash on Delivery (COD). | **Razorpay SDK** + Direct UPI + COD |
| **Customers dropping off during signup** | Lets shoppers sign in with one-tap Google, mobile phone OTP, or email/password. | **Google Firebase Auth** + signed session cookies |
| **Slow address typing on mobile** | One-tap GPS location fills street, city, state, and PIN code automatically at checkout. | **OpenStreetMap Nominatim** |
| **Expensive per-SMS gateway bills** | Sends order and delivery status SMS alerts directly from your own Android phone SIM card. | **httpSMS** + WooCommerce Webhooks |
| **Repetitive customer support questions** | Built-in **Chappie AI** assistant answers product, price, shipping, and return questions using live store data. | **Qdrant Vector DB** + **NVIDIA NIM** (`openai` SDK) |
| **Manual GST / tax invoice creation** | Generates downloadable PDF tax invoices automatically for every order. | **pdf-lib** (`/api/invoice/[id]`) |

---

## 🏗️ Project Architecture (3 Live Layers)

![INTERSTING Where Everything Is Hosted](docs/hosting-architecture.png)

### 1. Frontend — Live Storefront (`app/`)
- **Runs on:** **Vercel** (Global CDN + Next.js Edge/Serverless)
- **Pages:** Home (`/`), Shop (`/shop`), Product Details (`/product/[slug]`), Cart (`/cart`), Checkout (`/checkout`), Wishlist (`/wishlist`), Account (`/account`), Login/Signup (`/login`, `/signup`), Order Invoice (`/invoice/[id]`), and policy/FAQ pages.
- **Role:** Displays products, handles cart & wishlist, runs the Chappie AI chat widget, and guides shoppers through checkout.

### 2. Backend — Live API Bridge (`app/api/`)
- **Runs on:** **Vercel** Serverless Functions (private server-side Next.js API routes — secrets never reach the browser)
- **Endpoints:**
  - **Auth & Account:** `/api/auth/*` (Google, Firebase OTP, email login/signup) and `/api/account/*` (profile, address, password)
  - **Catalog & Cart:** `/api/products`, `/api/search`, `/api/reviews`, `/api/coupons`, `/api/wishlist`, `/api/media/[...path]`
  - **Payments & Invoices:** `/api/payment/create-order`, `/api/payment/verify`, `/api/orders`, `/api/invoice/[id]`
  - **AI & Webhooks:** `/api/assistant`, `/api/sync-policies`, `/api/webhooks/razorpay`, `/api/webhooks/product`, `/api/webhooks/woocommerce/orders`
- **Role:** Verifies users, checks real prices/stock, confirms Razorpay payments (including backup webhooks), generates PDF invoices, and triggers SMS/AI updates.

### 3. WooCommerce — Live Store Admin (`https://intersting.duckdns.org`)
- **Runs on:** **Oracle Cloud 2 GB Micro VM** (WordPress + WooCommerce + MariaDB + Qdrant at `/qdrant`)
- **Role:** Your daily control room. Add products, upload photos, update prices, manage stock, create coupons, and update order statuses — the storefront and Chappie AI stay in sync automatically.

---

## 🗺️ How Everything Connects

![INTERSTING Complete Project Architecture](docs/project-architecture.png)

![INTERSTING WooCommerce Control Loop and Order Lifecycle](docs/woocommerce-architecture.png)

---

## 🛡️ Safety & Privacy Notes

- **Secret keys stay on the server:** WooCommerce keys, Razorpay secrets, SMS keys, and AI keys are never exposed to the browser.
- **Protected customer data:** Signed cookies ensure only the rightful customer can view saved addresses, order history, or full PDF invoices.
- **No lost paid orders:** Razorpay backup webhooks save paid orders even if a customer closes the browser right after payment.

---

## 📖 More Guides

- **[Store Owner Handbook](PROJECT_ARCHITECTURE_GUIDE.md)** — Plain-English walkthrough of daily store operations and launch checks.

<details>
<summary><strong>🛠️ For Developers: Local Setup & Webhooks</strong></summary>

<br />

**Requirements:** Node.js 20+, a running WordPress + WooCommerce store, and `.env.local` (copied from `.env.example`; never commit `.env.local`).

```bash
npm install
npx next typegen
npx tsc --noEmit
npx next build
npm run dev
```

Open `http://localhost:3000`.

**One-Time Webhook Setup:**
- **Razorpay Dashboard → Settings → Webhooks:** `https://your-domain.com/api/webhooks/razorpay` (`payment.captured`, `order.paid`, `payment.failed`)
- **WooCommerce → Settings → Advanced → Webhooks:**
  - Product sync (`product.created`, `product.updated`): `https://your-domain.com/api/webhooks/product`
  - Order SMS (`order.updated`): `https://your-domain.com/api/webhooks/woocommerce/orders`

</details>

---

**License:** Proprietary storefront built for **INTERSTING Gourmet Pantry**. All rights reserved.
