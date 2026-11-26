# 🛡️ INTERSTING — Zero-Cost Hosting & Production Security Blueprint

> **System**: Headless Next.js 16 + Decoupled WooCommerce/MariaDB + Razorpay + Qdrant Vector AI + httpSMS  
> **Backend Specification**: **2 GB RAM Virtual Machine**  
> **Frontend**: **Vercel Hobby Tier (₹0/mo)**  
> **Production Fixed Cost**: **₹0.00 / month hosting** (Razorpay charges ~2% per successful transaction — no monthly fee)  
> **Target Audience**: Full-Stack Engineers, Startup Founders, Tech Leads  
> **Purpose**: Complete Architecture, 2 GB RAM Memory Optimization, Security Audit, Order Lifecycle, and Own httpSMS Server Feasibility on 2 GB

---

## 🌟 Executive Summary

Traditional e-commerce stacks demand heavy monthly cloud spend:
- Shopify Plus / AWS EC2 + RDS: **₹15,000 – ₹50,000 / month**
- Redis caching & vector search platforms: **₹5,000 – ₹10,000 / month**
- Twilio / Gupshup SMS: **₹0.25 – ₹0.40 per SMS**

**What we built instead:** A decoupled headless e-commerce engine serving catalog traffic from Vercel's edge (₹0), with WooCommerce + MariaDB + Qdrant running on a **2 GB RAM VM** (₹0), processing Razorpay UPI/Card/COD orders, sending SMS order alerts, and running an AI nutritionist (Chappie) via NVIDIA NIM + Qdrant.

**Fixed monthly hosting: ₹0.00.**  
**Variable cost:** Razorpay ~2% per transaction only when you make a sale.

> **Important:** Your current code calls `https://api.httpsms.com` (external httpSMS API). It does **not** run a self-hosted SMS server. See Section 5 for what happens if you host your own SMS gateway on the same 2 GB VM.

---

## 🏗️ 1. Zero-Cost System Architecture (Tuned for 2 GB RAM)

```mermaid
flowchart TD
    subgraph Client_Layer ["📱 Client & Shopper Experience"]
        User["Shopper (Mobile Browser / PWA / Desktop)"]
    end

    subgraph Edge_Layer ["🌐 Edge & Frontend Layer (Vercel — ₹0/mo, 0 MB on VM)"]
        CDN["Global Edge CDN & ISR Cache"]
        NextSSR["Next.js 16 App Router (Turbopack, PWA)"]
        APIRoutes["Serverless API Routes (/api/payment, /api/orders)"]
        RateLimiter["Sliding-Window IP Rate Limiter"]
    end

    subgraph Backend_Cloud ["⚡ Backend & CMS (2 GB RAM VM — ₹0/mo)"]
        Nginx["Nginx Reverse Proxy + Let's Encrypt SSL (~30 MB)"]
        Woo["Headless WordPress + PHP-FPM 'ondemand' (~150 MB)"]
        DB[(MariaDB 8.0 / InnoDB Buffer 256M (~320 MB))]
        Qdrant[("Qdrant Vector DB Docker Capped 300M (~220 MB)")]
        Swap["4 GB Swap Space (vm.swappiness=10 Safety Cushion)"]
        SMSServer["Own httpSMS Server? (~50–180 MB — Section 5)"]
    end

    subgraph Managed_SaaS ["🔌 Free-Tier Production Integrations (₹0/mo)"]
        Razorpay["Razorpay Gateway (~2% per txn, no monthly fee)"]
        HttpSMS["httpSMS.com External API OR Self-Hosted Gateway"]
        Firebase["Firebase Auth (50k MAU Free)"]
        NvidiaNIM["NVIDIA NIM (Free Community Tier)"]
    end

    User -->|HTTPS / TLS 1.3| CDN
    CDN --> NextSSR
    NextSSR --> APIRoutes
    APIRoutes --> RateLimiter

    RateLimiter -->|HMAC Verified REST| Nginx
    Nginx --> Woo
    Woo --> DB

    APIRoutes -->|Vector Search| Qdrant
    APIRoutes -->|HMAC-SHA256 Signatures| Razorpay
    APIRoutes -->|REST Webhook| HttpSMS
    NextSSR -->|Token Verification| Firebase
    NextSSR -->|Nemotron-3.5 Embeddings| NvidiaNIM
```

### Free-Tier Cost Breakdown

| Component | Technology / Provider | Free Tier | Real Capacity | Cost |
|-----------|----------------------|-----------|---------------|------|
| Frontend & Serverless | **Vercel Hobby** | 100 GB BW, Global CDN, Auto SSL | 50k–100k visits/mo | **₹0.00** |
| CMS & Relational DB | **Oracle Cloud / Budget VPS** | **2 GB RAM VM**, 1–2 vCPUs | 5,000+ products, 30 checkouts/min | **₹0.00** |
| Vector AI Search | **Qdrant (Docker on VM)** | Self-hosted, capped 300 MB | 1,000,000+ vectors | **₹0.00** |
| Payment Gateway | **Razorpay** | ₹0 setup, ₹0 AMC | Unlimited checkouts (~2% per txn) | **₹0.00 setup** |
| SMS Alerts | **httpSMS.com API** (current) or **Own Server** | External API or personal SIM | 3,000+ order SMS/mo | **₹0.00** |
| Domain & DNS | **DuckDNS + Cloudflare Free** | Unlimited DNS, basic WAF | Unlimited | **₹0.00** |
| Authentication | **Firebase Auth** | 50,000 MAU free | 50,000 customers | **₹0.00** |
| AI Embeddings & Chat | **NVIDIA NIM** | Free community tier | Semantic search + LLM | **₹0.00** |
| **FIXED MONTHLY TOTAL** | | | | **₹0.00** |

---

## ⚡ 2. The 2 GB RAM Memory Optimization Playbook

Running WordPress, MariaDB, and Qdrant on 2 GB crashes with default settings. Here is the exact 5-step tuning that stabilizes everything at **~870 MB active usage** with **~1.1 GB free headroom**.

### Memory Allocation Budget (2,048 MB Total)

| Service | Default Untuned | Tuned Footprint | Optimization Applied |
|---------|----------------|-----------------|---------------------|
| Linux OS & System Daemons | ~200 MB | ~150 MB | Minimal Ubuntu/Debian base |
| Nginx Reverse Proxy | ~50 MB | ~30 MB | 2 worker processes, gzip on |
| MariaDB / MySQL 8.0 | ~1,100 MB | **~320 MB** | `innodb_buffer_pool_size = 256M`, max 40 connections |
| PHP 8.2 / 8.3 FPM | ~800 MB | **~150 MB** | `pm = ondemand`, max 5 children |
| Qdrant Vector DB | ~500 MB | **~220 MB** | Docker `--memory=300m`, on-disk vectors |
| **TOTAL ACTIVE RAM** | **~2,650 MB (CRASH)** | **~870 MB** | **Stable — ~1,170 MB Free** |

### Step-by-Step Commands for 2 GB VM

#### Step 1: 4 GB Swap File (OOM Insurance)
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

#### Step 2: Tune MariaDB (`/etc/mysql/my.cnf`)
```ini
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_buffer_size = 16M
innodb_buffer_pool_instances = 1
max_connections = 40
table_open_cache = 400
table_definition_cache = 400
thread_cache_size = 8
performance_schema = OFF
```
Restart: `sudo systemctl restart mariadb`

#### Step 3: PHP-FPM ondemand (`/etc/php/8.2/fpm/pool.d/www.conf`)
```ini
pm = ondemand
pm.max_children = 5
pm.process_idle_timeout = 10s
pm.max_requests = 500
```
Restart: `sudo systemctl restart php8.2-fpm`

#### Step 4: Cap Qdrant in Docker
```bash
docker run -d \
  --name qdrant \
  --restart always \
  --memory=300m \
  --memory-swap=1g \
  -p 6333:6333 \
  -v /root/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant:latest
```

#### Step 5: Why Decoupling Protects the VM
- Next.js page visits, image compression, and React Server Components run on **Vercel — 0 MB on the VM**.
- Next.js ISR + in-memory cache means **90% of catalog requests never touch the 2 GB VM**.
- The VM only receives lightweight REST calls for checkout, webhooks, and AI search.

---

## ✅ 3. What Is Actually Implemented (Verified in Code)

| Feature | Implementation | Status |
|---------|---------------|--------|
| Frontend | Next.js 16 (React 19 + Turbopack), PWA, deployed on Vercel | ✅ Code |
| Backend | Headless WooCommerce REST API at `intersting.duckdns.org` | ✅ Code |
| Payments | Razorpay (UPI, Cards, Netbanking, COD, Manual UPI with 12-digit UTR) | ✅ Code |
| Price Security | Server-side authoritative price recalculation from WooCommerce; client amount ignored | ✅ `app/api/payment/create-order/route.ts` |
| Signature Verification | HMAC-SHA256 on payment callback + webhook raw body | ✅ `lib/payment/razorpay.ts` |
| Duplicate Prevention | In-memory Map + disk cache (`/tmp`) idempotency locks + WooCommerce order search | ✅ `lib/payment/pendingOrders.ts`, `confirmOrder.ts` |
| Rate Limiting | Sliding-window per IP: checkout 15/min, auth 5-10/min, AI 30/min | ✅ `lib/security/rateLimit.ts` |
| Stock Verification | Live WooCommerce stock check before payment initialization | ✅ Code |
| Coupon Validation | Server-side coupon verification (min/max spend, percent/fixed) | ✅ Code |
| Razorpay Webhook | Safety net: `payment.captured`/`order.paid` creates WooCommerce order if browser closes | ✅ `app/api/webhooks/razorpay/route.ts` |
| WooCommerce Webhook | `order.created`/`order.updated` triggers SMS via HMAC-SHA256 verification | ✅ `app/api/webhooks/woocommerce/orders/route.ts` |
| SMS | **httpSMS.com external REST API** (NOT self-hosted) | ✅ `lib/sms/httpsms.ts` |
| AI Assistant | Chappie AI: NVIDIA NIM embeddings + Qdrant vector search + RAG | ✅ `lib/rag/` |
| Caching | Next.js ISR + in-memory pending order cache (2-hour TTL) | ✅ Code |
| Security Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy | ✅ `next.config.ts` |
| GST Invoices | Dynamic PDF via `pdf-lib` on `/api/invoice/[id]/download` | ✅ Code |

---

## 📱 4. Order Management Lifecycle

```
[User clicks Place Order]
      │
      ▼
[1. Frontend] Instant page transition, truck animation
[2. Server] Rate limit check → Live stock & price check from WooCommerce
      → Server recalculates total (blocks price tampering)
      → Server verifies coupon
      → Creates Razorpay order
      → Stores pending order in memory + disk cache
[3. Payment] Razorpay modal: UPI / Cards / Netbanking / COD / Manual UPI
[4. Confirmation] Browser verify + Webhook safety net
      → HMAC-SHA256 verified
      → Gateway status re-verified with Razorpay
      → Idempotency check (no duplicate orders)
      → WooCommerce order created (status: processing)
      → Order confirmation SMS dispatched
      → Pending order cleared from cache
[5. Dispatch] SMS to customer + admin alert; PDF invoice available
```

---

## 📱 5. Running Your Own httpSMS Server on 2 GB

### Current setup (what your code does)
Your `lib/sms/httpsms.ts` calls **`https://api.httpsms.com/v1/messages/send`** — an external API. The 2 GB VM only makes an outbound HTTPS request. **RAM impact: ~0 MB.** This is the safest option for 2 GB.

### If you host your OWN httpSMS server on the same 2 GB VM

You would run a local SMS gateway service (e.g., a Node.js/Go/Python app talking to a GSM modem, Android phone via USB/ADB, or a SIM800 module) instead of calling an external API.

| Own SMS Server Type | Extra RAM | Total Active (with WooCommerce) | 2 GB Feasible? |
|---------------------|-----------|--------------------------------|----------------|
| Lightweight webhook receiver that forwards to external SMS API | ~30–60 MB | ~900–930 MB | ✅ Yes, comfortable |
| Small service polling GSM modem / Android phone via USB/ADB | ~100–180 MB | ~970–1,050 MB | ⚠️ Tight, works with swap |
| Android emulator or full SMS server stack | 400 MB – 1 GB+ | ~1,270–1,870 MB | ❌ High OOM risk |

#### If you proceed with a lightweight own SMS server:

1. **Cap it hard** with Docker memory limit:
   ```bash
   docker run -d \
     --name httpsms-own \
     --restart always \
     --memory=150m \
     --memory-swap=300m \
     -p 3001:3001 \
     your-own-httpsms-image
   ```

2. **Updated memory budget with own SMS server (~150 MB):**
   | Service | Footprint |
   |---------|-----------|
   | Linux + Nginx + MariaDB + PHP-FPM + Qdrant | ~870 MB |
   | Own httpSMS server (capped) | ~150 MB |
   | **New Total Active** | **~1,020 MB** |
   | **Remaining Headroom** | **~1,000 MB** |

3. **Critical rules:**
   - Do **not** run an Android emulator on this VM — it needs 512 MB–1 GB alone and will crash WooCommerce.
   - Keep Qdrant capped at 300 MB; do not increase it to make room for SMS.
   - Increase swap to 6 GB if adding the SMS service: `sudo fallocate -l 6G /swapfile`
   - Monitor with `free -h` and `docker stats --no-stream`. If active RAM exceeds ~1.4 GB, the VM will start swapping heavily and WooCommerce will slow to a crawl.

**Verdict:** A lightweight own SMS forwarder is fine on 2 GB. A full self-hosted SMS gateway with modem/emulator is **not** — move it to a separate device or keep using the external httpSMS API.

---

## 📊 6. Will 2 GB Handle Your Traffic?

| Traffic Pattern | 2 GB VM Verdict |
|----------------|-----------------|
| **500 visitors/day** (spread across 24 hours) | ✅ Works fine |
| **100–200 concurrent shoppers** browsing catalog | ✅ Works (most hits served by Vercel cache, not VM) |
| **30+ checkouts per minute** sustained | ⚠️ Tight — PHP-FPM max_children=5 may queue |
| **500 concurrent users** at the same time | ❌ **No.** OOM kill, 502 errors, database crashes |
| **Flash sale / traffic spike** | ⚠️ Rate limiter (15 checkout/min per IP) helps, but VM will struggle |

**For 500+ concurrent users, you need:**
- **4–8 GB RAM VM** for WooCommerce + MariaDB
- Redis object cache (1 GB+) to reduce database hits
- Or keep WooCommerce on 2 GB and aggressively cache catalog pages on Vercel ISR so only checkout/webhook traffic hits the VM

---

## 🔒 7. Security Features Actually in Code

- **Anti-Price Tampering:** Server recalculates totals from WooCommerce; client cannot underpay.
- **HMAC-SHA256:** Razorpay callback + webhook signatures verified with constant-time comparison.
- **Idempotency:** Memory + disk cache prevents duplicate orders on double-click or webhook race.
- **Gateway Re-verification:** Payment status re-fetched from Razorpay API before order creation.
- **Rate Limiting:** Sliding window per IP on checkout (15/min), auth (5–10/min), AI (30/min).
- **Credential Isolation:** No `NEXT_PUBLIC_` on secrets; WooCommerce and Razorpay keys are backend-only.
- **Webhook Signature Verification:** Both Razorpay and WooCommerce webhooks verified before processing.
- **Security Headers:** Clickjacking, MIME-sniffing, referrer, and permissions policies set in `next.config.ts`.
- **PCI-DSS:** Card data never touches your servers; Razorpay handles it in a PCI-DSS Level 1 iframe.

---

## 🛠️ 8. Quick Maintenance Commands for 2 GB VM

```bash
# Check real-time memory usage
free -h

# Top memory-consuming processes
ps aux --sort=-%mem | head -n 10

# Docker container memory stats
docker stats --no-stream

# Check if OOM killer has been triggered
dmesg | grep -i oom

# Test swap is active
swapon --show

# Restart tuned services
sudo systemctl restart mariadb
sudo systemctl restart php8.2-fpm
sudo docker restart qdrant
```

---

## ✅ Bottom Line

- **2 GB is enough** for WooCommerce + MariaDB + Qdrant on a small store with your current tuning, as long as the frontend stays on Vercel.
- **Your own lightweight httpSMS forwarder** (~50–150 MB) can fit on the same 2 GB VM if capped with Docker. A full SMS gateway with emulator/modem cannot.
- **500 concurrent users will crash 2 GB.** Plan for 4–8 GB if you expect real-time scale.
- **Your monthly hosting remains ₹0** — Razorpay only takes a percentage when you make a sale.
```
