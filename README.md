# INTERSTING — Headless Nuts & Dry Fruits E-Commerce Store

High-performance Next.js storefront powered by WooCommerce (WordPress) as the headless commerce backend.

## 🚀 Key Features

- **99% Business Logic in WooCommerce**: All products, pricing, discounts, stock levels, categories, images, and orders are 100% managed inside WordPress Admin (`https://intersting.duckdns.org/wp-admin`).
- **Direct High-Speed Media Delivery**: Images load directly from `https://intersting.duckdns.org/wp-content/uploads/` with Next.js edge optimization.
- **Full White Theme & Black Theme**: Minimalist, clean design with instant one-click theme switching in the header.
- **Dynamic Hero**: Features whichever product is starred as *Featured* in WordPress.
- **Headless Checkout**: Orders are sent directly to WooCommerce and appear in `WooCommerce → Orders`.
- **Automated SMS Alerts**: Order confirmations and status updates dispatched via httpSMS.
- **Slide-out Cart & Floating Bar**: Persistent cart synced with `localStorage`.

## 📖 Complete Documentation

Please see [**WOOCOMMERCE_GUIDE.md**](./WOOCOMMERCE_GUIDE.md) for full architectural details, credentials, and management guides.

## 💻 Environment Setup

1. Backend instance is live at `https://intersting.duckdns.org`.
2. Configure credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_WC_URL=https://intersting.duckdns.org
   WC_CONSUMER_KEY=your_consumer_key
   WC_CONSUMER_SECRET=your_consumer_secret
   WC_APP_USER=your_user
   WC_APP_PASSWORD=your_app_password
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm run start
   ```
